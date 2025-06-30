import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { 
  OmniVaultService, 
  Vault, 
  UserPosition, 
  VaultStore, 
  RiskProfile 
} from '../services/omnivault';
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
  
  // Data states
  vaultStore: VaultStore | null;
  userVaults: Vault[];
  selectedVault: Vault | null;
  userPosition: UserPosition | null;
  
  // Actions
  initialize: () => Promise<string | null>;
  createVault: (riskProfile: RiskProfile, minDeposit?: number) => Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey } | null>;
  deposit: (vaultId: number, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  withdraw: (vaultId: number, amount: number, mintAddress: PublicKey) => Promise<string | null>;
  selectVault: (vault: Vault) => void;
  refreshData: () => Promise<void>;
  
  // Cross-chain operations
  sendCrossChainMessage: (vaultId: number, destinationChainId: number, message: Buffer) => Promise<string | null>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useOmniVault = (): UseOmniVaultReturn => {
  const { connection } = useConnection();
  const { wallet, publicKey, connected } = useWallet();
  
  // Service instance
  const [service, setService] = useState<OmniVaultService | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Data states
  const [vaultStore, setVaultStore] = useState<VaultStore | null>(null);
  const [userVaults, setUserVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Initialize service when wallet connects
  useEffect(() => {
    if (connected && wallet && publicKey) {
      try {
        const provider = new AnchorProvider(
          connection,
          wallet.adapter as any,
          AnchorProvider.defaultOptions()
        );
        
        const omniVaultService = createOmniVaultService(provider);
        setService(omniVaultService);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize OmniVault service:', err);
        setError('Failed to initialize OmniVault service');
      }
    } else {
      setService(null);
      setVaultStore(null);
      setUserVaults([]);
      setSelectedVault(null);
      setUserPosition(null);
    }
  }, [connected, wallet, publicKey, connection]);

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
      
      // If we have a selected vault, refresh its position
      if (selectedVault) {
        const [vaultAddress] = service.getVaultPDA(selectedVault.owner, selectedVault.id.toNumber());
        const position = await service.getUserPosition(publicKey, vaultAddress);
        setUserPosition(position);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  }, [service, publicKey, selectedVault]);

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

  // Create a new vault
  const createVault = useCallback(async (riskProfile: RiskProfile, minDeposit?: number): Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey } | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    setIsCreatingVault(true);
    try {
      const result = await service.createVault(riskProfile, minDeposit);
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

  // Send cross-chain message
  const sendCrossChainMessage = useCallback(async (vaultId: number, destinationChainId: number, message: Buffer): Promise<string | null> => {
    if (!service) {
      setError('Service not available');
      return null;
    }

    try {
      const tx = await service.sendCrossChainMessage(vaultId, destinationChainId, message);
      setError(null);
      return tx;
    } catch (err: any) {
      console.error('Failed to send cross-chain message:', err);
      setError(err.message || 'Failed to send cross-chain message');
      return null;
    }
  }, [service]);

  // Select a vault and load its position
  const selectVault = useCallback(async (vault: Vault) => {
    setSelectedVault(vault);
    
    if (service && publicKey) {
      try {
        const [vaultAddress] = service.getVaultPDA(vault.owner, vault.id.toNumber());
        const position = await service.getUserPosition(publicKey, vaultAddress);
        setUserPosition(position);
      } catch (err) {
        console.error('Failed to load user position:', err);
        setUserPosition(null);
      }
    }
  }, [service, publicKey]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
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
    
    // Data states
    vaultStore,
    userVaults,
    selectedVault,
    userPosition,
    
    // Actions
    initialize,
    createVault,
    deposit,
    withdraw,
    selectVault,
    refreshData,
    
    // Cross-chain operations
    sendCrossChainMessage,
    
    // Error handling
    error,
    clearError,
  };
}; 