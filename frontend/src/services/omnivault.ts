import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { IDL, OmnivaultIDL } from '../idl/omnivault';

// Program ID from the IDL
export const OMNIVAULT_PROGRAM_ID = new PublicKey('66bzWSC6dWFKdAZDcdj7wbjHZ6YWBHB4o77tbP3twVnd');
export const LAYERZERO_ENDPOINT_ID = new PublicKey('H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp');

// Chain IDs for cross-chain operations
export const CHAIN_IDS = {
  ETHEREUM: 101,
  ARBITRUM: 110,
  POLYGON: 109,
  BSC: 102,
  AVALANCHE: 106,
  OPTIMISM: 111,
} as const;

// Risk profile enum that matches the IDL
export const RiskProfile = {
  Conservative: 'conservative',
  Moderate: 'moderate',
  Aggressive: 'aggressive'
} as const;

export type RiskProfile = typeof RiskProfile[keyof typeof RiskProfile];

// Type definitions based on the actual IDL structure
export interface VaultStore {
  authority: PublicKey;
  totalVaults: BN;
  totalTvl: BN;
  feeRate: number;
  bump: number;
  lastGlobalRebalance: BN;
  emergencyPause: boolean;
  supportedChains: number[];
}

export interface Vault {
  id: BN;
  owner: PublicKey;
  riskProfile: { [key: string]: {} }; // IDL enum structure
  totalDeposits: BN;
  totalYield: BN;
  minDeposit: BN;
  isActive: boolean;
  lastRebalance: BN;
  targetChains: number[];
  currentBestChain: number;
  currentApy: BN;
  rebalanceThreshold: BN;
  emergencyExit: boolean;
  bump: number;
}

export interface UserPosition {
  user: PublicKey;
  vault: PublicKey;
  amount: BN;
  lastDeposit: BN;
  lastWithdrawal: BN;
  bump: number;
}

export interface YieldTracker {
  vault: PublicKey;
  chainYields: ChainYield[];
  lastUpdate: BN;
  queryNonce: BN;
  bump: number;
}

export interface ChainYield {
  chainId: number;
  apy: BN;
  tvl: BN;
  riskScore: BN;
  lastUpdated: BN;
}

// Event types for real-time updates
export interface VaultCreatedEvent {
  vaultId: BN;
  owner: PublicKey;
  riskProfile: RiskProfile;
  targetChains?: number[];
}

export interface DepositMadeEvent {
  vaultId: BN;
  user: PublicKey;
  amount: BN;
  newTotal: BN;
}

export interface YieldDataReceivedEvent {
  vaultId: BN;
  chainId: number;
  apy: BN;
  tvl: BN;
  riskScore: BN;
}

export interface RebalanceTriggeredEvent {
  vaultId: BN;
  fromChain: number;
  toChain: number;
  yieldImprovement: BN;
}

