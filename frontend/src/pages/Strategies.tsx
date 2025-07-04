import { useState } from 'react';
import { 
  ChartBarIcon, 
  CogIcon, 
  PlusIcon,
  ShieldCheckIcon,
  BoltIcon,
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
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'aggressive':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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

    try {
      const result = await createVault(template.riskProfile, minDeposit, template.targetChains);
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

  const formatAPY = (apy: number) => {
    return (apy).toFixed(2) + '%';
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white">Strategies</h1>
              <p className="mt-2 text-gray-300 text-lg font-light">
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
          <h2 className="text-xl font-semibold text-white mb-4">
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
                    className={`card-elevated p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-accent-500 border-accent-400/50' 
                        : 'hover:scale-105'
                    }`}
                    onClick={() => selectVault(vault)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getRiskProfileIcon(riskProfile)}
                        <h3 className="ml-2 text-lg font-medium text-white">
                          Vault #{vault.id.toNumber()}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskProfileColor(riskProfile)}`}>
                        {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Total Deposited</p>
                          <p className="text-lg font-semibold text-white">
                            {performance.totalDeposits.toFixed(4)} SOL
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Current APY</p>
                          <p className="text-lg font-semibold text-green-400">
                            {formatAPY(performance.currentAPY)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Active Chain</p>
                        <p className="text-sm font-medium text-white">
                          {getChainName(vault.currentBestChain)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Target Chains</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vault.targetChains.slice(0, 3).map((chainId) => (
                            <span
                              key={chainId}
                              className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded"
                            >
                              {getChainName(chainId)}
                            </span>
                          ))}
                          {vault.targetChains.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded">
                              +{vault.targetChains.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center text-sm">
                          {vault.isActive ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-green-400">Active</span>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-yellow-400">Inactive</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {performance.totalYield > 0 ? `+${performance.performance.toFixed(2)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-elevated p-8 text-center">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
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
          <h2 className="text-xl font-semibold text-white mb-4">
            Strategy Templates
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {strategyTemplates.map((template) => (
              <div key={template.id} className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getRiskProfileIcon(template.riskProfile)}
                    <h3 className="ml-2 text-lg font-medium text-white">
                      {template.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskProfileColor(template.riskProfile)}`}>
                    {template.riskProfile.charAt(0).toUpperCase() + template.riskProfile.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-300 mb-4">
                  {template.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Expected APY</p>
                      <p className="text-lg font-semibold text-green-400">
                        {formatAPY(template.expectedAPY)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Risk Score</p>
                      <p className="text-lg font-semibold text-white">
                        {template.riskScore}/100
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Min Deposit</p>
                    <p className="text-sm font-medium text-white">
                      {template.minDeposit} SOL
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Features</p>
                    <div className="space-y-1">
                      {template.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-300">
                          <CheckCircleIcon className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-elevated max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                {selectedTemplate ? `Create ${selectedTemplate.name} Strategy` : 'Create Custom Strategy'}
              </h3>

              {selectedTemplate && (
                <div className="space-y-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      {getRiskProfileIcon(selectedTemplate.riskProfile)}
                      <span className="ml-2 font-medium text-white">
                        {selectedTemplate.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      {selectedTemplate.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Expected APY:</span>
                        <span className="ml-1 font-medium text-green-400">
                          {formatAPY(selectedTemplate.expectedAPY)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk Score:</span>
                        <span className="ml-1 font-medium text-white">
                          {selectedTemplate.riskScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Minimum Deposit (SOL)
                    </label>
                    <input
                      type="number"
                      value={customMinDeposit}
                      onChange={(e) => setCustomMinDeposit(e.target.value)}
                      placeholder={selectedTemplate.minDeposit.toString()}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-400 mt-1">
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
