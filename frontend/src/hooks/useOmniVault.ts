import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { 
  OmniVaultService, 
  Vault, 
  UserPosition, 
  VaultStore, 
  YieldTracker,
  ChainYield,
  VaultCreatedEvent,
  DepositMadeEvent,
  YieldDataReceivedEvent,
  RebalanceTriggeredEvent
} from '../services/omnivault';
import { RiskProfile } from '../services/omnivault';
import { createOmniVaultService } from '../services/omnivault';
import type { CrossChainMessage } from '../services/layerzero-official';

export interface UseOmniVaultReturn {
  // Service instance
  service: OmniVaultService | null;
  
  // Loading states
  loading: boolean;
  isInitializing: boolean;
  isCreatingVault: boolean;
  isDepositing: boolean;
  isWithdrawing: boolean;
  isQuerying: boolean;
  isRebalancing: boolean;
  
  // Data states
  vaultStore: VaultStore | null;
  userVaults: (Vault & { publicKey: PublicKey })[];
  selectedVault: (Vault & { publicKey: PublicKey }) | null;
  userPosition: UserPosition | null;
  yieldTracker: YieldTracker | null;
  
  // Balance information
  userSolBalance: number;
  minSolForVaultCreation: number;
  
  // Cross-chain data
  chainYields: ChainYield[];
  bestChain: ChainYield | null;
  
