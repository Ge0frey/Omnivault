import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  CogIcon, 
  PlusIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  BoltIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  targetChains: number[];
  expectedAPY: number;
  riskScore: number;
  minDeposit: number;
  features: string[];
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'stable-yield',
    name: 'Stable Yield',
    description: 'Low-risk strategy focusing on stable stablecoin yields across established DeFi protocols',
    riskProfile: 'conservative',
    targetChains: [101, 110], // Ethereum, Arbitrum
    expectedAPY: 8.5,
    riskScore: 15,
    minDeposit: 100,
    features: ['Stablecoin focus', 'Low volatility', 'Established protocols', 'Auto-rebalancing']
  },
  {
    id: 'balanced-growth',
    name: 'Balanced Growth',
    description: 'Balanced approach between yield and growth, diversified across multiple chains',
    riskProfile: 'moderate',
    targetChains: [101, 110, 109], // Ethereum, Arbitrum, Polygon
    expectedAPY: 15.2,
    riskScore: 45,
    minDeposit: 250,
    features: ['Multi-chain diversification', 'Yield farming', 'Liquid staking', 'Dynamic allocation']
  },
  {
    id: 'max-yield',
    name: 'Maximum Yield',
    description: 'High-yield strategy targeting emerging protocols and advanced DeFi strategies',
    riskProfile: 'aggressive',
    targetChains: [101, 110, 109, 102, 106], // All supported chains
    expectedAPY: 28.7,
    riskScore: 75,
    minDeposit: 500,
    features: ['High-yield protocols', 'Leveraged strategies', 'New opportunities', 'Active management']
  }
];

export const Strategies = () => {
  const {
    userVaults,
    selectedVault,
    chainYields,
    isCreatingVault,
    createVault,
    selectVault,
    getChainName,
    refreshData
  } = useOmniVault();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [customMinDeposit, setCustomMinDeposit] = useState<string>('');

  const getRiskProfileIcon = (riskProfile: string) => {
    switch (riskProfile) {
      case 'conservative':
        return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
      case 'moderate':
        return <ChartBarIcon className="h-5 w-5 text-yellow-500" />;
      case 'aggressive':
        return <BoltIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CogIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRiskProfileColor = (riskProfile: string) => {
    switch (riskProfile) {
      case 'conservative':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'aggressive':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getVaultRiskProfile = (vault: any): string => {
    if (vault.riskProfile.conservative !== undefined) return 'conservative';
    if (vault.riskProfile.moderate !== undefined) return 'moderate';
    if (vault.riskProfile.aggressive !== undefined) return 'aggressive';
    return 'unknown';
  };

  const calculateStrategyPerformance = (vault: any) => {
    const deposits = vault.totalDeposits.toNumber() / 1e9;
    const yieldEarned = vault.totalYield.toNumber() / 1e9;
    const apy = vault.currentApy.toNumber() / 100;
    
    return {
      totalDeposits: deposits,
      totalYield: yieldEarned,
      currentAPY: apy,
      performance: yieldEarned > 0 ? ((yieldEarned / deposits) * 100) : 0
    };
  };

  const handleCreateStrategy = async (template: StrategyTemplate) => {
    if (!template) return;

    const minDeposit = customMinDeposit 
      ? parseFloat(customMinDeposit) * 1e9 
      : template.minDeposit * 1e9;

    const riskProfileObj = {
      [template.riskProfile]: {}
    };

    try {
      const result = await createVault(riskProfileObj, minDeposit, template.targetChains);
      if (result) {
        setShowCreateModal(false);
        setSelectedTemplate(null);
        setCustomMinDeposit('');
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to create strategy:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatAPY = (apy: number) => {
    return (apy).toFixed(2) + '%';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Strategies</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Manage your yield optimization strategies and explore new opportunities
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Strategy
            </button>
          </div>
        </div>

        {/* Active Strategies */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Active Strategies
          </h2>
          
          {userVaults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userVaults.map((vault) => {
                const riskProfile = getVaultRiskProfile(vault);
                const performance = calculateStrategyPerformance(vault);
                const isSelected = selectedVault?.id.toNumber() === vault.id.toNumber();
                
                return (
                  <div
                    key={vault.id.toNumber()}
                    className={`card p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-primary-500 border-primary-200 dark:border-primary-700' 
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => selectVault(vault)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getRiskProfileIcon(riskProfile)}
                        <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                          Vault #{vault.id.toNumber()}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskProfileColor(riskProfile)}`}>
                        {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposited</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {performance.totalDeposits.toFixed(4)} SOL
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Current APY</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatAPY(performance.currentAPY)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Chain</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getChainName(vault.currentBestChain)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Target Chains</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vault.targetChains.slice(0, 3).map((chainId) => (
                            <span
                              key={chainId}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {getChainName(chainId)}
                            </span>
                          ))}
                          {vault.targetChains.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                              +{vault.targetChains.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm">
                          {vault.isActive ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-yellow-600">Inactive</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {performance.totalYield > 0 ? `+${performance.performance.toFixed(2)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You don't have any active strategies yet
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create Your First Strategy
              </button>
            </div>
          )}
        </div>

        {/* Strategy Templates */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Strategy Templates
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {strategyTemplates.map((template) => (
              <div key={template.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getRiskProfileIcon(template.riskProfile)}
                    <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskProfileColor(template.riskProfile)}`}>
                    {template.riskProfile.charAt(0).toUpperCase() + template.riskProfile.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {template.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expected APY</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatAPY(template.expectedAPY)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Risk Score</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.riskScore}/100
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Min Deposit</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.minDeposit} SOL
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Features</p>
                    <div className="space-y-1">
                      {template.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircleIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowCreateModal(true);
                  }}
                  className="w-full btn btn-secondary"
                >
                  Use This Strategy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create Strategy Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {selectedTemplate ? `Create ${selectedTemplate.name} Strategy` : 'Create Custom Strategy'}
              </h3>

              {selectedTemplate && (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      {getRiskProfileIcon(selectedTemplate.riskProfile)}
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedTemplate.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {selectedTemplate.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Expected APY:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {formatAPY(selectedTemplate.expectedAPY)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Risk Score:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                          {selectedTemplate.riskScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Deposit (SOL)
                    </label>
                    <input
                      type="number"
                      value={customMinDeposit}
                      onChange={(e) => setCustomMinDeposit(e.target.value)}
                      placeholder={selectedTemplate.minDeposit.toString()}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Default: {selectedTemplate.minDeposit} SOL
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                    setCustomMinDeposit('');
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedTemplate && handleCreateStrategy(selectedTemplate)}
                  disabled={isCreatingVault}
                  className="flex-1 btn btn-primary"
                >
                  {isCreatingVault ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Strategy'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
