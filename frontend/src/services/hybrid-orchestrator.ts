import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { CCTPService, CCTP_DOMAINS, CCTPTransferParams, TransferStatus } from './cctp';
import { LayerZeroService, CrossChainActionType } from './layerzero';
import OfficialLayerZeroService from './layerzero-official';
import { AttestationMonitor } from './attestation-monitor';
import { HookBuilder, HookType } from './cctp-hooks';
import { createOmniVaultService, OmniVaultService, RiskProfile } from './omnivault';

export enum TransferProtocol {
  CCTP = 'CCTP',
  LAYERZERO = 'LayerZero',
  AUTO = 'Auto',
}

export interface CrossChainTransfer {
  id: string;
  protocol: TransferProtocol;
  amount: BN;
  token: string;
  sourceChain: string;
  destinationChain: string;
  status: string;
  txHash?: string;
  attestation?: string;
  estimatedTime: number;
  actualTime?: number;
  fees: BN;
}

export interface YieldOpportunity {
  chainId: number;
  chainName: string;
  protocol: string;
  apy: number;
  tvl: BN;
  riskScore: number;
  gasEstimate: number;
  isOptimal: boolean;
}

export interface RebalanceStrategy {
  vaultId: number;
  currentChain: string;
  targetChain: string;
  amount: BN;
  expectedYieldImprovement: number;
  transferProtocol: TransferProtocol;
  estimatedTime: number;
  estimatedFees: BN;
  hooks?: Uint8Array;
}

export class HybridOrchestrator {
  private cctpService: CCTPService;
  private layerzeroService: OfficialLayerZeroService;
  private omnivaultService: OmniVaultService;
  private attestationMonitor: AttestationMonitor;
  private provider: AnchorProvider;
  private isTestnet: boolean;
  
  // Active transfers tracking
  private activeTransfers: Map<string, CrossChainTransfer> = new Map();
  
  // Yield opportunities cache
  private yieldOpportunities: Map<number, YieldOpportunity[]> = new Map();
  private yieldCacheTimeout: number = 300000; // 5 minutes
  private lastYieldUpdate: Map<number, number> = new Map();

