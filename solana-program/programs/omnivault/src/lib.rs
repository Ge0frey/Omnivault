use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::{
    program::invoke_signed,
    sysvar::{clock::Clock},
    instruction::{AccountMeta, Instruction},
    system_instruction,
};
use std::str::FromStr;

declare_id!("BxpNexvSRuUoaSwdff5aEmCGX7LBDhGPtA79VVraPtqr");

// LayerZero V2 Configuration
const LAYERZERO_ENDPOINT: &str = "LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV";  // LayerZero Devnet Endpoint
const MAX_CROSS_CHAIN_QUERIES: u8 = 10;
const MIN_REBALANCE_INTERVAL: i64 = 3600; // 1 hour

// Cross-chain identifiers for supported networks
pub mod chain_ids {
    pub const ETHEREUM: u16 = 101;
    pub const ARBITRUM: u16 = 110;
    pub const POLYGON: u16 = 109;
    pub const BSC: u16 = 102;
    pub const AVALANCHE: u16 = 106;
    pub const OPTIMISM: u16 = 111;
}

#[program]
pub mod omnivault {
    use super::*;

    /// Initialize the OmniVault program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        vault_store.authority = ctx.accounts.authority.key();
        vault_store.total_vaults = 0;
        vault_store.total_tvl = 0;
        vault_store.fee_rate = 100; // 1% default fee
        vault_store.bump = ctx.bumps.vault_store;
        vault_store.last_global_rebalance = Clock::get()?.unix_timestamp;
        vault_store.emergency_pause = false;
        
        // Initialize supported chains for cross-chain operations
        vault_store.supported_chains = vec![
            chain_ids::ETHEREUM,
            chain_ids::ARBITRUM,
            chain_ids::POLYGON,
            chain_ids::BSC,
            chain_ids::AVALANCHE,
            chain_ids::OPTIMISM,
        ];
        
