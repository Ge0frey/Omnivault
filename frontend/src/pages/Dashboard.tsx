import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useOmniVault } from '../hooks/useOmniVault';
import { RiskProfile } from '../services/omnivault';
import { TransactionSuccess } from '../components/TransactionSuccess';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  GiftIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const { connected } = useWallet();
  const {
    vaultStore,
    userVaults,
    selectedVault,
    userPosition,
    userSolBalance,
    minSolForVaultCreation,
    loading,
    isInitializing,
    isCreatingVault,
    initialize,
    createVault,
    selectVault,
    refreshData,
    refreshBalance,
    requestAirdrop,
    error,
    clearError
  } = useOmniVault();

  const [showCreateVault, setShowCreateVault] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfile>(RiskProfile.Conservative);
  const [successTransaction, setSuccessTransaction] = useState<{
    signature: string;
    title: string;
    description: string;
  } | null>(null);

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
      setSuccessTransaction({
        signature: tx,
        title: "OmniVault Initialized!",
        description: "The OmniVault system has been successfully initialized. You can now create vaults and start optimizing your yields."
      });
    }
  };

  const handleCreateVault = async () => {
    const result = await createVault(selectedRiskProfile);
    if (result) {
      console.log('Created vault:', result);
      setShowCreateVault(false);
      setSuccessTransaction({
        signature: result.tx,
        title: "Vault Created Successfully!",
        description: `Your ${selectedRiskProfile.toLowerCase()} risk profile vault (ID: ${result.vaultId}) has been created and is ready for deposits.`
      });
    }
  };

  const getRiskProfileBadgeColor = (risk: RiskProfile) => {
    switch (risk) {
      case RiskProfile.Conservative:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case RiskProfile.Moderate:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case RiskProfile.Aggressive:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
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
      <div className="min-h-screen flex items-center justify-center mobile-padding relative">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative text-center">
          <div className="mx-auto h-24 w-24 sm:h-32 sm:w-32 rounded-2xl gradient-bg flex items-center justify-center mb-6 sm:mb-8 shadow-2xl">
            <CurrencyDollarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-6 sm:mb-8 max-w-md text-base sm:text-lg font-light px-4">
            Connect your Solana wallet to access your OmniVault dashboard and start optimizing your yields with LayerZero V2.
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl mobile-padding mobile-section">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent-500 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">OmniVault Dashboard</h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg font-light">
            Cross-chain yield optimization powered by LayerZero V2 on Solana
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 card border-l-4 border-red-400 bg-red-500/10">
            <div className="flex p-4 sm:p-6">
              <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-red-300 font-medium text-sm sm:text-base">{error}</p>
                {error.includes('Insufficient SOL balance') && (
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={requestAirdrop}
                      className="btn btn-primary text-sm flex items-center justify-center"
                    >
                      <GiftIcon className="h-4 w-4 mr-2" />
                      Request Airdrop (2 SOL)
                    </button>
                    <button
                      onClick={refreshBalance}
                      className="btn btn-secondary text-sm flex items-center justify-center"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Refresh Balance
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={clearError}
                className="text-red-400 hover:text-red-300 ml-2 sm:ml-4 touch-target"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Transaction Success */}
        {successTransaction && (
          <div className="mb-4 sm:mb-6">
            <TransactionSuccess
              signature={successTransaction.signature}
              title={successTransaction.title}
              description={successTransaction.description}
              onClose={() => setSuccessTransaction(null)}
            />
          </div>
        )}

        {/* Low Balance Warning */}
        {connected && userSolBalance > 0 && userSolBalance < minSolForVaultCreation && !error && (
          <div className="mb-4 sm:mb-6 card border-l-4 border-yellow-400 bg-yellow-500/10">
            <div className="flex p-4 sm:p-6">
              <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 flex-1">
                <h3 className="text-yellow-300 font-semibold mb-2 text-sm sm:text-base">
                  Insufficient SOL Balance
                </h3>
                <p className="text-yellow-200 mb-3 sm:mb-4 text-sm sm:text-base">
                  You have {userSolBalance.toFixed(4)} SOL, but need at least {minSolForVaultCreation.toFixed(4)} SOL to create a vault.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={requestAirdrop}
                    className="btn btn-primary text-sm flex items-center justify-center"
                  >
                    <GiftIcon className="h-4 w-4 mr-2" />
                    Request Airdrop (2 SOL)
                  </button>
                  <button
                    onClick={refreshBalance}
                    className="btn btn-secondary text-sm flex items-center justify-center"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Balance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initialization Check */}
        {!vaultStore && !loading && (
          <div className="mb-6 sm:mb-8 card border-l-4 border-accent-400 bg-accent-500/10">
            <div className="flex items-start p-4 sm:p-6">
              <BoltIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent-400 flex-shrink-0 mt-1" />
              <div className="ml-3 sm:ml-4 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-accent-300 mb-2">Initialize OmniVault</h3>
                <p className="text-accent-200 mb-3 sm:mb-4 text-sm sm:text-base">
                  The OmniVault system needs to be initialized before you can create vaults.
                </p>
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="btn btn-accent flex items-center justify-center w-full sm:w-auto"
                >
                  {isInitializing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Initializing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Initialize OmniVault
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="stat-card col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-primary-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Your SOL Balance</div>
                <div className="text-base sm:text-xl font-bold text-white truncate">
                  {userSolBalance.toFixed(4)} SOL
                </div>
                {userSolBalance < minSolForVaultCreation && (
                  <div className="text-xs text-red-400 mt-1">
                    Need {minSolForVaultCreation.toFixed(4)} SOL minimum
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-accent-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <span className="text-sm sm:text-lg font-bold text-accent-400">#</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Total System Vaults</div>
                <div className="text-base sm:text-xl font-bold text-white truncate">
                  {vaultStore?.totalVaults?.toString() || '0'}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <ArrowTrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Your Vaults</div>
                <div className="text-base sm:text-xl font-bold text-white">
                  {userVaults.length}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <span className="text-sm sm:text-lg font-bold text-yellow-400">%</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Platform Fee</div>
                <div className="text-base sm:text-xl font-bold text-white">
                  {vaultStore ? (vaultStore.feeRate / 100).toFixed(2) : '0.00'}%
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl mb-2 sm:mb-0 sm:mr-3 self-start">
                <span className="text-sm sm:text-lg font-bold text-purple-400">P</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-400">Selected Position</div>
                <div className="text-base sm:text-xl font-bold text-white truncate">
                  {userPosition ? (userPosition.amount.toNumber() / 1e9).toFixed(4) : '0.0000'} SOL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Vaults List */}
          <div className="card-elevated p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
                Your Vaults
              </h3>
              {vaultStore && (
                <button
                  onClick={() => setShowCreateVault(true)}
                  disabled={isCreatingVault || userSolBalance < minSolForVaultCreation}
                  className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
                  title={
                    userSolBalance < minSolForVaultCreation 
                      ? `Need ${minSolForVaultCreation.toFixed(4)} SOL to create vault`
                      : undefined
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isCreatingVault ? 'Creating...' : 'Create Vault'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm sm:text-base">Loading vaults...</p>
              </div>
            ) : userVaults.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {userVaults.map((vault, index) => (
                  <div 
                    key={index}
                    className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 cursor-pointer group ${
                      selectedVault?.id.eq(vault.id) 
                        ? 'border-accent-500/50 bg-accent-500/5 shadow-lg shadow-accent-500/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                    }`}
                    onClick={() => selectVault(vault)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                      <div className="flex items-center">
                        <CheckCircleIcon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${selectedVault?.id.eq(vault.id) ? 'text-accent-500' : 'text-gray-500'}`} />
                        <h4 className="font-semibold text-white text-sm sm:text-base">
                          Vault #{vault.id.toString()}
                        </h4>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border self-start ${getRiskProfileBadgeColor(vault.riskProfile as unknown as RiskProfile)}`}>
                        {getRiskProfileName(vault.riskProfile)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-400">Deposits:</span>
                        <div className="font-medium text-white">{(vault.totalDeposits.toNumber() / 1e9).toFixed(4)} SOL</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <div className="font-medium text-white">{new Date(vault.lastRebalance.toNumber() * 1000).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CurrencyDollarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">You don't have any vaults yet.</p>
                {vaultStore && (
                  <button
                    onClick={() => setShowCreateVault(true)}
                    disabled={userSolBalance < minSolForVaultCreation}
                    className="btn btn-accent w-full sm:w-auto"
                    title={
                      userSolBalance < minSolForVaultCreation 
                        ? `Need ${minSolForVaultCreation.toFixed(4)} SOL to create vault`
                        : undefined
                    }
                  >
                    Create Your First Vault
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Vault Details */}
          <div className="card-elevated p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
              Vault Details
            </h3>
            {selectedVault ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="border-b border-white/10 pb-4 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-3">
                    <h4 className="text-xl sm:text-2xl font-bold text-white">
                      Vault #{selectedVault.id.toString()}
                    </h4>
                    <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border self-start ${getRiskProfileBadgeColor(selectedVault.riskProfile as unknown as RiskProfile)}`}>
                      {getRiskProfileName(selectedVault.riskProfile)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Deposits</div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {(selectedVault.totalDeposits.toNumber() / 1e9).toFixed(6)} SOL
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Your Position</div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {userPosition ? (userPosition.amount.toNumber() / 1e9).toFixed(6) : '0.000000'} SOL
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Created</div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {new Date(selectedVault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Last Rebalance</div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {new Date(selectedVault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button className="btn btn-primary">
                    Deposit
                  </button>
                  <button className="btn btn-secondary">
                    Withdraw
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ArrowTrendingUpIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-base sm:text-lg">Select a vault to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Vault Modal */}
        {showCreateVault && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-elevated max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
                Create New Vault
              </h3>
              
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Risk Profile
                </label>
                <select
                  value={selectedRiskProfile}
                  onChange={(e) => setSelectedRiskProfile(e.target.value as RiskProfile)}
                  className="input w-full"
                >
                  <option value={RiskProfile.Conservative}>Conservative - Lower risk, stable returns</option>
                  <option value={RiskProfile.Moderate}>Moderate - Balanced risk and returns</option>
                  <option value={RiskProfile.Aggressive}>Aggressive - Higher risk, higher potential returns</option>
                </select>
                <p className="mt-2 text-xs sm:text-sm text-gray-400">
                  Choose a risk profile that matches your investment strategy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setShowCreateVault(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVault}
                  disabled={isCreatingVault || userSolBalance < minSolForVaultCreation}
                  className="flex-1 btn btn-primary"
                  title={
                    userSolBalance < minSolForVaultCreation 
                      ? `Need ${minSolForVaultCreation.toFixed(4)} SOL to create vault`
                      : undefined
                  }
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