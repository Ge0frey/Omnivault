import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

// LayerZero V2 Constants
export const LAYERZERO_ENDPOINT_PROGRAM_ID = new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV");
export const LAYERZERO_DEVNET_ENDPOINT = "LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV";

// Chain IDs for LayerZero V2
export const CHAIN_IDS = {
  ETHEREUM: 101,
  ARBITRUM: 110,
  POLYGON: 109,
  BSC: 102,
  AVALANCHE: 106,
  OPTIMISM: 111,
  SOLANA: 21,
} as const;

// LayerZero Message Types
export enum CrossChainActionType {
  YieldQuery = 'YieldQuery',
  YieldResponse = 'YieldResponse',
  Rebalance = 'Rebalance',
  EmergencyPause = 'EmergencyPause',
}

export interface CrossChainAction {
  type: CrossChainActionType;
  vaultId: number;
  data: unknown;
}

export interface CrossChainMessage {
  action: CrossChainAction;
  timestamp: number;
  nonce: number;
}

// LayerZero OApp Configuration
export interface OAppConfig {
  endpoint: PublicKey;
  defaultGasLimit: number;
  defaultMsgValue: number;
  owner: PublicKey;
  peers: Map<number, PublicKey>; // chainId -> peer address
  trusted: boolean;
}

// LayerZero Options Builder
export class LayerZeroOptionsBuilder {
  private options: number[] = [];

  static newOptions(): LayerZeroOptionsBuilder {
    return new LayerZeroOptionsBuilder();
  }

  addExecutorLzReceiveOption(gasLimit: number, msgValue: number): LayerZeroOptionsBuilder {
    // LayerZero V2 options format
    // Type (1 byte) + Gas Limit (16 bytes) + Msg Value (16 bytes)
    this.options.push(0x03); // TYPE_3 for LZ_RECEIVE
    
    // Add gas limit (big-endian 16 bytes)
    const gasLimitBytes = new BN(gasLimit).toArray('be', 16);
    this.options.push(...gasLimitBytes);
    
    // Add msg value (big-endian 16 bytes)  
    const msgValueBytes = new BN(msgValue).toArray('be', 16);
    this.options.push(...msgValueBytes);
    
    return this;
  }

  addExecutorNativeDropOption(amount: number, receiver: PublicKey): LayerZeroOptionsBuilder {
    // TYPE_1 for native drop
    this.options.push(0x01);
    
    // Add amount (16 bytes)
    const amountBytes = new BN(amount).toArray('be', 16);
    this.options.push(...amountBytes);
    
    // Add receiver (32 bytes)
    this.options.push(...receiver.toBytes());
    
    return this;
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.options);
  }
}

// LayerZero Account Resolution
export interface LzAccount {
  pubkey: PublicKey;
  isWritable: boolean;
  isSigner: boolean;
}

export class LayerZeroService {
  private connection: Connection;
  private provider: AnchorProvider;
  private oappConfig: OAppConfig;
  private messageListeners: Map<number, ((message: CrossChainMessage) => void)[]> = new Map();

  constructor(provider: AnchorProvider, oappConfig: OAppConfig) {
    this.connection = provider.connection;
    this.provider = provider;
    this.oappConfig = oappConfig;
  }

