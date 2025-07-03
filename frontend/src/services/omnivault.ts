import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import type { Omnivault } from '../idl/omnivault';
import omnivaultIdl from '../idl/omnivault.json';

// Program ID from the IDL
export const OMNIVAULT_PROGRAM_ID = new PublicKey(omnivaultIdl.address);
export const LAYERZERO_ENDPOINT_ID = new PublicKey('H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp');

// Native SOL mint address
export const NATIVE_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

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

// Type definitions based on the actual generated IDL structure
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
  private program: Program<Omnivault>;
  public provider: AnchorProvider; // Make provider public for airdrop functionality
  private eventListeners: Map<string, number> = new Map();

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(omnivaultIdl as Omnivault, provider);
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
  async initialize(): Promise<string> {
    const [vaultStore] = this.getVaultStorePDA();
    const authority = this.provider.wallet.publicKey;

    if (!authority) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.program.methods
        .initialize()
        .accountsPartial({
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

    // Check user's SOL balance before proceeding
    const userBalance = await this.getUserSolBalance(owner);
    const requiredSol = await this.getMinimumSolForVaultCreation();
    
    if (userBalance < requiredSol) {
      throw new Error(
        `Insufficient SOL balance. You have ${userBalance.toFixed(4)} SOL, but need at least ${requiredSol.toFixed(4)} SOL to create a vault (for rent and transaction fees).`
      );
    }

    const [vaultStore] = this.getVaultStorePDA();
    
    // Get the current vault count to determine the next vault ID
    const vaultStoreAccount = await this.program.account.vaultStore.fetch(vaultStore);
    const vaultId = vaultStoreAccount.totalVaults.toNumber();
    
    const [vault] = this.getVaultPDA(owner, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);

    try {
      // Convert enum to IDL format
      const riskProfileIDL = { [riskProfile]: {} };

      const tx = await this.program.methods
        .createVault(
          riskProfileIDL, 
          new BN(minDeposit),
          targetChains
        )
        .accountsPartial({
          vault,
          yieldTracker,
          vaultStore,
          owner,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, vaultId, vaultAddress: vault };
    } catch (error: any) {
      console.error('Error creating vault:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('insufficient funds') || 
          error?.message?.includes('Attempt to debit an account') ||
          error?.transactionMessage?.includes('Attempt to debit an account')) {
        throw new Error(
          `Insufficient SOL balance. You need at least ${requiredSol.toFixed(4)} SOL to create a vault. Please fund your wallet and try again.`
        );
      }
      
      throw error;
    }
  }

  // Deposit SOL into a vault
  async depositSol(vault: PublicKey, amount: number): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();

    try {
      const tx = await this.program.methods
        .depositSol(new BN(amount))
        .accountsPartial({
          vault,
          userPosition,
          vaultStore,
          user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing SOL:', error);
      throw error;
    }
  }

  // Withdraw SOL from a vault
  async withdrawSol(vault: PublicKey, amount: number): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();

    try {
      const tx = await this.program.methods
        .withdrawSol(new BN(amount))
        .accountsPartial({
          vault,
          userPosition,
          vaultStore,
          user,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error withdrawing SOL:', error);
      throw error;
    }
  }

  // Deposit tokens into a vault
  async deposit(vault: PublicKey, amount: number, mintAddress: PublicKey): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      // Check if vault token account exists, create if needed
      const instructions = [];
      try {
        await getAccount(this.provider.connection, vaultTokenAccount);
      } catch (error) {
        // Account doesn't exist, create it
        instructions.push(
          createAssociatedTokenAccountInstruction(
            user,
            vaultTokenAccount,
            vault,
            mintAddress
          )
        );
      }

      const tx = await this.program.methods
        .deposit(new BN(amount))
        .accountsPartial({
          vault,
          userPosition,
          vaultStore,
          user,
          userTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions(instructions)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }

  // Withdraw tokens from a vault
  async withdraw(vault: PublicKey, amount: number, mintAddress: PublicKey): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [userPosition] = this.getUserPositionPDA(user, vault);
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      const tx = await this.program.methods
        .withdraw(new BN(amount))
        .accountsPartial({
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
        .queryCrossChainYields(targetChains || [101, 110])
        .accountsPartial({
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
  async rebalanceVault(vaultId: number, targetChain: number): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [vaultStore] = this.getVaultStorePDA();

    try {
      const tx = await this.program.methods
        .rebalanceVault(targetChain)
        .accountsPartial({
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
  ): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    const [vault] = this.getVaultPDA(user, vaultId);

    try {
      const tx = await this.program.methods
        .updateVaultConfig(
          config.newMinDeposit ? new BN(config.newMinDeposit) : null,
          config.newActiveStatus ?? null,
          config.newRebalanceThreshold ? new BN(config.newRebalanceThreshold) : null,
          config.newTargetChains ?? null
        )
        .accountsPartial({
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
      // This is expected when user hasn't deposited to this vault yet
      if (error instanceof Error && error.message?.includes('Account does not exist')) {
        console.log(`No user position found for vault ${vault.toBase58()} - user hasn't deposited yet`);
        return null;
      }
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
  async getUserVaults(user: PublicKey): Promise<(Vault & { publicKey: PublicKey })[]> {
    try {
      console.log('Fetching vaults for user:', user.toBase58());
      
      // Try to fetch all vaults first to see what's available
      const allVaults = await this.program.account.vault.all();
      console.log('Total vaults in the system:', allVaults.length);
      
      // In the Vault struct, the owner field is at:
      // 8 bytes (discriminator) + 8 bytes (id) = offset 16
      const vaults = await this.program.account.vault.all([
        {
          memcmp: {
            offset: 16, // Skip discriminator (8) + id field (8)
            bytes: user.toBase58(),
          },
        },
      ]);
      
      console.log(`Found ${vaults.length} vaults for user ${user.toBase58()}`);
      
      // Debug: Log the first few vaults to see their structure
      if (allVaults.length > 0) {
        console.log('Sample vault structure:', allVaults[0]);
      }
      
      // Return vaults with their PublicKey included
      return vaults.map((vault: any) => ({
        ...(vault.account as Vault),
        publicKey: vault.publicKey
      }));
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

  // Helper functions for amount conversion
  solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  }

  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  }

  // Check user's SOL balance
  async getUserSolBalance(publicKey?: PublicKey): Promise<number> {
    const userKey = publicKey || this.provider.wallet.publicKey;
    if (!userKey) {
      throw new Error('Wallet not connected');
    }
    
    const balance = await this.provider.connection.getBalance(userKey);
    return this.lamportsToSol(balance);
  }

  // Calculate minimum SOL required to create a vault (rent + fees)
  async getMinimumSolForVaultCreation(): Promise<number> {
    // Estimate rent for vault account (~1000 bytes) and yield tracker (~800 bytes)
    const vaultRent = await this.provider.connection.getMinimumBalanceForRentExemption(1000);
    const yieldTrackerRent = await this.provider.connection.getMinimumBalanceForRentExemption(800);
    
    // Add some buffer for transaction fees (0.01 SOL should be more than enough)
    const transactionFees = 0.01 * LAMPORTS_PER_SOL;
    
    const totalLamports = vaultRent + yieldTrackerRent + transactionFees;
    return this.lamportsToSol(totalLamports);
  }

  // Event listeners for real-time updates
  onVaultCreated(callback: (event: VaultCreatedEvent) => void): () => void {
    try {
      const listenerId = this.program.addEventListener('vaultCreated', (event) => {
        callback(event as VaultCreatedEvent);
      });
      
      this.eventListeners.set('vaultCreated', listenerId);
      
      return () => this.removeEventListener('vaultCreated');
    } catch (error) {
      console.error('Error setting up vault created listener:', error);
      return () => {};
    }
  }

  onDepositMade(callback: (event: DepositMadeEvent) => void): () => void {
    try {
      const listenerId = this.program.addEventListener('depositMade', (event) => {
        callback(event as DepositMadeEvent);
      });
      
      this.eventListeners.set('depositMade', listenerId);
      
      return () => this.removeEventListener('depositMade');
    } catch (error) {
      console.error('Error setting up deposit made listener:', error);
      return () => {};
    }
  }

  onYieldDataReceived(callback: (event: YieldDataReceivedEvent) => void): () => void {
    try {
      const listenerId = this.program.addEventListener('yieldDataReceived', (event) => {
        callback(event as YieldDataReceivedEvent);
      });
      
      this.eventListeners.set('yieldDataReceived', listenerId);
      
      return () => this.removeEventListener('yieldDataReceived');
    } catch (error) {
      console.error('Error setting up yield data received listener:', error);
      return () => {};
    }
  }

  onRebalanceTriggered(callback: (event: RebalanceTriggeredEvent) => void): () => void {
    try {
      const listenerId = this.program.addEventListener('rebalanceTriggered', (event) => {
        callback(event as RebalanceTriggeredEvent);
      });
      
      this.eventListeners.set('rebalanceTriggered', listenerId);
      
      return () => this.removeEventListener('rebalanceTriggered');
    } catch (error) {
      console.error('Error setting up rebalance triggered listener:', error);
      return () => {};
    }
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
      return this.program.account.vault.subscribe(vault, 'confirmed').on('change', callback);
    } catch (error) {
      console.error('Error subscribing to vault:', error);
      return null;
    }
  }

  subscribeToUserPosition(userPosition: PublicKey, callback: (account: UserPosition) => void) {
    try {
      return this.program.account.userPosition.subscribe(userPosition, 'confirmed').on('change', callback);
    } catch (error) {
      console.error('Error subscribing to user position:', error);
      return null;
    }
  }

  subscribeToYieldTracker(yieldTracker: PublicKey, callback: (account: YieldTracker) => void) {
    try {
      return this.program.account.yieldTracker.subscribe(yieldTracker, 'confirmed').on('change', callback);
    } catch (error) {
      console.error('Error subscribing to yield tracker:', error);
      return null;
    }
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