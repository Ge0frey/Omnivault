import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useOmniVault } from '../hooks/useOmniVault';
import { RiskProfile } from '../services/omnivault';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const { connected } = useWallet();
  const {
    vaultStore,
    userVaults,
    selectedVault,
    userPosition,
    loading,
    isInitializing,
    isCreatingVault,
    initialize,
    createVault,
    selectVault,
    refreshData,
    error,
    clearError
  } = useOmniVault();

  const [showCreateVault, setShowCreateVault] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfile>(RiskProfile.Conservative);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (connected) {
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, refreshData]);

  const handleInitialize = async () => {
    const tx = await initialize();
    if (tx) {
      console.log('Initialized vault store:', tx);
    }
  };

  const handleCreateVault = async () => {
    const result = await createVault(selectedRiskProfile);
    if (result) {
      console.log('Created vault:', result);
      setShowCreateVault(false);
    }
  };

  const getRiskProfileColor = (risk: RiskProfile) => {
    switch (risk) {
      case RiskProfile.Conservative:
        return 'text-green-600';
      case RiskProfile.Moderate:
        return 'text-yellow-600';
      case RiskProfile.Aggressive:
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getRiskProfileBadgeColor = (risk: RiskProfile) => {
    switch (risk) {
      case RiskProfile.Conservative:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case RiskProfile.Moderate:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case RiskProfile.Aggressive:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getRiskProfileName = (riskProfile: any): string => {
    if (typeof riskProfile === 'object' && riskProfile !== null) {
      if ('conservative' in riskProfile) return 'Conservative';
      if ('moderate' in riskProfile) return 'Moderate';
      if ('aggressive' in riskProfile) return 'Aggressive';
    }
    return 'Unknown';
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full gradient-bg flex items-center justify-center mb-8">
            <CurrencyDollarIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Connect your Solana wallet to access your OmniVault dashboard and start optimizing your yields with LayerZero V2.
          </p>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">OmniVault Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Cross-chain yield optimization powered by LayerZero V2 on Solana
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 card p-4 border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
              <button 
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Initialization Check */}
        {!vaultStore && !loading && (
          <div className="mb-8 card p-6 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Initialize OmniVault</h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  The OmniVault system needs to be initialized before you can create vaults.
                </p>
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="btn btn-primary"
                >
                  {isInitializing ? 'Initializing...' : 'Initialize OmniVault'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total System Vaults
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {vaultStore?.totalVaults?.toString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Your Vaults
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userVaults.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-warning-600 dark:text-warning-400">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Platform Fee
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {vaultStore ? (vaultStore.feeRate / 100).toFixed(2) : '0.00'}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Selected Position
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userPosition ? (userPosition.amount.toNumber() / 1e9).toFixed(4) : '0.0000'} SOL
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vaults List */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Vaults</h3>
              {vaultStore && (
                <button
                  onClick={() => setShowCreateVault(true)}
                  disabled={isCreatingVault}
                  className="btn btn-primary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isCreatingVault ? 'Creating...' : 'Create Vault'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading vaults...</p>
              </div>
            ) : userVaults.length > 0 ? (
              <div className="space-y-4">
                {userVaults.map((vault, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedVault?.id.eq(vault.id) 
                        ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => selectVault(vault)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Vault #{vault.id.toString()}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskProfileBadgeColor(vault.riskProfile as RiskProfile)}`}>
                        {getRiskProfileName(vault.riskProfile)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Deposits: {(vault.totalDeposits.toNumber() / 1e9).toFixed(4)} SOL</span>
                      <span>Created: {new Date(vault.lastRebalance.toNumber() * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any vaults yet.</p>
                {vaultStore && (
                  <button
                    onClick={() => setShowCreateVault(true)}
                    className="btn btn-primary"
                  >
                    Create Your First Vault
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Vault Details */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Vault Details</h3>
            {selectedVault ? (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Vault #{selectedVault.id.toString()}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskProfileBadgeColor(selectedVault.riskProfile as RiskProfile)}`}>
                      {getRiskProfileName(selectedVault.riskProfile)}
                    </span>
                  </div>
                  
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Deposits</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {(selectedVault.totalDeposits.toNumber() / 1e9).toFixed(6)} SOL
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Position</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {userPosition ? (userPosition.amount.toNumber() / 1e9).toFixed(6) : '0.000000'} SOL
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedVault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Rebalance</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedVault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="btn btn-primary">
                    Deposit
                  </button>
                  <button className="btn btn-secondary">
                    Withdraw
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a vault to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Vault Modal */}
        {showCreateVault && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Vault</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risk Profile
                </label>
                <select
                  value={selectedRiskProfile}
                  onChange={(e) => setSelectedRiskProfile(e.target.value as RiskProfile)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={RiskProfile.Conservative}>Conservative - Lower risk, stable returns</option>
                  <option value={RiskProfile.Moderate}>Moderate - Balanced risk and returns</option>
                  <option value={RiskProfile.Aggressive}>Aggressive - Higher risk, higher potential returns</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose a risk profile that matches your investment strategy.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateVault(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVault}
                  disabled={isCreatingVault}
                  className="flex-1 btn btn-primary"
                >
                  {isCreatingVault ? 'Creating...' : 'Create Vault'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 