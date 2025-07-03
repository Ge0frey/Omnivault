import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  CurrencyDollarIcon, 
  ArrowUpIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';
import { RiskProfile, NATIVE_SOL_MINT } from '../services/omnivault';

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
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
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

export const Withdraw: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    userVaults,
    withdrawSol,
    withdraw,
    isWithdrawing,
    error,
    clearError,
    service,
    vaultStore,
    refreshData,
    loading
  } = useOmniVault();

  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenOption>(SUPPORTED_TOKENS[0]);
  const [withdrawVault, setWithdrawVault] = useState<any>(null);
  const [userPosition, setUserPosition] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Refresh data when component mounts or wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshData();
    }
  }, [connected, publicKey, refreshData]);

  useEffect(() => {
    if (userVaults.length > 0 && !withdrawVault) {
      setWithdrawVault(userVaults[0]);
    }
  }, [userVaults, withdrawVault]);

  useEffect(() => {
    if (withdrawVault && publicKey && service) {
      fetchUserPosition();
    }
  }, [withdrawVault, publicKey, service]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const fetchUserPosition = async () => {
    if (!withdrawVault || !publicKey || !service) return;
    
    try {
      const position = await service.getUserPosition(publicKey, withdrawVault.key);
      setUserPosition(position);
    } catch (err) {
      console.error('Error fetching user position:', err);
      setUserPosition(null);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawVault || !amount || !userPosition || !isAmountValid()) return;

    try {
      clearError();
      
      const amountInLamports = selectedToken.symbol === 'SOL' 
        ? service?.solToLamports(parseFloat(amount)) || 0
        : Math.floor(parseFloat(amount) * Math.pow(10, selectedToken.decimals));

      let txHash: string | null = null;
      
      if (selectedToken.symbol === 'SOL') {
        txHash = await withdrawSol(withdrawVault, amountInLamports);
      } else {
        const mintAddress = new PublicKey(selectedToken.address);
        txHash = await withdraw(withdrawVault, amountInLamports, mintAddress);
      }

      if (txHash) {
        setLastTxHash(txHash);
        setShowSuccess(true);
        setAmount('');
        setShowConfirmation(false);
        
        // Refresh user position
        await fetchUserPosition();
        
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setShowConfirmation(false);
    }
  };

  const getAvailableBalance = () => {
    if (!userPosition) return 0;
    return service?.lamportsToSol(userPosition.amount.toNumber()) || 0;
  };

  const getWithdrawalFee = () => {
    if (!amount || !vaultStore) return 0;
    const amountValue = parseFloat(amount);
    const feeRate = vaultStore.feeRate / 10000; // Convert from basis points
    return amountValue * feeRate;
  };

  const getNetWithdrawal = () => {
    if (!amount) return 0;
    const amountValue = parseFloat(amount);
    const fee = getWithdrawalFee();
    return amountValue - fee;
  };

  const getRiskProfileColor = (vault: any) => {
    const riskProfile = Object.keys(vault.riskProfile)[0] as RiskProfile;
    switch (riskProfile) {
      case RiskProfile.Conservative:
        return 'bg-green-100 text-green-800 border-green-200';
      case RiskProfile.Moderate:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RiskProfile.Aggressive:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isAmountValid = () => {
    if (!amount || !userPosition) return false;
    const amountValue = parseFloat(amount);
    const availableBalance = getAvailableBalance();
    return amountValue > 0 && amountValue <= availableBalance;
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card p-8 text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to withdraw from OmniVault.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Withdraw your deposited funds from OmniVault at any time. Withdrawal fees apply.
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="card p-4 border border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Withdrawal Successful!</p>
              {lastTxHash && (
                <p className="text-green-600 dark:text-green-300 text-sm">
                  Transaction: {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-8)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card p-4 border border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Fee Information */}
      <div className="card p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <p className="text-blue-800 dark:text-blue-200 font-medium">Withdrawal Fee</p>
            <p className="text-blue-600 dark:text-blue-300 text-sm">
              A {vaultStore ? (vaultStore.feeRate / 100).toFixed(2) : '1.00'}% fee applies to all withdrawals to cover cross-chain operations.
            </p>
          </div>
        </div>
      </div>

      {/* Vault Selection */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Vault</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading your vaults...</p>
          </div>
        ) : userVaults.length === 0 ? (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No vaults found</p>
            <div className="space-y-2">
              <button 
                onClick={refreshData}
                className="btn btn-secondary mb-2"
                disabled={loading}
              >
                Refresh Vaults
              </button>
              <p className="text-sm text-gray-400">Create a vault and make deposits first</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              If you've created vaults but don't see them, try refreshing or check the browser console for errors.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userVaults.map((vault) => (
              <div
                key={vault.id.toString()}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  withdrawVault?.id.toString() === vault.id.toString()
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setWithdrawVault(vault)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Vault #{vault.id.toString()}
                      </h4>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getRiskProfileColor(vault)}`}>
                        {Object.keys(vault.riskProfile)[0]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current APY: {(vault.currentApy.toNumber() / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {service?.lamportsToSol(vault.totalDeposits.toNumber()).toFixed(4)} SOL
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Deposits</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Position */}
      {withdrawVault && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Position</h3>
          
          {userPosition ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getAvailableBalance().toFixed(6)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Deposit</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userPosition.lastDeposit.toNumber() > 0 
                      ? new Date(userPosition.lastDeposit.toNumber() * 1000).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No position found in this vault</p>
              <p className="text-sm text-gray-400">Make a deposit first to enable withdrawals</p>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Form */}
      {withdrawVault && userPosition && getAvailableBalance() > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Withdrawal Amount</h3>
          
          {/* Token Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Token
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUPPORTED_TOKENS.map((token) => (
                <button
                  key={token.address}
                  onClick={() => setSelectedToken(token)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    selectedToken.address === token.address
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{token.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount ({selectedToken.symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0"
                max={getAvailableBalance()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input w-full pr-20"
                placeholder={`Enter ${selectedToken.symbol} amount`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {selectedToken.symbol}
                </span>
              </div>
            </div>
            
            {/* Balance info */}
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available: {getAvailableBalance().toFixed(6)} SOL
              </p>
              <button
                onClick={() => setAmount(getAvailableBalance().toString())}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Max
              </button>
            </div>
            
            {/* Invalid amount warning */}
            {amount && !isAmountValid() && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Amount exceeds available balance
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          {selectedToken.symbol === 'SOL' && getAvailableBalance() > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['25%', '50%', '75%', '100%'].map((percentage) => {
                  const value = getAvailableBalance() * (parseInt(percentage) / 100);
                  return (
                    <button
                      key={percentage}
                      onClick={() => setAmount(value.toString())}
                      className="btn btn-secondary text-sm py-2"
                    >
                      {percentage}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Withdrawal Summary */}
          {amount && isAmountValid() && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Withdrawal Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Withdrawal Amount:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {amount} {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee ({vaultStore ? (vaultStore.feeRate / 100).toFixed(2) : '1.00'}%):</span>
                  <span className="text-red-600 dark:text-red-400">
                    -{getWithdrawalFee().toFixed(6)} {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span className="text-gray-900 dark:text-white">Net Withdrawal:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {getNetWithdrawal().toFixed(6)} {selectedToken.symbol}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Button */}
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={!isAmountValid() || isWithdrawing}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {isWithdrawing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <ArrowUpIcon className="h-4 w-4 mr-2" />
                Withdraw {selectedToken.symbol}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Withdrawals are subject to a fee to cover cross-chain optimization costs
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Withdrawal
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-medium">{amount} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                <span className="text-red-600">-{getWithdrawalFee().toFixed(6)} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>You will receive:</span>
                <span className="text-green-600">{getNetWithdrawal().toFixed(6)} {selectedToken.symbol}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="btn btn-primary flex-1"
              >
                {isWithdrawing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
