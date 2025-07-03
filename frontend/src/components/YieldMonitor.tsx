import React from 'react';
import { 
  ArrowTrendingUpIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  GlobeAltIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';

interface YieldMonitorProps {
  vaultId?: number;
}

export const YieldMonitor: React.FC<YieldMonitorProps> = ({ vaultId: _vaultId }) => {
  const {
    selectedVault,
    chainYields,
    bestChain,
    recentEvents,
    isQuerying,
    isRebalancing,
    queryCrossChainYields,
    rebalanceVault,
    getChainName
  } = useOmniVault();

  // Auto-refresh functionality
  const [refreshInterval] = React.useState<number>(30000); // 30 seconds

  const handleManualRefresh = () => {
    if (selectedVault) {
      queryCrossChainYields(selectedVault.id.toNumber());
    }
  };

  const handleRebalance = (chainId: number) => {
    if (selectedVault) {
      rebalanceVault(selectedVault.id.toNumber(), chainId);
    }
  };

  const formatAPY = (apy: number) => {
    return (apy / 100).toFixed(2) + '%';
  };

  const formatTVL = (tvl: number) => {
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(1)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 30) return 'text-green-600 bg-green-100';
    if (riskScore <= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 30) return 'Low';
    if (riskScore <= 60) return 'Medium';
    return 'High';
  };

  const getTimeSinceUpdate = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!selectedVault) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Select a vault to monitor cross-chain yields
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Cross-Chain Yield Monitor
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={isQuerying}
              className="btn btn-secondary flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isQuerying ? 'animate-spin' : ''}`} />
              {isQuerying ? 'Querying...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Vault Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Chain</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {getChainName(selectedVault.currentBestChain)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Current APY</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatAPY(selectedVault.currentApy.toNumber())}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Last Rebalance</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {getTimeSinceUpdate(selectedVault.lastRebalance.toNumber())}
            </div>
          </div>
        </div>

        {/* Best Chain Recommendation */}
        {bestChain && bestChain.chainId !== selectedVault.currentBestChain && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BoltIcon className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <div className="font-medium text-primary-900 dark:text-primary-200">
                    Better Yield Available!
                  </div>
                  <div className="text-sm text-primary-700 dark:text-primary-300">
                    {getChainName(bestChain.chainId)} offers {formatAPY(bestChain.apy.toNumber())} APY
                    (+{formatAPY(bestChain.apy.toNumber() - selectedVault.currentApy.toNumber())} improvement)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRebalance(bestChain.chainId)}
                disabled={isRebalancing}
                className="btn btn-primary flex items-center"
              >
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                {isRebalancing ? 'Rebalancing...' : 'Rebalance'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chain Yields Table */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Chain Yields Comparison
        </h4>
        
        {chainYields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    APY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    TVL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {chainYields.map((chainYield) => (
                  <tr key={chainYield.chainId} className={chainYield.chainId === selectedVault.currentBestChain ? 'bg-primary-50 dark:bg-primary-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {chainYield.chainId === selectedVault.currentBestChain && (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getChainName(chainYield.chainId)}
                        </span>
                        {bestChain?.chainId === chainYield.chainId && chainYield.chainId !== selectedVault.currentBestChain && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {formatAPY(chainYield.apy.toNumber())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatTVL(chainYield.tvl.toNumber())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(chainYield.riskScore.toNumber())}`}>
                        {getRiskLabel(chainYield.riskScore.toNumber())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getTimeSinceUpdate(chainYield.lastUpdated.toNumber())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {chainYield.chainId !== selectedVault.currentBestChain ? (
                        <button
                          onClick={() => handleRebalance(chainYield.chainId)}
                          disabled={isRebalancing}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          Switch
                        </button>
                      ) : (
                        <span className="text-green-600 text-sm font-medium">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No yield data available
            </p>
            <button
              onClick={handleManualRefresh}
              disabled={isQuerying}
              className="btn btn-primary"
            >
              Query Chain Yields
            </button>
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Recent Activity
        </h4>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  {event.type === 'RebalanceTriggered' && <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mr-2" />}
                  {event.type === 'YieldDataReceived' && <ChartBarIcon className="h-4 w-4 text-green-500 mr-2" />}
                  {event.type === 'DepositMade' && <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.type === 'RebalanceTriggered' && 'Rebalance Triggered'}
                      {event.type === 'YieldDataReceived' && 'Yield Data Updated'}
                      {event.type === 'DepositMade' && 'Deposit Made'}
                      {event.type === 'VaultCreated' && 'Vault Created'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {event.type === 'RebalanceTriggered' && 
                        `From ${getChainName(event.data.fromChain)} to ${getChainName(event.data.toChain)}`}
                      {event.type === 'YieldDataReceived' && 
                        `${getChainName(event.data.chainId)}: ${formatAPY(event.data.apy.toNumber())}`}
                      {event.type === 'DepositMade' && 
                        `${(event.data.amount.toNumber() / 1e9).toFixed(4)} SOL`}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {getTimeSinceUpdate(event.timestamp / 1000)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}; 