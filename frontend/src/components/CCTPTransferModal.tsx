import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  XMarkIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BoltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { FastTransferIndicator, TransferSpeed, TransferEstimate, TransferComparison } from './FastTransferIndicator';
import { CCTP_DOMAINS, DOMAIN_TO_CHAIN_NAME } from '../services/cctp';
import { HookBuilder } from '../services/cctp-hooks';

interface Chain {
  id: number;
  name: string;
  icon: string;
  cctpDomain?: number;
  layerZeroId?: number;
  isSupported: boolean;
}

const SUPPORTED_CHAINS: Chain[] = [
  { id: 1, name: 'Ethereum', icon: '🔷', cctpDomain: CCTP_DOMAINS.ETHEREUM, layerZeroId: 101, isSupported: true },
  { id: 2, name: 'Arbitrum', icon: '🔵', cctpDomain: CCTP_DOMAINS.ARBITRUM, layerZeroId: 110, isSupported: true },
  { id: 3, name: 'Optimism', icon: '🔴', cctpDomain: CCTP_DOMAINS.OPTIMISM, layerZeroId: 111, isSupported: true },
  { id: 4, name: 'Polygon', icon: '🟣', cctpDomain: CCTP_DOMAINS.POLYGON, layerZeroId: 109, isSupported: true },
  { id: 5, name: 'Avalanche', icon: '🔺', cctpDomain: CCTP_DOMAINS.AVALANCHE, layerZeroId: 106, isSupported: true },
  { id: 6, name: 'Base', icon: '🔷', cctpDomain: CCTP_DOMAINS.BASE, isSupported: true },
  { id: 7, name: 'Solana', icon: '🟢', cctpDomain: CCTP_DOMAINS.SOLANA, isSupported: true },
];

export interface CCTPTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'deposit' | 'withdraw';
  vaultId?: number;
  maxAmount?: BN;
  onConfirm: (
    amount: BN,
    sourceChain: Chain,
    destinationChain: Chain,
    usesFastTransfer: boolean,
    hooks?: HookBuilder
  ) => Promise<void>;
}