  constructor(
    provider: AnchorProvider,
    isTestnet: boolean = false
  ) {
    this.provider = provider;
    this.isTestnet = isTestnet;
    
    // Initialize services
    this.cctpService = new CCTPService(provider, isTestnet);
    this.omnivaultService = createOmniVaultService(provider);
    this.attestationMonitor = new AttestationMonitor(isTestnet);
    
    // Initialize LayerZero with enhanced config
    const lzConfig = {
      endpoint: new PublicKey("LZ1ZeTMZZnKWEcG2ukQpvJE2QnLEyV5uYPVfPjTvZmV"),
      defaultGasLimit: 200000,
      defaultMsgValue: 2000000,
      owner: provider.publicKey!,
      peers: new Map(),
      trusted: true,
    };
    
    this.layerzeroService = new OfficialLayerZeroService(provider, lzConfig);
    
    // Start attestation monitoring
    this.attestationMonitor.start();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for both protocols
   */
  private setupEventListeners(): void {
    // Listen for CCTP transfer status updates
    this.attestationMonitor.on('attestation:complete', (event) => {
      console.log('Attestation complete:', event);
      this.handleAttestationComplete(event);
    });

    this.attestationMonitor.on('attestation:failed', (event) => {
      console.error('Attestation failed:', event);
      this.handleAttestationFailed(event);
    });

    // Listen for LayerZero messages
    Object.values(CCTP_DOMAINS).forEach(domain => {
      if (typeof domain === 'number') {
        const chainId = this.domainToLayerZeroChain(domain);
        if (chainId) {
          this.layerzeroService.onMessage(chainId, (message) => {
            this.handleLayerZeroMessage(chainId, message);
          });
        }
      }
    });
  }

  /**
   * Deposit USDC using the optimal protocol
   */
  async depositUSDC(
    vaultId: number,
    amount: BN,
    sourceChain?: string,
    hooks?: HookBuilder
  ): Promise<CrossChainTransfer> {
    console.log(`Initiating USDC deposit: ${amount} to vault ${vaultId}`);
    
    const transferId = this.generateTransferId();
    
    // Determine source chain and domain
    const sourceDomain = sourceChain 
      ? this.chainNameToDomain(sourceChain)
      : CCTP_DOMAINS.SOLANA;
    
    // If source is Solana, direct deposit
    if (sourceDomain === CCTP_DOMAINS.SOLANA) {
      return this.depositUSDCDirect(vaultId, amount);
    }
    
    // For cross-chain deposits, use CCTP
    const transfer: CrossChainTransfer = {
      id: transferId,
      protocol: TransferProtocol.CCTP,
      amount,
      token: 'USDC',
      sourceChain: sourceChain || 'Solana',
      destinationChain: 'Solana',
      status: 'initiating',
      estimatedTime: 30,
      fees: this.cctpService.calculateFees(amount, true),
    };
    
    this.activeTransfers.set(transferId, transfer);
    
    // Build hooks if provided
    const hookData = hooks ? hooks.build() : undefined;
    
    // Execute CCTP transfer
    const params: CCTPTransferParams = {
      amount,
      sourceDomain,
      destinationDomain: CCTP_DOMAINS.SOLANA,
      destinationAddress: await this.getVaultAddress(vaultId),
      hookData,
      useFastTransfer: true,
    };
    
    const { txHash, messageHash } = await this.cctpService.burnUSDC(params);
    
    transfer.txHash = txHash;
    transfer.status = 'burning';
    
    // Monitor attestation
    this.attestationMonitor.monitorAttestation(messageHash).then(attestation => {
      transfer.attestation = attestation;
      transfer.status = 'attested';
      
      // Complete deposit on Solana
      this.completeCCTPDeposit(vaultId, amount, attestation, sourceDomain);
    });
    
    return transfer;
  }

  /**
   * Withdraw USDC using the optimal protocol
   */
  async withdrawUSDC(
    vaultId: number,
    amount: BN,
    destinationChain: string,
    destinationAddress: string
  ): Promise<CrossChainTransfer> {
    console.log(`Initiating USDC withdrawal: ${amount} from vault ${vaultId} to ${destinationChain}`);
    
    const transferId = this.generateTransferId();
    const destinationDomain = this.chainNameToDomain(destinationChain);
    
    // Check if CCTP is available for this route
    const useCCTP = this.shouldUseCCTP('USDC', 'Solana', destinationChain);
    
    const transfer: CrossChainTransfer = {
      id: transferId,
      protocol: useCCTP ? TransferProtocol.CCTP : TransferProtocol.LAYERZERO,
      amount,
      token: 'USDC',
      sourceChain: 'Solana',
      destinationChain,
      status: 'initiating',
      estimatedTime: useCCTP ? 30 : 600,
      fees: useCCTP 
        ? this.cctpService.calculateFees(amount, true)
        : await this.calculateLayerZeroFees(amount),
    };
    
    this.activeTransfers.set(transferId, transfer);
    
    if (useCCTP) {
      // Use CCTP for fast USDC withdrawal
      const vault = await this.omnivaultService.getVault(this.provider.publicKey!, vaultId);
      if (!vault) throw new Error('Vault not found');
      
      // Call Solana program to initiate withdrawal
      const tx = await this.omnivaultService.withdrawSol(vault.publicKey, amount.toNumber());
      
      transfer.txHash = tx;
      transfer.status = 'processing';
      
      // Initiate CCTP burn
      const params: CCTPTransferParams = {
        amount,
        sourceDomain: CCTP_DOMAINS.SOLANA,
        destinationDomain,
        destinationAddress,
        useFastTransfer: true,
      };
      
      const { messageHash } = await this.cctpService.burnUSDC(params);
      
      // Monitor attestation
      await this.attestationMonitor.monitorAttestation(messageHash);
      
      transfer.status = 'complete';
    } else {
      // Fallback to LayerZero for non-USDC or unsupported routes
      const chainId = this.domainToLayerZeroChain(destinationDomain);
      const message = {
        action: {
          type: CrossChainActionType.Rebalance,
          vaultId,
          data: { amount: amount.toString(), destinationAddress },
        },
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000),
      };
      
      const tx = await this.layerzeroService.sendMessage(chainId, message);
      
      transfer.txHash = tx;
      transfer.status = 'sent';
    }
    
    return transfer;
  }

