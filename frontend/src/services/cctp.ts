import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import axios from 'axios';

// CCTP V2 Domain Mappings
export const CCTP_DOMAINS = {
  ETHEREUM: 0,
  AVALANCHE: 1,
  OPTIMISM: 2,
  ARBITRUM: 3,
  BASE: 6,
  POLYGON: 7,
  SOLANA: 5,
  LINEA: 8,
  SONIC: 9,
  WORLD_CHAIN: 10,
} as const;

// Reverse mapping for convenience
export const DOMAIN_TO_CHAIN_NAME: Record<number, string> = {
  0: 'Ethereum',
  1: 'Avalanche',
  2: 'Optimism',
  3: 'Arbitrum',
  5: 'Solana',
  6: 'Base',
  7: 'Polygon',
  8: 'Linea',
  9: 'Sonic',
  10: 'World Chain',
};

// CCTP Contract Addresses (Mainnet)
export const CCTP_CONTRACTS = {
  SOLANA: {
    TOKEN_MESSENGER: new PublicKey('CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd'),
    MESSAGE_TRANSMITTER: new PublicKey('CCTPMpSDSddgCMqcCcTKvCJXPC3PqZFPKrFCTd8Ey3Ks'),
    USDC_MINT: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  },
  ETHEREUM: {
    TOKEN_MESSENGER: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
    MESSAGE_TRANSMITTER: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  ARBITRUM: {
    TOKEN_MESSENGER: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
    MESSAGE_TRANSMITTER: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  // Add other chains as needed
};

// Circle's Attestation Service endpoints
const ATTESTATION_API = {
  MAINNET: 'https://iris-api.circle.com/v1/attestations',
  TESTNET: 'https://iris-api-sandbox.circle.com/v1/attestations',
};

// Fee structure for Fast Transfer (basis points)
export const FAST_TRANSFER_FEES = {
  BASE_FEE: 10, // 0.1%
  PRIORITY_FEE: 5, // 0.05% for Fast Transfer
};

export interface CCTPTransferParams {
  amount: BN;
  sourceDomain: number;
  destinationDomain: number;
  destinationAddress: PublicKey | string;
  destinationCaller?: PublicKey;
  hookData?: Uint8Array;
  useFastTransfer?: boolean;
}

export interface CCTPMessage {
  messageHash: string;
  messageBody: Uint8Array;
  sourceDomain: number;
  destinationDomain: number;
  nonce: BN;
  sender: string;
  recipient: string;
  destinationCaller?: string;
}

export interface Attestation {
  attestation: string;
  status: 'pending' | 'complete' | 'failed';
  timestamp: number;
}

export interface TransferStatus {
  txHash: string;
  sourceChain: string;
  destinationChain: string;
  amount: BN;
  status: 'burning' | 'attesting' | 'minting' | 'complete' | 'failed';
  attestation?: string;
  estimatedTime: number;
  actualTime?: number;
}

export interface HookAction {
  type: 'deposit_vault' | 'rebalance' | 'compound' | 'custom';
  vaultId?: number;
  targetChain?: number;
  data: Uint8Array;
}

export class CCTPService {
  private provider: AnchorProvider;
  private isTestnet: boolean;
  private attestationCache: Map<string, Attestation> = new Map();
  private transferStatusMap: Map<string, TransferStatus> = new Map();
  private messageListeners: Map<string, ((status: TransferStatus) => void)[]> = new Map();

  constructor(provider: AnchorProvider, isTestnet: boolean = false) {
    this.provider = provider;
    this.isTestnet = isTestnet;
  }

  /**
   * Initiate a USDC burn on the source chain for cross-chain transfer
   */
  async burnUSDC(params: CCTPTransferParams): Promise<{ txHash: string; messageHash: string }> {
    console.log('Initiating USDC burn for CCTP transfer:', params);

    // Validate parameters
    if (params.amount.lte(new BN(0))) {
      throw new Error('Invalid transfer amount');
    }

    if (params.sourceDomain === params.destinationDomain) {
      throw new Error('Source and destination domains cannot be the same');
    }

    // For Solana as source
    if (params.sourceDomain === CCTP_DOMAINS.SOLANA) {
      return this.burnUSDCFromSolana(params);
    }

    // For other chains, return placeholder (would need chain-specific implementation)
    throw new Error(`Burning from domain ${params.sourceDomain} not yet implemented`);
  }

  /**
   * Burn USDC from Solana
   */
  private async burnUSDCFromSolana(params: CCTPTransferParams): Promise<{ txHash: string; messageHash: string }> {
    const transaction = new Transaction();

    // Calculate fees
    const feeAmount = this.calculateFees(params.amount, params.useFastTransfer || false);

    // Add burn instruction (simplified - actual implementation would use CCTP program)
    const burnIx = await this.createBurnInstruction(
      params.amount.sub(feeAmount),
      params.destinationDomain,
      params.destinationAddress,
      params.destinationCaller,
      params.hookData
    );

    transaction.add(burnIx);

    // Send transaction
    const txHash = await this.provider.sendAndConfirm(transaction);

    // Calculate message hash for attestation lookup
    const messageHash = this.calculateMessageHash(txHash, params);

    // Track transfer status
    const transferStatus: TransferStatus = {
      txHash,
      sourceChain: DOMAIN_TO_CHAIN_NAME[params.sourceDomain],
      destinationChain: DOMAIN_TO_CHAIN_NAME[params.destinationDomain],
      amount: params.amount,
      status: 'burning',
      estimatedTime: params.useFastTransfer ? 30 : 900, // 30s for Fast, 15 min for Standard
    };

    this.transferStatusMap.set(messageHash, transferStatus);

    // Start attestation polling
    this.pollAttestation(messageHash);

    return { txHash, messageHash };
  }

  /**
   * Create burn instruction for CCTP
   */
  private async createBurnInstruction(
    _amount: BN,
    _destinationDomain: number,
    _destinationAddress: PublicKey | string,
    _destinationCaller?: PublicKey,
    _hookData?: Uint8Array
  ): Promise<any> {
    // This would interact with the actual CCTP TokenMessenger program
    // Simplified for demonstration
    const instruction = SystemProgram.transfer({
      fromPubkey: this.provider.publicKey!,
      toPubkey: CCTP_CONTRACTS.SOLANA.TOKEN_MESSENGER,
      lamports: 0, // Placeholder
    });

    return instruction;
  }

  /**
   * Mint USDC on the destination chain using attestation
   */
  async mintUSDC(
    messageBytes: Uint8Array,
    attestation: string,
    destinationDomain: number
  ): Promise<string> {
    console.log('Minting USDC on destination chain:', destinationDomain);

    if (destinationDomain === CCTP_DOMAINS.SOLANA) {
      return this.mintUSDCOnSolana(messageBytes, attestation);
    }

    throw new Error(`Minting on domain ${destinationDomain} not yet implemented`);
  }

  /**
   * Mint USDC on Solana
   */
  private async mintUSDCOnSolana(
    messageBytes: Uint8Array,
    attestation: string
  ): Promise<string> {
    const transaction = new Transaction();

    // Add receive message instruction
    const receiveIx = await this.createReceiveMessageInstruction(messageBytes, attestation);
    transaction.add(receiveIx);

    // Send transaction
    const txHash = await this.provider.sendAndConfirm(transaction);

    console.log('USDC minted successfully:', txHash);
    return txHash;
  }

  /**
   * Create receive message instruction for CCTP
   */
  private async createReceiveMessageInstruction(
    _messageBytes: Uint8Array,
    _attestation: string
  ): Promise<any> {
    // This would interact with the actual CCTP MessageTransmitter program
    // Simplified for demonstration
    const instruction = SystemProgram.transfer({
      fromPubkey: this.provider.publicKey!,
      toPubkey: CCTP_CONTRACTS.SOLANA.MESSAGE_TRANSMITTER,
      lamports: 0, // Placeholder
    });

    return instruction;
  }

  /**
   * Get attestation from Circle's Attestation Service
   */
  async getAttestation(messageHash: string): Promise<Attestation | null> {
    // Check cache first
    if (this.attestationCache.has(messageHash)) {
      return this.attestationCache.get(messageHash)!;
    }

    try {
      const endpoint = this.isTestnet ? ATTESTATION_API.TESTNET : ATTESTATION_API.MAINNET;
      const response = await axios.get(`${endpoint}/${messageHash}`);

      if (response.data && response.data.attestation) {
        const attestation: Attestation = {
          attestation: response.data.attestation,
          status: 'complete',
          timestamp: Date.now(),
        };

        this.attestationCache.set(messageHash, attestation);
        return attestation;
      }

      return null;
    } catch (error) {
      console.error('Failed to get attestation:', error);
      return null;
    }
  }

  /**
   * Poll for attestation with exponential backoff
   */
  private async pollAttestation(messageHash: string, maxAttempts: number = 60): Promise<void> {
    let attempts = 0;
    let delay = 1000; // Start with 1 second

    const poll = async () => {
      attempts++;

      const attestation = await this.getAttestation(messageHash);

      if (attestation && attestation.status === 'complete') {
        // Update transfer status
        const status = this.transferStatusMap.get(messageHash);
        if (status) {
          status.status = 'minting';
          status.attestation = attestation.attestation;
          this.notifyListeners(messageHash, status);
        }
        return;
      }

      if (attempts >= maxAttempts) {
        const status = this.transferStatusMap.get(messageHash);
        if (status) {
          status.status = 'failed';
          this.notifyListeners(messageHash, status);
        }
        throw new Error('Attestation timeout');
      }

      // Exponential backoff
      delay = Math.min(delay * 1.5, 10000); // Max 10 seconds
      setTimeout(poll, delay);
    };

    poll().catch(console.error);
  }

  /**
   * Calculate fees for CCTP transfer
   */
  calculateFees(amount: BN, useFastTransfer: boolean): BN {
    let feeBps = FAST_TRANSFER_FEES.BASE_FEE;
    if (useFastTransfer) {
      feeBps += FAST_TRANSFER_FEES.PRIORITY_FEE;
    }

    return amount.mul(new BN(feeBps)).div(new BN(10000));
  }

  /**
   * Estimate transfer time based on route and Fast Transfer eligibility
   */
  estimateTransferTime(
    sourceDomain: number,
    destinationDomain: number,
    amount: BN,
    useFastTransfer: boolean
  ): number {
    // Fast Transfer: <30 seconds for eligible routes
    if (useFastTransfer && this.isFastTransferEligible(sourceDomain, destinationDomain, amount)) {
      return 30;
    }

    // Standard Transfer: 10-20 minutes
    return 900; // 15 minutes average
  }

  /**
   * Check if a transfer is eligible for Fast Transfer
   */
  isFastTransferEligible(sourceDomain: number, destinationDomain: number, amount: BN): boolean {
    // Fast Transfer eligibility rules
    const maxFastTransferAmount = new BN(1000000 * 10 ** 6); // $1M USDC
    const supportedRoutes = [
      [CCTP_DOMAINS.ETHEREUM, CCTP_DOMAINS.ARBITRUM],
      [CCTP_DOMAINS.ETHEREUM, CCTP_DOMAINS.OPTIMISM],
      [CCTP_DOMAINS.ETHEREUM, CCTP_DOMAINS.BASE],
      [CCTP_DOMAINS.ARBITRUM, CCTP_DOMAINS.ETHEREUM],
      [CCTP_DOMAINS.ARBITRUM, CCTP_DOMAINS.OPTIMISM],
      // Add more supported Fast Transfer routes
    ];

    const routeSupported = supportedRoutes.some(
      route => 
        (route[0] === sourceDomain && route[1] === destinationDomain) ||
        (route[1] === sourceDomain && route[0] === destinationDomain)
    );

    return routeSupported && amount.lte(maxFastTransferAmount);
  }

  /**
   * Build hook data for automated actions after CCTP transfer
   */
  buildHookData(action: HookAction): Uint8Array {
    // Encode hook action for on-chain execution
    const encoder = new TextEncoder();
    const actionBytes = encoder.encode(JSON.stringify(action));
    
    // Add action type identifier (first byte)
    const hookData = new Uint8Array(actionBytes.length + 1);
    hookData[0] = this.getActionTypeId(action.type);
    hookData.set(actionBytes, 1);

    return hookData;
  }

  /**
   * Get action type ID for hook encoding
   */
  private getActionTypeId(type: HookAction['type']): number {
    const typeMap: Record<HookAction['type'], number> = {
      'deposit_vault': 1,
      'rebalance': 2,
      'compound': 3,
      'custom': 255,
    };
    return typeMap[type] || 0;
  }

  /**
   * Parse hook data from CCTP message
   */
  parseHookData(hookData: Uint8Array): HookAction | null {
    if (!hookData || hookData.length < 2) {
      return null;
    }

    const actionType = hookData[0];
    const dataBytes = hookData.slice(1);
    const decoder = new TextDecoder();

    try {
      const actionData = JSON.parse(decoder.decode(dataBytes));
      return {
        type: this.getActionTypeFromId(actionType),
        ...actionData,
      };
    } catch (error) {
      console.error('Failed to parse hook data:', error);
      return null;
    }
  }

  /**
   * Get action type from ID
   */
  private getActionTypeFromId(id: number): HookAction['type'] {
    const idMap: Record<number, HookAction['type']> = {
      1: 'deposit_vault',
      2: 'rebalance',
      3: 'compound',
      255: 'custom',
    };
    return idMap[id] || 'custom';
  }

  /**
   * Calculate message hash for attestation lookup
   */
  private calculateMessageHash(txHash: string, _params: CCTPTransferParams): string {
    // This would calculate the actual CCTP message hash
    // Simplified for demonstration
    return `0x${txHash.slice(0, 64)}`;
  }

  /**
   * Subscribe to transfer status updates
   */
  onTransferStatus(messageHash: string, callback: (status: TransferStatus) => void): () => void {
    if (!this.messageListeners.has(messageHash)) {
      this.messageListeners.set(messageHash, []);
    }

    const listeners = this.messageListeners.get(messageHash)!;
    listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of status updates
   */
  private notifyListeners(messageHash: string, status: TransferStatus): void {
    const listeners = this.messageListeners.get(messageHash);
    if (listeners) {
      listeners.forEach(callback => callback(status));
    }
  }

  /**
   * Get optimal route for USDC transfer
   */
  getOptimalRoute(
    sourceDomain: number,
    destinationDomain: number,
    amount: BN
  ): {
    route: number[];
    estimatedTime: number;
    estimatedFee: BN;
    useFastTransfer: boolean;
  } {
    // Direct route check
    const directFastEligible = this.isFastTransferEligible(sourceDomain, destinationDomain, amount);
    const directTime = this.estimateTransferTime(sourceDomain, destinationDomain, amount, directFastEligible);
    const directFee = this.calculateFees(amount, directFastEligible);

    // For now, return direct route (multi-hop optimization could be added)
    return {
      route: [sourceDomain, destinationDomain],
      estimatedTime: directTime,
      estimatedFee: directFee,
      useFastTransfer: directFastEligible,
    };
  }

  /**
   * Batch multiple CCTP transfers for efficiency
   */
  async batchTransfers(transfers: CCTPTransferParams[]): Promise<{ txHash: string; messageHashes: string[] }[]> {
    console.log(`Batching ${transfers.length} CCTP transfers`);

    // Group transfers by source domain
    const transfersByDomain = new Map<number, CCTPTransferParams[]>();
    transfers.forEach(transfer => {
      const domain = transfer.sourceDomain;
      if (!transfersByDomain.has(domain)) {
        transfersByDomain.set(domain, []);
      }
      transfersByDomain.get(domain)!.push(transfer);
    });

    // Execute batched transfers per domain
    const results: { txHash: string; messageHashes: string[] }[] = [];

    for (const [domain, domainTransfers] of transfersByDomain) {
      if (domain === CCTP_DOMAINS.SOLANA) {
        // Batch Solana transfers in a single transaction
        const result = await this.batchSolanaTransfers(domainTransfers);
        results.push(result);
      } else {
        // Other chains would have their own batching logic
        for (const transfer of domainTransfers) {
          const result = await this.burnUSDC(transfer);
          results.push({ txHash: result.txHash, messageHashes: [result.messageHash] });
        }
      }
    }

    return results;
  }

  /**
   * Batch Solana CCTP transfers
   */
  private async batchSolanaTransfers(
    transfers: CCTPTransferParams[]
  ): Promise<{ txHash: string; messageHashes: string[] }> {
    const transaction = new Transaction();
    const messageHashes: string[] = [];

    for (const transfer of transfers) {
      const burnIx = await this.createBurnInstruction(
        transfer.amount,
        transfer.destinationDomain,
        transfer.destinationAddress,
        transfer.destinationCaller,
        transfer.hookData
      );
      transaction.add(burnIx);
    }

    const txHash = await this.provider.sendAndConfirm(transaction);

    // Calculate message hashes for all transfers
    transfers.forEach(transfer => {
      const messageHash = this.calculateMessageHash(txHash, transfer);
      messageHashes.push(messageHash);
      
      // Track each transfer
      const transferStatus: TransferStatus = {
        txHash,
        sourceChain: DOMAIN_TO_CHAIN_NAME[transfer.sourceDomain],
        destinationChain: DOMAIN_TO_CHAIN_NAME[transfer.destinationDomain],
        amount: transfer.amount,
        status: 'burning',
        estimatedTime: transfer.useFastTransfer ? 30 : 900,
      };
      this.transferStatusMap.set(messageHash, transferStatus);
      this.pollAttestation(messageHash);
    });

    return { txHash, messageHashes };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.attestationCache.clear();
    this.transferStatusMap.clear();
    this.messageListeners.clear();
  }
}

export const createCCTPService = (provider: AnchorProvider, isTestnet: boolean = false): CCTPService => {
  return new CCTPService(provider, isTestnet);
};
