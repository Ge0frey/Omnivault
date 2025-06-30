use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::{
    program::invoke_signed,
    sysvar::{rent::Rent, Sysvar},
    instruction::{AccountMeta, Instruction},
};
use std::str::FromStr;

declare_id!("HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4");

// LayerZero Endpoint Program ID (from Anchor.toml)
const LAYERZERO_ENDPOINT: &str = "H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp";

#[program]
pub mod omnivault {
    use super::*;

    /// Initialize the OmniVault program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        vault_store.authority = ctx.accounts.authority.key();
        vault_store.total_vaults = 0;
        vault_store.total_tvl = 0;
        vault_store.fee_rate = 100; // 1% fee (100 basis points)
        vault_store.bump = ctx.bumps.vault_store;
        
        msg!("OmniVault initialized successfully");
        Ok(())
    }

    /// Create a new vault with specified risk profile
    pub fn create_vault(
        ctx: Context<CreateVault>,
        risk_profile: RiskProfile,
        min_deposit: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let vault_store = &mut ctx.accounts.vault_store;
        
        vault.id = vault_store.total_vaults;
        vault.owner = ctx.accounts.owner.key();
        vault.risk_profile = risk_profile;
        vault.total_deposits = 0;
        vault.total_yield = 0;
        vault.min_deposit = min_deposit;
        vault.is_active = true;
        vault.last_rebalance = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.vault;
        
        vault_store.total_vaults += 1;
        
        msg!("Vault {} created with risk profile: {:?}", vault.id, vault.risk_profile);
        Ok(())
    }

    /// Deposit tokens into a vault
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let vault = &mut ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        
        require!(amount >= vault.min_deposit, OmniVaultError::DepositTooSmall);
        require!(vault.is_active, OmniVaultError::VaultInactive);
        
        // Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update vault and user position
        vault.total_deposits += amount;
        user_position.amount += amount;
        user_position.last_deposit = Clock::get()?.unix_timestamp;
        
        msg!("Deposited {} tokens to vault {}", amount, vault.id);
        Ok(())
    }

    /// Withdraw tokens from a vault
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.amount >= amount, OmniVaultError::InsufficientBalance);
        
        // Calculate withdrawal fee (we need access to vault_store)
        let withdrawal_amount = amount; // Simplified for now, fee logic can be added later
        
        // Get vault data for seeds
        let vault = &ctx.accounts.vault;
        let vault_seeds = &[
            b"vault",
            vault.owner.as_ref(),
            &vault.id.to_le_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];
        
        // Transfer tokens from vault to user
        let vault_authority = ctx.accounts.vault.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault_authority,
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, withdrawal_amount)?;
        
        // Update vault and user position
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits -= amount;
        user_position.amount -= amount;
        user_position.last_withdrawal = Clock::get()?.unix_timestamp;
        
        msg!("Withdrew {} tokens from vault {}", withdrawal_amount, vault.id);
        Ok(())
    }

    /// Send cross-chain message via LayerZero
    pub fn lz_send(
        ctx: Context<LzSend>,
        dst_chain_id: u16,
        message: Vec<u8>,
        options: Vec<u8>,
    ) -> Result<()> {
        require!(!message.is_empty(), OmniVaultError::InvalidPayload);
        
        let _vault = &ctx.accounts.vault;
        
        // Prepare LayerZero send instruction
        let lz_instruction_data = LzSendData {
            dst_chain_id,
            message,
            options,
        };
        
        let serialized_data = lz_instruction_data.try_to_vec()?;
        
        // Create instruction for LayerZero endpoint
        let lz_instruction = Instruction {
            program_id: Pubkey::from_str(LAYERZERO_ENDPOINT).unwrap(),
            accounts: vec![
                AccountMeta::new(ctx.accounts.endpoint.key(), false),
                AccountMeta::new(ctx.accounts.oapp_config.key(), false),
                AccountMeta::new(ctx.accounts.payer.key(), true),
            ],
            data: serialized_data,
        };
        
        // Invoke LayerZero endpoint
        invoke_signed(
            &lz_instruction,
            &[
                ctx.accounts.endpoint.to_account_info(),
                ctx.accounts.oapp_config.to_account_info(),
                ctx.accounts.payer.to_account_info(),
            ],
            &[],
        )?;
        
        msg!("LayerZero message sent to chain {}", dst_chain_id);
        Ok(())
    }

    /// Receive cross-chain message via LayerZero
    pub fn lz_receive(
        ctx: Context<LzReceive>,
        src_chain_id: u16,
        payload: Vec<u8>,
    ) -> Result<()> {
        require!(!payload.is_empty(), OmniVaultError::InvalidPayload);
        
        // Validate LayerZero endpoint
        let expected_endpoint = Pubkey::from_str(LAYERZERO_ENDPOINT).unwrap();
        require!(
            ctx.accounts.endpoint.key().eq(&expected_endpoint),
            OmniVaultError::InvalidLayerZeroEndpoint
        );
        
        // Deserialize payload
        let message: CrossChainMessage = CrossChainMessage::try_from_slice(&payload)?;
        
        match message.action {
            CrossChainAction::Rebalance { vault_id, new_allocation } => {
                let vault = &mut ctx.accounts.vault;
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                
                // Update vault allocation based on cross-chain signal
                vault.last_rebalance = Clock::get()?.unix_timestamp;
                
                msg!("Vault {} rebalanced via LayerZero from chain {}", vault_id, src_chain_id);
            },
            CrossChainAction::YieldUpdate { vault_id, yield_amount } => {
                let vault = &mut ctx.accounts.vault;
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                
                vault.total_yield += yield_amount;
                
                msg!("Yield updated for vault {} via LayerZero: {}", vault_id, yield_amount);
            },
            CrossChainAction::EmergencyPause { vault_id } => {
                let vault = &mut ctx.accounts.vault;
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                
                vault.is_active = false;
                
                msg!("Emergency pause activated for vault {} via LayerZero", vault_id);
            },
        }
        
        Ok(())
    }

    /// Get vault types for LayerZero receive instruction
    pub fn lz_receive_types(
        _ctx: Context<LzReceiveTypes>,
        src_chain_id: u16,
    ) -> Result<()> {
        // This instruction is called by LayerZero executor to get account types
        // Required for Solana's account model
        msg!("LayerZero receive types called for chain {}", src_chain_id);
        Ok(())
    }

    /// Rebalance vault strategy
    pub fn rebalance_vault(ctx: Context<RebalanceVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;
        
        // Only allow rebalancing once per hour
        require!(
            clock.unix_timestamp - vault.last_rebalance > 3600,
            OmniVaultError::RebalanceTooFrequent
        );
        
        // Implement rebalancing logic based on risk profile
        match vault.risk_profile {
            RiskProfile::Conservative => {
                // Conservative strategy: Focus on stable yields
                msg!("Rebalancing conservative vault {}", vault.id);
            },
            RiskProfile::Moderate => {
                // Moderate strategy: Balanced approach
                msg!("Rebalancing moderate vault {}", vault.id);
            },
            RiskProfile::Aggressive => {
                // Aggressive strategy: Higher risk, higher reward
                msg!("Rebalancing aggressive vault {}", vault.id);
            },
        }
        
        vault.last_rebalance = clock.unix_timestamp;
        Ok(())
    }

    /// Update vault configuration
    pub fn update_vault_config(
        ctx: Context<UpdateVaultConfig>,
        new_min_deposit: Option<u64>,
        new_active_status: Option<bool>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        if let Some(min_deposit) = new_min_deposit {
            vault.min_deposit = min_deposit;
        }
        
        if let Some(active_status) = new_active_status {
            vault.is_active = active_status;
        }
        
        msg!("Vault {} configuration updated", vault.id);
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultStore::INIT_SPACE,
        seeds = [b"vault_store"],
        bump
    )]
    pub vault_store: Account<'info, VaultStore>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref(), &vault_store.total_vaults.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub vault_store: Account<'info, VaultStore>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_position: Account<'info, UserPosition>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct LzSend<'info> {
    pub vault: Account<'info, Vault>,
    /// LayerZero Endpoint
    pub endpoint: AccountInfo<'info>,
    /// OApp Configuration
    pub oapp_config: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LzReceive<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    /// LayerZero Endpoint
    pub endpoint: AccountInfo<'info>,
    /// OApp Configuration
    pub oapp_config: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LzReceiveTypes<'info> {
    pub vault: Account<'info, Vault>,
    pub endpoint: AccountInfo<'info>,
    pub oapp_config: AccountInfo<'info>,
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RebalanceVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateVaultConfig<'info> {
    #[account(
        mut,
        has_one = owner
    )]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