        msg!("OmniVault program initialized with authority: {}", vault_store.authority);
        Ok(())
    }

    /// Create a new vault with specified risk profile and strategy
    pub fn create_vault(
        ctx: Context<CreateVault>,
        risk_profile: RiskProfile,
        min_deposit: u64,
        target_chains: Vec<u16>,
    ) -> Result<()> {
        require!(!target_chains.is_empty(), OmniVaultError::InvalidChainConfiguration);
        require!(target_chains.len() <= 10, OmniVaultError::TooManyChains);
        require!(min_deposit > 0, OmniVaultError::InvalidAmount);
        
        let vault_store = &mut ctx.accounts.vault_store;
        let vault = &mut ctx.accounts.vault;
        let yield_tracker = &mut ctx.accounts.yield_tracker;
        
        vault.id = vault_store.total_vaults;
        vault.owner = ctx.accounts.owner.key();
        vault.risk_profile = risk_profile.clone();
        vault.total_deposits = 0;
        vault.total_yield = 0;
        vault.min_deposit = min_deposit;
        vault.is_active = true;
        vault.last_rebalance = Clock::get()?.unix_timestamp;
        vault.target_chains = target_chains.clone();
        vault.current_best_chain = target_chains[0]; // Default to first chain
        vault.current_apy = 0;
        vault.rebalance_threshold = 200; // 2% threshold
        vault.emergency_exit = false;
        vault.bump = ctx.bumps.vault;
        
        // Initialize yield tracker
        yield_tracker.vault = vault.key();
        yield_tracker.chain_yields = vec![];
        yield_tracker.last_update = 0;
        yield_tracker.query_nonce = 0;
        yield_tracker.bump = ctx.bumps.yield_tracker;
        
        vault_store.total_vaults += 1;
        
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

    /// Deposit native SOL into a vault
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let vault = &mut ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        let vault_store = &ctx.accounts.vault_store;
        
        require!(amount >= vault.min_deposit, OmniVaultError::DepositTooSmall);
        require!(vault.is_active, OmniVaultError::VaultInactive);
        require!(!vault_store.emergency_pause, OmniVaultError::SystemPaused);
        require!(!vault.emergency_exit, OmniVaultError::VaultEmergencyExit);
        
        // Get vault PDA seeds for signing
        let bump = &[vault.bump];
        let vault_seeds = &[
            b"vault".as_ref(),
            vault.owner.as_ref(),
            &vault.id.to_le_bytes(),
            bump,
        ];

        // Transfer SOL from user to vault using system program
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &vault.key(),
            amount,
        );
        
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;
        
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
        
        msg!("Deposited {} SOL to vault {}", amount, vault.id);
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
        let bump = &[vault.bump];
        let vault_seeds = &[
            b"vault".as_ref(),
            vault.owner.as_ref(),
            &vault.id.to_le_bytes(),
            bump,
        ];
        
        // Transfer tokens from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let signer_seeds: &[&[&[u8]]] = &[vault_seeds];
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

    /// Withdraw native SOL from a vault
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        require!(amount > 0, OmniVaultError::InvalidAmount);
        
        let user_position = &mut ctx.accounts.user_position;
        let vault = &mut ctx.accounts.vault;
        
        require!(user_position.amount >= amount, OmniVaultError::InsufficientBalance);
        
        // Calculate withdrawal fee
        let vault_store = &ctx.accounts.vault_store;
        let fee = (amount * vault_store.fee_rate as u64) / 10000;
        let withdrawal_amount = amount - fee;
        
        // Transfer SOL from vault to user
        **vault.to_account_info().try_borrow_mut_lamports()? -= withdrawal_amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += withdrawal_amount;
        
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
        
        msg!("Withdrew {} SOL from vault {} (fee: {})", withdrawal_amount, vault.id, fee);
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
        
        // Enhanced LayerZero V2 messaging
        for chain_id in &target_chains {
            // Create LayerZero send options with gas settings
            let options = create_lz_options(*chain_id)?;
            
            let lz_instruction_data = LzSendData {
                dst_chain_id: *chain_id,
                message: message_data.clone(),
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
                    AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                ],
                data: serialized_data,
            };
            
            // Invoke LayerZero endpoint with proper account handling
            invoke_signed(
                &lz_instruction,
                &[
                    ctx.accounts.endpoint.to_account_info(),
                    ctx.accounts.oapp_config.to_account_info(),
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
            
            msg!("Enhanced yield query sent to chain {} with nonce {}", chain_id, yield_tracker.query_nonce);
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
        require!(
            ctx.accounts.endpoint.key() == Pubkey::from_str(LAYERZERO_ENDPOINT).unwrap(),
            OmniVaultError::InvalidLayerZeroEndpoint
        );
        
        let vault = &mut ctx.accounts.vault;
        let yield_tracker = &mut ctx.accounts.yield_tracker;
        
        // Deserialize cross-chain message
        let message: CrossChainMessage = CrossChainMessage::try_from_slice(&payload)?;
        
        match message.action {
            CrossChainAction::YieldResponse {
                vault_id,
                chain_id,
                apy,
                tvl,
                risk_score,
                query_nonce,
            } => {
                require!(vault_id == vault.id, OmniVaultError::InvalidVaultId);
                require!(query_nonce == yield_tracker.query_nonce, OmniVaultError::InvalidNonce);
                
                let new_yield = ChainYield {
                    chain_id,
                    apy,
                    tvl,
                    risk_score,
                    last_updated: Clock::get()?.unix_timestamp,
                };
                
                // Update or add chain yield data
                if let Some(existing_yield) = yield_tracker.chain_yields.iter_mut().find(|cy| cy.chain_id == chain_id) {
                    *existing_yield = new_yield;
                } else {
                    yield_tracker.chain_yields.push(new_yield);
                }
                
                // Check if rebalancing is needed
                if let Some(best_chain) = find_best_chain(&yield_tracker.chain_yields, &vault.risk_profile) {
                    let current_apy = vault.current_apy;
                    let improvement = best_chain.apy.saturating_sub(current_apy);
                    
                    if improvement > vault.rebalance_threshold && best_chain.chain_id != vault.current_best_chain {
                        // Trigger rebalancing
                        vault.current_best_chain = best_chain.chain_id;
                        vault.current_apy = best_chain.apy;
                        vault.last_rebalance = Clock::get()?.unix_timestamp;
                        
                        emit!(RebalanceTriggered {
                            vault_id: vault.id,
                            from_chain: vault.current_best_chain,
                            to_chain: best_chain.chain_id,
                            yield_improvement: improvement,
                        });
                        
                        msg!("Automated rebalance triggered for vault {} to chain {}", vault.id, best_chain.chain_id);
                    }
                }
                
                emit!(YieldDataReceived {
                    vault_id,
                    chain_id,
                    apy,
                    tvl,
                    risk_score,
                });
                
                msg!("Received yield data from chain {}: APY {}, TVL {}", chain_id, apy, tvl);
            }
            CrossChainAction::EmergencyPause { vault_id } => {
                require!(vault_id == vault.id, OmniVaultError::InvalidVaultId);
                vault.emergency_exit = true;
                
                emit!(EmergencyPauseActivated {
                    vault_id,
                    triggered_by_chain: src_chain_id,
                });
                
                msg!("Emergency pause triggered for vault {} from chain {}", vault_id, src_chain_id);
            }
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
        // This function provides type information for LayerZero's account resolution
        // The actual implementation depends on LayerZero V2 SDK requirements
        msg!("LZ receive types called for source chain: {}", src_chain_id);
        Ok(())
    }

    /// Manual rebalance vault strategy (admin only)
    pub fn rebalance_vault(ctx: Context<RebalanceVault>, target_chain: u16) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let vault_store = &ctx.accounts.vault_store;
        
        require!(!vault_store.emergency_pause, OmniVaultError::SystemPaused);
        require!(!vault.emergency_exit, OmniVaultError::VaultEmergencyExit);
        
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp - vault.last_rebalance > MIN_REBALANCE_INTERVAL,
            OmniVaultError::RebalanceTooFrequent
        );
        
        let old_chain = vault.current_best_chain;
        vault.current_best_chain = target_chain;
        vault.last_rebalance = clock.unix_timestamp;
        
        emit!(ManualRebalance {
            vault_id: vault.id,
            target_chain,
            executor: ctx.accounts.authority.key(),
        });
        
        msg!("Manual rebalance executed for vault {} from chain {} to chain {}", 
             vault.id, old_chain, target_chain);
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
            require!(min_deposit > 0, OmniVaultError::InvalidAmount);
            vault.min_deposit = min_deposit;
        }
        
        if let Some(active_status) = new_active_status {
            vault.is_active = active_status;
        }
        
        if let Some(threshold) = new_rebalance_threshold {
            require!(threshold > 0 && threshold <= 1000, OmniVaultError::InvalidThreshold); // Max 10%
            vault.rebalance_threshold = threshold;
        }
        
        if let Some(chains) = new_target_chains {
            require!(!chains.is_empty() && chains.len() <= 10, OmniVaultError::InvalidChainConfiguration);
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
        
        msg!("System emergency pause activated by {}", ctx.accounts.authority.key());
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
        
        msg!("System operations resumed by {}", ctx.accounts.authority.key());
        Ok(())
    }
}