  /**
   * Query cross-chain yields using LayerZero
   */
  async queryCrossChainYields(
    vaultId: number,
    targetChains?: string[]
  ): Promise<YieldOpportunity[]> {
    console.log(`Querying cross-chain yields for vault ${vaultId}`);
    
    const chainIds = targetChains 
      ? targetChains.map(chain => this.chainNameToLayerZeroId(chain))
      : [101, 110, 109, 102, 106, 111]; // Default chains
    
    // Check cache
    const cached = this.getCachedYields(vaultId);
    if (cached.length > 0) {
      console.log('Using cached yield data');
      return cached;
    }
    
    // Query yields via LayerZero
    const tx = await this.omnivaultService.queryCrossChainYields(vaultId, chainIds);
    
    console.log(`Yield query sent: ${tx}`);
    
    // Wait for responses (this would normally use event listeners)
    return new Promise((resolve) => {
      const opportunities: YieldOpportunity[] = [];
      let responsesReceived = 0;
      
      const timeout = setTimeout(() => {
        console.log('Yield query timeout, returning partial results');
        this.cacheYields(vaultId, opportunities);
        resolve(opportunities);
      }, 30000); // 30 second timeout
      
      // Listen for yield responses
      const cleanup = this.layerzeroService.onMessage(0, (message) => {
        if (message.action.type === CrossChainActionType.YieldResponse) {
          const data = message.action.data as any;
          
          opportunities.push({
            chainId: data.chainId,
            chainName: this.getChainName(data.chainId),
            protocol: data.protocol || 'Unknown',
            apy: data.apy,
            tvl: new BN(data.tvl),
            riskScore: data.riskScore,
            gasEstimate: data.gasEstimate || 0,
            isOptimal: false,
          });
          
          responsesReceived++;
          
          if (responsesReceived >= chainIds.length) {
            clearTimeout(timeout);
            cleanup();
            
            // Mark optimal opportunity
            const optimal = this.findOptimalYield(opportunities);
            if (optimal) {
              optimal.isOptimal = true;
            }
            
            this.cacheYields(vaultId, opportunities);
            resolve(opportunities);
          }
        }
      });
    });
  }

