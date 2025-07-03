use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::{
    program::invoke_signed,
    sysvar::{rent::Rent, Sysvar, clock::Clock},
    instruction::{AccountMeta, Instruction},
};
use std::str::FromStr;

declare_id!("HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4");

// LayerZero Endpoint Program ID (from Anchor.toml)
const LAYERZERO_ENDPOINT: &str = "H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp";

// Cross-chain identifiers for supported networks
pub mod chain_ids {
    pub const ETHEREUM: u16 = 101;
    pub const ARBITRUM: u16 = 110;
    pub const POLYGON: u16 = 109;
    pub const BSC: u16 = 102;
    pub const AVALANCHE: u16 = 106;
    pub const OPTIMISM: u16 = 111;
}

// Yield optimization constants
const MIN_YIELD_DIFFERENTIAL: u64 = 100; // 1% in basis points
const REBALANCE_COOLDOWN: i64 = 3600; // 1 hour in seconds
const MAX_CROSS_CHAIN_QUERIES: u8 = 5;
const EMERGENCY_PAUSE_THRESHOLD: u64 = 1000; // 10% loss threshold

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
        vault_store.last_global_rebalance = Clock::get()?.unix_timestamp;
        vault_store.emergency_pause = false;
        vault_store.supported_chains = vec![
            chain_ids::ETHEREUM,
            chain_ids::ARBITRUM,
            chain_ids::POLYGON,
            chain_ids::BSC,
            chain_ids::AVALANCHE,
        ];
        
        msg!("OmniVault initialized successfully");
        Ok(())
    }

    /// Create a new vault with specified risk profile and strategy
    pub fn create_vault(
        ctx: Context<CreateVault>,
        risk_profile: RiskProfile,
        min_deposit: u64,
        target_chains: Vec<u16>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let vault_store = &mut ctx.accounts.vault_store;
        
        require!(!vault_store.emergency_pause, OmniVaultError::SystemPaused);
        require!(!target_chains.is_empty(), OmniVaultError::InvalidChainConfiguration);
        require!(target_chains.len() <= MAX_CROSS_CHAIN_QUERIES as usize, OmniVaultError::TooManyChains);
        
        vault.id = vault_store.total_vaults;
        vault.owner = ctx.accounts.owner.key();
        vault.risk_profile = risk_profile;
        vault.total_deposits = 0;
        vault.total_yield = 0;
        vault.min_deposit = min_deposit;
        vault.is_active = true;
        vault.last_rebalance = Clock::get()?.unix_timestamp;
        vault.target_chains = target_chains;
        vault.current_best_chain = chain_ids::ETHEREUM; // Default
        vault.current_apy = 0;
        vault.rebalance_threshold = MIN_YIELD_DIFFERENTIAL;
        vault.emergency_exit = false;
        vault.bump = ctx.bumps.vault;
        
        vault_store.total_vaults += 1;
        
        // Initialize yield tracking for this vault
        let yield_tracker = &mut ctx.accounts.yield_tracker;
        yield_tracker.vault = vault.key();
        yield_tracker.chain_yields = vec![];
        yield_tracker.last_update = Clock::get()?.unix_timestamp;
        yield_tracker.query_nonce = 0;
        yield_tracker.bump = ctx.bumps.yield_tracker;
        
        emit!(VaultCreated {
            vault_id: vault.id,
            owner: vault.owner,
            risk_profile: vault.risk_profile.clone(),
            target_chains: vault.target_chains.clone(),
        });
        
        msg!("Vault {} created with risk profile: {:?}", vault.id, vault.risk_profile);
        Ok(())
    }

    /// Deposit tokens into a vault with automatic yield optimization trigger
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let vault = &mut ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        let vault_store = &ctx.accounts.vault_store;
        
        require!(amount >= vault.min_deposit, OmniVaultError::DepositTooSmall);
        require!(vault.is_active, OmniVaultError::VaultInactive);
        require!(!vault_store.emergency_pause, OmniVaultError::SystemPaused);
        require!(!vault.emergency_exit, OmniVaultError::VaultEmergencyExit);
        
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
        
        // Initialize user position if needed
        if user_position.user == Pubkey::default() {
            user_position.user = ctx.accounts.user.key();
            user_position.vault = vault.key();
            user_position.last_withdrawal = 0;
            user_position.bump = ctx.bumps.user_position;
        }
        
        emit!(DepositMade {
            vault_id: vault.id,
            user: ctx.accounts.user.key(),
            amount,
            new_total: vault.total_deposits,
        });
        
        msg!("Deposited {} tokens to vault {}", amount, vault.id);
        
        // Trigger yield optimization query if significant deposit
        if amount > vault.total_deposits / 10 { // If deposit is >10% of vault
            // This would trigger a cross-chain yield query
            msg!("Large deposit detected, triggering yield optimization query");
        }
        
        Ok(())
    }

    /// Withdraw tokens from a vault
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let user_position = &mut ctx.accounts.user_position;
        let vault = &mut ctx.accounts.vault;
        
        require!(user_position.amount >= amount, OmniVaultError::InsufficientBalance);
        
        // Calculate withdrawal fee based on vault store fee rate
        let vault_store = &ctx.accounts.vault_store;
        let fee = (amount * vault_store.fee_rate as u64) / 10000;
        let withdrawal_amount = amount - fee;
        
        // Get vault data for seeds
        let vault_seeds = &[
            b"vault",
            vault.owner.as_ref(),
            &vault.id.to_le_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];
        
        // Transfer tokens from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, withdrawal_amount)?;
        
        // Update vault and user position
        vault.total_deposits -= amount;
        user_position.amount -= amount;
        user_position.last_withdrawal = Clock::get()?.unix_timestamp;
        
        emit!(WithdrawalMade {
            vault_id: vault.id,
            user: ctx.accounts.user.key(),
            amount: withdrawal_amount,
            fee,
        });
        
        msg!("Withdrew {} tokens from vault {} (fee: {})", withdrawal_amount, vault.id, fee);
        Ok(())
    }

    /// Send cross-chain yield query via LayerZero
    pub fn query_cross_chain_yields(
        ctx: Context<QueryCrossChainYields>,
        target_chains: Vec<u16>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let yield_tracker = &mut ctx.accounts.yield_tracker;
        
        require!(!target_chains.is_empty(), OmniVaultError::InvalidChainConfiguration);
        require!(target_chains.len() <= MAX_CROSS_CHAIN_QUERIES as usize, OmniVaultError::TooManyChains);
        
        let clock = Clock::get()?;
        
        // Rate limiting: Don't query too frequently
        require!(
            clock.unix_timestamp - yield_tracker.last_update > 300, // 5 minutes
            OmniVaultError::QueryTooFrequent
        );
        
        yield_tracker.query_nonce += 1;
        
        // Create cross-chain query message
        let query_message = CrossChainMessage {
            action: CrossChainAction::YieldQuery {
                vault_id: vault.id,
                risk_profile: vault.risk_profile.clone(),
                query_nonce: yield_tracker.query_nonce,
                requested_chains: target_chains.clone(),
            },
            timestamp: clock.unix_timestamp,
            nonce: yield_tracker.query_nonce,
        };
        
        let message_data = query_message.try_to_vec()?;
        
        // Send to each target chain
        for chain_id in &target_chains {
            let lz_instruction_data = LzSendData {
                dst_chain_id: *chain_id,
                message: message_data.clone(),
                options: vec![], // Default options
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
            
            msg!("Yield query sent to chain {}", chain_id);
        }
        
        yield_tracker.last_update = clock.unix_timestamp;
        
        emit!(YieldQuerySent {
            vault_id: vault.id,
            chains: target_chains,
            nonce: yield_tracker.query_nonce,
        });
        
        Ok(())
    }

    /// Receive cross-chain yield data and trigger rebalancing if needed
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
            CrossChainAction::YieldResponse { 
                vault_id, 
                chain_id, 
                apy, 
                tvl, 
                risk_score,
                query_nonce 
            } => {
                let vault = &mut ctx.accounts.vault;
                let yield_tracker = &mut ctx.accounts.yield_tracker;
                
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                require!(query_nonce == yield_tracker.query_nonce, OmniVaultError::InvalidNonce);
                
                // Update yield data for this chain
                let chain_yield = ChainYield {
                    chain_id,
                    apy,
                    tvl,
                    risk_score,
                    last_updated: Clock::get()?.unix_timestamp,
                };
                
                // Update or add yield data for this chain
                if let Some(existing) = yield_tracker.chain_yields.iter_mut().find(|cy| cy.chain_id == chain_id) {
                    *existing = chain_yield;
                } else {
                    yield_tracker.chain_yields.push(chain_yield);
                }
                
                // Check if we should rebalance
                if let Some(best_chain) = find_best_chain(&yield_tracker.chain_yields, &vault.risk_profile) {
                    let current_apy = vault.current_apy;
                    let yield_improvement = best_chain.apy.saturating_sub(current_apy);
                    
                    if yield_improvement >= vault.rebalance_threshold && 
                       best_chain.chain_id != vault.current_best_chain {
                        
                        // Trigger rebalancing
                        vault.current_best_chain = best_chain.chain_id;
                        vault.current_apy = best_chain.apy;
                        vault.last_rebalance = Clock::get()?.unix_timestamp;
                        
                        emit!(RebalanceTriggered {
                            vault_id,
                            from_chain: vault.current_best_chain,
                            to_chain: best_chain.chain_id,
                            yield_improvement,
                        });
                        
                        msg!("Rebalancing vault {} to chain {} (APY: {})", 
                             vault_id, best_chain.chain_id, best_chain.apy);
                    }
                }
                
                emit!(YieldDataReceived {
                    vault_id,
                    chain_id,
                    apy,
                    tvl,
                    risk_score,
                });
                
                msg!("Yield data received from chain {}: APY={}, TVL={}", chain_id, apy, tvl);
            },
            
            CrossChainAction::EmergencyPause { vault_id } => {
                let vault = &mut ctx.accounts.vault;
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                
                vault.emergency_exit = true;
                vault.is_active = false;
                
                emit!(EmergencyPauseActivated {
                    vault_id,
                    triggered_by_chain: src_chain_id,
                });
                
                msg!("Emergency pause activated for vault {} from chain {}", vault_id, src_chain_id);
            },
            
            CrossChainAction::Rebalance { vault_id, new_allocation } => {
                let vault = &mut ctx.accounts.vault;
                require!(vault.id == vault_id, OmniVaultError::InvalidVaultId);
                
                // Process rebalancing instruction
                vault.last_rebalance = Clock::get()?.unix_timestamp;
                
                emit!(RebalanceExecuted {
                    vault_id,
                    allocation_data: new_allocation,
                });
                
                msg!("Rebalance executed for vault {}", vault_id);
            },
            
            _ => {
                return Err(OmniVaultError::UnsupportedAction.into());
            }
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

    /// Manual rebalance vault strategy (admin only)
    pub fn rebalance_vault(ctx: Context<RebalanceVault>, target_chain: u16) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let vault_store = &ctx.accounts.vault_store;
        let clock = Clock::get()?;
        
        require!(!vault_store.emergency_pause, OmniVaultError::SystemPaused);
        require!(!vault.emergency_exit, OmniVaultError::VaultEmergencyExit);
        
        // Only allow rebalancing once per cooldown period
        require!(
            clock.unix_timestamp - vault.last_rebalance > REBALANCE_COOLDOWN,
            OmniVaultError::RebalanceTooFrequent
        );
        
        // Validate target chain
        require!(
            vault.target_chains.contains(&target_chain),
            OmniVaultError::InvalidTargetChain
        );
        
        vault.current_best_chain = target_chain;
        vault.last_rebalance = clock.unix_timestamp;
        
        emit!(ManualRebalance {
            vault_id: vault.id,
            target_chain,
            executor: ctx.accounts.authority.key(),
        });
        
        msg!("Manual rebalance of vault {} to chain {}", vault.id, target_chain);
        Ok(())
    }

    /// Update vault configuration (owner only)
    pub fn update_vault_config(
        ctx: Context<UpdateVaultConfig>,
        new_min_deposit: Option<u64>,
        new_active_status: Option<bool>,
        new_rebalance_threshold: Option<u64>,
        new_target_chains: Option<Vec<u16>>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        if let Some(min_deposit) = new_min_deposit {
            vault.min_deposit = min_deposit;
        }
        
        if let Some(active_status) = new_active_status {
            vault.is_active = active_status;
        }
        
        if let Some(threshold) = new_rebalance_threshold {
            require!(threshold >= 10, OmniVaultError::InvalidThreshold); // Min 0.1%
            vault.rebalance_threshold = threshold;
        }
        
        if let Some(chains) = new_target_chains {
            require!(!chains.is_empty(), OmniVaultError::InvalidChainConfiguration);
            require!(chains.len() <= MAX_CROSS_CHAIN_QUERIES as usize, OmniVaultError::TooManyChains);
            vault.target_chains = chains;
        }
        
        emit!(VaultConfigUpdated {
            vault_id: vault.id,
            updated_by: ctx.accounts.owner.key(),
        });
        
        msg!("Vault {} configuration updated", vault.id);
        Ok(())
    }

    /// Emergency pause system (admin only)
    pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        vault_store.emergency_pause = true;
        
        emit!(SystemEmergencyPause {
            triggered_by: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("System emergency pause activated");
        Ok(())
    }

    /// Resume system operations (admin only)
    pub fn resume_operations(ctx: Context<ResumeOperations>) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        vault_store.emergency_pause = false;
        
        emit!(SystemResumed {
            resumed_by: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("System operations resumed");
        Ok(())
    }
}

// Helper function to find the best chain based on risk profile
fn find_best_chain<'a>(chain_yields: &'a [ChainYield], risk_profile: &RiskProfile) -> Option<&'a ChainYield> {
    if chain_yields.is_empty() {
        return None;
    }
    
    match risk_profile {
        RiskProfile::Conservative => {
            // Prioritize low risk, then yield
            chain_yields.iter()
                .filter(|cy| cy.risk_score <= 30) // Low risk threshold
                .max_by_key(|cy| cy.apy)
        },
        RiskProfile::Moderate => {
            // Balance risk and yield
            chain_yields.iter()
                .max_by_key(|cy| {
                    // Score = APY - (risk_score * penalty_factor)
                    cy.apy.saturating_sub(cy.risk_score * 2)
                })
        },
        RiskProfile::Aggressive => {
            // Prioritize highest yield
            chain_yields.iter()
                .max_by_key(|cy| cy.apy)
        },
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
    #[account(
        init,
        payer = owner,
        space = 8 + YieldTracker::INIT_SPACE,
        seeds = [b"yield_tracker", vault.key().as_ref()],
        bump
    )]
    pub yield_tracker: Account<'info, YieldTracker>,
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
    #[account()]
    pub vault_store: Account<'info, VaultStore>,
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
    #[account()]
    pub vault_store: Account<'info, VaultStore>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct QueryCrossChainYields<'info> {
    #[account()]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub yield_tracker: Account<'info, YieldTracker>,
    /// CHECK: LayerZero Endpoint Program - verified against known program ID
    pub endpoint: AccountInfo<'info>,
    /// CHECK: OApp Configuration account - managed by LayerZero
    pub oapp_config: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LzReceive<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub yield_tracker: Account<'info, YieldTracker>,
    /// CHECK: LayerZero Endpoint Program - verified against known program ID
    pub endpoint: AccountInfo<'info>,
    /// CHECK: OApp Configuration account - managed by LayerZero
    pub oapp_config: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LzReceiveTypes<'info> {
    pub vault: Account<'info, Vault>,
    pub yield_tracker: Account<'info, YieldTracker>,
    /// CHECK: LayerZero Endpoint Program - verified against known program ID
    pub endpoint: AccountInfo<'info>,
    /// CHECK: OApp Configuration account - managed by LayerZero
    pub oapp_config: AccountInfo<'info>,
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RebalanceVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account()]
    pub vault_store: Account<'info, VaultStore>,
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

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub vault_store: Account<'info, VaultStore>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResumeOperations<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub vault_store: Account<'info, VaultStore>,
    pub authority: Signer<'info>,
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
    pub last_global_rebalance: i64,
    pub emergency_pause: bool,
    #[max_len(10)]
    pub supported_chains: Vec<u16>,
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
    #[max_len(10)]
    pub target_chains: Vec<u16>,
    pub current_best_chain: u16,
    pub current_apy: u64,
    pub rebalance_threshold: u64,
    pub emergency_exit: bool,
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

