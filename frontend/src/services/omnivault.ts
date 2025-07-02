import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, BN, EventParser } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { IDL } from '../idl/omnivault';

// Program ID from the IDL
export const OMNIVAULT_PROGRAM_ID = new PublicKey('HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4');
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

// Risk profile enum
export enum RiskProfile {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive'
}

// Type definitions based on the enhanced IDL
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
  riskProfile: RiskProfile;
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
  targetChains: number[];
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
  private program: Program;
  private connection: Connection;
  private provider: AnchorProvider;
  private eventParser: EventParser;
  private eventListeners: Map<string, number> = new Map();

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.connection = provider.connection;
    this.program = new Program(IDL, OMNIVAULT_PROGRAM_ID, provider);
    this.eventParser = new EventParser(this.program.programId, this.program.coder);
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

  // Utility function to get yield tracker PDA
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
  async initialize() {
    const [vaultStore] = this.getVaultStorePDA();
    const authority = this.provider.wallet.publicKey;

    try {
      const tx = await this.program.methods
        .initialize()
        .accounts({
          vaultStore,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing vault store:', error);
      throw error;
    }
  }

  // Create a new vault with cross-chain configuration
  async createVault(
    riskProfile: RiskProfile, 
    minDeposit: number = 1000000, // Default 1 SOL minimum
    targetChains: number[] = [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM]
  ) {
    const owner = this.provider.wallet.publicKey;
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get the current vault count to determine the next vault ID
    const vaultStoreAccount = await this.program.account.vaultStore.fetch(vaultStore);
    const vaultId = vaultStoreAccount.totalVaults.toNumber();
    
    const [vault] = this.getVaultPDA(owner, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);

    try {
      const tx = await this.program.methods
        .createVault(
          { [riskProfile.toLowerCase()]: {} }, 
          new BN(minDeposit),
          targetChains
        )
        .accounts({
          vault,
          yieldTracker,
          vaultStore,
          owner,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, vaultId, vaultAddress: vault };
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  }

  // Deposit tokens into a vault
  async deposit(vaultId: number, amount: number, mintAddress: PublicKey) {
    const user = this.provider.wallet.publicKey;
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
          userPosition,
          vaultStore,
          user,
          userTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }

  // Withdraw tokens from a vault
  async withdraw(vaultId: number, amount: number, mintAddress: PublicKey) {
    const user = this.provider.wallet.publicKey;
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
          userPosition,
          vaultStore,
          user,
          userTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  // Query cross-chain yields for optimization
  async queryCrossChainYields(vaultId: number, targetChains?: number[]) {
    const user = this.provider.wallet.publicKey;
    const [vault] = this.getVaultPDA(user, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);
    
    // Use vault's target chains if not specified
    if (!targetChains) {
      const vaultAccount = await this.program.account.vault.fetch(vault);
      targetChains = vaultAccount.targetChains;
    }
    
    // LayerZero specific accounts (these would need to be configured)
    const endpoint = LAYERZERO_ENDPOINT_ID;
    const oappConfig = vault; // Simplified - in practice this would be a separate account

    try {
      const tx = await this.program.methods
        .queryCrossChainYields(targetChains)
        .accounts({
          vault,
          yieldTracker,
          endpoint,
          oappConfig,
          payer: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error querying cross-chain yields:', error);
      throw error;
    }
  }

  // Manual rebalance vault to specific chain
  async rebalanceVault(vaultId: number, targetChain: number) {
    const user = this.provider.wallet.publicKey;
    const [vault] = this.getVaultPDA(user, vaultId);
    const [vaultStore] = this.getVaultStorePDA();

    try {
      const tx = await this.program.methods
        .rebalanceVault(targetChain)
        .accounts({
          vault,
          vaultStore,
          authority: user,
        })
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
      newRebalanceThreshold?: number;
      newTargetChains?: number[];
    }
  ) {
    const user = this.provider.wallet.publicKey;
    const [vault] = this.getVaultPDA(user, vaultId);

    try {
      const tx = await this.program.methods
        .updateVaultConfig(
          config.newMinDeposit ? new BN(config.newMinDeposit) : null,
          config.newActiveStatus ?? null,
          config.newRebalanceThreshold ? new BN(config.newRebalanceThreshold) : null,
          config.newTargetChains ?? null
        )
        .accounts({
          vault,
          owner: user,
        })
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
      const account = await this.program.account.vaultStore.fetch(vaultStore);
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
      const account = await this.program.account.vault.fetch(vault);
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
      const account = await this.program.account.userPosition.fetch(userPosition);
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
      const account = await this.program.account.yieldTracker.fetch(yieldTracker);
      return account as YieldTracker;
    } catch (error) {
      console.error('Error fetching yield tracker:', error);
      return null;
    }
  }

  // Fetch all vaults for a user
  async getUserVaults(user: PublicKey): Promise<Vault[]> {
    try {
      const vaults = await this.program.account.vault.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: user.toBase58(),
          },
        },
      ]);
      
      return vaults.map(vault => vault.account as Vault);
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

  // Real-time event listeners
  onVaultCreated(callback: (event: VaultCreatedEvent) => void): () => void {
    const listenerId = this.program.addEventListener('VaultCreated', callback);
    this.eventListeners.set('VaultCreated', listenerId);
    return () => this.removeEventListener('VaultCreated');
  }

  onDepositMade(callback: (event: DepositMadeEvent) => void): () => void {
    const listenerId = this.program.addEventListener('DepositMade', callback);
    this.eventListeners.set('DepositMade', listenerId);
    return () => this.removeEventListener('DepositMade');
  }

  onYieldDataReceived(callback: (event: YieldDataReceivedEvent) => void): () => void {
    const listenerId = this.program.addEventListener('YieldDataReceived', callback);
    this.eventListeners.set('YieldDataReceived', listenerId);
    return () => this.removeEventListener('YieldDataReceived');
  }

  onRebalanceTriggered(callback: (event: RebalanceTriggeredEvent) => void): () => void {
    const listenerId = this.program.addEventListener('RebalanceTriggered', callback);
    this.eventListeners.set('RebalanceTriggered', listenerId);
    return () => this.removeEventListener('RebalanceTriggered');
  }

  // Remove event listener
  removeEventListener(eventName: string): void {
    const listenerId = this.eventListeners.get(eventName);
    if (listenerId !== undefined) {
      this.program.removeEventListener(listenerId);
      this.eventListeners.delete(eventName);
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
    return this.program.account.vault.subscribe(vault, 'confirmed').on('change', callback);
  }

  subscribeToUserPosition(userPosition: PublicKey, callback: (account: UserPosition) => void) {
    return this.program.account.userPosition.subscribe(userPosition, 'confirmed').on('change', callback);
  }

  subscribeToYieldTracker(yieldTracker: PublicKey, callback: (account: YieldTracker) => void) {
    return this.program.account.yieldTracker.subscribe(yieldTracker, 'confirmed').on('change', callback);
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
}; 