export class OmniVaultService {
  private program: Program<OmnivaultIDL>;
  private provider: AnchorProvider;
  private eventListeners: Map<string, number> = new Map();

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(IDL, provider);
  }

  // Utility function to get vault store PDA
  getVaultStorePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault_store')],
      OMNIVAULT_PROGRAM_ID
    );
  }

  // Utility function to get vault PDA
  getVaultPDA(owner: PublicKey, vaultId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('vault'),
        owner.toBuffer(),
        new BN(vaultId).toArrayLike(Buffer, 'le', 8)
      ],
      OMNIVAULT_PROGRAM_ID
    );
  }

  // Utility function to get user position PDA
  getUserPositionPDA(user: PublicKey, vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        vault.toBuffer(),
        user.toBuffer()
      ],
      OMNIVAULT_PROGRAM_ID
    );
  }

  // Utility function to get yield tracker PDA (if available in the program)
  getYieldTrackerPDA(vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('yield_tracker'),
        vault.toBuffer()
      ],
      OMNIVAULT_PROGRAM_ID
    );
  }

  // Initialize the vault store (one-time setup)
  async initialize(): Promise<string> {
    const [vaultStore] = this.getVaultStorePDA();
    const authority = this.provider.wallet.publicKey;

    if (!authority) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.program.methods
        .initialize()
        .accounts({
          vault_store: vaultStore,
          authority,
          system_program: SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing vault store:', error);
      throw error;
    }
  }

  // Create a new vault - with target chains support
  async createVault(
    riskProfile: RiskProfile, 
    minDeposit: number = 1000000, // Default 1 SOL minimum
    targetChains: number[] = [101, 110] // Default to Ethereum and Arbitrum
  ): Promise<{ tx: string; vaultId: number; vaultAddress: PublicKey }> {
    const owner = this.provider.wallet.publicKey;
    
    if (!owner) {
      throw new Error('Wallet not connected');
    }

    const [vaultStore] = this.getVaultStorePDA();
    
    // Get the current vault count to determine the next vault ID
    const vaultStoreAccount = await (this.program.account as any).vaultStore.fetch(vaultStore);
    const vaultId = (vaultStoreAccount as any).totalVaults.toNumber();
    
    const [vault] = this.getVaultPDA(owner, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);

    try {
      // Convert enum to IDL format
      const riskProfileIDL = { [riskProfile]: {} };

      const tx = await this.program.methods
        .create_vault(
          riskProfileIDL, 
          new BN(minDeposit),
          targetChains
        )
        .accounts({
          vault,
          yield_tracker: yieldTracker,
          vault_store: vaultStore,
          owner,
          system_program: SystemProgram.programId,
        } as any)
        .rpc();

      return { tx, vaultId, vaultAddress: vault };
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  }

  // Deposit tokens into a vault
  async deposit(vaultId: number, amount: number, mintAddress: PublicKey): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const vaultOwner = user; // For simplicity, assuming user owns the vault
    
    const [vault] = this.getVaultPDA(vaultOwner, vaultId);
    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      const tx = await this.program.methods
        .deposit(new BN(amount))
        .accounts({
          vault,
          user_position: userPosition,
          vault_store: vaultStore,
          user,
          user_token_account: userTokenAccount,
          vault_token_account: vaultTokenAccount,
          token_program: TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }

  // Withdraw tokens from a vault
  async withdraw(vaultId: number, amount: number, mintAddress: PublicKey): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const vaultOwner = user; // For simplicity, assuming user owns the vault
    
    const [vault] = this.getVaultPDA(vaultOwner, vaultId);
    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      const tx = await this.program.methods
        .withdraw(new BN(amount))
        .accounts({
          vault,
          user_position: userPosition,
          vault_store: vaultStore,
          user,
          user_token_account: userTokenAccount,
          vault_token_account: vaultTokenAccount,
          token_program: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  // Query cross-chain yields for optimization
  async queryCrossChainYields(vaultId: number, targetChains?: number[]): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);
    
    // LayerZero specific accounts (these would need to be configured)
    const endpoint = LAYERZERO_ENDPOINT_ID;
    const oappConfig = vault; // Simplified - in practice this would be a separate account

    try {
      const tx = await this.program.methods
        .query_cross_chain_yields(targetChains || [101, 110])
        .accounts({
          vault,
          yield_tracker: yieldTracker,
          endpoint,
          oapp_config: oappConfig,
          payer: user,
          system_program: SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error querying cross-chain yields:', error);
      throw error;
    }
  }

  // Manual rebalance vault to specific chain
  async rebalanceVault(vaultId: number, targetChain: number): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [vaultStore] = this.getVaultStorePDA();

    try {
      const tx = await this.program.methods
        .rebalance_vault(targetChain)
        .accounts({
          vault,
          vault_store: vaultStore,
          authority: user,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error rebalancing vault:', error);
      throw error;
    }
  }

  // Update vault configuration
  async updateVaultConfig(
    vaultId: number,
    config: {
      newMinDeposit?: number;
      newActiveStatus?: boolean;
    }
  ): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [vault] = this.getVaultPDA(user, vaultId);

    try {
      const tx = await this.program.methods
        .update_vault_config(
          config.newMinDeposit ? new BN(config.newMinDeposit) : null,
          config.newActiveStatus ?? null,
          null, // rebalance_threshold
          null  // target_chains
        )
        .accounts({
          vault,
          owner: user,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating vault config:', error);
      throw error;
    }
  }

  // Fetch vault store data
  async getVaultStore(): Promise<VaultStore | null> {
    try {
      const [vaultStore] = this.getVaultStorePDA();
      const account = await (this.program.account as any).vaultStore.fetch(vaultStore);
      return account as VaultStore;
    } catch (error) {
      console.error('Error fetching vault store:', error);
      return null;
    }
  }

  // Fetch vault data
  async getVault(owner: PublicKey, vaultId: number): Promise<Vault | null> {
    try {
      const [vault] = this.getVaultPDA(owner, vaultId);
      const account = await (this.program.account as any).vault.fetch(vault);
      return account as Vault;
    } catch (error) {
      console.error('Error fetching vault:', error);
      return null;
    }
  }

  // Fetch user position data
  async getUserPosition(user: PublicKey, vault: PublicKey): Promise<UserPosition | null> {
    try {
      const [userPosition] = this.getUserPositionPDA(user, vault);
      const account = await (this.program.account as any).userPosition.fetch(userPosition);
      return account as UserPosition;
    } catch (error) {
      console.error('Error fetching user position:', error);
      return null;
    }
  }

  // Fetch yield tracker data
  async getYieldTracker(vault: PublicKey): Promise<YieldTracker | null> {
    try {
      const [yieldTracker] = this.getYieldTrackerPDA(vault);
      const account = await (this.program.account as any).yieldTracker.fetch(yieldTracker);
      return account as YieldTracker;
    } catch (error) {
      console.error('Error fetching yield tracker:', error);
      return null;
    }
  }

  // Fetch all vaults for a user
  async getUserVaults(user: PublicKey): Promise<Vault[]> {
    try {
      const vaults = await (this.program.account as any).vault.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: user.toBase58(),
          },
        },
      ]);
      
      return vaults.map((vault: any) => vault.account as Vault);
    } catch (error) {
      console.error('Error fetching user vaults:', error);
      return [];
    }
  }

  // Get chain name from ID
  getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      [CHAIN_IDS.ETHEREUM]: 'Ethereum',
      [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
      [CHAIN_IDS.POLYGON]: 'Polygon',
      [CHAIN_IDS.BSC]: 'BSC',
      [CHAIN_IDS.AVALANCHE]: 'Avalanche',
      [CHAIN_IDS.OPTIMISM]: 'Optimism',
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  // Event listeners (simplified for now)
  onVaultCreated(): () => void {
    // TODO: Implement event listening
    return () => {};
  }

  onDepositMade(): () => void {
    // TODO: Implement event listening
    return () => {};
  }

  onYieldDataReceived(): () => void {
    // TODO: Implement event listening
    return () => {};
  }

  onRebalanceTriggered(): () => void {
    // TODO: Implement event listening
    return () => {};
  }

  // Remove event listener
  removeEventListener(eventName: string): void {
    const listenerId = this.eventListeners.get(eventName);
    if (listenerId !== undefined) {
      try {
        this.program.removeEventListener(listenerId);
        this.eventListeners.delete(eventName);
      } catch (error) {
        console.error('Error removing event listener:', error);
      }
    }
  }

  // Remove all event listeners
  removeAllEventListeners(): void {
    for (const [eventName] of this.eventListeners) {
      this.removeEventListener(eventName);
    }
  }

  // Subscribe to account changes (for real-time updates)
  subscribeToVault(vault: PublicKey, callback: (account: Vault) => void) {
    try {
      return (this.program.account as any).vault.subscribe(vault, 'confirmed').on('change', callback);
    } catch (error) {
      console.error('Error subscribing to vault:', error);
      return null;
    }
  }

  subscribeToUserPosition(userPosition: PublicKey, callback: (account: UserPosition) => void) {
    try {
      return (this.program.account as any).userPosition.subscribe(userPosition, 'confirmed').on('change', callback);
    } catch (error) {
      console.error('Error subscribing to user position:', error);
      return null;
    }
  }

  // Account subscriptions (simplified for now)
  subscribeToYieldTracker(): number {
    // TODO: Implement account subscription
    return 0;
  }

  // Cleanup method
  cleanup(): void {
    this.removeAllEventListeners();
  }
}

// Export a factory function to create the service
export const createOmniVaultService = (provider: AnchorProvider): OmniVaultService => {
  return new OmniVaultService(provider);
}; 