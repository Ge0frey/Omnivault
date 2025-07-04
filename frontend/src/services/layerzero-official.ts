import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';

// Re-export from our working custom implementation
import LayerZeroService, {
  type CrossChainMessage,
  type OAppConfig
} from './layerzero';

// Custom types that extend the existing ones
export interface EnhancedCrossChainMessage extends CrossChainMessage {
  messageType?: string;
}

export interface EnhancedOAppConfig extends OAppConfig {
  delegate?: PublicKey;
}

// Official LayerZero Service - Currently wraps our custom implementation
// This provides a path for future migration to official SDKs

// Official LayerZero Service - for now, this is just the custom implementation
// In the future, this will be replaced with official SDK implementation
export class OfficialLayerZeroService {
  private service: LayerZeroService;
  private enhancedConfig: EnhancedOAppConfig;

  constructor(provider: AnchorProvider, config: Partial<EnhancedOAppConfig> = {}) {
    // Create base config
    const baseConfig: OAppConfig = {
      endpoint: config.endpoint || new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV"),
      defaultGasLimit: config.defaultGasLimit || 200000,
      defaultMsgValue: config.defaultMsgValue || 2000000,
      owner: config.owner || provider.publicKey!,
      peers: config.peers || new Map(),
      trusted: config.trusted || true,
    };

    // Initialize the custom service
    this.service = new LayerZeroService(provider, baseConfig);

    // Store enhanced config
    this.enhancedConfig = {
      ...baseConfig,
      delegate: config.delegate || provider.publicKey!,
    };
  }

  // Delegate all methods to the custom service
  async initializeOApp(): Promise<string> {
    return await this.service.initializeOApp(this.enhancedConfig.owner);
  }

  async setPeer(dstChainId: number, peerAddress: PublicKey): Promise<string> {
    return await this.service.setPeer(dstChainId, peerAddress);
  }

  isPeer(chainId: number, peerAddress: PublicKey): boolean {
    return this.service.isPeer(chainId, peerAddress);
  }

  async estimateLayerZeroFees(
    dstChainId: number,
    message: EnhancedCrossChainMessage,
    options?: Uint8Array,
    payInLzToken: boolean = false
  ): Promise<{ nativeFee: number; lzTokenFee: number; breakdown?: any }> {
    const payload = JSON.stringify(message);
    const result = await this.service.estimateFees(
      dstChainId,
      payload.length,
      payInLzToken,
      options
    );

    // Add breakdown for enhanced functionality
    const breakdown = {
      baseFee: result.nativeFee * 0.6,
      payloadFee: result.nativeFee * 0.3,
      optionsFee: result.nativeFee * 0.1,
      chainId: dstChainId,
      payloadSize: payload.length,
    };

    return { ...result, breakdown };
  }

  async sendMessage(
    dstChainId: number,
    message: EnhancedCrossChainMessage,
    options?: Uint8Array,
    payInLzToken: boolean = false
  ): Promise<string> {
    return await this.service.sendMessage(dstChainId, message, options, payInLzToken);
  }

  async handleLzReceive(
    srcChainId: number,
    payload: Uint8Array,
    _nonce?: BN
  ): Promise<void> {
    return await this.service.handleLzReceive(srcChainId, payload);
  }

  createLzOptions(dstChainId: number, gasLimit?: number): Uint8Array {
    return this.service.createLzOptions(dstChainId, gasLimit);
  }

  onMessage(
    chainId: number,
    callback: (message: CrossChainMessage) => void
  ): () => void {
    return this.service.onMessage(chainId, callback);
  }

  getChainName(chainId: number): string {
    return this.service.getChainName(chainId);
  }

  getEnhancedConfig(): EnhancedOAppConfig {
    return this.enhancedConfig;
  }

  getLayerZeroService(): LayerZeroService {
    return this.service;
  }

  // Additional methods that are used by OmniVault service
  getOAppConfigPDA(owner: PublicKey): [PublicKey, number] {
    return this.service.getOAppConfigPDA(owner);
  }

  async estimateFees(
    dstChainId: number,
    messageSize: number,
    payInLzToken: boolean = false,
    options?: Uint8Array
  ): Promise<{ nativeFee: number; lzTokenFee: number }> {
    return await this.service.estimateFees(dstChainId, messageSize, payInLzToken, options);
  }

  cleanup(): void {
    this.service.cleanup();
  }
}

// Re-export everything from the base LayerZero service
export * from './layerzero';

// Additional exports for enhanced functionality
export { LayerZeroService };

export default OfficialLayerZeroService; 