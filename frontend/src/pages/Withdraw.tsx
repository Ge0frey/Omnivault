import { useState, useEffect } from 'react';
import { BN } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  ArrowUpIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalculatorIcon
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



export const Withdraw = () => {
  const { connected } = useWallet();
  const { 
    userVaults, 
    loading,
    getUserUSDCPositionInVault,
    withdrawSol,
    withdrawUSDC,
    error,
    clearError
  } = useOmniVault();
  
  const [amount, setAmount] = useState('');
  const [selectedVaultForWithdraw, setSelectedVaultForWithdraw] = useState<any>(null);
  const [withdrawType, setWithdrawType] = useState<'partial' | 'full'>('partial');
  const [selectedToken, setSelectedToken] = useState<TokenOption>(SUPPORTED_TOKENS[0]);
  const [successTransaction, setSuccessTransaction] = useState<{
    signature: string;
    title: string;
    description: string;
  } | null>(null);
  const [showCCTPModal, setShowCCTPModal] = useState(false);
  const [vaultUSDCPosition, setVaultUSDCPosition] = useState<number>(0);

  // Fetch vault USDC position when vault is selected
  useEffect(() => {
    const fetchUSDCPosition = async () => {
      if (selectedVaultForWithdraw?.publicKey && getUserUSDCPositionInVault) {
        const position = await getUserUSDCPositionInVault(selectedVaultForWithdraw.publicKey);
        setVaultUSDCPosition(position);
      }
    };
    fetchUSDCPosition();
  }, [selectedVaultForWithdraw, getUserUSDCPositionInVault]);

  const handleWithdraw = async () => {
    if (!selectedVaultForWithdraw || (!amount && withdrawType === 'partial')) return;
    
    const amountNum = withdrawType === 'full' 
      ? getAvailableBalance(selectedVaultForWithdraw) 
      : parseFloat(amount);
    
    if (amountNum <= 0) return;
    
    // Check balance for SOL
    if (selectedToken.symbol === 'SOL' && amountNum > getAvailableBalance(selectedVaultForWithdraw)) return;

    try {
      let tx;
      if (selectedToken.symbol === 'SOL') {
        tx = await withdrawSol(selectedVaultForWithdraw, amountNum);
      } else if (selectedToken.symbol === 'USDC') {
        // Convert USDC amount to smallest unit (6 decimals)
        const usdcAmount = Math.floor(amountNum * 1e6);
        tx = await withdrawUSDC(selectedVaultForWithdraw, usdcAmount);
      } else {
        // For other tokens
        alert(`${selectedToken.symbol} withdrawals are coming soon! Please use SOL or USDC for now.`);
        return;
      }
      
      if (tx) {
        console.log('Withdrawal successful:', tx);
        setAmount('');
        setSuccessTransaction({
          signature: tx,
          title: "Withdrawal Successful!",
          description: `Successfully withdrew ${amountNum.toFixed(4)} ${selectedToken.symbol} from Vault #${selectedVaultForWithdraw.id.toString()}`
        });
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
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

  const getAvailableBalance = (vault: any): number => {
    // Return balance based on selected token
    if (selectedToken.symbol === 'USDC') {
      return vaultUSDCPosition;
    }
    // For SOL, use the vault's total deposits (simplified)
    return vault.totalDeposits.toNumber() / 1e9;
  };

  const getTotalYieldEarned = (vault: any): number => {
    // This would be the yield earned by the user
    // For now, using vault's total yield as placeholder
    return vault.totalYield ? vault.totalYield.toNumber() / 1e9 : 0;
  };

  const calculateWithdrawFee = (amount: number): number => {
    // Assuming 0.5% withdrawal fee
    return amount * 0.005;
  };

  const calculateNetAmount = (amount: number): number => {
    return amount - calculateWithdrawFee(amount);
  };

  const isFormValid = selectedVaultForWithdraw && 
    (withdrawType === 'full' || (amount && parseFloat(amount) > 0 && 
      (selectedToken.symbol !== 'SOL' || parseFloat(amount) <= getAvailableBalance(selectedVaultForWithdraw))));

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
            <MinusCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-6 sm:mb-8 max-w-md text-base sm:text-lg font-light px-4">
            Connect your Solana wallet to access your OmniVault portfolios and manage withdrawals.
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
            <ArrowUpIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent-500 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Withdraw Funds</h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg font-light">
            Withdraw your earnings and principal from your OmniVault positions
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
                {userVaults.map((vault, index) => {
                  const availableBalance = getAvailableBalance(vault);
                  const yieldEarned = getTotalYieldEarned(vault);
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 cursor-pointer group ${
                        selectedVaultForWithdraw?.id.eq(vault.id) 
                          ? 'border-accent-500/50 bg-accent-500/5 shadow-lg shadow-accent-500/10' 
                          : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                      }`}
                      onClick={() => setSelectedVaultForWithdraw(vault)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                        <div className="flex items-center">
                          <CheckCircleIcon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${selectedVaultForWithdraw?.id.eq(vault.id) ? 'text-accent-500' : 'text-gray-500'}`} />
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
                          <span className="text-gray-400">Available:</span>
                          <div className="font-medium text-white">
                            {selectedToken.symbol === 'SOL' 
                              ? `${availableBalance.toFixed(4)} SOL`
                              : `${vaultUSDCPosition.toFixed(2)} USDC`}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Yield Earned:</span>
                          <div className="font-medium text-green-400">{yieldEarned.toFixed(4)} SOL</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Current APY:</span>
                          <div className="font-medium text-green-400">{(vault.currentApy.toNumber() / 100).toFixed(2)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Value:</span>
                          <div className="font-medium text-accent-400">{(availableBalance + yieldEarned).toFixed(4)} SOL</div>
                        </div>
                      </div>
                      
                      <div className="text-xs sm:text-sm text-gray-400">
                        Last rebalance: {new Date(vault.lastRebalance.toNumber() * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ShieldCheckIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">No vaults with funds</p>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                  You need to deposit funds into a vault before you can withdraw.
                </p>
                <button className="btn btn-accent w-full sm:w-auto">
                  Make a Deposit
                </button>
              </div>
            )}
          </div>

          {/* Withdrawal Form */}
          <div className="card-elevated p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <MinusCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-500" />
              Withdraw Amount
            </h3>

            {selectedVaultForWithdraw ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Selected Vault Info */}
                <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white text-sm sm:text-base">
                      Vault #{selectedVaultForWithdraw.id.toString()}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskProfileBadgeColor(selectedVaultForWithdraw.riskProfile)}`}>
                      {getRiskProfileName(selectedVaultForWithdraw.riskProfile)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-400">Available:</span>
                      <div className="font-medium text-white">
                        {selectedToken.symbol === 'SOL'
                          ? `${getAvailableBalance(selectedVaultForWithdraw).toFixed(4)} SOL`
                          : `${vaultUSDCPosition.toFixed(2)} USDC`}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Yield Earned:</span>
                      <div className="font-medium text-green-400">
                        {getTotalYieldEarned(selectedVaultForWithdraw).toFixed(4)} SOL
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
                          <p className="text-sm text-blue-300 font-medium">Cross-Chain USDC Withdrawal!</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Withdraw USDC to other chains (Ethereum, Arbitrum, Base, etc.) directly from this vault using Circle's CCTP.
                          </p>
                          <button
                            onClick={() => {
                              if (selectedVaultForWithdraw) {
                                setShowCCTPModal(true);
                              }
                            }}
                            disabled={!selectedVaultForWithdraw}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                          >
                            Use Cross-Chain Withdrawal →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Withdrawal Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Withdrawal Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setWithdrawType('partial');
                        setAmount('');
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        withdrawType === 'partial'
                          ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                          : 'border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="text-center">
                        <CalculatorIcon className="h-5 w-5 mx-auto mb-1" />
                        <div className="font-medium text-sm">Partial</div>
                        <div className="text-xs opacity-75">Specify amount</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setWithdrawType('full');
                        setAmount(getAvailableBalance(selectedVaultForWithdraw).toString());
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        withdrawType === 'full'
                          ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                          : 'border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="text-center">
                        <ArrowUpIcon className="h-5 w-5 mx-auto mb-1" />
                        <div className="font-medium text-sm">Full</div>
                        <div className="text-xs opacity-75">Withdraw all</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                {withdrawType === 'partial' && (
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                      Amount to Withdraw ({selectedToken.symbol})
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
                        max={selectedToken.symbol === 'SOL' ? getAvailableBalance(selectedVaultForWithdraw) : undefined}
                        className="input w-full pr-16"
                      />
                      {selectedToken.symbol === 'SOL' && (
                        <button
                          onClick={() => setAmount(getAvailableBalance(selectedVaultForWithdraw).toString())}
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
                            ? `${getAvailableBalance(selectedVaultForWithdraw).toFixed(4)} SOL`
                            : `${vaultUSDCPosition.toFixed(2)} USDC`
                        }
                      </span>
                      {amount && (
                        <span className="text-gray-400">
                          ≈ ${(parseFloat(amount) * (selectedToken.symbol === 'SOL' ? 150 : selectedToken.symbol === 'USDC' ? 1 : 1)).toFixed(2)} USD
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Amount Buttons for Partial */}
                {withdrawType === 'partial' && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Quick amounts:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['25%', '50%', '75%', '100%'].map((percentage) => {
                        const availableBalance = getAvailableBalance(selectedVaultForWithdraw);
                        const quickAmount = availableBalance * (parseInt(percentage) / 100);
                        return (
                          <button
                            key={percentage}
                            onClick={() => setAmount(quickAmount.toString())}
                            className="btn btn-secondary text-xs px-2 py-1"
                          >
                            {percentage}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Withdrawal Summary */}
                {(amount || withdrawType === 'full') && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-300 mb-2 text-sm">Withdrawal Summary</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Amount:</span>
                        <span className="text-white font-medium">
                          {withdrawType === 'full' 
                            ? getAvailableBalance(selectedVaultForWithdraw).toFixed(4) 
                            : (amount || '0')} {selectedToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Withdrawal Fee (0.5%):</span>
                        <span className="text-red-400">
                          -{calculateWithdrawFee(
                            withdrawType === 'full' 
                              ? getAvailableBalance(selectedVaultForWithdraw) 
                              : parseFloat(amount || '0')
                          ).toFixed(4)} {selectedToken.symbol}
                        </span>
                      </div>
                      <div className="border-t border-blue-500/30 pt-2 flex justify-between">
                        <span className="text-blue-200 font-medium">You'll receive:</span>
                        <span className="text-green-400 font-bold">
                          {calculateNetAmount(
                            withdrawType === 'full' 
                              ? getAvailableBalance(selectedVaultForWithdraw) 
                              : parseFloat(amount || '0')
                          ).toFixed(4)} {selectedToken.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Important Info */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-yellow-300 mb-1 text-sm">Important Information</h4>
                      <ul className="text-xs sm:text-sm text-yellow-200 space-y-1">
                        <li>• Withdrawals may take a few minutes to process</li>
                        <li>• A 0.5% fee applies to cover cross-chain gas costs</li>
                        <li>• Partial withdrawals keep your vault active</li>
                        <li>• Full withdrawals will close your vault position</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Withdraw Button */}
                <button
                  onClick={handleWithdraw}
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
                      <ArrowUpIcon className="h-5 w-5 mr-2" />
                      {withdrawType === 'full' ? 'Withdraw All' : `Withdraw ${amount || '0'} ${selectedToken.symbol}`}
                    </>
                  )}
                </button>

                {!isFormValid && (withdrawType === 'partial' && amount) && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-red-400">
                      {parseFloat(amount) > getAvailableBalance(selectedVaultForWithdraw) 
                        ? 'Amount exceeds available balance' 
                        : parseFloat(amount) <= 0 
                        ? 'Amount must be greater than 0' 
                        : 'Please enter a valid amount'
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CheckCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-base sm:text-lg">Select a vault to withdraw funds</p>
                <p className="text-gray-500 text-sm sm:text-base px-4 mt-2">
                  Choose one of your vaults from the left panel to start withdrawing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How Withdrawals Work */}
        <div className="mt-8 sm:mt-12 card-elevated p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-accent-500" />
            How Withdrawals Work
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Select & Confirm</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Choose your vault and specify the amount you want to withdraw.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Cross-Chain Processing</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Our system retrieves your funds from active chains and consolidates them.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2 text-base sm:text-lg">Receive Funds</h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Funds are transferred to your wallet minus a small processing fee.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CCTP Transfer Modal */}
      {showCCTPModal && selectedVaultForWithdraw && (
        <CCTPTransferModal
          isOpen={showCCTPModal}
          onClose={() => setShowCCTPModal(false)}
          mode="withdraw"
          vaultId={selectedVaultForWithdraw.id.toNumber()}
          maxAmount={new BN(getAvailableBalance(selectedVaultForWithdraw) * 1e6)} // Convert to USDC decimals
          onConfirm={async (amount, _sourceChain, destinationChain, usesFastTransfer) => {
            try {
              // Handle cross-chain withdrawal via CCTP
              const tx = await withdrawUSDC(selectedVaultForWithdraw, amount.toNumber());
              if (tx) {
                setSuccessTransaction({
                  signature: tx,
                  title: "Cross-Chain Withdrawal Successful!",
                  description: `Successfully withdrew ${(amount.toNumber() / 1e6).toFixed(2)} USDC to ${destinationChain.name} from Vault #${selectedVaultForWithdraw.id.toString()}${usesFastTransfer ? ' (Fast Transfer)' : ''}`
                });
                setShowCCTPModal(false);
              }
            } catch (error) {
              console.error('Cross-chain withdrawal failed:', error);
            }
          }}
        />
      )}
    </div>
  );
};
