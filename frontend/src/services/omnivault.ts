import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { IDL } from '../idl/omnivault';

// Program ID from the IDL
export const OMNIVAULT_PROGRAM_ID = new PublicKey('HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4');
export const LAYERZERO_ENDPOINT_ID = new PublicKey('H3SKp4cL5rpzJDntDa2umKE9AHkGiyss1W8BNDndhHWp');

// Risk profile enum
export enum RiskProfile {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive'
}

// Type definitions based on the IDL
export interface VaultStore {
  authority: PublicKey;
  totalVaults: BN;
  totalTvl: BN;
  feeRate: number;
  bump: number;
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

export class OmniVaultService {
  private program: Program;
  private connection: Connection;
  private provider: AnchorProvider;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.connection = provider.connection;
    this.program = new Program(IDL, OMNIVAULT_PROGRAM_ID, provider);
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

  // Create a new vault
  async createVault(riskProfile: RiskProfile, minDeposit: number = 1000000) { // Default 1 SOL minimum
    const owner = this.provider.wallet.publicKey;
    const [vaultStore] = this.getVaultStorePDA();
    
    // Get the current vault count to determine the next vault ID
    const vaultStoreAccount = await this.program.account.vaultStore.fetch(vaultStore);
    const vaultId = vaultStoreAccount.totalVaults.toNumber();
    
    const [vault] = this.getVaultPDA(owner, vaultId);

    try {
      const tx = await this.program.methods
        .createVault({ [riskProfile.toLowerCase()]: {} }, new BN(minDeposit))
        .accounts({
          vault,
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
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      const tx = await this.program.methods
        .deposit(new BN(amount))
        .accounts({
          vault,
          userPosition,
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
    
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, user);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, vault, true);

    try {
      const tx = await this.program.methods
        .withdraw(new BN(amount))
        .accounts({
          vault,
          userPosition,
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

  // Send cross-chain message via LayerZero
  async sendCrossChainMessage(vaultId: number, destinationChainId: number, message: Buffer) {
    const user = this.provider.wallet.publicKey;
    const [vault] = this.getVaultPDA(user, vaultId);
    
    // LayerZero specific accounts (these would need to be configured)
    const endpoint = LAYERZERO_ENDPOINT_ID;
    const oappConfig = vault; // Simplified - in practice this would be a separate account

    try {
      const tx = await this.program.methods
        .lzSend(destinationChainId, Array.from(message))
        .accounts({
          vault,
          endpoint,
          oappConfig,
          payer: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error sending cross-chain message:', error);
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

  // Subscribe to account changes
  subscribeToVault(vault: PublicKey, callback: (account: Vault) => void) {
    return this.program.account.vault.subscribe(vault, 'confirmed').on('change', callback);
  }

  subscribeToUserPosition(userPosition: PublicKey, callback: (account: UserPosition) => void) {
    return this.program.account.userPosition.subscribe(userPosition, 'confirmed').on('change', callback);
  }
}

// Export a factory function to create the service
export const createOmniVaultService = (provider: AnchorProvider): OmniVaultService => {
  return new OmniVaultService(provider);
}; 