  // Actions
  initialize: () => Promise<string | null>;
  createVault: (riskProfile: RiskProfile, minDeposit?: number, targetChains?: number[]) => Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey } | null>;
  deposit: (vault: Vault & { publicKey: PublicKey }, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  withdraw: (vault: Vault & { publicKey: PublicKey }, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  depositSol: (vault: Vault & { publicKey: PublicKey }, amount: number) => Promise<string | null>;
  withdrawSol: (vault: Vault & { publicKey: PublicKey }, amount: number) => Promise<string | null>;
  depositUSDC: (vault: Vault & { publicKey: PublicKey }, amount: number) => Promise<string | null>;
  withdrawUSDC: (vault: Vault & { publicKey: PublicKey }, amount: number) => Promise<string | null>;
  selectVault: (vault: Vault & { publicKey: PublicKey }) => void;
  refreshData: () => Promise<void>;
  
  // Cross-chain operations
  queryCrossChainYields: (vaultId: number, targetChains?: number[]) => Promise<string | null>;
  rebalanceVault: (vaultId: number, targetChain: number) => Promise<string | null>;
  updateVaultConfig: (vaultId: number, config: any) => Promise<string | null>;
  
  // LayerZero operations
  handleLzReceive: (srcChainId: number, payload: Uint8Array, vaultId: number) => Promise<string | null>;
  getLzReceiveTypes: (srcChainId: number, vaultId: number) => Promise<{ accounts: PublicKey[]; accountMetas: any[] } | null>;
  configureLzPeer: (dstChainId: number, peerAddress: string) => Promise<string | null>;
  isLzPeerConfigured: (chainId: number, peerAddress: string) => boolean;
  estimateLzFees: (dstChainId: number, messageSize: number, payInLzToken?: boolean) => Promise<{ nativeFee: number; lzTokenFee: number } | null>;
  onCrossChainMessage: (chainId: number, callback: (message: CrossChainMessage) => void) => () => void;
  
  // Balance utilities
  refreshBalance: () => Promise<void>;
  requestAirdrop: () => Promise<string | null>;
  
  // Real-time events
  recentEvents: Array<{
    type: string;
    data: any;
    timestamp: number;
  }>;
  
  // Helper functions
  getChainName: (chainId: number) => string;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useOmniVault = (): UseOmniVaultReturn => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  
  // Service instance
  const [service, setService] = useState<OmniVaultService | null>(null);
  const serviceRef = useRef<OmniVaultService | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  
  // Data states
  const [vaultStore, setVaultStore] = useState<VaultStore | null>(null);
  const [userVaults, setUserVaults] = useState<(Vault & { publicKey: PublicKey })[]>([]);
  const [selectedVault, setSelectedVault] = useState<(Vault & { publicKey: PublicKey }) | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [yieldTracker, setYieldTracker] = useState<YieldTracker | null>(null);
  
  // Balance states
  const [userSolBalance, setUserSolBalance] = useState<number>(0);
  const [minSolForVaultCreation, setMinSolForVaultCreation] = useState<number>(0);
  
  // Cross-chain data
  const [chainYields, setChainYields] = useState<ChainYield[]>([]);
  const [bestChain, setBestChain] = useState<ChainYield | null>(null);
  
  // Real-time events
  const [recentEvents, setRecentEvents] = useState<Array<{
    type: string;
    data: any;
    timestamp: number;
  }>>([]);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Initialize service when wallet connects
  useEffect(() => {
    if (connected && anchorWallet && connection) {
      try {
        // Cleanup previous service
        if (serviceRef.current) {
          serviceRef.current.cleanup();
        }
        
        const provider = new AnchorProvider(
          connection,
          anchorWallet,
          {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
          }
        );
        
        const omniVaultService = createOmniVaultService(provider);
        setService(omniVaultService);
        serviceRef.current = omniVaultService;
        setError(null);
        
        // Setup event listeners
        setupEventListeners(omniVaultService);
        
      } catch (err) {
        console.error('Failed to initialize OmniVault service:', err);
        setError('Failed to initialize OmniVault service');
      }
    } else {
      // Cleanup when wallet disconnects
      if (serviceRef.current) {
        serviceRef.current.cleanup();
        serviceRef.current = null;
      }
      setService(null);
      setVaultStore(null);
      setUserVaults([]);
      setSelectedVault(null);
      setUserPosition(null);
      setYieldTracker(null);
      setChainYields([]);
      setBestChain(null);
      setRecentEvents([]);
    }
  }, [connected, anchorWallet, connection]);

  // Setup real-time event listeners
  const setupEventListeners = useCallback((service: OmniVaultService) => {
    // Listen for vault created events
    service.onVaultCreated((event: VaultCreatedEvent) => {
      addEvent('VaultCreated', event);
      // Refresh data to show new vault
      refreshData();
    });

    // Listen for deposit events
    service.onDepositMade((event: DepositMadeEvent) => {
      addEvent('DepositMade', event);
      // Refresh data to update balances
      refreshData();
    });

    // Listen for yield data updates
    service.onYieldDataReceived((event: YieldDataReceivedEvent) => {
      addEvent('YieldDataReceived', event);
      // Update yield tracker data
      if (selectedVault) {
        loadYieldTracker(selectedVault.id.toNumber());
      }
    });

    // Listen for rebalance events
    service.onRebalanceTriggered((event: RebalanceTriggeredEvent) => {
      addEvent('RebalanceTriggered', event);
      // Refresh vault data
      if (selectedVault) {
        loadVaultData(selectedVault.id.toNumber());
      }
    });
  }, []);

  // Add event to recent events list
  const addEvent = useCallback((type: string, data: any) => {
    setRecentEvents(prev => [
      { type, data, timestamp: Date.now() },
      ...prev.slice(0, 19) // Keep last 20 events
    ]);
  }, []);

  // Refresh user balance and vault creation requirements
  const refreshBalance = useCallback(async () => {
    if (!service || !publicKey) return;
    
    try {
      const [balance, minRequired] = await Promise.all([
        service.getUserSolBalance(publicKey),
        service.getMinimumSolForVaultCreation()
      ]);
      
      setUserSolBalance(balance);
      setMinSolForVaultCreation(minRequired);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [service, publicKey]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!service || !publicKey) {
      console.log('Skipping refresh - no service or publicKey');
      return;
    }
    
    console.log('Refreshing data for user:', publicKey.toBase58());
    setLoading(true);
    try {
      // Load all data in parallel
      const [vaultStoreData, vaults] = await Promise.all([
        service.getVaultStore(),
        service.getUserVaults(publicKey),
        refreshBalance() // Refresh balance along with other data
      ]);
      
      setVaultStore(vaultStoreData);
      console.log('Vault store loaded:', vaultStoreData);
      
      setUserVaults(vaults);
      console.log('User vaults loaded:', vaults.length, 'vaults');
      
      // If we have a selected vault, refresh its data
      if (selectedVault) {
        await loadVaultData(selectedVault.id.toNumber());
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  }, [service, publicKey, selectedVault, refreshBalance]);

  // Load initial data when service is available
  useEffect(() => {
    if (service && publicKey) {
      refreshData();
    }
  }, [service, publicKey, refreshData]);

  // Load specific vault data including position and yield tracker
  const loadVaultData = useCallback(async (vaultId: number) => {
    if (!service || !publicKey || !selectedVault) return;
    
    try {
      // Load user position using the selectedVault's publicKey
      const position = await service.getUserPosition(publicKey, selectedVault.publicKey);
      setUserPosition(position);
      
      // Load yield tracker
      await loadYieldTracker(vaultId);
    } catch (err) {
      console.error('Failed to load vault data:', err);
    }
  }, [service, publicKey, selectedVault]);

  // Load yield tracker and process chain yields
  const loadYieldTracker = useCallback(async (_vaultId: number) => {
    if (!service || !publicKey || !selectedVault) return;
    
    try {
      const tracker = await service.getYieldTracker(selectedVault.publicKey);
      
      if (tracker) {
        setYieldTracker(tracker);
        setChainYields(tracker.chainYields);
        
        // Find best chain based on vault's risk profile
        const best = findBestChain(tracker.chainYields, selectedVault.riskProfile);
        setBestChain(best);
      }
    } catch (err) {
      console.error('Failed to load yield tracker:', err);
    }
  }, [service, publicKey, selectedVault]);

  // Helper to convert risk profile object to string
  const getRiskProfileString = useCallback((riskProfile: { [key: string]: {} }): RiskProfile => {
    const keys = Object.keys(riskProfile);
    if (keys.length > 0) {
      const key = keys[0];
      return key as RiskProfile;
    }
    return RiskProfile.Conservative;
  }, []);

  // Find best chain based on risk profile
  const findBestChain = useCallback((yields: ChainYield[], riskProfileObj: { [key: string]: {} }): ChainYield | null => {
    if (yields.length === 0) return null;
    
    const riskProfile = getRiskProfileString(riskProfileObj);
    
    switch (riskProfile) {
      case RiskProfile.Conservative:
        // Prioritize low risk, then yield
        return yields
          .filter(cy => cy.riskScore.toNumber() <= 30)
          .reduce((best, current) => 
            current.apy.gt(best.apy) ? current : best
          ) || null;
      
      case RiskProfile.Moderate:
        // Balance risk and yield
        return yields.reduce((best, current) => {
          const currentScore = current.apy.toNumber() - (current.riskScore.toNumber() * 2);
          const bestScore = best.apy.toNumber() - (best.riskScore.toNumber() * 2);
          return currentScore > bestScore ? current : best;
        }) || null;
      
      case RiskProfile.Aggressive:
        // Prioritize highest yield
        return yields.reduce((best, current) => 
          current.apy.gt(best.apy) ? current : best
        ) || null;
      
      default:
        return null;
    }
  }, [getRiskProfileString]);

  // Initialize vault store
  const initialize = useCallback(async (): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsInitializing(true);
    try {
      const tx = await service.initialize();
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to initialize:', err);
      setError(err.message || 'Failed to initialize vault store');
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [service, refreshData]);

  // Create a new vault with cross-chain configuration
  const createVault = useCallback(async (
    riskProfile: RiskProfile, 
    minDeposit?: number,
    targetChains?: number[]
  ): Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey } | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsCreatingVault(true);
    try {
      const result = await service.createVault(
        riskProfile, 
        minDeposit,
        targetChains
      );
      await refreshData();
      setError(null);
      return result;
    } catch (err: any) {
      console.error('Failed to create vault:', err);
      setError(err.message || 'Failed to create vault');
      return null;
    } finally {
      setIsCreatingVault(false);
    }
  }, [service, refreshData]);

  // Deposit into a vault
  const deposit = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number, mintAddress: PublicKey): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsDepositing(true);
    try {
      const tx = await service.deposit(vault.publicKey, amount, mintAddress);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to deposit:', err);
      setError(err.message || 'Failed to deposit');
      return null;
    } finally {
      setIsDepositing(false);
    }
  }, [service, refreshData]);

  // Deposit SOL into a vault
  const depositSol = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsDepositing(true);
    try {
      const tx = await service.depositSol(vault.publicKey, amount);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to deposit SOL:', err);
      setError(err.message || 'Failed to deposit SOL');
      return null;
    } finally {
      setIsDepositing(false);
    }
  }, [service, refreshData]);

  // Withdraw from a vault
  const withdraw = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number, mintAddress: PublicKey): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsWithdrawing(true);
    try {
      const tx = await service.withdraw(vault.publicKey, amount, mintAddress);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to withdraw:', err);
      setError(err.message || 'Failed to withdraw');
      return null;
    } finally {
      setIsWithdrawing(false);
    }
  }, [service, refreshData]);

  // Withdraw SOL from a vault
  const withdrawSol = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsWithdrawing(true);
    try {
      const tx = await service.withdrawSol(vault.publicKey, amount);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to withdraw SOL:', err);
      setError(err.message || 'Failed to withdraw SOL');
      return null;
    } finally {
      setIsWithdrawing(false);
    }
  }, [service, refreshData]);

  // Deposit USDC into a vault
  const depositUSDC = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsDepositing(true);
    try {
      const tx = await service.depositUSDC(vault.publicKey, amount);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to deposit USDC:', err);
      setError(err.message || 'Failed to deposit USDC');
      return null;
    } finally {
      setIsDepositing(false);
    }
  }, [service, refreshData]);

  // Withdraw USDC from a vault
  const withdrawUSDC = useCallback(async (vault: Vault & { publicKey: PublicKey }, amount: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsWithdrawing(true);
    try {
      const tx = await service.withdrawUSDC(vault.publicKey, amount);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to withdraw USDC:', err);
      setError(err.message || 'Failed to withdraw USDC');
      return null;
    } finally {
      setIsWithdrawing(false);
    }
  }, [service, refreshData]);

  // Query cross-chain yields
  const queryCrossChainYields = useCallback(async (vaultId: number, targetChains?: number[]): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsQuerying(true);
    try {
      const tx = await service.queryCrossChainYields(vaultId, targetChains);
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to query cross-chain yields:', err);
      setError(err.message || 'Failed to query yields');
      return null;
    } finally {
      setIsQuerying(false);
    }
  }, [service]);

  // Rebalance vault to specific chain
  const rebalanceVault = useCallback(async (vaultId: number, targetChain: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsRebalancing(true);
    try {
      const tx = await service.rebalanceVault(vaultId, targetChain);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to rebalance vault:', err);
      setError(err.message || 'Failed to rebalance vault');
      return null;
    } finally {
      setIsRebalancing(false);
    }
  }, [service, refreshData]);

  // Update vault configuration
  const updateVaultConfig = useCallback(async (vaultId: number, config: any): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const tx = await service.updateVaultConfig(vaultId, config);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to update vault config:', err);
      setError(err.message || 'Failed to update vault config');
      return null;
    }
  }, [service, refreshData]);

  // Handle LayerZero lz_receive for incoming cross-chain messages
  const handleLzReceive = useCallback(async (srcChainId: number, payload: Uint8Array, vaultId: number): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const tx = await service.handleLzReceive(srcChainId, payload, vaultId);
      await refreshData();
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to handle LayerZero receive:', err);
      setError(err.message || 'Failed to handle LayerZero receive');
      return null;
    }
  }, [service, refreshData]);

  // Get LayerZero receive types for account resolution
  const getLzReceiveTypes = useCallback(async (srcChainId: number, vaultId: number): Promise<{ accounts: PublicKey[]; accountMetas: any[] } | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const result = await service.getLzReceiveTypes(srcChainId, vaultId);
      setError(null);
      return result;
    } catch (err: any) {
      console.error('Failed to get LayerZero receive types:', err);
      setError(err.message || 'Failed to get LayerZero receive types');
      return null;
    }
  }, [service]);

  // Configure LayerZero peer for cross-chain communication
  const configureLzPeer = useCallback(async (dstChainId: number, peerAddress: string): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const tx = await service.configureLzPeer(dstChainId, peerAddress);
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to configure LayerZero peer:', err);
      setError(err.message || 'Failed to configure LayerZero peer');
      return null;
    }
  }, [service]);

  // Check if LayerZero peer is configured
  const isLzPeerConfigured = useCallback((chainId: number, peerAddress: string): boolean => {
    if (!service) return false;
    return service.isLzPeerConfigured(chainId, peerAddress);
  }, [service]);

  // Estimate LayerZero fees for cross-chain operations
  const estimateLzFees = useCallback(async (dstChainId: number, messageSize: number, payInLzToken: boolean = false): Promise<{ nativeFee: number; lzTokenFee: number } | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const fees = await service.estimateLzFees(dstChainId, messageSize, payInLzToken);
      setError(null);
      return fees;
    } catch (err: any) {
      console.error('Failed to estimate LayerZero fees:', err);
      setError(err.message || 'Failed to estimate LayerZero fees');
      return null;
    }
  }, [service]);

  // Add cross-chain message listener
  const onCrossChainMessage = useCallback((chainId: number, callback: (message: CrossChainMessage) => void): (() => void) => {
    if (!service) {
      console.warn('Service not available for cross-chain message listener');
      return () => {}; // Return empty cleanup function
    }

    try {
      return service.onCrossChainMessage(chainId, callback);
    } catch (err: unknown) {
      console.error('Failed to add cross-chain message listener:', err);
      return () => {}; // Return empty cleanup function
    }
  }, [service]);

  // Select a vault and load its data
  const selectVault = useCallback(async (vault: Vault & { publicKey: PublicKey }) => {
    setSelectedVault(vault);
    await loadVaultData(vault.id.toNumber());
  }, [loadVaultData]);

  // Get chain name helper
  const getChainName = useCallback((chainId: number): string => {
    return service?.getChainName(chainId) || `Chain ${chainId}`;
  }, [service]);

  // Request airdrop for testing (devnet/testnet only)
  const requestAirdrop = useCallback(async (): Promise<string | null> => {
    if (!service || !publicKey) {
      setError('Service not available or wallet not connected');
      return null;
    }

    try {
      // Request 2 SOL airdrop
      const signature = await service.provider.connection.requestAirdrop(
        publicKey,
        2 * 1e9 // 2 SOL in lamports
      );
      
      // Wait for confirmation
      await service.provider.connection.confirmTransaction(signature);
      
      // Refresh balance after airdrop
      await refreshBalance();
      
      setError(null);
      return signature;
    } catch (err: any) {
      console.error('Failed to request airdrop:', err);
      setError(err.message || 'Failed to request airdrop. This only works on devnet/testnet.');
      return null;
    }
  }, [service, publicKey, refreshBalance]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, []);

  return {
    // Service instance
    service,
    
    // Loading states
    loading,
    isInitializing,
    isCreatingVault,
    isDepositing,
    isWithdrawing,
    isQuerying,
    isRebalancing,
    
    // Data states
    vaultStore,
    userVaults,
    selectedVault,
    userPosition,
    yieldTracker,
    
    // Balance information
    userSolBalance,
    minSolForVaultCreation,
    
    // Cross-chain data
    chainYields,
    bestChain,
    
    // Actions
    initialize,
    createVault,
    deposit,
    withdraw,
    depositSol,
    withdrawSol,
    depositUSDC,
    withdrawUSDC,
    selectVault,
    refreshData,
    
    // Cross-chain operations
    queryCrossChainYields,
    rebalanceVault,
    updateVaultConfig,
    
    // LayerZero operations
    handleLzReceive,
    getLzReceiveTypes,
    configureLzPeer,
    isLzPeerConfigured,
    estimateLzFees,
    onCrossChainMessage,
    
    // Balance utilities
    refreshBalance,
    requestAirdrop,
    
    // Real-time events
    recentEvents,
    
    // Helper functions
    getChainName,
    
    // Error handling
    error,
    clearError,
  };
}; 