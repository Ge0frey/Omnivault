use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::SysvarId;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4");

// ============================================================================
// CONSTANTS
// ============================================================================

// PDA Seeds
pub const VAULT_STORE_SEED: &[u8] = b"OmniVaultStore";
pub const STRATEGY_SEED: &[u8] = b"Strategy";
pub const POSITION_SEED: &[u8] = b"Position";
pub const YIELD_DATA_SEED: &[u8] = b"YieldData";
pub const PEER_SEED: &[u8] = b"Peer";
pub const LZ_RECEIVE_TYPES_SEED: &[u8] = b"LzReceiveTypes";
pub const LZ_COMPOSE_TYPES_SEED: &[u8] = b"LzComposeTypes";

// LayerZero Configuration
pub const ENDPOINT_ID: u32 = 30168; // Solana Devnet Endpoint ID
pub const SOLANA_MAINNET_ENDPOINT_ID: u32 = 30168;
pub const ETHEREUM_MAINNET_ENDPOINT_ID: u32 = 30101;
pub const ARBITRUM_MAINNET_ENDPOINT_ID: u32 = 30110;
pub const OPTIMISM_MAINNET_ENDPOINT_ID: u32 = 30111;
pub const POLYGON_MAINNET_ENDPOINT_ID: u32 = 30109;
pub const AVALANCHE_MAINNET_ENDPOINT_ID: u32 = 30106;

// Business Logic Constants
pub const MAX_STRATEGIES_PER_VAULT: u64 = 100;
pub const MAX_POSITIONS_PER_USER: u64 = 10;
pub const MAX_CHAINS_PER_STRATEGY: u8 = 10;
pub const DEFAULT_REBALANCE_THRESHOLD_BPS: u16 = 500; // 5%
pub const DEFAULT_MAX_SLIPPAGE_BPS: u16 = 100; // 1%
pub const DEFAULT_MIN_REBALANCE_INTERVAL: i64 = 3600; // 1 hour
pub const DEFAULT_MANAGEMENT_FEE_BPS: u16 = 200; // 2%
pub const DEFAULT_PERFORMANCE_FEE_BPS: u16 = 1000; // 10%
pub const MIN_DEPOSIT_AMOUNT: u64 = 1_000_000; // 0.001 SOL (in lamports)
pub const MAX_DEPOSIT_AMOUNT: u64 = 1_000_000_000_000; // 1000 SOL (in lamports)

// Risk Management
pub const CONSERVATIVE_MAX_RISK_SCORE: u8 = 30;
pub const MODERATE_MAX_RISK_SCORE: u8 = 60;
pub const AGGRESSIVE_MAX_RISK_SCORE: u8 = 100;

// Time Constants
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const SECONDS_PER_DAY: i64 = 86400;
pub const SECONDS_PER_WEEK: i64 = 604800;

// Yield Data Validity
pub const DEFAULT_YIELD_DATA_VALIDITY: i64 = 300; // 5 minutes

// Rate Limiting
pub const DEFAULT_RATE_LIMIT_PER_HOUR: u32 = 100;
pub const DEFAULT_MAX_MESSAGE_SIZE: u32 = 1024; // 1KB

// Message type constants
pub const YIELD_UPDATE_TYPE: u8 = 1;
pub const STRATEGY_INSTRUCTION_TYPE: u8 = 2;
pub const TOKEN_MOVEMENT_TYPE: u8 = 3;
pub const POSITION_UPDATE_TYPE: u8 = 4;
pub const REBALANCE_INSTRUCTION_TYPE: u8 = 5;

// Message structure offsets
pub const MESSAGE_TYPE_OFFSET: usize = 0;
pub const PAYLOAD_LENGTH_OFFSET: usize = 1;
pub const PAYLOAD_OFFSET: usize = 5;

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum OmniVaultError {
    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,
    
    #[msg("Invalid deposit amount: Must be within min/max limits")]
    InvalidDepositAmount,
    
    #[msg("Invalid withdrawal amount: Insufficient balance")]
    InvalidWithdrawalAmount,
    
    #[msg("Vault is currently paused")]
    VaultPaused,
    
    #[msg("Strategy is not active")]
    StrategyInactive,
    
    #[msg("Position not found or inactive")]
    PositionInactive,
    
    #[msg("Rebalance not needed or too soon")]
    RebalanceNotNeeded,
    
    #[msg("Invalid risk profile")]
    InvalidRiskProfile,
    
    #[msg("Yield data is stale or invalid")]
    StaleYieldData,
    
    #[msg("Peer not trusted or rate limited")]
    PeerNotTrusted,
    
    #[msg("Message size exceeds maximum allowed")]
    MessageTooLarge,
    
    #[msg("Invalid chain endpoint ID")]
    InvalidChainEid,
    
    #[msg("Strategy allocation exceeds 100%")]
    InvalidAllocation,
    
    #[msg("Maximum number of strategies reached")]
    MaxStrategiesReached,
    
    #[msg("Maximum number of positions reached")]
    MaxPositionsReached,
    
    #[msg("Invalid message format or type")]
    InvalidMessage,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Insufficient liquidity for operation")]
    InsufficientLiquidity,
    
    #[msg("Protocol risk too high for selected profile")]
    RiskTooHigh,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Invalid time parameter")]
    InvalidTime,
    
    #[msg("Strategy not found")]
    StrategyNotFound,
    
    #[msg("Yield data not found")]
    YieldDataNotFound,
    
    #[msg("Peer configuration not found")]
    PeerNotFound,
    
    #[msg("Invalid LayerZero parameters")]
    InvalidLzParams,
    
    #[msg("Cross-chain operation failed")]
    CrossChainOperationFailed,

    #[msg("Invalid parameter")]
    InvalidParameter,

    #[msg("Invalid strategy")]
    InvalidStrategy,
}

