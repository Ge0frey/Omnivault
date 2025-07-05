import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import OfficialLayerZeroService, { 
  CrossChainActionType,
  CHAIN_IDS,
  type CrossChainMessage,
  type OAppConfig 
} from '../services/layerzero-official';

interface CrossChainEvent {
  id: string;
  timestamp: number;
  sourceChain: number;
  message: CrossChainMessage;
  processed: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface CrossChainMessageHandlerProps {
  vaultId?: number;
  onYieldDataReceived?: (data: unknown) => void;
  onEmergencyPause?: (data: unknown) => void;
  onRebalanceReceived?: (data: unknown) => void;
}

export const CrossChainMessageHandler: React.FC<CrossChainMessageHandlerProps> = ({
  vaultId,
  onYieldDataReceived,
  onEmergencyPause,
  onRebalanceReceived
}) => {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [layerzeroService, setLayerzeroService] = useState<OfficialLayerZeroService | null>(null);
  const [events, setEvents] = useState<CrossChainEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const listenersRef = useRef<(() => void)[]>([]);

  // Initialize LayerZero service
  useEffect(() => {
    if (!publicKey || !wallet) return;

    const initializeService = async () => {
      try {
        // Create OApp configuration
        const oappConfig: OAppConfig = {
          endpoint: new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV"),
          defaultGasLimit: 200000,
          defaultMsgValue: 2000000, // 0.002 SOL
          owner: publicKey,
          peers: new Map(),
          trusted: true
        };

        // Initialize peers for supported chains
        const ethereumPeer = new PublicKey("11111111111111111111111111111111"); // Placeholder
        const arbitrumPeer = new PublicKey("11111111111111111111111111111111"); // Placeholder
        
        oappConfig.peers.set(CHAIN_IDS.ETHEREUM, ethereumPeer);
        oappConfig.peers.set(CHAIN_IDS.ARBITRUM, arbitrumPeer);

        // Create provider (simplified for this example)
        const provider = {
          connection,
          publicKey,
          sendAndConfirm: async () => {
            // This would be handled by wallet adapter
            return "mock-signature";
          }
        } as unknown as import('@coral-xyz/anchor').AnchorProvider;

        const service = new OfficialLayerZeroService(provider, oappConfig);
        setLayerzeroService(service);

        // Start listening for messages
        startListening(service);

      } catch (error) {
        console.error('Failed to initialize LayerZero service:', error);
      }
    };

    initializeService();

    return () => {
      cleanupListeners();
    };
  }, [publicKey, wallet, connection]);

  // Start listening for cross-chain messages
  const startListening = useCallback((service: OfficialLayerZeroService) => {
    if (isListening) return;

    setIsListening(true);

    // Listen for messages from all supported chains
    const supportedChains = [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.BSC,
      CHAIN_IDS.AVALANCHE,
      CHAIN_IDS.OPTIMISM
    ];

    supportedChains.forEach(chainId => {
      const cleanup = service.onMessage(chainId, (message) => {
        handleIncomingMessage(chainId, message);
      });
      listenersRef.current.push(cleanup);
    });

    // Listen for LayerZero events
    const yieldDataListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onYieldDataReceived) {
        onYieldDataReceived(customEvent.detail);
      }
    };

    const emergencyPauseListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onEmergencyPause) {
        onEmergencyPause(customEvent.detail);
      }
    };

    const rebalanceListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onRebalanceReceived) {
        onRebalanceReceived(customEvent.detail);
      }
    };

    window.addEventListener('layerzero:yieldDataReceived', yieldDataListener);
    window.addEventListener('layerzero:emergencyPauseReceived', emergencyPauseListener);
    window.addEventListener('layerzero:rebalanceReceived', rebalanceListener);

    // Store cleanup functions
    listenersRef.current.push(
      () => window.removeEventListener('layerzero:yieldDataReceived', yieldDataListener),
      () => window.removeEventListener('layerzero:emergencyPauseReceived', emergencyPauseListener),
      () => window.removeEventListener('layerzero:rebalanceReceived', rebalanceListener)
    );
  }, [isListening, onYieldDataReceived, onEmergencyPause, onRebalanceReceived]);

  // Cleanup listeners
  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach(cleanup => cleanup());
    listenersRef.current = [];
  }, []);



  // Handle incoming cross-chain message
  const handleIncomingMessage = useCallback((sourceChain: number, message: CrossChainMessage) => {
    // Filter messages for specific vault if provided
    if (vaultId && message.action.vaultId !== vaultId) {
      return;
    }

    const event: CrossChainEvent = {
      id: `${sourceChain}-${message.nonce}-${Date.now()}`,
      timestamp: Date.now(),
      sourceChain,
      message,
      processed: false,
      type: getEventType(message.action.type)
    };

    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
    setUnreadCount(prev => prev + 1);

    // Auto-mark as processed after 5 seconds
    setTimeout(() => {
      markEventAsProcessed(event.id);
    }, 5000);
  }, [vaultId]);

  // Get event type for styling
  const getEventType = (actionType: CrossChainActionType): 'info' | 'success' | 'warning' | 'error' => {
    switch (actionType) {
      case CrossChainActionType.YieldResponse:
        return 'success';
      case CrossChainActionType.EmergencyPause:
        return 'error';
      case CrossChainActionType.Rebalance:
        return 'info';
      default:
        return 'info';
    }
  };

  // Mark event as processed
  const markEventAsProcessed = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, processed: true } : event
    ));
  };

  // Clear all events
  const clearEvents = () => {
    setEvents([]);
    setUnreadCount(0);
  };

  // Toggle notifications visibility
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get event title
  const getEventTitle = (message: CrossChainMessage) => {
    switch (message.action.type) {
      case CrossChainActionType.YieldResponse:
        return 'Yield Data Received';
      case CrossChainActionType.EmergencyPause:
        return 'Emergency Pause Activated';
      case CrossChainActionType.Rebalance:
        return 'Rebalance Initiated';
      default:
        return 'Cross-Chain Message';
    }
  };

  // Get event description
  const getEventDescription = (event: CrossChainEvent) => {
    const chainName = layerzeroService?.getChainName(event.sourceChain) || `Chain ${event.sourceChain}`;
    
    switch (event.message.action.type) {
      case CrossChainActionType.YieldResponse:
        return `Received yield data from ${chainName}`;
      case CrossChainActionType.EmergencyPause:
        return `Emergency pause triggered from ${chainName}`;
      case CrossChainActionType.Rebalance:
        return `Rebalance request from ${chainName}`;
      default:
        return `Message from ${chainName}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={toggleNotifications}
        className="relative p-3 rounded-full glass-effect border border-white/10 hover:bg-white/5 transition-all duration-300"
      >
        <BellIcon className="h-6 w-6 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="mt-2 w-80 max-h-96 overflow-y-auto glass-effect border border-white/10 rounded-lg shadow-2xl">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Cross-Chain Messages</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (isListening) {
                      setIsListening(false);
                      cleanupListeners();
                    } else {
                      setIsListening(true);
                      // Restart listening if we have a service
                      if (layerzeroService) {
                        startListening(layerzeroService);
                      }
                    }
                  }}
                  className={`p-1 rounded text-xs ${
                    isListening ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  {isListening ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded text-xs text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-xs text-gray-400">
                {isListening ? 'Listening' : 'Not listening'}
              </span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cross-chain messages yet</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !event.processed ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {getEventTitle(event.message)}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Nonce: {event.message.nonce}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossChainMessageHandler; 