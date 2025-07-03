import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
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
  RebalanceTriggeredEvent,
} from '../services/omnivault';
import { RiskProfile } from '../services/omnivault';
import { createOmniVaultService } from '../services/omnivault';

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
  userVaults: Vault[];
  selectedVault: Vault | null;
  userPosition: UserPosition | null;
  yieldTracker: YieldTracker | null;
  
  // Cross-chain data
  chainYields: ChainYield[];
  bestChain: ChainYield | null;
  
  // Actions
  initialize: () => Promise<string | null>;
  createVault: (riskProfile: RiskProfile, minDeposit?: number, targetChains?: number[]) => Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey } | null>;
  deposit: (vaultId: number, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  withdraw: (vaultId: number, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  selectVault: (vault: Vault) => void;
  refreshData: () => Promise<void>;
  
  // Cross-chain operations
  queryCrossChainYields: (vaultId: number, targetChains?: number[]) => Promise<string | null>;
  rebalanceVault: (vaultId: number, targetChain: number) => Promise<string | null>;
  updateVaultConfig: (vaultId: number, config: any) => Promise<string | null>;
  
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
  const { wallet, publicKey, connected } = useWallet();
  
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
  const [userVaults, setUserVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [yieldTracker, setYieldTracker] = useState<YieldTracker | null>(null);
  
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
    if (connected && wallet && publicKey) {
      try {
        // Cleanup previous service
        if (serviceRef.current) {
          serviceRef.current.cleanup();
        }
        
        const provider = new AnchorProvider(
          connection,
          wallet.adapter as any,
          AnchorProvider.defaultOptions()
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
  }, [connected, wallet, publicKey, connection]);

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

  // Load initial data when service is available
  useEffect(() => {
    if (service && publicKey) {
      refreshData();
    }
  }, [service, publicKey]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!service || !publicKey) return;
    
    setLoading(true);
    try {
      // Load vault store
      const vaultStoreData = await service.getVaultStore();
      setVaultStore(vaultStoreData);
      
      // Load user vaults
      const vaults = await service.getUserVaults(publicKey);
      setUserVaults(vaults);
      
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
  }, [service, publicKey, selectedVault]);

  // Load specific vault data including position and yield tracker
  const loadVaultData = useCallback(async (vaultId: number) => {
    if (!service || !publicKey) return;
    
    try {
      const vault = await service.getVault(publicKey, vaultId);
      if (vault) {
        setSelectedVault(vault);
        
        // Load user position
        const [vaultAddress] = service.getVaultPDA(vault.owner, vault.id.toNumber());
        const position = await service.getUserPosition(publicKey, vaultAddress);
        setUserPosition(position);
        
        // Load yield tracker
        await loadYieldTracker(vaultId);
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    }
  }, [service, publicKey]);

  // Load yield tracker and process chain yields
  const loadYieldTracker = useCallback(async (vaultId: number) => {
    if (!service || !publicKey) return;
    
    try {
      const vault = await service.getVault(publicKey, vaultId);
      if (vault) {
        const [vaultAddress] = service.getVaultPDA(vault.owner, vault.id.toNumber());
        const tracker = await service.getYieldTracker(vaultAddress);
        
        if (tracker) {
          setYieldTracker(tracker);
          setChainYields(tracker.chainYields);
          
          // Find best chain based on vault's risk profile
          const best = findBestChain(tracker.chainYields, vault.riskProfile);
          setBestChain(best);
        }
      }
    } catch (err) {
      console.error('Failed to load yield tracker:', err);
    }
  }, [service, publicKey]);

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
  const deposit = useCallback(async (vaultId: number, amount: number, mintAddress: PublicKey): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsDepositing(true);
    try {
      const tx = await service.deposit(vaultId, amount, mintAddress);
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

  // Withdraw from a vault
  const withdraw = useCallback(async (vaultId: number, amount: number, mintAddress: PublicKey): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsWithdrawing(true);
    try {
      const tx = await service.withdraw(vaultId, amount, mintAddress);
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

  // Select a vault and load its data
  const selectVault = useCallback(async (vault: Vault) => {
    setSelectedVault(vault);
    await loadVaultData(vault.id.toNumber());
  }, [loadVaultData]);

  // Get chain name helper
  const getChainName = useCallback((chainId: number): string => {
    return service?.getChainName(chainId) || `Chain ${chainId}`;
  }, [service]);

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
    
    // Cross-chain data
    chainYields,
    bestChain,
    
    // Actions
    initialize,
    createVault,
    deposit,
    withdraw,
    selectVault,
    refreshData,
    
    // Cross-chain operations
    queryCrossChainYields,
    rebalanceVault,
    updateVaultConfig,
    
    // Real-time events
    recentEvents,
    
    // Helper functions
    getChainName,
    
    // Error handling
    error,
    clearError,
  };
}; 