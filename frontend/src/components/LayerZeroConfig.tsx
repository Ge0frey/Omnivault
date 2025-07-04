import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  LinkIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useOmniVault } from '../hooks/useOmniVault';
import { CHAIN_IDS } from '../services/layerzero-official';

interface ChainPeerConfig {
  chainId: number;
  chainName: string;
  peerAddress: string;
  isConfigured: boolean;
  estimatedFee: number;
}

interface LayerZeroConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayerZeroConfig: React.FC<LayerZeroConfigProps> = ({ isOpen, onClose }) => {
  const {
    configureLzPeer,
    isLzPeerConfigured,
    estimateLzFees,
    error,
    clearError
  } = useOmniVault();

  const [peerConfigs, setPeerConfigs] = useState<ChainPeerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPeerChainId, setNewPeerChainId] = useState('');
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [showAddPeer, setShowAddPeer] = useState(false);

  // Initialize peer configurations
  useEffect(() => {
    if (isOpen) {
      initializePeerConfigs();
    }
  }, [isOpen]);

  const initializePeerConfigs = async () => {
    const supportedChains = [
      { id: CHAIN_IDS.ETHEREUM, name: 'Ethereum' },
      { id: CHAIN_IDS.ARBITRUM, name: 'Arbitrum' },
      { id: CHAIN_IDS.POLYGON, name: 'Polygon' },
      { id: CHAIN_IDS.BSC, name: 'BSC' },
      { id: CHAIN_IDS.AVALANCHE, name: 'Avalanche' },
      { id: CHAIN_IDS.OPTIMISM, name: 'Optimism' },
    ];

    const configs: ChainPeerConfig[] = [];

    for (const chain of supportedChains) {
      try {
        // Check if peer is already configured (this would need actual peer addresses)
        const dummyPeerAddress = "0x1234567890123456789012345678901234567890"; // Placeholder
        const isConfigured = isLzPeerConfigured(chain.id, dummyPeerAddress);
        
        // Estimate fees for typical message size (500 bytes)
        const fees = await estimateLzFees(chain.id, 500);
        const estimatedFee = fees ? fees.nativeFee / 1e9 : 0; // Convert to SOL

        configs.push({
          chainId: chain.id,
          chainName: chain.name,
          peerAddress: isConfigured ? dummyPeerAddress : '',
          isConfigured,
          estimatedFee
        });
      } catch (error) {
        console.error(`Failed to initialize config for ${chain.name}:`, error);
        configs.push({
          chainId: chain.id,
          chainName: chain.name,
          peerAddress: '',
          isConfigured: false,
          estimatedFee: 0
        });
      }
    }

    setPeerConfigs(configs);
  };

  const handleConfigurePeer = async (chainId: number, peerAddress: string) => {
    setLoading(true);
    clearError();

    try {
      await configureLzPeer(chainId, peerAddress);
      
      // Update the local config
      setPeerConfigs(prev => prev.map(config => 
        config.chainId === chainId 
          ? { ...config, peerAddress, isConfigured: true }
          : config
      ));

      console.log(`Successfully configured peer for chain ${chainId}`);
    } catch (error) {
      console.error('Failed to configure peer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewPeer = async () => {
    if (!newPeerChainId || !newPeerAddress) {
      return;
    }

    const chainId = parseInt(newPeerChainId);
    await handleConfigurePeer(chainId, newPeerAddress);
    
    // Reset form
    setNewPeerChainId('');
    setNewPeerAddress('');
    setShowAddPeer(false);
  };

  const handleRemovePeer = (chainId: number) => {
    setPeerConfigs(prev => prev.map(config => 
      config.chainId === chainId 
        ? { ...config, peerAddress: '', isConfigured: false }
        : config
    ));
  };

  const getTotalEstimatedFees = () => {
    return peerConfigs.reduce((total, config) => total + config.estimatedFee, 0);
  };

  const getConfiguredCount = () => {
    return peerConfigs.filter(config => config.isConfigured).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl glass-effect border border-white/10 rounded-xl shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Cog6ToothIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">LayerZero Configuration</h2>
                  <p className="text-sm text-gray-400">Configure cross-chain peers and settings</p>
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

          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center space-x-3">
                  <LinkIcon className="h-8 w-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{getConfiguredCount()}</div>
                    <div className="text-sm text-gray-400">Configured Peers</div>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{getTotalEstimatedFees().toFixed(4)}</div>
                    <div className="text-sm text-gray-400">Total Est. Fees (SOL)</div>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center space-x-3">
                  <Cog6ToothIcon className="h-8 w-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{peerConfigs.length}</div>
                    <div className="text-sm text-gray-400">Supported Chains</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Peer Configuration List */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Chain Peer Configuration</h3>
                <button
                  onClick={() => setShowAddPeer(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Peer</span>
                </button>
              </div>

              {peerConfigs.map((config) => (
                <div key={config.chainId} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {config.isConfigured ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-400"></div>
                        )}
                        <span className="font-medium text-white">{config.chainName}</span>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        Chain ID: {config.chainId}
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        Est. Fee: {config.estimatedFee.toFixed(4)} SOL
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {config.isConfigured ? (
                        <>
                          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                            Configured
                          </span>
                          <button
                            onClick={() => handleRemovePeer(config.chainId)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConfigurePeer(config.chainId, `0x${config.chainId.toString().padStart(40, '0')}`)}
                          disabled={loading}
                          className="btn btn-primary btn-sm"
                        >
                          Configure
                        </button>
                      )}
                    </div>
                  </div>

                  {config.peerAddress && (
                    <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-800/50 p-2 rounded">
                      Peer: {config.peerAddress}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Peer Form */}
            {showAddPeer && (
              <div className="card p-4 border border-blue-500/30">
                <h4 className="text-lg font-semibold text-white mb-4">Add New Peer</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Chain ID
                    </label>
                    <input
                      type="number"
                      value={newPeerChainId}
                      onChange={(e) => setNewPeerChainId(e.target.value)}
                      className="input w-full"
                      placeholder="Enter chain ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Peer Address
                    </label>
                    <input
                      type="text"
                      value={newPeerAddress}
                      onChange={(e) => setNewPeerAddress(e.target.value)}
                      className="input w-full"
                      placeholder="Enter peer contract address"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddPeer(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNewPeer}
                    disabled={!newPeerChainId || !newPeerAddress || loading}
                    className="btn btn-primary"
                  >
                    Add Peer
                  </button>
                </div>
              </div>
            )}

            {/* LayerZero Documentation Links */}
            <div className="card p-4 bg-blue-500/5 border border-blue-500/20">
              <h4 className="text-lg font-semibold text-white mb-2">LayerZero V2 Resources</h4>
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Peers must be configured on both source and destination chains</p>
                <p>• Use <code className="bg-gray-800 px-1 rounded">setPeer</code> to establish trusted communication</p>
                <p>• Minimum 0.002 SOL required for Solana destination messages</p>
                <p>• Gas limits are automatically calculated based on destination chain</p>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://docs.layerzero.network/v2/developers/solana/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  LayerZero Solana Docs
                </a>
                <a
                  href="https://docs.layerzero.network/v2/developers/solana/oapp/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  OApp Configuration
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerZeroConfig; 