// ============================================================================
// MESSAGE CODEC STRUCTURES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct YieldUpdatePayload {
    pub protocol_id: [u8; 32],
    pub apy_basis_points: u32,
    pub tvl: u64,
    pub available_liquidity: u64,
    pub risk_score: u8,
    pub volatility_score: u8,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StrategyInstructionPayload {
    pub strategy_id: u64,
    pub instruction_type: u8, // 1 = create, 2 = update, 3 = pause, 4 = resume
    pub target_chain_eid: u32,
    pub target_allocation_bps: u16,
    pub min_yield_bps: u16,
    pub max_slippage_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TokenMovementPayload {
    pub token_address: [u8; 32],
    pub amount: u64,
    pub source_chain_eid: u32,
    pub destination_chain_eid: u32,
    pub recipient: [u8; 32],
    pub operation_type: u8, // 1 = deposit, 2 = withdraw, 3 = rebalance
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PositionUpdatePayload {
    pub position_id: [u8; 32],
    pub new_value: u64,
    pub yield_earned: u64,
    pub fees_accrued: u64,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RebalanceInstructionPayload {
    pub strategy_id: u64,
    pub source_chain_eid: u32,
    pub destination_chain_eid: u32,
    pub amount_to_move: u64,
    pub expected_yield_improvement_bps: u16,
    pub max_slippage_bps: u16,
}

// ============================================================================
// LAYERZERO TYPES
// ============================================================================

/// LayerZero account structure for lz_receive_types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LzAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

/// LayerZero receive parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LzReceiveParams {
    pub src_eid: u32,
    pub sender: [u8; 32],
    pub nonce: u64,
    pub guid: [u8; 32],
    pub message: Vec<u8>,
}

/// LayerZero compose parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LzComposeParams {
    pub from: [u8; 32],
    pub to: Pubkey,
    pub guid: [u8; 32],
    pub index: u16,
    pub message: Vec<u8>,
}

/// LayerZero send parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LzSendParams {
    pub dst_eid: u32,
    pub to: [u8; 32],
    pub message: Vec<u8>,
    pub options: Vec<u8>,
    pub native_fee: u64,
    pub lz_token_fee: u64,
}

/// Account structure for lz_receive_types PDA
#[account]
pub struct LzReceiveTypesAccounts {
    pub store: Pubkey,
}

impl LzReceiveTypesAccounts {
    pub const LEN: usize = 8 + 32; // discriminator + store
}

/// Account structure for lz_compose_types PDA
#[account]
pub struct LzComposeTypesAccounts {
    pub store: Pubkey,
}

impl LzComposeTypesAccounts {
    pub const LEN: usize = 8 + 32; // discriminator + store
}

// ============================================================================
// STATE STRUCTURES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum RiskProfile {
    Conservative,
    Moderate,
    Aggressive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
pub struct ChainAllocation {
    /// Chain endpoint ID
    pub chain_eid: u32,
    /// Target allocation percentage (basis points)
    pub target_allocation_bps: u16,
    /// Current allocation percentage (basis points)
    pub current_allocation_bps: u16,
    /// Minimum yield threshold (basis points)
    pub min_yield_bps: u16,
}

impl Default for ChainAllocation {
    fn default() -> Self {
        Self {
            chain_eid: 0,
            target_allocation_bps: 0,
            current_allocation_bps: 0,
            min_yield_bps: 0,
        }
    }
}

#[account]
#[derive(Debug)]
pub struct VaultStore {
    /// Admin authority for the vault
    pub admin: Pubkey,
    /// Bump seed for PDA derivation
    pub bump: u8,
    /// LayerZero endpoint program ID
    pub endpoint_program: Pubkey,
    /// Total value locked in the vault
    pub total_value_locked: u64,
    /// Number of active strategies
    pub strategy_count: u64,
    /// Number of user positions
    pub position_count: u64,
    /// Vault creation timestamp
    pub created_at: i64,
    /// Last rebalance timestamp
    pub last_rebalance: i64,
    /// Emergency pause flag
    pub is_paused: bool,
    /// Minimum deposit amount
    pub min_deposit: u64,
    /// Maximum deposit amount
    pub max_deposit: u64,
    /// Management fee in basis points (e.g., 100 = 1%)
    pub management_fee_bps: u16,
    /// Performance fee in basis points
    pub performance_fee_bps: u16,
    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl VaultStore {
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        1 +  // bump
        32 + // endpoint_program
        8 +  // total_value_locked
        8 +  // strategy_count
        8 +  // position_count
        8 +  // created_at
        8 +  // last_rebalance
        1 +  // is_paused
        8 +  // min_deposit
        8 +  // max_deposit
        2 +  // management_fee_bps
        2 +  // performance_fee_bps
        64;  // reserved

    pub fn is_admin(&self, authority: &Pubkey) -> bool {
        self.admin == *authority
    }

    pub fn can_deposit(&self, amount: u64) -> bool {
        !self.is_paused && 
        amount >= self.min_deposit && 
        amount <= self.max_deposit
    }
}

#[account]
#[derive(Debug)]
pub struct Strategy {
    /// Strategy unique identifier
    pub id: u64,
    /// Strategy name
    pub name: [u8; 32],
    /// Risk profile
    pub risk_profile: RiskProfile,
    /// Vault store this strategy belongs to
    pub vault_store: Pubkey,
    /// Strategy creator/admin
    pub admin: Pubkey,
    /// Whether strategy is active
    pub is_active: bool,
    /// Rebalance threshold in basis points
    pub rebalance_threshold_bps: u16,
    /// Maximum slippage tolerance in basis points
    pub max_slippage_bps: u16,
    /// Minimum time between rebalances (seconds)
    pub min_rebalance_interval: i64,
    /// Last rebalance timestamp
    pub last_rebalance: i64,
    /// Total value managed by this strategy
    pub total_value: u64,
    /// Number of allocations
    pub allocation_count: u8,
    /// Chain allocations (max 10 chains)
    pub allocations: [ChainAllocation; 10],
    /// Strategy creation timestamp
    pub created_at: i64,
    /// Strategy update timestamp
    pub updated_at: i64,
    /// Strategy bump seed
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 128],
}

impl Strategy {
    pub const LEN: usize = 8 + // discriminator
        8 +   // id
        32 +  // name
        1 +   // risk_profile (enum)
        32 +  // vault_store
        32 +  // admin
        1 +   // is_active
        2 +   // rebalance_threshold_bps
        2 +   // max_slippage_bps
        8 +   // min_rebalance_interval
        8 +   // last_rebalance
        8 +   // total_value
        1 +   // allocation_count
        (4 + 2 + 2 + 2) * 10 + // allocations (10 * ChainAllocation size)
        8 +   // created_at
        8 +   // updated_at
        1 +   // bump
        128;  // reserved

    pub fn can_rebalance(&self, current_time: i64) -> bool {
        self.is_active && 
        current_time >= self.last_rebalance + self.min_rebalance_interval
    }

    pub fn needs_rebalancing(&self) -> bool {
        for allocation in &self.allocations[..self.allocation_count as usize] {
            let diff = if allocation.target_allocation_bps > allocation.current_allocation_bps {
                allocation.target_allocation_bps - allocation.current_allocation_bps
            } else {
                allocation.current_allocation_bps - allocation.target_allocation_bps
            };
            
            if diff >= self.rebalance_threshold_bps {
                return true;
            }
        }
        false
    }
}