// State structures
#[account]
#[derive(InitSpace)]
pub struct VaultStore {
    pub authority: Pubkey,
    pub total_vaults: u64,
    pub total_tvl: u64,
    pub fee_rate: u16, // Basis points (100 = 1%)
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub id: u64,
    pub owner: Pubkey,
    pub risk_profile: RiskProfile,
    pub total_deposits: u64,
    pub total_yield: u64,
    pub min_deposit: u64,
    pub is_active: bool,
    pub last_rebalance: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub last_deposit: i64,
    pub last_withdrawal: i64,
    pub bump: u8,
}

// Enums and Data Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum RiskProfile {
    Conservative,
    Moderate,
    Aggressive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LzSendData {
    pub dst_chain_id: u16,
    pub message: Vec<u8>,
    pub options: Vec<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CrossChainMessage {
    pub action: CrossChainAction,
    pub timestamp: i64,
    pub nonce: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CrossChainAction {
    Rebalance {
        vault_id: u64,
        new_allocation: Vec<u8>,
    },
    YieldUpdate {
        vault_id: u64,
        yield_amount: u64,
    },
    EmergencyPause {
        vault_id: u64,
    },
}

// Error codes
#[error_code]
pub enum OmniVaultError {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Deposit amount is too small")]
    DepositTooSmall,
    #[msg("Vault is not active")]
    VaultInactive,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid LayerZero endpoint")]
    InvalidLayerZeroEndpoint,
    #[msg("Invalid payload")]
    InvalidPayload,
    #[msg("Invalid vault ID")]
    InvalidVaultId,
    #[msg("Rebalance too frequent")]
    RebalanceTooFrequent,
    #[msg("Unauthorized caller")]
    UnauthorizedCaller,
}
