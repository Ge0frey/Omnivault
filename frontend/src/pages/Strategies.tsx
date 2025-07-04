import { useState, useMemo } from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CubeTransparentIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  BoltIcon,
  ScaleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';

interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedAPY: number;
  minDeposit: number;
  maxDeposit: number;
  chains: string[];
  protocols: string[];
  features: string[];
  totalTVL: number;
  activeVaults: number;
  icon: any;
  gradient: string;
}

export const Strategies = () => {
  const { chainYields, getChainName } = useOmniVault();
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'risk'>('apy');

  const strategies: Strategy[] = useMemo(() => [
    {
      id: 'conservative-yield',
      name: 'Conservative Yield',
      description: 'Low-risk strategy focused on stable yields through established DeFi protocols with proven track records.',
      riskLevel: 'Low',
      expectedAPY: 5.5,
      minDeposit: 0.1,
      maxDeposit: 1000,
      chains: ['Solana', 'Ethereum', 'Polygon'],
      protocols: ['Aave', 'Compound', 'Marinade'],
      features: ['Stable yields', 'Low volatility', 'High liquidity'],
      totalTVL: 125000000,
      activeVaults: 1250,
      icon: ShieldCheckIcon,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'balanced-growth',
      name: 'Balanced Growth',
      description: 'Moderate risk strategy balancing yield optimization with capital preservation across multiple chains.',
      riskLevel: 'Medium',
      expectedAPY: 12.3,
      minDeposit: 0.25,
      maxDeposit: 5000,
      chains: ['Solana', 'Ethereum', 'Arbitrum', 'Optimism'],
      protocols: ['Uniswap', 'Raydium', 'Jupiter', 'Orca'],
      features: ['Balanced risk/reward', 'Multi-chain diversification', 'Yield farming'],
      totalTVL: 89000000,
      activeVaults: 890,
      icon: ScaleIcon,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'aggressive-defi',
      name: 'Aggressive DeFi',
      description: 'High-risk, high-reward strategy targeting maximum yields through advanced DeFi strategies and new protocols.',
      riskLevel: 'High',
      expectedAPY: 28.7,
      minDeposit: 0.5,
      maxDeposit: 10000,
      chains: ['Solana', 'Ethereum', 'Arbitrum', 'Base', 'Avalanche'],
      protocols: ['GMX', 'Drift', 'Zeta', 'Mango', 'Tensor'],
      features: ['Maximum yield potential', 'Leveraged positions', 'New protocol access'],
      totalTVL: 45000000,
      activeVaults: 324,
      icon: BoltIcon,
      gradient: 'from-red-500 to-pink-500'
    },
    {
      id: 'cross-chain-arb',
      name: 'Cross-Chain Arbitrage',
      description: 'Automated arbitrage opportunities across multiple blockchains using LayerZero technology.',
      riskLevel: 'Medium',
      expectedAPY: 15.8,
      minDeposit: 1.0,
      maxDeposit: 25000,
      chains: ['Solana', 'Ethereum', 'Arbitrum', 'Polygon', 'Optimism', 'Base'],
      protocols: ['LayerZero', 'Wormhole', '1inch', 'Stargate'],
      features: ['Arbitrage automation', 'Cross-chain optimization', 'MEV capture'],
      totalTVL: 67000000,
      activeVaults: 445,
      icon: GlobeAltIcon,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'liquid-staking',
      name: 'Liquid Staking Plus',
      description: 'Enhanced liquid staking with additional yield layers through restaking and DeFi integration.',
      riskLevel: 'Low',
      expectedAPY: 8.2,
      minDeposit: 0.05,
      maxDeposit: 50000,
      chains: ['Solana', 'Ethereum'],
      protocols: ['Marinade', 'Jito', 'Lido', 'EigenLayer'],
      features: ['Liquid staking rewards', 'Restaking yields', 'Principal protection'],
      totalTVL: 234000000,
      activeVaults: 2340,
      icon: CubeTransparentIcon,
      gradient: 'from-purple-500 to-indigo-500'
    }
  ], []);

  const filteredStrategies = useMemo(() => {
    let filtered = strategies;
    
    if (selectedRiskLevel !== 'All') {
      filtered = filtered.filter(strategy => strategy.riskLevel === selectedRiskLevel);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return b.expectedAPY - a.expectedAPY;
        case 'tvl':
          return b.totalTVL - a.totalTVL;
        case 'risk':
          const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        default:
          return 0;
      }
    });
  }, [strategies, selectedRiskLevel, sortBy]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'High':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-56 h-56 sm:w-80 sm:h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl mobile-padding mobile-section">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent-500 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Yield Strategies</h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg font-light">
            Discover automated strategies optimized for cross-chain yield generation
          </p>
        </div>

        {/* Strategy Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="stat-card col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-accent-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Total TVL</div>
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {formatCurrency(strategies.reduce((sum, s) => sum + s.totalTVL, 0))}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <ArrowTrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Active Strategies</div>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {strategies.length}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Max APY</div>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {Math.max(...strategies.map(s => s.expectedAPY)).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Total Vaults</div>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {formatNumber(strategies.reduce((sum, s) => sum + s.activeVaults, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6 sm:mb-8 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value as any)}
                  className="input text-sm"
                >
                  <option value="All">All Risk Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input text-sm"
                >
                  <option value="apy">Expected APY</option>
                  <option value="tvl">Total TVL</option>
                  <option value="risk">Risk Level</option>
                </select>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-400">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Showing {filteredStrategies.length} of {strategies.length} strategies
            </div>
          </div>
        </div>

        {/* Strategy Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {filteredStrategies.map((strategy) => (
            <div key={strategy.id} className="card-elevated p-6 sm:p-8 group hover:scale-105 transition-all duration-500">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${strategy.gradient} mr-3 sm:mr-4`}>
                      <strategy.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{strategy.name}</h3>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(strategy.riskLevel)}`}>
                        {strategy.riskLevel} Risk
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold text-accent-400">
                      {strategy.expectedAPY.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Expected APY</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed flex-grow">
                  {strategy.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-gray-400">TVL</div>
                    <div className="text-base sm:text-lg font-bold text-white">{formatCurrency(strategy.totalTVL)}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-gray-400">Active Vaults</div>
                    <div className="text-base sm:text-lg font-bold text-white">{formatNumber(strategy.activeVaults)}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-gray-400">Min Deposit</div>
                    <div className="text-base sm:text-lg font-bold text-white">{strategy.minDeposit} SOL</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-gray-400">Max Deposit</div>
                    <div className="text-base sm:text-lg font-bold text-white">{formatNumber(strategy.maxDeposit)} SOL</div>
                  </div>
                </div>

                {/* Chains */}
                <div className="mb-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Supported Chains</div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {strategy.chains.map((chain, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Protocols */}
                <div className="mb-4 sm:mb-6">
                  <div className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Key Protocols</div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {strategy.protocols.slice(0, 3).map((protocol, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {protocol}
                      </span>
                    ))}
                    {strategy.protocols.length > 3 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                        +{strategy.protocols.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Key Features</div>
                  <ul className="space-y-1">
                    {strategy.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs sm:text-sm text-gray-300">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-accent-500 rounded-full mr-2 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button className="btn btn-accent w-full flex items-center justify-center text-sm sm:text-base">
                  Create Vault with This Strategy
                  <ArrowTrendingUpIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Chain Performance Table */}
        <div className="card-elevated p-4 sm:p-6 mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
            Live Chain Performance
          </h3>
          
          {chainYields.length > 0 ? (
            <div className="table-mobile">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Chain
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Current APY
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      TVL
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {chainYields.map((chain) => (
                    <tr key={chain.chainId}>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                          <div className="text-xs sm:text-sm font-medium text-white">
                            {getChainName(chain.chainId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mr-1" />
                          <span className="text-xs sm:text-sm font-medium text-green-400">
                            {(chain.apy.toNumber() / 100).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                        ${(chain.tvl.toNumber() / 1e6).toFixed(1)}M
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                          chain.riskScore.toNumber() <= 30 ? 'text-green-400 bg-green-500/20 border-green-500/30' :
                          chain.riskScore.toNumber() <= 60 ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                          'text-red-400 bg-red-500/20 border-red-500/30'
                        }`}>
                          {chain.riskScore.toNumber()}/100
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
                        {new Date(chain.lastUpdated.toNumber() * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm sm:text-base">Loading chain performance data...</p>
            </div>
          )}
        </div>

        {/* Strategy Information */}
        <div className="card-elevated p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <InformationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-accent-500" />
            How Strategies Work
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Choose Strategy</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Select a strategy that matches your risk tolerance and yield goals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Auto-Optimization</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Our system automatically optimizes your funds across chains and protocols.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Earn & Monitor</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Watch your yields compound automatically while maintaining full control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