export const CCTPTransferModal: React.FC<CCTPTransferModalProps> = ({
  isOpen,
  onClose,
  mode,
  vaultId,
  maxAmount,
  onConfirm,
}) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState<string>('');
  const [sourceChain, setSourceChain] = useState<Chain>(
    mode === 'deposit' ? SUPPORTED_CHAINS[0] : SUPPORTED_CHAINS[6] // Solana for withdrawals
  );
  const [destinationChain, setDestinationChain] = useState<Chain>(
    mode === 'deposit' ? SUPPORTED_CHAINS[6] : SUPPORTED_CHAINS[0] // Solana for deposits
  );
  const [usesFastTransfer, setUsesFastTransfer] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoCompound, setAutoCompound] = useState(false);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChainSelector, setShowChainSelector] = useState<'source' | 'destination' | null>(null);

  // Transfer estimates
  const [transferEstimates, setTransferEstimates] = useState<TransferEstimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<number>(0);

  useEffect(() => {
    if (amount && sourceChain && destinationChain) {
      calculateTransferEstimates();
    }
  }, [amount, sourceChain, destinationChain]);

  const calculateTransferEstimates = () => {
    const amountBN = new BN(parseFloat(amount || '0') * 1e6);

    const estimates: TransferEstimate[] = [];

    // Fast Transfer estimate (CCTP)
    if (sourceChain.cctpDomain !== undefined && destinationChain.cctpDomain !== undefined) {
      estimates.push({
        speed: TransferSpeed.FAST,
        protocol: 'CCTP',
        estimatedTime: 30,
        fee: amountBN.mul(new BN(15)).div(new BN(10000)), // 0.15%
        isEligible: amountBN.lt(new BN(1000000 * 1e6)), // <$1M
        reason: amountBN.gte(new BN(1000000 * 1e6)) ? 'Amount exceeds Fast Transfer limit' : undefined,
      });
    }

    // Standard Transfer estimate (CCTP)
    if (sourceChain.cctpDomain !== undefined && destinationChain.cctpDomain !== undefined) {
      estimates.push({
        speed: TransferSpeed.STANDARD,
        protocol: 'CCTP',
        estimatedTime: 900,
        fee: amountBN.mul(new BN(10)).div(new BN(10000)), // 0.10%
        isEligible: true,
      });
    }

    // LayerZero fallback
    if (sourceChain.layerZeroId && destinationChain.layerZeroId) {
      estimates.push({
        speed: TransferSpeed.SLOW,
        protocol: 'LayerZero',
        estimatedTime: 1800,
        fee: amountBN.mul(new BN(20)).div(new BN(10000)), // 0.20%
        isEligible: true,
      });
    }

    setTransferEstimates(estimates);
  };

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    if (maxAmount) {
      setAmount((maxAmount.toNumber() / 1e6).toString());
    }
  };

  const validateTransfer = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const amountBN = new BN(parseFloat(amount) * 1e6);
    if (maxAmount && amountBN.gt(maxAmount)) {
      setError('Amount exceeds maximum');
      return false;
    }

    if (sourceChain.id === destinationChain.id) {
      setError('Source and destination chains cannot be the same');
      return false;
    }

    if (!sourceChain.isSupported || !destinationChain.isSupported) {
      setError('Selected chain is not supported');
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateTransfer()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const amountBN = new BN(parseFloat(amount) * 1e6);
      
      // Build hooks if advanced options are enabled
      let hooks: HookBuilder | undefined;
      if (showAdvanced && (autoCompound || autoRebalance)) {
        hooks = new HookBuilder();
        
        if (autoCompound && vaultId) {
          hooks.addCompound(
            vaultId,
            new BN(100 * 1e6), // Min $100 to compound
            'threshold',
            { reinvestRatio: 100 }
          );
        }
        
        if (autoRebalance && vaultId) {
          hooks.addRebalance(
            vaultId,
            50, // 0.5% yield improvement threshold
            { maxSlippage: 100 }
          );
        }
      }

      const selectedTransfer = transferEstimates[selectedEstimate];
      await onConfirm(
        amountBN,
        sourceChain,
        destinationChain,
        selectedTransfer?.speed === TransferSpeed.FAST,
        hooks
      );

      // Reset form
      setAmount('');
      onClose();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const swapChains = () => {
    const temp = sourceChain;
    setSourceChain(destinationChain);
    setDestinationChain(temp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative w-full max-w-2xl glass-effect border border-white/10 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {mode === 'deposit' ? 'Deposit' : 'Withdraw'} USDC
                  </h2>
                  <p className="text-sm text-gray-400">Cross-chain transfer via CCTP V2</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Chain Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Source Chain */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
                  <button
                    onClick={() => setShowChainSelector('source')}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{sourceChain.icon}</span>
                      <span className="font-medium text-white">{sourceChain.name}</span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Swap Button */}
                <div className="flex items-end justify-center">
                  <button
                    onClick={swapChains}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <ArrowsRightLeftIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Destination Chain */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                  <button
                    onClick={() => setShowChainSelector('destination')}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{destinationChain.icon}</span>
                      <span className="font-medium text-white">{destinationChain.name}</span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Chain Selector Dropdown */}
              {showChainSelector && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-white/10 rounded-xl shadow-xl">
                  <div className="p-2">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          if (showChainSelector === 'source') {
                            setSourceChain(chain);
                          } else {
                            setDestinationChain(chain);
                          }
                          setShowChainSelector(null);
                        }}
                        className="w-full p-3 rounded-lg hover:bg-white/5 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{chain.icon}</span>
                          <span className="font-medium text-white">{chain.name}</span>
                        </div>
                        {chain.cctpDomain !== undefined && (
                          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                            CCTP
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 pr-20 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleMaxClick}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-400/10 rounded-lg transition-colors"
                >
                  MAX
                </button>
              </div>
              {maxAmount && (
                <p className="mt-1 text-xs text-gray-400">
                  Available: {(maxAmount.toNumber() / 1e6).toFixed(2)} USDC
                </p>
              )}
            </div>

            {/* Transfer Options */}
            {transferEstimates.length > 0 && (
              <TransferComparison
                estimates={transferEstimates}
                selectedIndex={selectedEstimate}
                onSelect={setSelectedEstimate}
              />
            )}

            {/* Advanced Options */}
            <div className="border border-white/10 rounded-xl p-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-white">Advanced Options</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    showAdvanced ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-compound yields</span>
                    <input
                      type="checkbox"
                      checked={autoCompound}
                      onChange={(e) => setAutoCompound(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-rebalance for best yields</span>
                    <input
                      type="checkbox"
                      checked={autoRebalance}
                      onChange={(e) => setAutoRebalance(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <BoltIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-blue-300 font-medium">Fast Transfer Enabled</p>
                  <p className="text-xs text-gray-400">
                    Your USDC will arrive in under 30 seconds using Circle's CCTP V2 protocol. 
                    Transfers are secured by Circle's attestation service.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {transferEstimates[selectedEstimate] && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Est. time: {Math.floor(transferEstimates[selectedEstimate].estimatedTime / 60)} min
                    </span>
                    <span className="text-gray-500">•</span>
                    <span>
                      Fee: ${(transferEstimates[selectedEstimate].fee.toNumber() / 1e6).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing || !amount || !sourceChain || !destinationChain}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