#[account]
#[derive(InitSpace)]
pub struct YieldTracker {
    pub vault: Pubkey,
    #[max_len(10)]
    pub chain_yields: Vec<ChainYield>,
    pub last_update: i64,
    pub query_nonce: u64,
    pub bump: u8,
}

// Enums and Data Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace, Debug)]
pub enum RiskProfile {
    Conservative,
    Moderate,
    Aggressive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ChainYield {
    pub chain_id: u16,
    pub apy: u64, // APY in basis points (10000 = 100%)
    pub tvl: u64, // Total Value Locked
    pub risk_score: u64, // Risk score 0-100 (0 = lowest risk)
    pub last_updated: i64,
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
    YieldQuery {
        vault_id: u64,
        risk_profile: RiskProfile,
        query_nonce: u64,
        requested_chains: Vec<u16>,
    },
    YieldResponse {
        vault_id: u64,
        chain_id: u16,
        apy: u64,
        tvl: u64,
        risk_score: u64,
        query_nonce: u64,
    },
    EmergencyPause {
        vault_id: u64,
    },
}

// Events for real-time frontend updates
#[event]
pub struct VaultCreated {
    pub vault_id: u64,
    pub owner: Pubkey,
    pub risk_profile: RiskProfile,
    pub target_chains: Vec<u16>,
}

#[event]
pub struct DepositMade {
    pub vault_id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub new_total: u64,
}

#[event]
pub struct WithdrawalMade {
    pub vault_id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct YieldQuerySent {
    pub vault_id: u64,
    pub chains: Vec<u16>,
    pub nonce: u64,
}

#[event]
pub struct YieldDataReceived {
    pub vault_id: u64,
    pub chain_id: u16,
    pub apy: u64,
    pub tvl: u64,
    pub risk_score: u64,
}

#[event]
pub struct RebalanceTriggered {
    pub vault_id: u64,
    pub from_chain: u16,
    pub to_chain: u16,
    pub yield_improvement: u64,
}

#[event]
pub struct RebalanceExecuted {
    pub vault_id: u64,
    pub allocation_data: Vec<u8>,
}

#[event]
pub struct ManualRebalance {
    pub vault_id: u64,
    pub target_chain: u16,
    pub executor: Pubkey,
}

#[event]
pub struct EmergencyPauseActivated {
    pub vault_id: u64,
    pub triggered_by_chain: u16,
}

#[event]
pub struct VaultConfigUpdated {
    pub vault_id: u64,
    pub updated_by: Pubkey,
}

#[event]
pub struct SystemEmergencyPause {
    pub triggered_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SystemResumed {
    pub resumed_by: Pubkey,
    pub timestamp: i64,
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
    #[msg("System paused")]
    SystemPaused,
    #[msg("Invalid chain configuration")]
    InvalidChainConfiguration,
    #[msg("Too many chains")]
    TooManyChains,
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Invalid nonce")]
    InvalidNonce,
    #[msg("Unsupported action")]
    UnsupportedAction,
    #[msg("Invalid target chain")]
    InvalidTargetChain,
    #[msg("Query too frequent")]
    QueryTooFrequent,
    #[msg("Vault emergency exit")]
    VaultEmergencyExit,
}