  /**
   * Execute rebalancing using hybrid approach
   */
  async rebalanceVault(
    vaultId: number,
    targetChain: string,
    amount: BN,
    strategy?: RebalanceStrategy
  ): Promise<CrossChainTransfer> {
    console.log(`Rebalancing vault ${vaultId} to ${targetChain}`);
    
    const transferId = this.generateTransferId();
    const targetDomain = this.chainNameToDomain(targetChain);
    const targetChainId = this.chainNameToLayerZeroId(targetChain);
    
    // Determine optimal protocol
    const useCCTP = this.shouldUseCCTP('USDC', 'Solana', targetChain);
    
    const transfer: CrossChainTransfer = {
      id: transferId,
      protocol: useCCTP ? TransferProtocol.CCTP : TransferProtocol.LAYERZERO,
      amount,
      token: 'USDC',
      sourceChain: 'Solana',
      destinationChain: targetChain,
      status: 'rebalancing',
      estimatedTime: useCCTP ? 45 : 900,
      fees: new BN(0),
    };
    
    this.activeTransfers.set(transferId, transfer);
    
    if (useCCTP) {
      // Use CCTP for fast rebalancing
      console.log('Using CCTP Fast Transfer for rebalancing');
      
      // Build rebalance hook
      const hookBuilder = new HookBuilder()
        .addRebalance(vaultId, 100, {
          targetDomain,
          maxSlippage: 50,
        })
        .withYieldThreshold('gt', 50); // >0.5% improvement
      
      // Execute rebalance via CCTP
      const params: CCTPTransferParams = {
        amount,
        sourceDomain: CCTP_DOMAINS.SOLANA,
        destinationDomain: targetDomain,
        destinationAddress: await this.getOptimalProtocolAddress(targetChain),
        hookData: hookBuilder.build(),
        useFastTransfer: true,
      };
      
      const { txHash, messageHash } = await this.cctpService.burnUSDC(params);
      
      transfer.txHash = txHash;
      transfer.status = 'transferring';
      
      // Monitor attestation and completion
      await this.attestationMonitor.monitorAttestation(messageHash);
      
      transfer.status = 'complete';
      
    } else {
      // Use LayerZero for discovery + execution
      console.log('Using LayerZero for rebalancing');
      
      const message = {
        action: {
          type: CrossChainActionType.Rebalance,
          vaultId,
          data: {
            amount: amount.toString(),
            targetChainId,
          },
        },
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000),
      };
      
      const tx = await this.layerzeroService.sendMessage(targetChainId, message);
      
      transfer.txHash = tx;
      transfer.status = 'sent';
    }
    
