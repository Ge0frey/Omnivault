# OmniVault Frontend

A React frontend for OmniVault, a cross-chain yield optimizer built on Solana. This application provides a user-friendly interface for managing yield-optimized vaults across multiple blockchains.

## Features

- **Cross-Chain Yield Optimization**: Automatically rebalance funds across chains for maximum yield
- **Vault Management**: Create, deposit, withdraw, and monitor yield-generating vaults
- **Real-time Analytics**: Track performance, yields, and risk metrics across chains
- **Strategy Templates**: Pre-configured strategies for different risk profiles
- **Wallet Integration**: Support for Phantom, Solflare, and Torus wallets
- **Dark Mode**: Responsive design with dark/light theme support

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Solana Web3.js** for blockchain interaction
- **Anchor** for Solana program integration
- **Wallet Adapter** for Solana wallet connections
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Zustand** for state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ge0frey/Omnivault
cd OmniVault/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your environment (optional):
```bash
# For devnet (default)
# Leave environment variables commented out

# For local development with Solana validator
VITE_USE_LOCAL_VALIDATOR=true

# For custom RPC endpoint
VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Environment Configuration

The application supports different Solana network configurations:

- **Devnet (default)**: No configuration needed
- **Local Validator**: Set `VITE_USE_LOCAL_VALIDATOR=true`
- **Custom RPC**: Set `VITE_SOLANA_RPC_ENDPOINT=your_rpc_url`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   ├── WalletProvider.tsx  # Solana wallet integration
│   ├── YieldMonitor.tsx    # Cross-chain yield tracking
│   └── TransactionSuccess.tsx  # Transaction feedback
├── pages/              # Main application pages
│   ├── Landing.tsx     # Landing page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Deposit.tsx     # Deposit interface
│   ├── Withdraw.tsx    # Withdrawal interface
│   ├── Strategies.tsx  # Strategy templates
│   └── Analytics.tsx   # Performance analytics
├── hooks/              # Custom React hooks
│   └── useOmniVault.ts # Main application state hook
├── services/           # External service integrations
│   └── omnivault.ts    # Solana program service
├── idl/               # Anchor program IDL
│   ├── omnivault.json  # Program interface definition
│   └── omnivault.ts    # TypeScript types
└── assets/            # Static assets
```

## Key Features

### Vault Management
- Create vaults with different risk profiles (Conservative, Moderate, Aggressive)
- Configure target chains for yield optimization
- Set minimum deposit requirements and rebalance thresholds

### Cross-Chain Yield Tracking
- Real-time yield data from multiple chains
- Automatic rebalancing suggestions
- Risk-adjusted yield optimization

### Analytics Dashboard
- Performance metrics and historical data
- Chain-specific allocation and performance
- Risk scoring and portfolio analysis

### Strategy Templates
- Pre-configured strategies for different risk appetites
- One-click strategy deployment
- Customizable parameters

## Wallet Integration

The application supports multiple Solana wallets:
- **Phantom**: Popular browser extension wallet
- **Solflare**: Web and mobile wallet
- **Torus**: Social login wallet

## Development

### Code Style
- ESLint with TypeScript configuration
- Prettier for code formatting
- Tailwind CSS for styling

### State Management
- React Query for server state
- Zustand for client state
- Custom hooks for complex state logic

### Type Safety
- Full TypeScript coverage
- Anchor-generated types for Solana programs
- Strict type checking enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the OmniVault ecosystem. See the main repository for license information.

## Support

For support and questions:
- Check the main OmniVault documentation
- Open an issue in the repository
- Join our community discussions

## Security

This application handles cryptocurrency transactions. Always:
- Verify transaction details before signing
- Use hardware wallets for large amounts
- Keep your private keys secure
- Only use trusted RPC endpoints