#[account]
#[derive(Debug)]
pub struct Position {
    /// Position owner
    pub owner: Pubkey,
    /// Vault store this position belongs to
    pub vault_store: Pubkey,
    /// Strategy ID this position follows
    pub strategy_id: u64,
    /// Risk profile
    pub risk_profile: RiskProfile,
    /// Initial deposit amount
    pub initial_deposit: u64,
    /// Current position value
    pub current_value: u64,
    /// Total deposits made
    pub total_deposits: u64,
    /// Total withdrawals made
    pub total_withdrawals: u64,
    /// Accrued fees
    pub accrued_fees: u64,
    /// Last yield calculation
    pub last_yield_calculation: i64,
    /// Position creation timestamp
    pub created_at: i64,
    /// Last activity timestamp
    pub last_activity: i64,
    /// Whether position is active
    pub is_active: bool,
    /// Auto-compound flag
    pub auto_compound: bool,
    /// Position bump seed
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl Position {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // vault_store
        8 +  // strategy_id
        1 +  // risk_profile
        8 +  // initial_deposit
        8 +  // current_value
        8 +  // total_deposits
        8 +  // total_withdrawals
        8 +  // accrued_fees
        8 +  // last_yield_calculation
        8 +  // created_at
        8 +  // last_activity
        1 +  // is_active
        1 +  // auto_compound
        1 +  // bump
        64;  // reserved

    pub fn calculate_pnl(&self) -> i64 {
        (self.current_value as i64) - (self.total_deposits as i64) + (self.total_withdrawals as i64)
    }

    pub fn calculate_yield_percentage(&self) -> u16 {
        if self.total_deposits == 0 {
            return 0;
        }
        
        let pnl = self.calculate_pnl();
        if pnl <= 0 {
            return 0;
        }
        
        // Calculate yield as basis points
        ((pnl as u64 * 10000) / self.total_deposits) as u16
    }

    pub fn can_withdraw(&self, amount: u64) -> bool {
        self.is_active && self.current_value >= amount
    }
}

#[account]
#[derive(Debug)]
pub struct YieldData {
    /// Chain endpoint ID
    pub chain_eid: u32,
    /// Protocol identifier
    pub protocol_id: [u8; 32],
    /// Current APY in basis points
    pub apy_basis_points: u32,
    /// Total value locked in the protocol
    pub tvl: u64,
    /// Available liquidity
    pub available_liquidity: u64,
    /// Last update timestamp
    pub last_updated: i64,
    /// Data validity period (seconds)
    pub validity_period: i64,
    /// Minimum deposit amount
    pub min_deposit: u64,
    /// Maximum deposit amount
    pub max_deposit: u64,
    /// Protocol risk score (0-100, higher is riskier)
    pub risk_score: u8,
    /// Whether the protocol is active
    pub is_active: bool,
    /// Historical APY data (last 30 days average)
    pub historical_apy_30d: u32,
    /// Volatility score (0-100)
    pub volatility_score: u8,
    /// Bump seed for PDA
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl YieldData {
    pub const LEN: usize = 8 + // discriminator
        4 +  // chain_eid
        32 + // protocol_id
        4 +  // apy_basis_points
        8 +  // tvl
        8 +  // available_liquidity
        8 +  // last_updated
        8 +  // validity_period
        8 +  // min_deposit
        8 +  // max_deposit
        1 +  // risk_score
        1 +  // is_active
        4 +  // historical_apy_30d
        1 +  // volatility_score
        1 +  // bump
        64;  // reserved

    pub fn is_valid(&self, current_time: i64) -> bool {
        self.is_active && 
        current_time <= self.last_updated + self.validity_period
    }

    pub fn is_suitable_for_risk_profile(&self, risk_profile: &RiskProfile) -> bool {
        match risk_profile {
            RiskProfile::Conservative => self.risk_score <= 30 && self.volatility_score <= 30,
            RiskProfile::Moderate => self.risk_score <= 60 && self.volatility_score <= 60,
            RiskProfile::Aggressive => true, // No restrictions for aggressive
        }
    }

    pub fn calculate_risk_adjusted_yield(&self) -> u32 {
        // Simple risk adjustment: reduce yield based on risk score
        let risk_adjustment = (self.risk_score as u32 * 100) / 100; // Convert to basis points
        if self.apy_basis_points > risk_adjustment {
            self.apy_basis_points - risk_adjustment
        } else {
            0
        }
    }

    pub fn can_accommodate_deposit(&self, amount: u64) -> bool {
        self.is_active &&
        amount >= self.min_deposit &&
        amount <= self.max_deposit &&
        amount <= self.available_liquidity
    }
}

#[account]
#[derive(Debug)]
pub struct PeerConfig {
    /// Vault store this peer belongs to
    pub vault_store: Pubkey,
    /// Source chain endpoint ID
    pub src_eid: u32,
    /// Peer address on the source chain
    pub peer_address: [u8; 32],
    /// Whether this peer is trusted
    pub is_trusted: bool,
    /// Maximum message size from this peer
    pub max_message_size: u32,
    /// Rate limit: max messages per hour
    pub rate_limit_per_hour: u32,
    /// Current message count in the current hour
    pub current_hour_message_count: u32,
    /// Hour timestamp for rate limiting
    pub current_hour_timestamp: i64,
    /// Total messages received from this peer
    pub total_messages_received: u64,
    /// Last message timestamp
    pub last_message_timestamp: i64,
    /// Peer configuration creation timestamp
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl PeerConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // vault_store
        4 +  // src_eid
        32 + // peer_address
        1 +  // is_trusted
        4 +  // max_message_size
        4 +  // rate_limit_per_hour
        4 +  // current_hour_message_count
        8 +  // current_hour_timestamp
        8 +  // total_messages_received
        8 +  // last_message_timestamp
        8 +  // created_at
        1 +  // bump
        64;  // reserved

    pub fn can_receive_message(&mut self, current_time: i64, message_size: u32) -> bool {
        if !self.is_trusted {
            return false;
        }

        if message_size > self.max_message_size {
            return false;
        }

        // Check rate limiting
        let current_hour = current_time / 3600; // Convert to hours
        let stored_hour = self.current_hour_timestamp / 3600;

        if current_hour != stored_hour {
            // New hour, reset counter
            self.current_hour_message_count = 0;
            self.current_hour_timestamp = current_time;
        }

        if self.current_hour_message_count >= self.rate_limit_per_hour {
            return false;
        }

        true
    }