    return transfer;
  }

  /**
   * Determine if CCTP should be used for a transfer
   */
  private shouldUseCCTP(
    token: string,
    sourceChain: string,
    destinationChain: string
  ): boolean {
    // CCTP is only for USDC
    if (token !== 'USDC') {
      return false;
    }
    
    // Check if both chains support CCTP
    const sourceDomain = this.chainNameToDomain(sourceChain);
    const destDomain = this.chainNameToDomain(destinationChain);
    
    const supportedDomains = [
      CCTP_DOMAINS.ETHEREUM,
      CCTP_DOMAINS.ARBITRUM,
      CCTP_DOMAINS.OPTIMISM,
      CCTP_DOMAINS.POLYGON,
      CCTP_DOMAINS.AVALANCHE,
      CCTP_DOMAINS.BASE,
      CCTP_DOMAINS.SOLANA,
    ];
    
    return supportedDomains.includes(sourceDomain) && 
           supportedDomains.includes(destDomain);
  }

  /**
   * Calculate LayerZero fees
   */
  private async calculateLayerZeroFees(amount: BN): Promise<BN> {
    // Simplified fee calculation
    const baseFee = new BN(1000000); // 0.001 SOL
    const percentageFee = amount.mul(new BN(10)).div(new BN(10000)); // 0.1%
    return baseFee.add(percentageFee);
  }

  /**
   * Direct deposit for same-chain operations
   */
  private async depositUSDCDirect(
    vaultId: number,
    amount: BN
  ): Promise<CrossChainTransfer> {
    const vault = await this.omnivaultService.getVault(
      this.provider.publicKey!,
      vaultId
    );
    
    if (!vault) {
      throw new Error('Vault not found');
    }
    
    const tx = await this.omnivaultService.depositSol(
      vault.publicKey,
      amount.toNumber()
    );
    
    return {
      id: this.generateTransferId(),
      protocol: TransferProtocol.CCTP,
      amount,
      token: 'USDC',
      sourceChain: 'Solana',
      destinationChain: 'Solana',
      status: 'complete',
      txHash: tx,
      estimatedTime: 0,
      actualTime: 0,
      fees: new BN(0),
    };
  }

  /**
   * Complete CCTP deposit after attestation
   */
  private async completeCCTPDeposit(
    vaultId: number,
    amount: BN,
    attestation: string,
    sourceDomain: number
  ): Promise<void> {
    console.log(`Completing CCTP deposit for vault ${vaultId}`);
    
    // Prepare transaction to call deposit_usdc_via_cctp instruction
    const transaction = new Transaction();
    
    // Add instruction (simplified - would use actual program instruction)
    // This would call the Solana program's deposit_usdc_via_cctp instruction
    
    const tx = await this.provider.sendAndConfirm(transaction);
    console.log(`CCTP deposit completed: ${tx}`);
  }

  /**
   * Handle attestation complete event
   */
  private handleAttestationComplete(event: any): void {
    console.log('Processing attestation complete event:', event);
    
    // Update transfer status
    for (const [id, transfer] of this.activeTransfers) {
      if (transfer.attestation === event.messageHash) {
        transfer.status = 'attested';
        transfer.actualTime = Date.now();
        break;
      }
    }
  }

  /**
   * Handle attestation failed event
   */
  private handleAttestationFailed(event: any): void {
    console.error('Processing attestation failed event:', event);
    
    // Update transfer status and attempt fallback
    for (const [id, transfer] of this.activeTransfers) {
      if (transfer.attestation === event.messageHash) {
        transfer.status = 'failed';
        
        // Attempt fallback to LayerZero
        console.log('Attempting LayerZero fallback for failed CCTP transfer');
        // Implementation would go here
        break;
      }
    }
  }

  /**
   * Handle LayerZero message
   */
  private handleLayerZeroMessage(chainId: number, message: any): void {
    console.log(`Received LayerZero message from chain ${chainId}:`, message);
    
    switch (message.action.type) {
      case CrossChainActionType.YieldResponse:
        // Process yield data
        break;
      case CrossChainActionType.EmergencyPause:
        // Handle emergency pause
        console.warn('Emergency pause received from chain', chainId);
        break;
      case CrossChainActionType.Rebalance:
        // Process rebalance confirmation
        break;
    }
  }

  /**
   * Get vault address
   */
  private async getVaultAddress(vaultId: number): Promise<PublicKey> {
    const vault = await this.omnivaultService.getVault(
      this.provider.publicKey!,
      vaultId
    );
    
    if (!vault) {
      throw new Error('Vault not found');
    }
    
    return vault.publicKey;
  }

  /**
   * Get optimal protocol address for target chain
   */
  private async getOptimalProtocolAddress(chain: string): Promise<PublicKey> {
    // This would return the actual protocol address on the target chain
    // For now, return a placeholder
    return new PublicKey('11111111111111111111111111111111');
  }

  /**
   * Find optimal yield opportunity
   */
  private findOptimalYield(opportunities: YieldOpportunity[]): YieldOpportunity | null {
    if (opportunities.length === 0) return null;
    
    // Score each opportunity based on APY and risk
    const scored = opportunities.map(opp => ({
      ...opp,
      score: (opp.apy * 100) - (opp.riskScore * 2) - (opp.gasEstimate / 1000000),
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0];
  }

  /**
   * Cache yield opportunities
   */
  private cacheYields(vaultId: number, opportunities: YieldOpportunity[]): void {
    this.yieldOpportunities.set(vaultId, opportunities);
    this.lastYieldUpdate.set(vaultId, Date.now());
  }

  /**
   * Get cached yields if still valid
   */
  private getCachedYields(vaultId: number): YieldOpportunity[] {
    const cached = this.yieldOpportunities.get(vaultId);
    const lastUpdate = this.lastYieldUpdate.get(vaultId);
    
    if (!cached || !lastUpdate) return [];
    
    if (Date.now() - lastUpdate > this.yieldCacheTimeout) {
      // Cache expired
      this.yieldOpportunities.delete(vaultId);
      this.lastYieldUpdate.delete(vaultId);
      return [];
    }
    
    return cached;
  }

  /**
   * Convert chain name to CCTP domain
   */
  private chainNameToDomain(chainName: string): number {
    const mapping: Record<string, number> = {
      'Ethereum': CCTP_DOMAINS.ETHEREUM,
      'Arbitrum': CCTP_DOMAINS.ARBITRUM,
      'Optimism': CCTP_DOMAINS.OPTIMISM,
      'Polygon': CCTP_DOMAINS.POLYGON,
      'Avalanche': CCTP_DOMAINS.AVALANCHE,
      'Base': CCTP_DOMAINS.BASE,
      'Solana': CCTP_DOMAINS.SOLANA,
    };
    
    return mapping[chainName] || 0;
  }

  /**
   * Convert chain name to LayerZero chain ID
   */
  private chainNameToLayerZeroId(chainName: string): number {
    const mapping: Record<string, number> = {
      'Ethereum': 101,
      'Arbitrum': 110,
      'Optimism': 111,
      'Polygon': 109,
      'Avalanche': 106,
      'BSC': 102,
    };
    
    return mapping[chainName] || 0;
  }

  /**
   * Convert CCTP domain to LayerZero chain ID
   */
  private domainToLayerZeroChain(domain: number): number | null {
    const mapping: Record<number, number> = {
      [CCTP_DOMAINS.ETHEREUM]: 101,
      [CCTP_DOMAINS.ARBITRUM]: 110,
      [CCTP_DOMAINS.OPTIMISM]: 111,
      [CCTP_DOMAINS.POLYGON]: 109,
      [CCTP_DOMAINS.AVALANCHE]: 106,
    };
    
    return mapping[domain] || null;
  }

  /**
   * Get chain name
   */
  private getChainName(chainId: number): string {
    return this.layerzeroService.getChainName(chainId);
  }

  /**
   * Generate unique transfer ID
   */
  private generateTransferId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active transfers
   */
  getActiveTransfers(): CrossChainTransfer[] {
    return Array.from(this.activeTransfers.values());
  }

  /**
   * Get transfer by ID
   */
  getTransfer(transferId: string): CrossChainTransfer | null {
    return this.activeTransfers.get(transferId) || null;
  }

  /**
   * Get protocol statistics
   */
  getProtocolStats(): {
    cctpTransfers: number;
    layerzeroTransfers: number;
    averageCCTPTime: number;
    averageLayerZeroTime: number;
    totalVolume: BN;
    totalFees: BN;
  } {
    const transfers = Array.from(this.activeTransfers.values());
    
    const cctpTransfers = transfers.filter(t => t.protocol === TransferProtocol.CCTP);
    const lzTransfers = transfers.filter(t => t.protocol === TransferProtocol.LAYERZERO);
    
    const avgCCTPTime = cctpTransfers.length > 0
      ? cctpTransfers.reduce((acc, t) => acc + (t.actualTime || t.estimatedTime), 0) / cctpTransfers.length
      : 0;
    
    const avgLZTime = lzTransfers.length > 0
      ? lzTransfers.reduce((acc, t) => acc + (t.actualTime || t.estimatedTime), 0) / lzTransfers.length
      : 0;
    
    const totalVolume = transfers.reduce((acc, t) => acc.add(t.amount), new BN(0));
    const totalFees = transfers.reduce((acc, t) => acc.add(t.fees), new BN(0));
    
    return {
      cctpTransfers: cctpTransfers.length,
      layerzeroTransfers: lzTransfers.length,
      averageCCTPTime: avgCCTPTime,
      averageLayerZeroTime: avgLZTime,
      totalVolume,
      totalFees,
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.attestationMonitor.stop();
    this.cctpService.cleanup();
    this.layerzeroService.cleanup();
    this.activeTransfers.clear();
    this.yieldOpportunities.clear();
    this.lastYieldUpdate.clear();
  }
}

// Export factory function
export const createHybridOrchestrator = (
  provider: AnchorProvider,
  isTestnet: boolean = false
): HybridOrchestrator => {
  return new HybridOrchestrator(provider, isTestnet);
};
