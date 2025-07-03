import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  CurrencyDollarIcon, 
  ArrowDownIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

export const Deposit: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    userVaults,
    selectedVault,
    selectVault,
    depositSol,
    deposit,
    isDepositing,
    error,
    clearError,
    service,
    refreshData,
    loading
  } = useOmniVault();

  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenOption>(SUPPORTED_TOKENS[0]);
  const [depositVault, setDepositVault] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');

  // Refresh data when component mounts or wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshData();
    }
  }, [connected, publicKey, refreshData]);

  useEffect(() => {
    if (userVaults.length > 0 && !depositVault) {
      setDepositVault(userVaults[0]);
    }
  }, [userVaults, depositVault]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleDeposit = async () => {
    if (!connected || !publicKey || !depositVault || !amount) return;

    try {
      let txHash: string;
      
      if (selectedToken.symbol === 'SOL') {
        // Convert SOL to lamports
        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
        txHash = await depositSol(depositVault.id.toNumber(), lamports);
      } else {
        // Handle SPL token deposit
        const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, selectedToken.decimals));
        const mintAddress = new PublicKey(selectedToken.address);
        txHash = await deposit(depositVault.id.toNumber(), tokenAmount, mintAddress);
      }

      setLastTxHash(txHash);
      setShowSuccess(true);
      setAmount('');
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Deposit failed:', err);
    }
  };

  const getMinDepositFormatted = () => {
    if (!depositVault) return '0';
    return service?.lamportsToSol(depositVault.minDeposit.toNumber()).toString() || '0';
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
    if (!amount || !depositVault) return false;
    const amountValue = parseFloat(amount);
    const minDeposit = service?.lamportsToSol(depositVault.minDeposit.toNumber()) || 0;
    return amountValue >= minDeposit && amountValue > 0;
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
            Please connect your wallet to make deposits into OmniVault.
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposit Funds</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Deposit SOL or supported tokens into your vault to start earning optimized cross-chain yields.
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="card p-4 border border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Deposit Successful!</p>
              <p className="text-green-600 dark:text-green-300 text-sm">
                Transaction: {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-8)}
              </p>
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
            <PlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No vaults found</p>
            <div className="space-y-2">
              <button 
                onClick={refreshData}
                className="btn btn-secondary mb-2"
                disabled={loading}
              >
                Refresh Vaults
              </button>
              <button className="btn btn-primary">Create Your First Vault</button>
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
                  depositVault?.id.toString() === vault.id.toString()
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setDepositVault(vault)}
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
                      Minimum deposit: {getMinDepositFormatted()} SOL
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

      {/* Deposit Form */}
      {depositVault && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Deposit Amount</h3>
          
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
            
            {/* Min deposit warning */}
            {amount && !isAmountValid() && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Minimum deposit: {getMinDepositFormatted()} SOL
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          {selectedToken.symbol === 'SOL' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['0.1', '0.5', '1.0', '5.0'].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className="btn btn-secondary text-sm py-2"
                  >
                    {quickAmount} SOL
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deposit Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Deposit Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {amount || '0'} {selectedToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Vault:</span>
                <span className="text-gray-900 dark:text-white">
                  #{depositVault.id.toString()} ({Object.keys(depositVault.riskProfile)[0]})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estimated APY:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {(depositVault.currentApy.toNumber() / 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            disabled={!isAmountValid() || isDepositing}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {isDepositing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <ArrowDownIcon className="h-4 w-4 mr-2" />
                Deposit {selectedToken.symbol}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Your funds will be automatically optimized across chains for maximum yield
          </p>
        </div>
      )}
    </div>
  );
};