    pub fn record_message(&mut self, current_time: i64) {
        self.current_hour_message_count += 1;
        self.total_messages_received += 1;
        self.last_message_timestamp = current_time;
    }
}

// ============================================================================
// MESSAGE CODEC FUNCTIONS
// ============================================================================

pub fn encode_message(message_type: u8, payload: &[u8]) -> Result<Vec<u8>> {
    let payload_len = payload.len() as u32;
    let mut message = Vec::with_capacity(PAYLOAD_OFFSET + payload.len());
    
    // Message type (1 byte)
    message.push(message_type);
    
    // Payload length (4 bytes, big-endian)
    message.extend_from_slice(&payload_len.to_be_bytes());
    
    // Payload
    message.extend_from_slice(payload);
    
    Ok(message)
}

pub fn decode_message_type(message: &[u8]) -> Result<u8> {
    if message.is_empty() {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    Ok(message[MESSAGE_TYPE_OFFSET])
}

pub fn decode_payload_length(message: &[u8]) -> Result<u32> {
    if message.len() < PAYLOAD_OFFSET {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let length_bytes: [u8; 4] = message[PAYLOAD_LENGTH_OFFSET..PAYLOAD_OFFSET]
        .try_into()
        .map_err(|_| OmniVaultError::InvalidMessage)?;
    
    Ok(u32::from_be_bytes(length_bytes))
}

pub fn decode_payload(message: &[u8]) -> Result<&[u8]> {
    let payload_length = decode_payload_length(message)? as usize;
    
    if message.len() < PAYLOAD_OFFSET + payload_length {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    Ok(&message[PAYLOAD_OFFSET..PAYLOAD_OFFSET + payload_length])
}

pub fn encode_yield_update(payload: &YieldUpdatePayload) -> Result<Vec<u8>> {
    let serialized_payload = payload.try_to_vec()?;
    encode_message(YIELD_UPDATE_TYPE, &serialized_payload)
}

pub fn decode_yield_update(message: &[u8]) -> Result<YieldUpdatePayload> {
    let message_type = decode_message_type(message)?;
    if message_type != YIELD_UPDATE_TYPE {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let payload = decode_payload(message)?;
    YieldUpdatePayload::try_from_slice(payload)
        .map_err(|_| OmniVaultError::InvalidMessage.into())
}

pub fn encode_strategy_instruction(payload: &StrategyInstructionPayload) -> Result<Vec<u8>> {
    let serialized_payload = payload.try_to_vec()?;
    encode_message(STRATEGY_INSTRUCTION_TYPE, &serialized_payload)
}

pub fn decode_strategy_instruction(message: &[u8]) -> Result<StrategyInstructionPayload> {
    let message_type = decode_message_type(message)?;
    if message_type != STRATEGY_INSTRUCTION_TYPE {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let payload = decode_payload(message)?;
    StrategyInstructionPayload::try_from_slice(payload)
        .map_err(|_| OmniVaultError::InvalidMessage.into())
}

pub fn encode_token_movement(payload: &TokenMovementPayload) -> Result<Vec<u8>> {
    let serialized_payload = payload.try_to_vec()?;
    encode_message(TOKEN_MOVEMENT_TYPE, &serialized_payload)
}

pub fn decode_token_movement(message: &[u8]) -> Result<TokenMovementPayload> {
    let message_type = decode_message_type(message)?;
    if message_type != TOKEN_MOVEMENT_TYPE {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let payload = decode_payload(message)?;
    TokenMovementPayload::try_from_slice(payload)
        .map_err(|_| OmniVaultError::InvalidMessage.into())
}

pub fn encode_position_update(payload: &PositionUpdatePayload) -> Result<Vec<u8>> {
    let serialized_payload = payload.try_to_vec()?;
    encode_message(POSITION_UPDATE_TYPE, &serialized_payload)
}

pub fn decode_position_update(message: &[u8]) -> Result<PositionUpdatePayload> {
    let message_type = decode_message_type(message)?;
    if message_type != POSITION_UPDATE_TYPE {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let payload = decode_payload(message)?;
    PositionUpdatePayload::try_from_slice(payload)
        .map_err(|_| OmniVaultError::InvalidMessage.into())
}

pub fn encode_rebalance_instruction(payload: &RebalanceInstructionPayload) -> Result<Vec<u8>> {
    let serialized_payload = payload.try_to_vec()?;
    encode_message(REBALANCE_INSTRUCTION_TYPE, &serialized_payload)
}

pub fn decode_rebalance_instruction(message: &[u8]) -> Result<RebalanceInstructionPayload> {
    let message_type = decode_message_type(message)?;
    if message_type != REBALANCE_INSTRUCTION_TYPE {
        return Err(OmniVaultError::InvalidMessage.into());
    }
    
    let payload = decode_payload(message)?;
    RebalanceInstructionPayload::try_from_slice(payload)
        .map_err(|_| OmniVaultError::InvalidMessage.into())
}

pub fn extract_protocol_id(message: &[u8]) -> Result<[u8; 32]> {
    let message_type = decode_message_type(message)?;
    
    match message_type {
        YIELD_UPDATE_TYPE => {
            let payload = decode_yield_update(message)?;
            Ok(payload.protocol_id)
        }
        _ => Err(OmniVaultError::InvalidMessage.into()),
    }
}

pub fn get_message_type(message: &[u8]) -> Result<u8> {
    decode_message_type(message)
}

// ============================================================================
// INSTRUCTION PARAMETER STRUCTURES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitVaultStoreParams {
    pub endpoint: Pubkey,
    pub min_deposit: u64,
    pub max_deposit: u64,
    pub management_fee_bps: u16,
    pub performance_fee_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateStrategyParams {
    pub name: [u8; 32],
    pub risk_profile: RiskProfile,
    pub rebalance_threshold_bps: u16,
    pub max_slippage_bps: u16,
    pub min_rebalance_interval: i64,
    pub allocations: Vec<ChainAllocation>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateStrategyParams {
    pub strategy_id: u32,
    pub name: Option<[u8; 32]>,
    pub risk_profile: Option<RiskProfile>,
    pub rebalance_threshold_bps: Option<u16>,
    pub max_slippage_bps: Option<u16>,
    pub min_rebalance_interval: Option<i64>,
    pub allocations: Option<Vec<ChainAllocation>>,
    pub is_active: Option<bool>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositParams {
    pub amount: u64,
    pub strategy_id: u64,
    pub risk_profile: RiskProfile,
    pub auto_compound: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawParams {
    pub amount: u64,
    pub close_position: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ExecuteRebalanceParams {
    pub strategy_id: u64,
    pub force_rebalance: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetPeerParams {
    pub src_eid: u32,
    pub peer_address: [u8; 32],
    pub is_trusted: bool,
    pub max_message_size: u32,
    pub rate_limit_per_hour: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateYieldDataParams {
    pub chain_eid: u32,
    pub protocol_id: [u8; 32],
    pub apy_basis_points: u32,
    pub tvl: u64,
    pub available_liquidity: u64,
    pub risk_score: u8,
    pub volatility_score: u8,
    pub is_active: bool,
}

// ============================================================================
// PROGRAM MODULE
// ============================================================================

#[program]
pub mod omnivault {
    use super::*;

    /// Initialize the OmniVault store and register with LayerZero endpoint
    pub fn init_vault_store(ctx: Context<InitVaultStore>, params: InitVaultStoreParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let clock = Clock::get()?;

        // Validate parameters
        require!(
            params.min_deposit >= MIN_DEPOSIT_AMOUNT,
            OmniVaultError::InvalidDepositAmount
        );
        require!(
            params.max_deposit <= MAX_DEPOSIT_AMOUNT,
            OmniVaultError::InvalidDepositAmount
        );
        require!(
            params.min_deposit <= params.max_deposit,
            OmniVaultError::InvalidDepositAmount
        );
        require!(
            params.management_fee_bps <= 1000, // Max 10%
            OmniVaultError::InvalidAllocation
        );
        require!(
            params.performance_fee_bps <= 2000, // Max 20%
            OmniVaultError::InvalidAllocation
        );

        // Initialize vault store
        vault_store.admin = ctx.accounts.admin.key();
        vault_store.bump = ctx.bumps.vault_store;
        vault_store.endpoint_program = params.endpoint;
        vault_store.total_value_locked = 0;
        vault_store.strategy_count = 0;
        vault_store.position_count = 0;
        vault_store.created_at = clock.unix_timestamp;
        vault_store.last_rebalance = clock.unix_timestamp;
        vault_store.is_paused = false;
        vault_store.min_deposit = params.min_deposit;
        vault_store.max_deposit = params.max_deposit;
        vault_store.management_fee_bps = params.management_fee_bps;
        vault_store.performance_fee_bps = params.performance_fee_bps;
        vault_store.reserved = [0; 64];

        // Initialize LZ receive types account
        ctx.accounts.lz_receive_types_accounts.store = vault_store.key();

        // Initialize LZ compose types account
        ctx.accounts.lz_compose_types_accounts.store = vault_store.key();

        msg!("OmniVault initialized successfully");
        msg!("Vault Store: {}", vault_store.key());
        msg!("Admin: {}", vault_store.admin);
        msg!("Endpoint: {}", vault_store.endpoint_program);

        Ok(())
    }

    /// LayerZero receive types - specifies accounts needed for lz_receive
    pub fn lz_receive_types(ctx: Context<LzReceiveTypes>, params: LzReceiveParams) -> Result<Vec<LzAccount>> {
        let vault_store = ctx.accounts.vault_store.key();

        // Get the peer PDA for the source chain
        let peer_seeds = [
            PEER_SEED,
            vault_store.as_ref(),
            &params.src_eid.to_be_bytes(),
        ];
        let (peer, _) = Pubkey::find_program_address(&peer_seeds, ctx.program_id);

        let mut accounts = vec![
            // Core accounts
            LzAccount {
                pubkey: vault_store,
                is_signer: false,
                is_writable: true,
            },
            LzAccount {
                pubkey: peer,
                is_signer: false,
                is_writable: false,
            },
        ];

        // Determine message type and add specific accounts
        if let Ok(message_type) = get_message_type(&params.message) {
            match message_type {
                YIELD_UPDATE_TYPE => {
                    // Add yield data PDA
                    if let Ok(protocol_id) = extract_protocol_id(&params.message) {
                        let yield_data_seeds = [
                            YIELD_DATA_SEED,
                            &params.src_eid.to_be_bytes(),
                            &protocol_id,
                        ];
                        let (yield_data, _) = Pubkey::find_program_address(&yield_data_seeds, ctx.program_id);

                        accounts.push(LzAccount {
                            pubkey: yield_data,
                            is_signer: false,
                            is_writable: true,
                        });
                    }
                }
                STRATEGY_INSTRUCTION_TYPE => {
                    // Add strategy PDA (will be determined from message payload)
                    // For now, we'll add a placeholder that will be resolved in lz_receive
                    accounts.push(LzAccount {
                        pubkey: Pubkey::default(),
                        is_signer: false,
                        is_writable: true,
                    });
                }
                POSITION_UPDATE_TYPE => {
                    // Add position PDA (will be determined from message payload)
                    accounts.push(LzAccount {
                        pubkey: Pubkey::default(),
                        is_signer: false,
                        is_writable: true,
                    });
                }
                TOKEN_MOVEMENT_TYPE => {
                    // Add token-related accounts
                    accounts.extend(vec![
                        LzAccount {
                            pubkey: anchor_spl::token::ID,
                            is_signer: false,
                            is_writable: false,
                        },
                        LzAccount {
                            pubkey: Pubkey::default(), // Token account placeholder
                            is_signer: false,
                            is_writable: true,
                        },
                    ]);
                }
                REBALANCE_INSTRUCTION_TYPE => {
                    // Add strategy PDA
                    accounts.push(LzAccount {
                        pubkey: Pubkey::default(),
                        is_signer: false,
                        is_writable: true,
                    });
                }
                _ => {
                    // Unknown message type, minimal accounts
                }
            }
        }

        // Add system program and rent sysvar (required for most operations)
        accounts.extend(vec![
            LzAccount {
                pubkey: System::id(),
                is_signer: false,
                is_writable: false,
            },
            LzAccount {
                pubkey: Rent::id(),
                is_signer: false,
                is_writable: false,
            },
        ]);

        // Add clock sysvar for timestamp operations
        accounts.push(LzAccount {
            pubkey: Clock::id(),
            is_signer: false,
            is_writable: false,
        });

        Ok(accounts)
    }

    /// LayerZero receive - handles incoming cross-chain messages
    pub fn lz_receive(ctx: Context<LzReceive>, params: LzReceiveParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let peer = &mut ctx.accounts.peer;
        let clock = &ctx.accounts.clock;

        // Validate peer can receive this message
        require!(
            peer.can_receive_message(clock.unix_timestamp, params.message.len() as u32),
            OmniVaultError::PeerNotTrusted
        );

        // Record the message
        peer.record_message(clock.unix_timestamp);

        // Process message based on type
        let message_type = get_message_type(&params.message)?;

        match message_type {
            YIELD_UPDATE_TYPE => {
                handle_yield_update(vault_store, &params, clock.unix_timestamp)?;
            }
            STRATEGY_INSTRUCTION_TYPE => {
                handle_strategy_instruction(vault_store, &params, clock.unix_timestamp)?;
            }
            TOKEN_MOVEMENT_TYPE => {
                handle_token_movement(vault_store, &params, clock.unix_timestamp)?;
            }
            POSITION_UPDATE_TYPE => {
                handle_position_update(vault_store, &params, clock.unix_timestamp)?;
            }
            REBALANCE_INSTRUCTION_TYPE => {
                handle_rebalance_instruction(vault_store, &params, clock.unix_timestamp)?;
            }
            _ => {
                return Err(OmniVaultError::InvalidMessage.into());
            }
        }

        msg!("LayerZero message processed successfully");
        msg!("Source EID: {}", params.src_eid);
        msg!("Message type: {}", message_type);
        msg!("Nonce: {}", params.nonce);

        Ok(())
    }

    /// Create a new yield optimization strategy
    pub fn create_strategy(ctx: Context<CreateStrategy>, params: CreateStrategyParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let strategy = &mut ctx.accounts.strategy;
        let clock = &ctx.accounts.clock;

        require!(
            vault_store.strategy_count < MAX_STRATEGIES_PER_VAULT,
            OmniVaultError::MaxStrategiesReached
        );

        require!(
            params.allocations.len() <= MAX_CHAINS_PER_STRATEGY as usize,
            OmniVaultError::InvalidAllocation
        );

        // Validate total allocation doesn't exceed 100%
        let total_allocation: u16 = params.allocations.iter()
            .map(|a| a.target_allocation_bps)
            .sum();
        require!(
            total_allocation <= 10000, // 100% in basis points
            OmniVaultError::InvalidAllocation
        );

        strategy.id = vault_store.strategy_count;
        strategy.name = params.name;
        strategy.risk_profile = params.risk_profile;
        strategy.vault_store = vault_store.key();
        strategy.admin = ctx.accounts.admin.key();
        strategy.is_active = true;
        strategy.rebalance_threshold_bps = params.rebalance_threshold_bps;
        strategy.max_slippage_bps = params.max_slippage_bps;
        strategy.min_rebalance_interval = params.min_rebalance_interval;
        strategy.last_rebalance = clock.unix_timestamp;
        strategy.total_value = 0;
        strategy.allocation_count = params.allocations.len() as u8;
        strategy.created_at = clock.unix_timestamp;
        strategy.updated_at = clock.unix_timestamp;
        strategy.bump = ctx.bumps.strategy;
        strategy.reserved = [0; 128];

        // Copy allocations
        for (i, allocation) in params.allocations.iter().enumerate() {
            if i < 10 {
                strategy.allocations[i] = allocation.clone();
            }
        }

        vault_store.strategy_count += 1;

        msg!("Strategy created successfully");
        msg!("Strategy ID: {}", strategy.id);
        msg!("Risk Profile: {:?}", strategy.risk_profile);

        Ok(())
    }

    /// Update an existing strategy
    pub fn update_strategy(ctx: Context<UpdateStrategy>, params: UpdateStrategyParams) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        let clock = &ctx.accounts.clock;

        // Update name if provided
        if let Some(name) = params.name {
            strategy.name = name;
        }

        // Update risk profile if provided
        if let Some(risk_profile) = params.risk_profile {
            strategy.risk_profile = risk_profile;
        }

        // Update rebalance threshold if provided
        if let Some(rebalance_threshold_bps) = params.rebalance_threshold_bps {
            require!(
                rebalance_threshold_bps <= 10000, // Max 100%
                OmniVaultError::InvalidParameter
            );
            strategy.rebalance_threshold_bps = rebalance_threshold_bps;
        }

        // Update max slippage if provided
        if let Some(max_slippage_bps) = params.max_slippage_bps {
            require!(
                max_slippage_bps <= 1000, // Max 10%
                OmniVaultError::InvalidParameter
            );
            strategy.max_slippage_bps = max_slippage_bps;
        }

        // Update min rebalance interval if provided
        if let Some(min_rebalance_interval) = params.min_rebalance_interval {
            require!(
                min_rebalance_interval >= 300, // Minimum 5 minutes
                OmniVaultError::InvalidParameter
            );
            strategy.min_rebalance_interval = min_rebalance_interval;
        }

        // Update allocations if provided
        if let Some(allocations) = params.allocations {
            require!(
                allocations.len() <= MAX_CHAINS_PER_STRATEGY as usize,
                OmniVaultError::InvalidAllocation
            );

            // Validate total allocation doesn't exceed 100%
            let total_allocation: u16 = allocations.iter()
                .map(|a| a.target_allocation_bps)
                .sum();
            require!(
                total_allocation <= 10000, // 100% in basis points
                OmniVaultError::InvalidAllocation
            );

            // Clear existing allocations
            strategy.allocations = [ChainAllocation::default(); 10];
            strategy.allocation_count = allocations.len() as u8;

            // Copy new allocations
            for (i, allocation) in allocations.iter().enumerate() {
                if i < 10 {
                    strategy.allocations[i] = allocation.clone();
                }
            }
        }

        // Update active status if provided
        if let Some(is_active) = params.is_active {
            strategy.is_active = is_active;
        }

        strategy.updated_at = clock.unix_timestamp;

        msg!("Strategy updated successfully");
        msg!("Strategy ID: {}", strategy.id);
        msg!("Updated at: {}", strategy.updated_at);

        Ok(())
    }

    /// User deposits tokens into the vault
    pub fn deposit(ctx: Context<Deposit>, params: DepositParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let position = &mut ctx.accounts.position;
        let strategy = &ctx.accounts.strategy;
        let clock = &ctx.accounts.clock;

        // Validate vault is not paused
        require!(!vault_store.is_paused, OmniVaultError::VaultPaused);

        // Validate deposit amount
        require!(
            vault_store.can_deposit(params.amount),
            OmniVaultError::InvalidDepositAmount
        );

        // Validate strategy belongs to this vault
        require!(
            strategy.vault_store == vault_store.key(),
            OmniVaultError::StrategyNotFound
        );

        // Initialize position if this is the first deposit
        if position.owner == Pubkey::default() {
            position.owner = ctx.accounts.user.key();
            position.vault_store = vault_store.key();
            position.strategy_id = params.strategy_id;
            position.risk_profile = params.risk_profile;
            position.initial_deposit = params.amount;
            position.current_value = params.amount;
            position.total_deposits = params.amount;
            position.total_withdrawals = 0;
            position.accrued_fees = 0;
            position.last_yield_calculation = clock.unix_timestamp;
            position.created_at = clock.unix_timestamp;
            position.last_activity = clock.unix_timestamp;
            position.is_active = true;
            position.auto_compound = params.auto_compound;
            position.bump = ctx.bumps.position;
            position.reserved = [0; 64];

            // Increment position count
            vault_store.position_count = vault_store
                .position_count
                .checked_add(1)
                .ok_or(OmniVaultError::ArithmeticOverflow)?;
        } else {
            // Update existing position
            require!(position.is_active, OmniVaultError::PositionInactive);
            require!(
                position.strategy_id == params.strategy_id,
                OmniVaultError::StrategyNotFound
            );

            position.total_deposits = position
                .total_deposits
                .checked_add(params.amount)
                .ok_or(OmniVaultError::ArithmeticOverflow)?;

            position.current_value = position
                .current_value
                .checked_add(params.amount)
                .ok_or(OmniVaultError::ArithmeticOverflow)?;

            position.last_activity = clock.unix_timestamp;
        }

        // Transfer tokens from user to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, params.amount)?;

        // Update vault TVL
        vault_store.total_value_locked = vault_store
            .total_value_locked
            .checked_add(params.amount)
            .ok_or(OmniVaultError::ArithmeticOverflow)?;

        msg!("Deposit successful");
        msg!("User: {}", ctx.accounts.user.key());
        msg!("Amount: {}", params.amount);
        msg!("Strategy ID: {}", params.strategy_id);
        msg!("Position Value: {}", position.current_value);
        msg!("Vault TVL: {}", vault_store.total_value_locked);

        Ok(())
    }

    /// User withdraws tokens from the vault
    pub fn withdraw(ctx: Context<Withdraw>, params: WithdrawParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let position = &mut ctx.accounts.position;
        let clock = &ctx.accounts.clock;

        require!(!vault_store.is_paused, OmniVaultError::VaultPaused);
        require!(
            position.can_withdraw(params.amount),
            OmniVaultError::InvalidWithdrawalAmount
        );

        let vault_seeds = &[VAULT_STORE_SEED, &[vault_store.bump]];
        let signer = &[&vault_seeds[..]];

        // Transfer tokens from vault to user
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: vault_store.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, params.amount)?;

        // Update position
        position.current_value = position
            .current_value
            .checked_sub(params.amount)
            .ok_or(OmniVaultError::ArithmeticOverflow)?;

        position.total_withdrawals = position
            .total_withdrawals
            .checked_add(params.amount)
            .ok_or(OmniVaultError::ArithmeticOverflow)?;

        position.last_activity = clock.unix_timestamp;

        if params.close_position || position.current_value == 0 {
            position.is_active = false;
        }

        // Update vault TVL
        vault_store.total_value_locked = vault_store
            .total_value_locked
            .checked_sub(params.amount)
            .ok_or(OmniVaultError::ArithmeticOverflow)?;

        msg!("Withdrawal successful");
        msg!("Amount: {}", params.amount);
        msg!("Remaining Position Value: {}", position.current_value);

        Ok(())
    }

    /// Execute rebalancing across chains
    pub fn execute_rebalance(ctx: Context<ExecuteRebalance>, params: ExecuteRebalanceParams) -> Result<()> {
        let vault_store = &mut ctx.accounts.vault_store;
        let strategy = &mut ctx.accounts.strategy;
        let clock = &ctx.accounts.clock;

        require!(strategy.is_active, OmniVaultError::StrategyInactive);

        if !params.force_rebalance {
            require!(
                strategy.can_rebalance(clock.unix_timestamp),
                OmniVaultError::RebalanceNotNeeded
            );
            require!(
                strategy.needs_rebalancing(),
                OmniVaultError::RebalanceNotNeeded
            );
        }

        strategy.last_rebalance = clock.unix_timestamp;
        vault_store.last_rebalance = clock.unix_timestamp;

        msg!("Rebalance executed for strategy: {}", strategy.id);
        Ok(())
    }

    /// Set peer configuration for cross-chain communication
    pub fn set_peer(ctx: Context<SetPeer>, params: SetPeerParams) -> Result<()> {
        let peer = &mut ctx.accounts.peer;
        let clock = &ctx.accounts.clock;

        peer.vault_store = ctx.accounts.vault_store.key();
        peer.src_eid = params.src_eid;
        peer.peer_address = params.peer_address;
        peer.is_trusted = params.is_trusted;
        peer.max_message_size = params.max_message_size;
        peer.rate_limit_per_hour = params.rate_limit_per_hour;
        peer.current_hour_message_count = 0;
        peer.current_hour_timestamp = clock.unix_timestamp;
        peer.total_messages_received = 0;
        peer.last_message_timestamp = 0;
        peer.created_at = clock.unix_timestamp;
        peer.bump = ctx.bumps.peer;
        peer.reserved = [0; 64];

        msg!("Peer configured for EID: {}", params.src_eid);
        Ok(())
    }

    /// Update yield data from cross-chain sources
    pub fn update_yield_data(ctx: Context<UpdateYieldData>, params: UpdateYieldDataParams) -> Result<()> {
        let yield_data = &mut ctx.accounts.yield_data;
        let clock = &ctx.accounts.clock;

        yield_data.chain_eid = params.chain_eid;
        yield_data.protocol_id = params.protocol_id;
        yield_data.apy_basis_points = params.apy_basis_points;
        yield_data.tvl = params.tvl;
        yield_data.available_liquidity = params.available_liquidity;
        yield_data.last_updated = clock.unix_timestamp;
        yield_data.validity_period = DEFAULT_YIELD_DATA_VALIDITY;
        yield_data.min_deposit = MIN_DEPOSIT_AMOUNT;
        yield_data.max_deposit = MAX_DEPOSIT_AMOUNT;
        yield_data.risk_score = params.risk_score;
        yield_data.is_active = params.is_active;
        yield_data.historical_apy_30d = params.apy_basis_points; // Simplified
        yield_data.volatility_score = params.volatility_score;
        yield_data.bump = ctx.bumps.yield_data;
        yield_data.reserved = [0; 64];

        msg!("Yield data updated for protocol: {:?}", params.protocol_id);
        msg!("APY: {} bps", params.apy_basis_points);
        msg!("TVL: {}", params.tvl);

        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

#[derive(Accounts)]
pub struct InitVaultStore<'info> {
    #[account(
        init,
        payer = admin,
        space = VaultStore::LEN,
        seeds = [VAULT_STORE_SEED],
        bump
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        init,
        payer = admin,
        space = LzReceiveTypesAccounts::LEN,
        seeds = [LZ_RECEIVE_TYPES_SEED, vault_store.key().as_ref()],
        bump
    )]
    pub lz_receive_types_accounts: Account<'info, LzReceiveTypesAccounts>,

    #[account(
        init,
        payer = admin,
        space = LzComposeTypesAccounts::LEN,
        seeds = [LZ_COMPOSE_TYPES_SEED, vault_store.key().as_ref()],
        bump
    )]
    pub lz_compose_types_accounts: Account<'info, LzComposeTypesAccounts>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceiveTypes<'info> {
    #[account(
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        seeds = [LZ_RECEIVE_TYPES_SEED, vault_store.key().as_ref()],
        bump
    )]
    pub lz_receive_types_accounts: Account<'info, LzReceiveTypesAccounts>,
}

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceive<'info> {
    #[account(
        mut,
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        mut,
        seeds = [PEER_SEED, vault_store.key().as_ref(), &params.src_eid.to_be_bytes()],
        bump = peer.bump,
        constraint = params.sender == peer.peer_address @ OmniVaultError::PeerNotTrusted
    )]
    pub peer: Account<'info, PeerConfig>,

    pub clock: Sysvar<'info, Clock>,
    /// CHECK: Remaining accounts will be validated based on message type
    pub remaining_accounts: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(params: CreateStrategyParams)]
pub struct CreateStrategy<'info> {
    #[account(
        mut,
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump,
        constraint = vault_store.is_admin(&admin.key()) @ OmniVaultError::Unauthorized
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        init,
        payer = admin,
        space = Strategy::LEN,
        seeds = [STRATEGY_SEED, &vault_store.strategy_count.to_le_bytes()],
        bump
    )]
    pub strategy: Account<'info, Strategy>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(params: UpdateStrategyParams)]
pub struct UpdateStrategy<'info> {
    #[account(
        mut,
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump,
        constraint = vault_store.is_admin(&admin.key()) @ OmniVaultError::Unauthorized
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        mut,
        seeds = [STRATEGY_SEED, &params.strategy_id.to_le_bytes()],
        bump = strategy.bump,
        constraint = strategy.vault_store == vault_store.key() @ OmniVaultError::InvalidStrategy,
        constraint = strategy.admin == admin.key() @ OmniVaultError::Unauthorized
    )]
    pub strategy: Account<'info, Strategy>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(params: DepositParams)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        init_if_needed,
        payer = user,
        space = Position::LEN,
        seeds = [POSITION_SEED, user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        seeds = [STRATEGY_SEED, &params.strategy_id.to_le_bytes()],
        bump = strategy.bump,
        constraint = strategy.is_active @ OmniVaultError::StrategyInactive
    )]
    pub strategy: Account<'info, Strategy>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.amount >= params.amount @ OmniVaultError::InvalidDepositAmount
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(params: WithdrawParams)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [VAULT_STORE_SEED],
        bump = vault_store.bump
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(
        mut,
        seeds = [POSITION_SEED, user.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == user.key() @ OmniVaultError::Unauthorized,
        constraint = position.is_active @ OmniVaultError::PositionInactive
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ExecuteRebalance<'info> {
    #[account(mut)]
    pub vault_store: Account<'info, VaultStore>,
    
    #[account(mut)]
    pub strategy: Account<'info, Strategy>,
    
    pub admin: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(params: SetPeerParams)]
pub struct SetPeer<'info> {
    #[account(
        init_if_needed,
        payer = admin,
        space = PeerConfig::LEN,
        seeds = [PEER_SEED, vault_store.key().as_ref(), &params.src_eid.to_be_bytes()],
        bump
    )]
    pub peer: Account<'info, PeerConfig>,

    #[account(
        constraint = vault_store.is_admin(&admin.key()) @ OmniVaultError::Unauthorized
    )]
    pub vault_store: Account<'info, VaultStore>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(params: UpdateYieldDataParams)]
