import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  CurrencyDollarIcon, 
  ArrowDownIcon, 
  ExclamationTriangleIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';
import { NATIVE_SOL_MINT } from '../services/omnivault';
import { TransactionSuccess } from '../components/TransactionSuccess';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CCTPTransferModal } from '../components/CCTPTransferModal';

interface TokenOption {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

const SUPPORTED_TOKENS: TokenOption[] = [
  {
    address: NATIVE_SOL_MINT.toString(),
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    icon: '◎'
  },
  {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '💰'
  },
];



export const Deposit = () => {
  const { connected } = useWallet();
  const { 
    userVaults, 
    userSolBalance,
    userUSDCBalance,
    loading,
    depositSol,
    depositUSDC,
    getVaultUSDCBalance,
    getUserUSDCPositionInVault,
    error,
    clearError
  } = useOmniVault();
  
  const [amount, setAmount] = useState('');
  const [selectedVaultForDeposit, setSelectedVaultForDeposit] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<TokenOption>(SUPPORTED_TOKENS[0]);
  const [successTransaction, setSuccessTransaction] = useState<{
    signature: string;
    title: string;
    description: string;
  } | null>(null);
  const [showCCTPModal, setShowCCTPModal] = useState(false);
  const [vaultUSDCBalance, setVaultUSDCBalance] = useState<number>(0);
  const [userUSDCPosition, setUserUSDCPosition] = useState<number>(0);
  const [allVaultUSDCBalances, setAllVaultUSDCBalances] = useState<Map<string, number>>(new Map());

  // Fetch USDC balances for all vaults
  useEffect(() => {
    const fetchAllVaultUSDCBalances = async () => {
      if (!userVaults.length || !getVaultUSDCBalance) return;
      
      const balances = new Map<string, number>();
      for (const vault of userVaults) {
        try {
          const balance = await getVaultUSDCBalance(vault.publicKey);
          balances.set(vault.publicKey.toString(), balance);
        } catch (err) {
          console.error('Error fetching USDC balance for vault:', err);
        }
      }
      setAllVaultUSDCBalances(balances);
    };
    fetchAllVaultUSDCBalances();
  }, [userVaults, getVaultUSDCBalance]);

  // Fetch vault USDC balances when a vault is selected
  useEffect(() => {
    const fetchVaultUSDCData = async () => {
      if (selectedVaultForDeposit?.publicKey && getVaultUSDCBalance && getUserUSDCPositionInVault) {
        try {
          const [balance, position] = await Promise.all([
            getVaultUSDCBalance(selectedVaultForDeposit.publicKey),
            getUserUSDCPositionInVault(selectedVaultForDeposit.publicKey)
          ]);
          setVaultUSDCBalance(balance);
          setUserUSDCPosition(position);
        } catch (err) {
          console.error('Error fetching vault USDC data:', err);
        }
      }
    };
    fetchVaultUSDCData();
  }, [selectedVaultForDeposit, getVaultUSDCBalance, getUserUSDCPositionInVault]);

  const handleDeposit = async () => {
    if (!selectedVaultForDeposit || !amount) return;
    
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return;
    
    // Check balance for SOL
    if (selectedToken.symbol === 'SOL' && amountNum > userSolBalance) return;

    try {
      let tx;
      if (selectedToken.symbol === 'SOL') {
        tx = await depositSol(selectedVaultForDeposit, amountNum);
      } else if (selectedToken.symbol === 'USDC') {
        // Convert USDC amount to smallest unit (6 decimals)
        const usdcAmount = Math.floor(amountNum * 1e6);
        tx = await depositUSDC(selectedVaultForDeposit, usdcAmount);
      } else {
        // For other tokens
        alert(`${selectedToken.symbol} deposits are coming soon! Please use SOL or USDC for now.`);
        return;
      }
      
      if (tx) {
        console.log('Deposit successful:', tx);
        setAmount('');
        setSuccessTransaction({
          signature: tx,
          title: "Deposit Successful!",
          description: `Successfully deposited ${amount} ${selectedToken.symbol} into Vault #${selectedVaultForDeposit.id.toString()}`
        });
        
        // Refresh vault USDC balances after successful deposit
        if (selectedToken.symbol === 'USDC' && getVaultUSDCBalance && getUserUSDCPositionInVault) {
          setTimeout(async () => {
            try {
              const [balance, position] = await Promise.all([
                getVaultUSDCBalance(selectedVaultForDeposit.publicKey),
                getUserUSDCPositionInVault(selectedVaultForDeposit.publicKey)
              ]);
              setVaultUSDCBalance(balance);
              setUserUSDCPosition(position);
              
              // Also update the map
              const newBalances = new Map(allVaultUSDCBalances);
              newBalances.set(selectedVaultForDeposit.publicKey.toString(), balance);
              setAllVaultUSDCBalances(newBalances);
            } catch (err) {
              console.error('Error refreshing USDC balances:', err);
            }
          }, 2000); // Wait 2 seconds for transaction to confirm
        }
      }
    } catch (error) {
      console.error('Deposit failed:', error);
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

  const getRiskProfileBadgeColor = (riskProfile: any) => {
    const name = getRiskProfileName(riskProfile).toLowerCase();
    switch (name) {
      case 'conservative':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'aggressive':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const isFormValid = selectedVaultForDeposit && amount && parseFloat(amount) > 0 && 
    (selectedToken.symbol !== 'SOL' || parseFloat(amount) <= userSolBalance);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center mobile-padding relative">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 sm:w-96 sm:h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative text-center">
          <div className="mx-auto h-24 w-24 sm:h-32 sm:w-32 rounded-2xl gradient-bg flex items-center justify-center mb-6 sm:mb-8 shadow-2xl">
            <PlusCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-6 sm:mb-8 max-w-md text-base sm:text-lg font-light px-4">
            Connect your Solana wallet to start depositing funds into your OmniVault portfolios.
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
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-56 h-56 sm:w-80 sm:h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative mx-auto max-w-6xl mobile-padding mobile-section">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <ArrowDownIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent-500 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Deposit Funds</h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg font-light">
            Deposit SOL into your vaults to start earning optimized cross-chain yields
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 card border-l-4 border-red-400 bg-red-500/10">
            <div className="flex p-4 sm:p-6">
              <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-red-300 font-medium text-sm sm:text-base">{error}</p>
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

        {/* Balance Display */}
        <div className="card mb-6 sm:mb-8 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-primary-500/20 rounded-xl mr-3 sm:mr-4">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-white">Available Balance</h3>
                <p className="text-lg sm:text-2xl font-bold text-accent-400">
                  {userSolBalance.toFixed(4)} SOL
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <p className="text-sm text-gray-400">≈ ${(userSolBalance * 150).toFixed(2)} USD</p>
                <p className="text-xs text-gray-500">1 SOL ≈ $150</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Vault Selection */}
          <div className="card-elevated p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
              Select Vault
            </h3>
            
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
                      selectedVaultForDeposit?.id.eq(vault.id) 
                        ? 'border-accent-500/50 bg-accent-500/5 shadow-lg shadow-accent-500/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                    }`}
                    onClick={() => setSelectedVaultForDeposit(vault)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                      <div className="flex items-center">
                        <CheckCircleIcon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${selectedVaultForDeposit?.id.eq(vault.id) ? 'text-accent-500' : 'text-gray-500'}`} />
                        <h4 className="font-semibold text-white text-sm sm:text-base">
                          Vault #{vault.id.toString()}
                        </h4>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border self-start ${getRiskProfileBadgeColor(vault.riskProfile)}`}>
                        {getRiskProfileName(vault.riskProfile)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-3">
                      <div>
                        <span className="text-gray-400">Current APY:</span>
                        <div className="font-medium text-green-400">{(vault.currentApy.toNumber() / 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Deposited:</span>
                        <div className="font-medium text-white">
                          <div>{(vault.totalDeposits.toNumber() / 1e9).toFixed(4)} SOL</div>
                          {(allVaultUSDCBalances.get(vault.publicKey.toString()) || 0) > 0 && (
                            <div className="text-blue-400">${(allVaultUSDCBalances.get(vault.publicKey.toString()) || 0).toFixed(2)} USDC</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-400">
                      Optimizing across chains • Last updated: {new Date(vault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ShieldCheckIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">No vaults available</p>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                  You need to create a vault first before you can deposit funds.
                </p>
                <button className="btn btn-accent w-full sm:w-auto">
                  Create Your First Vault
                </button>
              </div>
            )}
          </div>

          {/* Deposit Form */}
          <div className="card-elevated p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <PlusCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
              Deposit Amount
            </h3>

            {selectedVaultForDeposit ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Selected Vault Info */}
                <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white text-sm sm:text-base">
                      Vault #{selectedVaultForDeposit.id.toString()}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskProfileBadgeColor(selectedVaultForDeposit.riskProfile)}`}>
                      {getRiskProfileName(selectedVaultForDeposit.riskProfile)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-400">Current APY:</span>
                      <div className="font-medium text-green-400">
                        {(selectedVaultForDeposit.currentApy.toNumber() / 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Vault Total:</span>
                      <div className="font-medium text-white">
                        <div>{(selectedVaultForDeposit.totalDeposits.toNumber() / 1e9).toFixed(4)} SOL</div>
                        {vaultUSDCBalance > 0 && (
                          <div className="text-blue-400">${vaultUSDCBalance.toFixed(2)} USDC</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Token
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUPPORTED_TOKENS.map((token) => (
                      <button
                        key={token.address}
                        onClick={() => setSelectedToken(token)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedToken.address === token.address
                            ? 'border-accent-500 bg-accent-500/20'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{token.icon}</div>
                          <div className="text-sm font-medium text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Cross-chain Option for USDC */}
                  {selectedToken.symbol === 'USDC' && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-300 font-medium">Cross-Chain USDC Available!</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Deposit USDC from other chains (Ethereum, Arbitrum, Base, etc.) directly into this vault using Circle's CCTP.
                          </p>
                          <button
                            onClick={() => {
                              if (selectedVaultForDeposit) {
                                setShowCCTPModal(true);
                              }
                            }}
                            disabled={!selectedVaultForDeposit}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                          >
                            Use Cross-Chain Deposit →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Deposit ({selectedToken.symbol})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step={selectedToken.decimals === 9 ? "0.0001" : "0.01"}
                      min="0"
                      max={selectedToken.symbol === 'SOL' ? userSolBalance : undefined}
                      className="input w-full pr-16"
                    />
                    {(selectedToken.symbol === 'SOL' || selectedToken.symbol === 'USDC') && (
                      <button
                        onClick={() => setAmount(
                          selectedToken.symbol === 'SOL' 
                            ? userSolBalance.toString()
                            : userUSDCBalance.toString()
                        )}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-accent-400 hover:text-accent-300 bg-accent-500/20 px-2 py-1 rounded font-medium transition-colors"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">
                      Available: {
                        selectedToken.symbol === 'SOL' 
                          ? `${userSolBalance.toFixed(4)} SOL` 
                          : `${userUSDCBalance.toFixed(2)} USDC`
                      }
                                          </span>
                      {selectedVaultForDeposit && userUSDCPosition > 0 && (
                        <span className="text-gray-400 text-xs">
                          Position: ${userUSDCPosition.toFixed(2)} USDC
                        </span>
                      )}
                      {amount && (
                        <span className="text-gray-400">
                          ≈ ${(parseFloat(amount) * (selectedToken.symbol === 'SOL' ? 150 : selectedToken.symbol === 'USDC' ? 1 : 1)).toFixed(2)} USD
                        </span>
                      )}
                    </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Quick amounts:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedToken.symbol === 'SOL' ? 
                      [0.1, 0.5, 1.0, 5.0].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => {
                            const maxAvailable = selectedToken.symbol === 'SOL' 
                              ? userSolBalance 
                              : userUSDCBalance;
                            setAmount(Math.min(quickAmount, maxAvailable).toString());
                          }}
                          disabled={quickAmount > (selectedToken.symbol === 'SOL' ? userSolBalance : userUSDCBalance)}
                          className="btn btn-secondary text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {quickAmount} {selectedToken.symbol}
                        </button>
                      )) :
                      [10, 50, 100, 500].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => setAmount(Math.min(quickAmount, userUSDCBalance).toString())}
                          disabled={quickAmount > userUSDCBalance}
                          className="btn btn-secondary text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {quickAmount} {selectedToken.symbol}
                        </button>
                      ))
                    }
                  </div>
                </div>

                {/* Deposit Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-1 text-sm">Deposit Information</h4>
                      <ul className="text-xs sm:text-sm text-blue-200 space-y-1">
                        <li>• Funds are automatically optimized across chains</li>
                        <li>• Yields are compounded automatically</li>
                        <li>• Small gas fees may apply for cross-chain operations</li>
                        <li>• You can withdraw anytime (subject to network conditions)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Deposit Button */}
                <button
                  onClick={handleDeposit}
                  disabled={!isFormValid || loading}
                  className="btn btn-accent w-full flex items-center justify-center text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon className="h-5 w-5 mr-2" />
                      Deposit {amount || '0'} {selectedToken.symbol}
                    </>
                  )}
                </button>

                {!isFormValid && amount && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-red-400">
                      {selectedToken.symbol === 'SOL' && parseFloat(amount) > userSolBalance 
                        ? 'Insufficient balance' 
                        : parseFloat(amount) <= 0 
                        ? 'Amount must be greater than 0' 
                        : 'Please select a vault and enter an amount'
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CheckCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-base sm:text-lg">Select a vault to deposit funds</p>
                <p className="text-gray-500 text-sm sm:text-base px-4 mt-2">
                  Choose one of your vaults from the left panel to start depositing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How Deposits Work */}
        <div className="mt-8 sm:mt-12 card-elevated p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <InformationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-accent-500" />
            How Deposits Work
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Deposit SOL</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Deposit your SOL into the selected vault with your chosen risk profile.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Auto-Optimization</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Our system finds the best yields across multiple blockchains and automatically deploys your funds.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Earn & Compound</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Watch your deposits grow with optimized yields that are automatically compounded.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CCTP Transfer Modal */}
      {showCCTPModal && selectedVaultForDeposit && (
        <CCTPTransferModal
          isOpen={showCCTPModal}
          onClose={() => setShowCCTPModal(false)}
          mode="deposit"
          vaultId={selectedVaultForDeposit.id.toNumber()}
          onConfirm={async (amount, sourceChain, _destinationChain, usesFastTransfer) => {
            try {
              // Handle cross-chain deposit via CCTP
              const tx = await depositUSDC(selectedVaultForDeposit, amount.toNumber());
              if (tx) {
                setSuccessTransaction({
                  signature: tx,
                  title: "Cross-Chain Deposit Successful!",
                  description: `Successfully deposited ${(amount.toNumber() / 1e6).toFixed(2)} USDC from ${sourceChain.name} to Vault #${selectedVaultForDeposit.id.toString()}${usesFastTransfer ? ' (Fast Transfer)' : ''}`
                });
                setShowCCTPModal(false);
              }
            } catch (error) {
              console.error('Cross-chain deposit failed:', error);
            }
          }}
        />
      )}
    </div>
  );
};
