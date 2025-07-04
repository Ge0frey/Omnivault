import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import type { Omnivault } from '../idl/omnivault';
import omnivaultIdl from '../idl/omnivault.json';
import LayerZeroService, { 
  CrossChainActionType,
  type CrossChainMessage
} from './layerzero';

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
  private layerzeroService: LayerZeroService | null = null;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(omnivaultIdl as Omnivault, provider);
    this.initializeLayerZero();
  }

  // Initialize LayerZero service
  private async initializeLayerZero() {
    try {
      if (!this.provider.publicKey) return;

      // Create OApp configuration for LayerZero
      const oappConfig = {
        endpoint: new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV"),
        defaultGasLimit: 200000,
        defaultMsgValue: 2000000, // 0.002 SOL minimum for Solana
        owner: this.provider.publicKey,
        peers: new Map(),
        trusted: true
      };

      // Initialize peers for supported chains (these would be configured via setPeer)
      const supportedChains = [101, 110, 109, 102, 106, 111]; // Chain IDs from smart contract
      supportedChains.forEach(chainId => {
        // Placeholder peer addresses - these should be set through proper LayerZero configuration
        const placeholderPeer = new PublicKey("11111111111111111111111111111111");
        oappConfig.peers.set(chainId, placeholderPeer);
      });

      this.layerzeroService = new LayerZeroService(this.provider, oappConfig);
    } catch (error) {
      console.error('Failed to initialize LayerZero service:', error);
    }
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

    // Convert SOL to lamports
    const amountLamports = this.solToLamports(amount);

    try {
      const tx = await this.program.methods
        .depositSol(new BN(amountLamports))
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

    // Convert SOL to lamports
    const amountLamports = this.solToLamports(amount);

    try {
      const tx = await this.program.methods
        .withdrawSol(new BN(amountLamports))
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

  // Query cross-chain yields for optimization with proper LayerZero integration
  async queryCrossChainYields(vaultId: number, targetChains?: number[]): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);
    
    // Use proper LayerZero OApp configuration
    const [oappConfig] = this.layerzeroService.getOAppConfigPDA(user);
    const endpoint = new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV");

    const chains = targetChains || [101, 110, 109, 102]; // Default chains

    try {
      // Estimate LayerZero fees for all target chains
      let totalFees = 0;
      for (const chainId of chains) {
        const queryMessage: CrossChainMessage = {
          action: {
            type: CrossChainActionType.YieldQuery,
            vaultId,
            data: {
              riskProfile: 'moderate', // This would come from vault data
              queryNonce: Date.now(),
              requestedChains: chains
            }
          },
          timestamp: Date.now(),
          nonce: Date.now()
        };

        const serializedMessage = Buffer.from(JSON.stringify(queryMessage));
        const fees = await this.layerzeroService.estimateFees(
          chainId,
          serializedMessage.length,
          false // Pay in native SOL
        );
        totalFees += fees.nativeFee;
      }

      console.log(`Estimated LayerZero fees: ${totalFees / LAMPORTS_PER_SOL} SOL`);

      // Check user has enough SOL for fees
      const userBalance = await this.getUserSolBalance(user);
      const requiredBalance = totalFees / LAMPORTS_PER_SOL;
      
      if (userBalance < requiredBalance) {
        throw new Error(`Insufficient SOL balance. Need ${requiredBalance.toFixed(4)} SOL for cross-chain queries`);
      }

      // Execute the cross-chain yield query
      const tx = await this.program.methods
        .queryCrossChainYields(chains)
        .accountsPartial({
          vault,
          yieldTracker,
          endpoint,
          oappConfig,
          payer: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Send LayerZero messages to each target chain
      for (const chainId of chains) {
        try {
          const queryMessage: CrossChainMessage = {
            action: {
              type: CrossChainActionType.YieldQuery,
              vaultId,
              data: {
                riskProfile: 'moderate',
                queryNonce: Date.now(),
                requestedChains: [chainId]
              }
            },
            timestamp: Date.now(),
            nonce: Date.now()
          };

          // Create LayerZero options with proper gas settings
          const options = this.layerzeroService.createLzOptions(chainId);
          
          // Send the message
          await this.layerzeroService.sendMessage(
            chainId,
            queryMessage,
            options,
            false // Pay in native SOL
          );

          console.log(`Sent yield query to chain ${chainId}`);
        } catch (error) {
          console.warn(`Failed to send yield query to chain ${chainId}:`, error);
          // Continue with other chains even if one fails
        }
      }

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

  // Handle LayerZero lz_receive for incoming cross-chain messages
  async handleLzReceive(
    srcChainId: number,
    payload: Uint8Array,
    vaultId: number
  ): Promise<string> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);
    const [oappConfig] = this.layerzeroService.getOAppConfigPDA(user);
    const endpoint = new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV");

    try {
      // First, call our LayerZero service to handle and verify the message
      await this.layerzeroService.handleLzReceive(srcChainId, payload);

      // Then execute the on-chain lz_receive instruction
      const signature = await this.program.methods
        .lzReceive(srcChainId, Buffer.from(payload))
        .accountsPartial({
          vault,
          yieldTracker,
          endpoint,
          oappConfig,
          payer: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`Processed LayerZero message from chain ${srcChainId}`);
      return signature;
    } catch (error) {
      console.error('Error handling LayerZero receive:', error);
      throw error;
    }
  }

  // Get LayerZero receive types for account resolution
  async getLzReceiveTypes(
    srcChainId: number,
    vaultId: number
  ): Promise<{ accounts: PublicKey[]; accountMetas: any[] }> {
    const user = this.provider.wallet.publicKey;
    
    if (!user) {
      throw new Error('Wallet not connected');
    }

    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    const [vault] = this.getVaultPDA(user, vaultId);
    const [yieldTracker] = this.getYieldTrackerPDA(vault);
    const [oappConfig] = this.layerzeroService.getOAppConfigPDA(user);
    const endpoint = new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV");

    try {
      // Execute the lz_receive_types instruction to get account requirements
      await this.program.methods
        .lzReceiveTypes(srcChainId)
        .accountsPartial({
          vault,
          yieldTracker,
          endpoint,
          oappConfig,
          payer: user,
        })
        .rpc();

      // Return the required accounts for lz_receive
      const accounts = [vault, yieldTracker, endpoint, oappConfig, user];
      const accountMetas = accounts.map((pubkey, index) => ({
        pubkey,
        isWritable: index < 2, // vault and yieldTracker are writable
        isSigner: index === 4   // only payer is signer
      }));

      return { accounts, accountMetas };
    } catch (error) {
      console.error('Error getting LayerZero receive types:', error);
      throw error;
    }
  }

  // Configure LayerZero peer for cross-chain communication
  async configureLzPeer(dstChainId: number, peerAddress: string): Promise<string> {
    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    try {
      const peerPubkey = new PublicKey(peerAddress);
      const tx = await this.layerzeroService.setPeer(dstChainId, peerPubkey);
      console.log(`Configured LayerZero peer for chain ${dstChainId}: ${peerAddress}`);
      return tx;
    } catch (error) {
      console.error('Error configuring LayerZero peer:', error);
      throw error;
    }
  }

  // Check if LayerZero peer is configured
  isLzPeerConfigured(chainId: number, peerAddress: string): boolean {
    if (!this.layerzeroService) {
      return false;
    }

    try {
      const peerPubkey = new PublicKey(peerAddress);
      return this.layerzeroService.isPeer(chainId, peerPubkey);
    } catch (error) {
      console.error('Error checking LayerZero peer:', error);
      return false;
    }
  }

  // Estimate LayerZero fees for cross-chain operations
  async estimateLzFees(
    dstChainId: number,
    messageSize: number,
    payInLzToken: boolean = false
  ): Promise<{ nativeFee: number; lzTokenFee: number }> {
    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    try {
      return await this.layerzeroService.estimateFees(dstChainId, messageSize, payInLzToken);
    } catch (error) {
      console.error('Error estimating LayerZero fees:', error);
      throw error;
    }
  }

  // Add cross-chain message listener
  onCrossChainMessage(
    chainId: number,
    callback: (message: CrossChainMessage) => void
  ): () => void {
    if (!this.layerzeroService) {
      throw new Error('LayerZero service not initialized');
    }

    return this.layerzeroService.onMessage(chainId, callback);
  }

  // Get LayerZero service instance
  getLayerZeroService(): LayerZeroService | null {
    return this.layerzeroService;
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
    
    // Cleanup LayerZero service
    if (this.layerzeroService) {
      this.layerzeroService.cleanup();
    }
  }
}

// Export a factory function to create the service
export const createOmniVaultService = (provider: AnchorProvider): OmniVaultService => {
  return new OmniVaultService(provider);
}; 