pub struct UpdateYieldData<'info> {
    #[account(
        init_if_needed,
        payer = admin,
        space = YieldData::LEN,
        seeds = [YIELD_DATA_SEED, &params.chain_eid.to_be_bytes(), &params.protocol_id],
        bump
    )]
    pub yield_data: Account<'info, YieldData>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn handle_yield_update(
    _vault_store: &mut VaultStore,
    params: &LzReceiveParams,
    _current_time: i64,
) -> Result<()> {
    let payload = decode_yield_update(&params.message)?;

    msg!("Yield update received:");
    msg!("Protocol ID: {:?}", payload.protocol_id);
    msg!("APY: {} bps", payload.apy_basis_points);
    msg!("TVL: {}", payload.tvl);
    msg!("Available Liquidity: {}", payload.available_liquidity);
    msg!("Risk Score: {}", payload.risk_score);
    msg!("Timestamp: {}", payload.timestamp);

    // Here you would update the YieldData PDA
    // This requires access to the remaining accounts which would contain the YieldData account

    Ok(())
}

fn handle_strategy_instruction(
    _vault_store: &mut VaultStore,
    params: &LzReceiveParams,
    _current_time: i64,
) -> Result<()> {
    let payload = decode_strategy_instruction(&params.message)?;

    msg!("Strategy instruction received:");
    msg!("Strategy ID: {}", payload.strategy_id);
    msg!("Instruction Type: {}", payload.instruction_type);
    msg!("Target Chain EID: {}", payload.target_chain_eid);
    msg!("Target Allocation: {} bps", payload.target_allocation_bps);

    // Process the strategy instruction
    match payload.instruction_type {
        1 => msg!("Create strategy instruction"),
        2 => msg!("Update strategy instruction"),
        3 => msg!("Pause strategy instruction"),
        4 => msg!("Resume strategy instruction"),
        _ => return Err(OmniVaultError::InvalidMessage.into()),
    }

    Ok(())
}

