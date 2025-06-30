# OmniVault 🚀

> **Cross-chain yield optimization platform built on Solana with LayerZero V2 integration**

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![LayerZero](https://img.shields.io/badge/LayerZero-V2-blue?style=for-the-badge)](https://layerzero.network/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Anchor](https://img.shields.io/badge/Anchor-FF6B35?style=for-the-badge)](https://www.anchor-lang.com/)

## 🌟 Overview

OmniVault is a groundbreaking cross-chain yield optimization platform that harnesses LayerZero V2's omnichain capabilities to maximize returns across multiple blockchain networks. Built on Solana for unparalleled performance and minimal costs, OmniVault intelligently rebalances user funds across the most profitable DeFi opportunities.

### 🎯 **Hackathon Submission**: LayerZero Solana Breakout Bounty

**Program ID**: `HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4`  
**Network**: Solana Devnet  
**LayerZero Endpoint**: `H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp`  
**Explorer**: [View on Solana Explorer](https://explorer.solana.com/address/HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4?cluster=devnet)

## ✨ Features

### 🔥 Core Functionality
- **🌐 Cross-Chain Yield Optimization**: Automatically discover and capture the best yield opportunities across multiple chains
- **⚡ LayerZero V2 Integration**: Seamless cross-chain messaging and asset transfers using cutting-edge omnichain technology
- **🛡️ Risk Management**: Multiple risk profiles (Conservative, Moderate, Aggressive) tailored to user preferences
- **🔄 Real-time Rebalancing**: Automated portfolio rebalancing based on live market conditions
- **📊 Transparent Analytics**: Comprehensive dashboard with performance metrics and historical data

### 🛠️ Technical Features
- **🏗️ Solana Program**: High-performance smart contracts built with Anchor framework
- **🌉 LayerZero OApp**: Native omnichain application enabling true cross-chain functionality
- **⚛️ React Frontend**: Modern, responsive user interface with real-time updates
- **🔗 Wallet Integration**: Support for major Solana wallets (Phantom, Solflare, etc.)
- **📡 Live Data Sync**: Real-time synchronization and notifications

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
│   │   ├── pages/                # 📄 Page components (Dashboard, Deposit, etc.)
│   │   ├── hooks/                # 🪝 Custom React hooks (useOmniVault)
│   │   ├── services/             # 🔧 Blockchain services & API calls
│   │   ├── idl/                  # 📋 Generated IDL types
│   │   └── utils/                # 🛠️ Utility functions
│   ├── public/                   # 🖼️ Static assets
│   └── package.json              # 📦 Frontend dependencies
│
├── ⚓ solana-program/             # Solana program (smart contracts)
│   ├── programs/
│   │   └── omnivault/
│   │       └── src/
│   │           └── lib.rs        # 🦀 Main program logic with LayerZero V2
│   ├── tests/                    # 🧪 Comprehensive program tests
│   ├── target/                   # 🎯 Build artifacts & IDL
│   └── Anchor.toml               # ⚙️ Anchor configuration
│
├── 📜 scripts/                   # Deployment and utility scripts
│   ├── deploy.sh                 # 🚀 Automated deployment script
│   └── generate-idl.js           # 📋 IDL TypeScript generation
│
├── 🐳 docker-compose.yml         # Local development environment
└── 📖 README.md                  # This file
```

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js 18+** and npm
- **Rust** and Cargo
- **Solana CLI** tools
- **Anchor framework** v0.29+
- **Solana wallet** with devnet SOL

### 💻 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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

3. **Build the program**
   ```bash
   cd solana-program
   anchor build
   ```

4. **Deploy to devnet** 🚀
   ```bash
   cd ..
   ./scripts/deploy.sh
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application** 🌐
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 🎮 Usage Guide

### 🔥 Getting Started

1. **🔗 Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **⚡ Initialize System**: If prompted, initialize the OmniVault system (one-time setup)
3. **🏗️ Create Vault**: Choose a risk profile and create your first vault
4. **💰 Deposit Funds**: Add SOL or supported tokens to your vault
5. **📊 Monitor Performance**: Track your yields and performance in the dashboard

### 🛡️ Risk Profiles

| Profile | Risk Level | Expected APY | Description |
|---------|------------|--------------|-------------|
| 🟢 **Conservative** | Low | 6-8% | Stable, low-risk yield farming |
| 🟡 **Moderate** | Medium | 8-12% | Balanced risk-reward strategies |
| 🔴 **Aggressive** | High | 12%+ | High-risk, high-reward opportunities |

### 🌉 Cross-Chain Operations

OmniVault seamlessly handles cross-chain operations through LayerZero V2:

- **🔄 Automatic Rebalancing**: Funds intelligently moved to chains with better opportunities
- **📡 Cross-Chain Messaging**: Real-time communication between blockchain networks
- **🎛️ Unified Management**: Single interface for managing multi-chain positions
- **⚡ Gas Optimization**: Efficient cross-chain transaction routing

## 🔧 Smart Contract Implementation

### Core Instructions

#### `initialize()`
Initialize the main vault store (one-time setup)
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()>
```

#### `create_vault(risk_profile: RiskProfile)`
Create a new vault with specified risk profile
```rust
pub fn create_vault(ctx: Context<CreateVault>, risk_profile: RiskProfile) -> Result<()>
```

#### `deposit(amount: u64)`
Deposit SOL into a vault
```rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()>
```

#### `withdraw(amount: u64)`
Withdraw SOL from a vault
```rust
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>
```

### LayerZero V2 Instructions

#### `lz_send(dst_eid: u32, message: Vec<u8>)`
Send cross-chain message via LayerZero
```rust
pub fn lz_send(ctx: Context<LzSend>, dst_eid: u32, message: Vec<u8>) -> Result<()>
```

#### `lz_receive(src_eid: u32, message: Vec<u8>)`
Receive cross-chain message from LayerZero
```rust
pub fn lz_receive(ctx: Context<LzReceive>, src_eid: u32, message: Vec<u8>) -> Result<()>
```

### Account Structures

#### `VaultStore`
Global program state
```rust
pub struct VaultStore {
    pub authority: Pubkey,
    pub vault_count: u32,
    pub fee_rate: u16,
    pub layerzero_endpoint: Pubkey,
}
```

#### `Vault`
Individual vault instance
```rust
pub struct Vault {
    pub id: u32,
    pub owner: Pubkey,
    pub risk_profile: RiskProfile,
    pub total_deposits: u64,
    pub created_at: i64,
}
```

#### `UserPosition`
User's position in a vault
```rust
pub struct UserPosition {
    pub vault_id: u32,
    pub user: Pubkey,
    pub deposited_amount: u64,
    pub last_update: i64,
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
- **Ethereum** (ETH)
- **Arbitrum** (ARB)
- **Polygon** (MATIC)
- **Optimism** (OP)
- **Base** (BASE)
- **Avalanche** (AVAX)
- **BNB Smart Chain** (BSC)
- **And many more...**

### 🔗 Cross-Chain Actions
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CrossChainAction {
    Deposit { amount: u64 },
    Withdraw { amount: u64 },
    Rebalance { target_chain: u32, amount: u64 },
}
```

## 🛠️ Development

### 🧪 Running Tests

```bash
# Solana program tests
cd solana-program
anchor test

# Frontend tests
cd frontend
npm test
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
./scripts/generate-idl.js
```

## 🔒 Security

### 🛡️ Smart Contract Security
- **⚓ Anchor Framework**: Type safety and memory management
- **🧪 Comprehensive Testing**: Full test suite coverage
- **🔐 PDAs**: Program Derived Addresses for enhanced security
- **✅ Input Validation**: Rigorous validation and error handling

### 🌉 Cross-Chain Security
- **🔒 LayerZero V2**: Battle-tested security model
- **🌐 Decentralized Verification**: Multi-party verification system
- **🔄 Immutable Messaging**: Tamper-proof cross-chain communication

## 📈 Roadmap

### Phase 1: Core Platform ✅
- [x] Solana program development with Anchor
- [x] LayerZero V2 OApp integration
- [x] React frontend with wallet integration
- [x] Vault management system
- [x] Risk profile implementation
- [x] Devnet deployment

### Phase 2: Enhanced Features 🚧
- [ ] Advanced yield strategies and algorithms
- [ ] Support for more SPL tokens
- [ ] Mobile-responsive improvements
- [ ] Advanced analytics and reporting
- [ ] Performance optimization

### Phase 3: Ecosystem Expansion 📋
- [ ] Additional blockchain support
- [ ] Governance token ($OMNI)
- [ ] DAO governance implementation
- [ ] Strategic partner integrations
- [ ] Mainnet deployment

## 🏅 Hackathon Compliance

### ✅ **LayerZero Solana Breakout Bounty Requirements**

- **✅ LayerZero V2 Program Implementation**: OmniVault implements a complete LayerZero V2 OApp on Solana
- **✅ Solana Integration**: Built with Anchor framework, deployed on Solana devnet
- **✅ Cross-Chain Functionality**: Demonstrates meaningful cross-chain yield optimization
- **✅ Working Demo**: Fully functional application with frontend interface
- **✅ Technical Innovation**: Novel approach to cross-chain DeFi using LayerZero V2

### 🎯 **Core Innovation**
OmniVault solves the fragmented DeFi landscape by providing a unified yield optimization platform that automatically finds and captures the best opportunities across multiple chains, all through a single Solana-based interface powered by LayerZero V2.

### 📊 **Technical Achievements**
- **Program Size**: ~500 lines of Rust code
- **Frontend Integration**: Complete TypeScript service layer
- **Cross-Chain Messaging**: Full LayerZero V2 OApp implementation
- **Account Management**: Sophisticated PDA architecture
- **Error Handling**: Comprehensive validation and error management

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✨ Make your changes
4. 🧪 Add tests
5. 📤 Submit a pull request

## 📞 Support & Community

- **📚 Documentation**: [Coming Soon]
- **💬 Discord**: [Join our community]
- **🐦 Twitter**: [@OmniVault]
- **📧 Email**: support@omnivault.io
- **🐛 Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🌟 Built with ❤️ for the LayerZero Solana Breakout Bounty 🌟**

*Pioneering the future of cross-chain yield optimization with LayerZero V2 on Solana*

[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)](https://github.com/your-username)
[![LayerZero](https://img.shields.io/badge/Powered%20by-LayerZero%20V2-blue?style=for-the-badge)](https://layerzero.network/)
[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)

</div> 