// Helper function to create LayerZero options for different chains
fn create_lz_options(dst_chain_id: u16) -> Result<Vec<u8>> {
    // Create options based on destination chain
    let gas_limit: u128 = match dst_chain_id {
        101 => 200_000,    // Ethereum - higher gas
        110 => 150_000,    // Arbitrum - lower gas
        109 => 100_000,    // Polygon - very low gas
        102 => 80_000,     // BSC - low gas
        106 => 120_000,    // Avalanche - medium gas
        111 => 150_000,    // Optimism - lower gas
        _ => 100_000,      // Default
    };
    
    // Simple options encoding - in production, use LayerZero SDK
    let mut options = Vec::new();
    options.extend_from_slice(&gas_limit.to_le_bytes());
    options.push(0x01); // Version flag
    
    Ok(options)
}

// Helper function to find the best chain based on risk profile
fn find_best_chain<'a>(chain_yields: &'a [ChainYield], risk_profile: &RiskProfile) -> Option<&'a ChainYield> {
    if chain_yields.is_empty() {
        return None;
    }
    
    match risk_profile {
        RiskProfile::Conservative => {
            // Prioritize low risk, then yield
            chain_yields
                .iter()
                .filter(|cy| cy.risk_score <= 30)
                .max_by_key(|cy| cy.apy)
        }
        RiskProfile::Moderate => {
            // Balance risk and yield
            chain_yields
                .iter()
                .max_by_key(|cy| cy.apy.saturating_sub(cy.risk_score * 2))
        }
        RiskProfile::Aggressive => {
            // Prioritize highest yield
            chain_yields.iter().max_by_key(|cy| cy.apy)
        }
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
pub struct DepositSol<'info> {
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
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_position: Account<'info, UserPosition>,
    #[account()]
    pub vault_store: Account<'info, VaultStore>,
    #[account(mut)]
    pub user: Signer<'info>,
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