fn handle_token_movement(
    vault_store: &mut VaultStore,
    params: &LzReceiveParams,
    _current_time: i64,
) -> Result<()> {
    let payload = decode_token_movement(&params.message)?;

    msg!("Token movement received:");
    msg!("Token Address: {:?}", payload.token_address);
    msg!("Amount: {}", payload.amount);
    msg!("Source Chain: {}", payload.source_chain_eid);
    msg!("Destination Chain: {}", payload.destination_chain_eid);
    msg!("Operation Type: {}", payload.operation_type);

    // Update vault TVL based on operation type
    match payload.operation_type {
        1 => {
            // Deposit
            vault_store.total_value_locked = vault_store
                .total_value_locked
                .checked_add(payload.amount)
                .ok_or(OmniVaultError::ArithmeticOverflow)?;
        }
        2 => {
            // Withdraw
            vault_store.total_value_locked = vault_store
                .total_value_locked
                .checked_sub(payload.amount)
                .ok_or(OmniVaultError::ArithmeticOverflow)?;
        }
        3 => {
            // Rebalance - no net change in TVL
            msg!("Rebalance operation, no TVL change");
        }
        _ => return Err(OmniVaultError::InvalidMessage.into()),
    }

    Ok(())
}

fn handle_position_update(
    _vault_store: &mut VaultStore,
    params: &LzReceiveParams,
    _current_time: i64,
) -> Result<()> {
    let payload = decode_position_update(&params.message)?;

    msg!("Position update received:");
    msg!("Position ID: {:?}", payload.position_id);
    msg!("New Value: {}", payload.new_value);
    msg!("Yield Earned: {}", payload.yield_earned);
    msg!("Fees Accrued: {}", payload.fees_accrued);
    msg!("Timestamp: {}", payload.timestamp);

    // Here you would update the Position PDA
    // This requires access to the remaining accounts

    Ok(())
}

fn handle_rebalance_instruction(
    vault_store: &mut VaultStore,
    params: &LzReceiveParams,
    current_time: i64,
) -> Result<()> {
    let payload = decode_rebalance_instruction(&params.message)?;

    msg!("Rebalance instruction received:");
    msg!("Strategy ID: {}", payload.strategy_id);
    msg!("Source Chain: {}", payload.source_chain_eid);
    msg!("Destination Chain: {}", payload.destination_chain_eid);
    msg!("Amount to Move: {}", payload.amount_to_move);
    msg!("Expected Yield Improvement: {} bps", payload.expected_yield_improvement_bps);

    // Update last rebalance timestamp
    vault_store.last_rebalance = current_time;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize {}