  // Initialize LayerZero OApp Configuration
  async initializeOApp(owner: PublicKey): Promise<string> {
    const [oappConfigPda] = this.getOAppConfigPDA(owner);
    
    const transaction = new Transaction();
    
    // Create OApp Config Account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: oappConfigPda,
        space: 200, // Adjust based on OApp config size
        lamports: await this.connection.getMinimumBalanceForRentExemption(200),
        programId: LAYERZERO_ENDPOINT_PROGRAM_ID,
      })
    );

    // Initialize OApp configuration
    // This would be a CPI call to LayerZero's initialization function
    // transaction.add(await this.createInitializeOAppInstruction(oappConfigPda, owner));

    const signature = await this.provider.sendAndConfirm(transaction);
    return signature;
  }

  // Get OApp Configuration PDA
  getOAppConfigPDA(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("oapp_config"),
        owner.toBuffer(),
      ],
      LAYERZERO_ENDPOINT_PROGRAM_ID
    );
  }

  // Get LayerZero Send PDA
  getLzSendPDA(sender: PublicKey, dstChainId: number, nonce: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("lz_send"),
        sender.toBuffer(),
        new BN(dstChainId).toArrayLike(Buffer, 'le', 2),
        new BN(nonce).toArrayLike(Buffer, 'le', 8),
      ],
      LAYERZERO_ENDPOINT_PROGRAM_ID
    );
  }

  // Get LayerZero Receive PDA
  getLzReceivePDA(receiver: PublicKey, srcChainId: number, nonce: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("lz_receive"),
        receiver.toBuffer(),
        new BN(srcChainId).toArrayLike(Buffer, 'le', 2),
        new BN(nonce).toArrayLike(Buffer, 'le', 8),
      ],
      LAYERZERO_ENDPOINT_PROGRAM_ID
    );
  }

  // Create LayerZero send options with proper gas settings
  createLzOptions(dstChainId: number, gasLimit?: number, msgValue?: number): Uint8Array {
    const builder = LayerZeroOptionsBuilder.newOptions();
    
    // Set gas limit based on destination chain
    const defaultGasLimit = this.getDefaultGasLimit(dstChainId);
    const defaultMsgValue = this.getDefaultMsgValue(dstChainId);
    
    builder.addExecutorLzReceiveOption(
      gasLimit || defaultGasLimit,
      msgValue || defaultMsgValue
    );
    
    return builder.toBytes();
  }

  // Get default gas limit for chain
  private getDefaultGasLimit(chainId: number): number {
    const gasLimits: Record<number, number> = {
      [CHAIN_IDS.ETHEREUM]: 200_000,
      [CHAIN_IDS.ARBITRUM]: 150_000,
      [CHAIN_IDS.POLYGON]: 100_000,
      [CHAIN_IDS.BSC]: 80_000,
      [CHAIN_IDS.AVALANCHE]: 120_000,
      [CHAIN_IDS.OPTIMISM]: 150_000,
    };
    
    return gasLimits[chainId] || 100_000;
  }

  // Get default message value for chain (in wei/lamports)
  private getDefaultMsgValue(chainId: number): number {
    const msgValues: Record<number, number> = {
      [CHAIN_IDS.ETHEREUM]: 0,
      [CHAIN_IDS.ARBITRUM]: 0,
      [CHAIN_IDS.POLYGON]: 0,
      [CHAIN_IDS.BSC]: 0,
      [CHAIN_IDS.AVALANCHE]: 0,
      [CHAIN_IDS.OPTIMISM]: 0,
      [CHAIN_IDS.SOLANA]: 2_000_000, // 0.002 SOL minimum for Solana
    };
    
    return msgValues[chainId] || 0;
  }

  // Set peer configuration for cross-chain communication
  async setPeer(dstChainId: number, peerAddress: PublicKey): Promise<string> {
    const transaction = new Transaction();
    
    // This would be a CPI call to LayerZero's setPeer function
    // transaction.add(await this.createSetPeerInstruction(oappConfigPda, dstChainId, peerAddress));
    
    // Update local config
    this.oappConfig.peers.set(dstChainId, peerAddress);
    
    const signature = await this.provider.sendAndConfirm(transaction);
    return signature;
  }

  // Check if peer is set for a chain
  isPeer(chainId: number, peerAddress: PublicKey): boolean {
    const configuredPeer = this.oappConfig.peers.get(chainId);
    return configuredPeer?.equals(peerAddress) || false;
  }

  // Estimate LayerZero fees
  async estimateFees(
    dstChainId: number,
    payloadSize: number,
    payInLzToken: boolean = false,
    options?: Uint8Array
  ): Promise<{ nativeFee: number; lzTokenFee: number }> {
    // This would be a CPI call to LayerZero's quote function
    // For now, return estimated fees based on chain and payload size
    const baseFee = this.getBaseFee(dstChainId);
    const payloadFee = payloadSize * 100; // 100 lamports per byte
    const optionsFee = options ? options.length * 50 : 0;
    
    const totalFee = baseFee + payloadFee + optionsFee;
    
    return {
      nativeFee: payInLzToken ? 0 : totalFee,
      lzTokenFee: payInLzToken ? totalFee : 0,
    };
  }

  // Get base fee for chain
  private getBaseFee(chainId: number): number {
    const baseFees: Record<number, number> = {
      [CHAIN_IDS.ETHEREUM]: 100_000, // 0.0001 SOL
      [CHAIN_IDS.ARBITRUM]: 50_000,
      [CHAIN_IDS.POLYGON]: 30_000,
      [CHAIN_IDS.BSC]: 25_000,
      [CHAIN_IDS.AVALANCHE]: 40_000,
      [CHAIN_IDS.OPTIMISM]: 50_000,
    };
    
    return baseFees[chainId] || 50_000;
  }

  // Send cross-chain message
  async sendMessage(
    dstChainId: number,
    message: CrossChainMessage,
    options?: Uint8Array,
    payInLzToken: boolean = false
  ): Promise<string> {
    const transaction = new Transaction();
    
    // Estimate fees
    const payload = this.serializeMessage(message);
    await this.estimateFees(dstChainId, payload.length, payInLzToken, options);
    
    // This would be a CPI call to LayerZero's send function
    // transaction.add(await this.createSendInstruction(
    //   oappConfigPda,
    //   lzSendPda,
    //   dstChainId,
    //   payload,
    //   options,
    //   payInLzToken,
    //   estimatedFees
    // ));
    
    const signature = await this.provider.sendAndConfirm(transaction);
    return signature;
  }

  // Serialize cross-chain message
  private serializeMessage(message: CrossChainMessage): Uint8Array {
    // Use borsh or similar serialization
    return Buffer.from(JSON.stringify(message));
  }

  // Deserialize cross-chain message
  private deserializeMessage(data: Uint8Array): CrossChainMessage {
    return JSON.parse(Buffer.from(data).toString());
  }

  // Handle incoming LayerZero message
  async handleLzReceive(
    srcChainId: number,
    payload: Uint8Array
  ): Promise<void> {
    try {
      const message = this.deserializeMessage(payload);
      
      // Verify message authenticity
      if (!this.verifyMessage(message, srcChainId)) {
        console.error('Message verification failed');
        return;
      }

      // Process the message
      await this.processMessage(message, srcChainId);
      
      // Notify listeners
      this.notifyMessageListeners(srcChainId, message);
      
    } catch (error) {
      console.error('Failed to handle LayerZero receive:', error);
    }
  }

  // Verify incoming message
  private verifyMessage(message: CrossChainMessage, srcChainId: number): boolean {
    // Check if peer is configured for source chain
    if (!this.oappConfig.peers.has(srcChainId)) {
      return false;
    }
    
    // Verify message structure
    if (!message.action || !message.timestamp || !message.nonce) {
      return false;
    }
    
    // Check message timestamp (not too old)
    const now = Date.now();
    if (now - message.timestamp > 300000) { // 5 minutes
      return false;
    }
    
    return true;
  }

  // Process incoming message
  private async processMessage(message: CrossChainMessage, srcChainId: number): Promise<void> {
    switch (message.action.type) {
      case CrossChainActionType.YieldResponse:
        await this.handleYieldResponse(message, srcChainId);
        break;
      case CrossChainActionType.EmergencyPause:
        await this.handleEmergencyPause(message, srcChainId);
        break;
      case CrossChainActionType.Rebalance:
        await this.handleRebalance(message, srcChainId);
        break;
      default:
        console.warn('Unknown message type:', message.action.type);
    }
  }

  // Handle yield response message
  private async handleYieldResponse(message: CrossChainMessage, srcChainId: number): Promise<void> {
    const { vaultId, data } = message.action;
    
    // Emit event for UI updates
    this.emitEvent('yieldDataReceived', {
      vaultId,
      chainId: srcChainId,
      ...(data as Record<string, unknown>)
    });
  }

  // Handle emergency pause message
  private async handleEmergencyPause(message: CrossChainMessage, srcChainId: number): Promise<void> {
    const { vaultId } = message.action;
    
    // Emit event for UI updates
    this.emitEvent('emergencyPauseReceived', {
      vaultId,
      sourceChain: srcChainId,
      timestamp: message.timestamp
    });
  }

  // Handle rebalance message
  private async handleRebalance(message: CrossChainMessage, srcChainId: number): Promise<void> {
    const { vaultId, data } = message.action;
    
    // Emit event for UI updates
    this.emitEvent('rebalanceReceived', {
      vaultId,
      sourceChain: srcChainId,
      ...(data as Record<string, unknown>)
    });
  }

  // Add message listener
  onMessage(chainId: number, callback: (message: CrossChainMessage) => void): () => void {
    if (!this.messageListeners.has(chainId)) {
      this.messageListeners.set(chainId, []);
    }
    
    const listeners = this.messageListeners.get(chainId)!;
    listeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Notify message listeners
  private notifyMessageListeners(chainId: number, message: CrossChainMessage): void {
    const listeners = this.messageListeners.get(chainId) || [];
    listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  // Emit custom events
  private emitEvent(eventName: string, data: unknown): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
  }

  // Get chain name
  getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      [CHAIN_IDS.ETHEREUM]: 'Ethereum',
      [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
      [CHAIN_IDS.POLYGON]: 'Polygon',
      [CHAIN_IDS.BSC]: 'BSC',
      [CHAIN_IDS.AVALANCHE]: 'Avalanche',
      [CHAIN_IDS.OPTIMISM]: 'Optimism',
      [CHAIN_IDS.SOLANA]: 'Solana',
    };
    
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  // Cleanup
  cleanup(): void {
    this.messageListeners.clear();
  }
}

export default LayerZeroService; 