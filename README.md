# OmniVault 🚀

## Access platform from - https://omnizerovault.vercel.app/

# Quick links
### Video demo link with commentary -  https://youtu.be/wfsZKqv5FYo


> **Cross-chain yield optimization platform built on Solana with LayerZero V2 integration**

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![LayerZero](https://img.shields.io/badge/LayerZero-V2-blue?style=for-the-badge)](https://layerzero.network/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Anchor](https://img.shields.io/badge/Anchor-FF6B35?style=for-the-badge)](https://www.anchor-lang.com/)

## 🌟 Overview

OmniVault is a sophisticated DeFi platform that leverages LayerZero V2 technology to optimize yield farming across multiple blockchain networks. By automatically monitoring yield opportunities across chains and rebalancing user funds, OmniVault maximizes returns while minimizing risk.

## ✨ Features

### 🔥 Core Functionality
- **🌐 Cross-Chain Yield Optimization**: Automatically find and capitalize on the best yield opportunities across supported chains
- **⚡ LayerZero V2 Integration**: Secure, trust-minimized cross-chain messaging
- **🛡️ Risk Management**: Risk-Based Vault Management with Conservative, Moderate, and Aggressive risk profiles
- **🔄 Real-time Rebalancing**: Automated fund movement to highest-yielding protocols
- **📊 Transparent Analytics**: Cross-chain analytics dashboard with performance tracking
- **💰 SOL & Token Support**: Native SOL deposits and withdrawals with SPL token support

### 🛠️ Technical Features
- **🏗️ Solana Program**: High-performance smart contracts built with Anchor framework
- **🌉 LayerZero OApp**: Native omnichain application enabling true cross-chain functionality
- **⚛️ React Frontend**: Modern, responsive user interface with real-time updates
- **🔗 Wallet Integration**: Support for Phantom, Solflare, and Torus wallets
- **📡 Live Data Sync**: Real-time synchronization and event notifications
- **🐳 Docker Support**: Containerized local development environment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OMNIVAULT ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

👤 USER
  │
  │ 1. Connect Wallet
  ▼
┌─────────────────┐
│   🦊 PHANTOM    │ ──── Wallet Adapter ──── React Frontend
│     WALLET      │                           │
└─────────────────┘                           │
                                              ▼
                                    ┌─────────────────┐
                                    │  📱 FRONTEND    │
                                    │  (React + TS)   │
                                    │                 │
                                    │ • Dashboard     │
                                    │ • Vault Mgmt    │
                                    │ • Analytics     │
                                    │ • Yield Monitor │
                                    └─────────────────┘
                                              │
                                              │ 2. Create Vault / Deposit
                                              ▼
                                    ┌─────────────────┐
                                    │  ⚓ ANCHOR      │
                                    │  PROGRAM        │
                                    │                 │
                                    │ • VaultStore    │
                                    │ • User Vaults   │
                                    │ • Positions     │
                                    │ • YieldTracker  │
                                    └─────────────────┘
                                              │
                                              │ 3. Cross-chain Operations
                                              ▼
                                    ┌─────────────────┐
                                    │  🌉 LAYERZERO   │
                                    │  V2 ENDPOINT    │
                                    │                 │
                                    │ • OApp Logic    │
                                    │ • Messaging     │
                                    │ • Verification  │
                                    └─────────────────┘
                                              │
                                              │ 4. Cross-chain Yield Optimization
                                              ▼
                            ┌─────────────────────────────────────────┐
                            │           🌐 TARGET CHAINS              │
                            │                                         │
                            │  ETH    ARB    POLY   OPT   BASE  AVAX │
                            │  ┌───┐  ┌───┐  ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
                            │  │DeFi│  │DeFi│  │DeFi│ │DeFi│ │DeFi│ │DeFi│ │
                            │  │Apps│  │Apps│  │Apps│ │Apps│ │Apps│ │Apps│ │
                            │  └───┘  └───┘  └───┘ └───┘ └───┘ └───┘ │
                            └─────────────────────────────────────────┘
```

## 📁 Project Structure

```
OmniVault/
│
├── 🎨 frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/           # 🧩 Reusable UI components
│   │   │   ├── Header.tsx        # Navigation header
│   │   │   ├── WalletProvider.tsx # Solana wallet integration
│   │   │   ├── YieldMonitor.tsx  # Cross-chain yield tracking
│   │   │   └── TransactionSuccess.tsx # Transaction feedback
│   │   ├── pages/                # 📄 Application pages
│   │   │   ├── Landing.tsx       # Landing page
│   │   │   ├── Dashboard.tsx     # Main dashboard
│   │   │   ├── Deposit.tsx       # Deposit interface
│   │   │   ├── Withdraw.tsx      # Withdrawal interface
│   │   │   ├── Strategies.tsx    # Strategy templates
│   │   │   └── Analytics.tsx     # Performance analytics
│   │   ├── hooks/                # 🪝 Custom React hooks
│   │   │   └── useOmniVault.ts   # Main application state hook
│   │   ├── services/             # 🔧 Blockchain services
│   │   │   └── omnivault.ts      # Solana program service
│   │   ├── idl/                  # 📋 Generated IDL types
│   │   │   ├── omnivault.json    # Program interface definition
│   │   │   └── omnivault.ts      # TypeScript types
│   │   └── assets/               # 🖼️ Static assets
│   └── package.json              # 📦 Frontend dependencies
│
├── ⚓ solana-program/             # Solana program (smart contracts)
│   ├── programs/
│   │   └── omnivault/
│   │       └── src/
│   │           └── lib.rs        # 🦀 Main program logic with LayerZero V2
│   ├── tests/                    # 🧪 Comprehensive program tests
│   │   └── omnivault.ts          # Test suite
│   ├── target/                   # 🎯 Build artifacts & IDL
│   └── Anchor.toml               # ⚙️ Anchor configuration
│
├── 📜 scripts/                   # Deployment and utility scripts
│   ├── deploy.sh                 # 🚀 Automated deployment script
│   └── generate-idl.js           # 📋 IDL TypeScript generation
│
├── 🐳 docker-compose.yml         # Local Solana test validator
└── 📖 README.md                  # This file
```

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js 18+** and npm
- **Rust** and Cargo
- **Solana CLI** tools
- **Anchor framework** v0.31+
- **Solana wallet** with devnet SOL

### 💻 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ge0frey/Omnivault
   cd OmniVault
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   
   # Solana program dependencies
   cd ../solana-program
   npm install
   ```

3. **Set up local environment (optional)**
   ```bash
   # Start local Solana test validator with Docker
   docker-compose up -d solana-test-validator
   
   # Or use the frontend environment configuration
   cd frontend
   cp .env.example .env
   # Edit .env to set VITE_USE_LOCAL_VALIDATOR=true for localhost
   ```

4. **Build the program and generate IDL**
   ```bash
   cd solana-program
   anchor build
   
   # Generate TypeScript types for frontend
   cd ..
   node scripts/generate-idl.js
   ```

5. **Deploy to devnet** 🚀
   ```bash
   ./scripts/deploy.sh
   ```

6. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application** 🌐
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 🔧 Configuration & Development

### 🌐 Network Configuration

The application supports multiple Solana network configurations:

```bash
# For devnet (default)
# Leave environment variables commented out

# For local development with Solana validator
VITE_USE_LOCAL_VALIDATOR=true

# For custom RPC endpoint
VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com
```

### 📋 IDL Integration & Development

The integration between the Solana program and frontend is managed through the IDL:

```bash
# Build program and copy IDL to frontend
node scripts/generate-idl.js
```

This script automatically:
1. 🏗️ Builds the Anchor program (`anchor build`)
2. 📋 Copies generated IDL JSON to `frontend/src/idl/omnivault.json`
3. 🔧 Copies TypeScript types to `frontend/src/idl/omnivault.ts`

### 🔄 Development Workflow

When making changes to the Solana program:

```bash
# 1. Make changes to solana-program/programs/omnivault/src/lib.rs
# 2. Regenerate IDL and types
node scripts/generate-idl.js

# 3. Frontend will automatically use updated types
cd frontend && npm run dev
```

## 🎮 Usage Guide

### 🔥 Getting Started

1. **🔗 Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **⚡ Initialize System**: If prompted, initialize the OmniVault system (one-time setup)
3. **🏗️ Create Vault**: Choose a risk profile and create your first vault
4. **💰 Deposit Funds**: Add SOL or supported tokens to your vault
5. **📊 Monitor Performance**: Track your yields and performance in the dashboard
6. **🔄 Cross-Chain Operations**: Query yields and rebalance across chains

### 🛡️ Risk Profiles

| Profile | Risk Level | Expected APY | Target Chains | Description |
|---------|------------|--------------|---------------|-------------|
| 🟢 **Conservative** | Low | 6-8% | Ethereum, Arbitrum | Stable, low-risk yield farming |
| 🟡 **Moderate** | Medium | 8-12% | Multi-chain | Balanced risk-reward strategies |
| 🔴 **Aggressive** | High | 12%+ | All chains | High-risk, high-reward opportunities |

### 🌉 Cross-Chain Operations

OmniVault seamlessly handles cross-chain operations through LayerZero V2:

- **🔄 Automatic Rebalancing**: Funds intelligently moved to chains with better opportunities
- **📡 Cross-Chain Messaging**: Real-time communication between blockchain networks
- **🎛️ Unified Management**: Single interface for managing multi-chain positions
- **⚡ Gas Optimization**: Efficient cross-chain transaction routing
- **📊 Yield Monitoring**: Real-time yield tracking across all supported chains

## 🔧 Smart Contract Implementation

### Core Instructions

#### `initialize()`
Initialize the main vault store (one-time setup)
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()>
```

#### `create_vault(risk_profile, min_deposit, target_chains)`
Create a new vault with specified configuration
```rust
pub fn create_vault(
    ctx: Context<CreateVault>,
    risk_profile: RiskProfile,
    min_deposit: u64,
    target_chains: Vec<u16>,
) -> Result<()>
```

#### `deposit_sol(amount)` / `withdraw_sol(amount)`
Deposit/withdraw native SOL
```rust
pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()>
pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()>
```

#### `deposit(amount)` / `withdraw(amount)`
Deposit/withdraw SPL tokens
```rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()>
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>
```

### LayerZero V2 Instructions

#### `query_cross_chain_yields(target_chains)`
Query yield opportunities across chains
```rust
pub fn query_cross_chain_yields(
    ctx: Context<QueryCrossChainYields>,
    target_chains: Vec<u16>,
) -> Result<()>
```

#### `lz_receive(src_chain_id, payload)`
Receive cross-chain messages from LayerZero
```rust
pub fn lz_receive(
    ctx: Context<LzReceive>,
    src_chain_id: u16,
    payload: Vec<u8>,
) -> Result<()>
```

#### `rebalance_vault(target_chain)`
Manual vault rebalancing
```rust
pub fn rebalance_vault(
    ctx: Context<RebalanceVault>,
    target_chain: u16,
) -> Result<()>
```

### Account Structures

#### `VaultStore`
Global program state
```rust
pub struct VaultStore {
    pub authority: Pubkey,
    pub total_vaults: u64,
    pub total_tvl: u64,
    pub fee_rate: u16,
    pub bump: u8,
    pub last_global_rebalance: i64,
    pub emergency_pause: bool,
    pub supported_chains: Vec<u16>,
}
```

#### `Vault`
Individual vault instance
```rust
pub struct Vault {
    pub id: u64,
    pub owner: Pubkey,
    pub risk_profile: RiskProfile,
    pub total_deposits: u64,
    pub total_yield: u64,
    pub min_deposit: u64,
    pub is_active: bool,
    pub last_rebalance: i64,
    pub target_chains: Vec<u16>,
    pub current_best_chain: u16,
    pub current_apy: u64,
    pub rebalance_threshold: u64,
    pub emergency_exit: bool,
    pub bump: u8,
}
```

#### `UserPosition`
User's position in a vault
```rust
pub struct UserPosition {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub last_deposit: i64,
    pub last_withdrawal: i64,
    pub bump: u8,
}
```

#### `YieldTracker`
Cross-chain yield tracking
```rust
pub struct YieldTracker {
    pub vault: Pubkey,
    pub chain_yields: Vec<ChainYield>,
    pub last_update: i64,
    pub query_nonce: u64,
    pub bump: u8,
}
```

## 🏆 LayerZero V2 Integration

OmniVault leverages LayerZero V2's revolutionary omnichain technology:

### 🌟 Key Features
- **🌐 Omnichain Application (OApp)**: Native cross-chain messaging capabilities
- **💧 Unified Liquidity**: Access liquidity pools across all supported chains
- **🎯 Seamless UX**: Users interact with a single interface regardless of underlying chains
- **⚡ Gas Optimization**: Intelligent routing for cost-effective cross-chain transactions
- **🔒 Security**: Immutable, censorship-resistant protocol with decentralized verification

### 🌍 Supported Chains
- **Ethereum** (Chain ID: 101)
- **Arbitrum** (Chain ID: 110)
- **Polygon** (Chain ID: 109)
- **BSC** (Chain ID: 102)
- **Avalanche** (Chain ID: 106)
- **Optimism** (Chain ID: 111)

### 🔗 Cross-Chain Message Types
```rust
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
```

## 🛠️ Development

### 🧪 Running Tests

```bash
# Solana program tests
cd solana-program
anchor test

# Frontend development server
cd frontend
npm run dev

# Frontend build
npm run build
```

### 🏗️ Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build program (verifiable)
cd solana-program
anchor build --verifiable
```

### 🚀 Deployment Scripts

```bash
# Deploy to devnet
./scripts/deploy.sh

# Generate TypeScript IDL
node scripts/generate-idl.js
```

### 🐳 Docker Development

```bash
# Start local Solana test validator
docker-compose up -d solana-test-validator

# Build Anchor program in Docker
docker-compose up anchor-build
```

## 🔒 Security

### 🛡️ Smart Contract Security
- **⚓ Anchor Framework**: Type safety and memory management
- **🧪 Comprehensive Testing**: Full test suite coverage
- **🔐 PDAs**: Program Derived Addresses for enhanced security
- **✅ Input Validation**: Rigorous validation and error handling
- **🚫 Emergency Controls**: Emergency pause and resume functionality

### 🌉 Cross-Chain Security
- **🔒 LayerZero V2**: Battle-tested security model
- **🌐 Decentralized Verification**: Multi-party verification system
- **🔄 Immutable Messaging**: Tamper-proof cross-chain communication
- **⏰ Nonce Protection**: Replay attack prevention

## 📈 Roadmap

### Phase 1: Core Platform ✅
- [x] Solana program development with Anchor
- [x] LayerZero V2 OApp integration
- [x] React frontend with wallet integration
- [x] Vault management system
- [x] Risk profile implementation
- [x] SOL deposit/withdrawal functionality
- [x] Cross-chain yield querying
- [x] Real-time event monitoring
- [x] Devnet deployment

### Phase 2: Enhanced Features 🚧
- [ ] Advanced yield strategies and algorithms
- [ ] Support for more SPL tokens
- [ ] Mobile-responsive improvements
- [ ] Advanced analytics and reporting
- [ ] Performance optimization
- [ ] Automated rebalancing triggers

### Phase 3: Ecosystem Expansion 📋
- [ ] Additional blockchain support
- [ ] Governance token ($OMNI)
- [ ] DAO governance implementation
- [ ] Strategic partner integrations
- [ ] Mainnet deployment
- [ ] Institutional features

### 🎯 **Core Innovation**
OmniVault solves the fragmented DeFi landscape by providing a unified yield optimization platform that automatically finds and captures the best opportunities across multiple chains, all through a single Solana-based interface powered by LayerZero V2.

### 📊 **Technical Achievements**
- **Program Size**: lines of Rust code with comprehensive functionality
- **Frontend Integration**: Complete TypeScript service layer 
- **Cross-Chain Messaging**: Full LayerZero V2 OApp implementation
- **Account Management**: Sophisticated PDA architecture with 4 main account types
- **Error Handling**: Comprehensive validation with 18 custom error types
- **Real-time Features**: Event-driven architecture with live updates

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✨ Make your changes
4. 🧪 Add tests
5. 📤 Submit a pull request

## 📞 Support 

- **📚 Documentation**: See frontend README for detailed frontend docs
- **🐛 Issues**: [GitHub Issues](https://github.com/Ge0frey/Omnivault/issues)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🌟 Built with ❤️ for the LayerZero Solana Breakout Bounty 🌟**

*Pioneering the future of cross-chain yield optimization with LayerZero V2 on Solana*

[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)](https://github.com/Ge0frey/Omnivault)
[![LayerZero](https://img.shields.io/badge/Powered%20by-LayerZero%20V2-blue?style=for-the-badge)](https://layerzero.network/)
[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)

</div> 
