import React, { useState, useMemo } from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';

interface PerformanceMetrics {
  totalInvested: number;
  currentValue: number;
  totalYield: number;
  totalReturn: number;
  totalReturnPercent: number;
  avgAPY: number;
  riskScore: number;
}

interface ChainAnalytics {
  chainId: number;
  name: string;
  allocation: number;
  apy: number;
  tvl: number;
  riskScore: number;
  performance: number;
  lastUpdate: number;
}

export const Analytics = () => {
  const {
    userVaults,
    selectedVault,
    chainYields,
    recentEvents,
    getChainName,
    refreshData
  } = useOmniVault();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'apy' | 'tvl' | 'risk'>('apy');

  // Helper function to get vault risk profile
  const getVaultRiskProfile = (vault: any): string => {
    if (vault.riskProfile.conservative !== undefined) return 'conservative';
    if (vault.riskProfile.moderate !== undefined) return 'moderate';
    if (vault.riskProfile.aggressive !== undefined) return 'aggressive';
    return 'unknown';
  };

  // Calculate portfolio performance metrics
  const portfolioMetrics = useMemo((): PerformanceMetrics => {
    if (userVaults.length === 0) {
      return {
        totalInvested: 0,
        currentValue: 0,
        totalYield: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        avgAPY: 0,
        riskScore: 0
      };
    }

    const totalInvested = userVaults.reduce((sum, vault) => 
      sum + (vault.totalDeposits.toNumber() / 1e9), 0);
    const totalYieldEarned = userVaults.reduce((sum, vault) => 
      sum + (vault.totalYield.toNumber() / 1e9), 0);
    const currentValue = totalInvested + totalYieldEarned;
    const totalReturn = totalYieldEarned;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    const avgAPY = userVaults.reduce((sum, vault) => 
      sum + (vault.currentApy.toNumber() / 100), 0) / userVaults.length;

    // Calculate weighted risk score
    const totalValue = userVaults.reduce((sum, vault) => sum + vault.totalDeposits.toNumber(), 0);
    const weightedRiskScore = userVaults.reduce((sum, vault) => {
      const weight = vault.totalDeposits.toNumber() / totalValue;
      const riskProfile = getVaultRiskProfile(vault);
      const risk = riskProfile === 'conservative' ? 20 : riskProfile === 'moderate' ? 50 : 80;
      return sum + (risk * weight);
    }, 0);

    return {
      totalInvested,
      currentValue,
      totalYield: totalYieldEarned,
      totalReturn,
      totalReturnPercent,
      avgAPY,
      riskScore: weightedRiskScore
    };
  }, [userVaults]);

  // Calculate chain analytics
  const chainAnalytics = useMemo((): ChainAnalytics[] => {
    const chainMap = new Map<number, ChainAnalytics>();
    
    // Initialize with chain yields data
    chainYields.forEach(chainYield => {
      chainMap.set(chainYield.chainId, {
        chainId: chainYield.chainId,
        name: getChainName(chainYield.chainId),
        allocation: 0,
        apy: chainYield.apy.toNumber() / 100,
        tvl: chainYield.tvl.toNumber(),
        riskScore: chainYield.riskScore.toNumber(),
        performance: 0,
        lastUpdate: chainYield.lastUpdated.toNumber()
      });
    });

    // Calculate allocations from user vaults
    const totalPortfolioValue = portfolioMetrics.totalInvested;
    userVaults.forEach(vault => {
      const chainId = vault.currentBestChain;
      const vaultValue = vault.totalDeposits.toNumber() / 1e9;
      const allocation = totalPortfolioValue > 0 ? (vaultValue / totalPortfolioValue) * 100 : 0;
      
      if (chainMap.has(chainId)) {
        const existing = chainMap.get(chainId)!;
        existing.allocation += allocation;
      } else {
        chainMap.set(chainId, {
          chainId,
          name: getChainName(chainId),
          allocation,
          apy: vault.currentApy.toNumber() / 100,
          tvl: 0,
          riskScore: 50, // default
          performance: 0,
          lastUpdate: Date.now() / 1000
        });
      }
    });

    return Array.from(chainMap.values()).sort((a, b) => b.allocation - a.allocation);
  }, [chainYields, userVaults, portfolioMetrics.totalInvested, getChainName]);

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 30) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    if (riskScore <= 60) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 30) return 'Low Risk';
    if (riskScore <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount * 150); // Assuming 1 SOL = $150 for display
  };

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(4)} SOL`;
  };

  const formatAPY = (apy: number) => {
    return `${apy.toFixed(2)}%`;
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 3 Months';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const getPerformanceIcon = (percent: number) => {
    if (percent > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (percent < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    return <ArrowPathIcon className="h-4 w-4 text-gray-500" />;
  };

  const processRecentEvents = () => {
    return recentEvents.slice(0, 10).map(event => {
      let icon, title, description, color;
      
      switch (event.type) {
        case 'DepositMade':
          icon = <ArrowUpIcon className="h-4 w-4" />;
          title = 'Deposit Made';
          description = `${(event.data.amount.toNumber() / 1e9).toFixed(4)} SOL deposited`;
          color = 'text-green-600 bg-green-100 dark:bg-green-900';
          break;
        case 'WithdrawalMade':
          icon = <ArrowDownIcon className="h-4 w-4" />;
          title = 'Withdrawal Made';
          description = `${(event.data.amount.toNumber() / 1e9).toFixed(4)} SOL withdrawn`;
          color = 'text-blue-600 bg-blue-100 dark:bg-blue-900';
          break;
        case 'RebalanceTriggered':
          icon = <ArrowPathIcon className="h-4 w-4" />;
          title = 'Auto Rebalance';
          description = `Moved to ${getChainName(event.data.toChain)}`;
          color = 'text-purple-600 bg-purple-100 dark:bg-purple-900';
          break;
        case 'YieldDataReceived':
          icon = <ChartBarIcon className="h-4 w-4" />;
          title = 'Yield Update';
          description = `${getChainName(event.data.chainId)}: ${formatAPY(event.data.apy.toNumber() / 100)}`;
          color = 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900';
          break;
        default:
          icon = <InformationCircleIcon className="h-4 w-4" />;
          title = event.type;
          description = 'Activity detected';
          color = 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      }

      return {
        ...event,
        icon,
        title,
        description,
        color,
        timestamp: new Date(event.timestamp).toLocaleString()
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Comprehensive portfolio analytics and performance insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="input text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={refreshData}
                className="btn btn-secondary flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Portfolio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatSOL(portfolioMetrics.currentValue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatCurrency(portfolioMetrics.currentValue)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Return</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatSOL(portfolioMetrics.totalReturn)}
                </p>
                <div className="flex items-center">
                  {getPerformanceIcon(portfolioMetrics.totalReturnPercent)}
                  <p className={`text-sm ml-1 ${
                    portfolioMetrics.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(portfolioMetrics.totalReturnPercent)}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average APY</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAPY(portfolioMetrics.avgAPY)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Across {userVaults.length} vault{userVaults.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolioMetrics.riskScore.toFixed(0)}/100
                </p>
                <p className={`text-sm px-2 py-1 rounded-full inline-flex ${getRiskColor(portfolioMetrics.riskScore)}`}>
                  {getRiskLabel(portfolioMetrics.riskScore)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Chain Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chain Allocation */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chain Allocation</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="input text-sm"
              >
                <option value="apy">By APY</option>
                <option value="tvl">By TVL</option>
                <option value="risk">By Risk</option>
              </select>
            </div>
            
            <div className="space-y-4">
              {chainAnalytics.map((chain) => (
                <div key={chain.chainId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500 mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{chain.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {chain.allocation.toFixed(1)}% allocation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedMetric === 'apy' && formatAPY(chain.apy)}
                      {selectedMetric === 'tvl' && `$${(chain.tvl / 1e6).toFixed(1)}M`}
                      {selectedMetric === 'risk' && `${chain.riskScore}/100`}
                    </p>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ 
                          width: `${selectedMetric === 'apy' ? Math.min(chain.apy * 2, 100) : 
                                  selectedMetric === 'tvl' ? Math.min((chain.tvl / 1e9) * 10, 100) :
                                  chain.riskScore}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Performance Over Time ({getTimeframeLabel(timeframe)})
            </h3>
            <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Performance chart visualization</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Chart integration coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vault Performance Table */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vault Performance</h3>
          
          {userVaults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vault
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Deposited
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Current APY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Yield Earned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Active Chain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {userVaults.map((vault) => {
                    const riskProfile = getVaultRiskProfile(vault);
                    const deposited = vault.totalDeposits.toNumber() / 1e9;
                    const yieldEarned = vault.totalYield.toNumber() / 1e9;
                    const apy = vault.currentApy.toNumber() / 100;
                    
                    return (
                      <tr key={vault.id.toNumber()}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Vault #{vault.id.toNumber()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            riskProfile === 'conservative' ? 'text-green-600 bg-green-100 dark:bg-green-900' :
                            riskProfile === 'moderate' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900' :
                            'text-red-600 bg-red-100 dark:bg-red-900'
                          }`}>
                            {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatSOL(deposited)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatAPY(apy)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatSOL(yieldEarned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getChainName(vault.currentBestChain)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            vault.isActive ? 'text-green-600 bg-green-100 dark:bg-green-900' : 
                            'text-red-600 bg-red-100 dark:bg-red-900'
                          }`}>
                            {vault.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No vaults to analyze</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Create a vault to start tracking performance</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {processRecentEvents().map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${event.color} mr-3`}>
                      {event.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {event.timestamp}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Activity will appear here as you use OmniVault</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
