import axios, { type AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export enum AttestationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export interface AttestationEvent {
  messageHash: string;
  status: AttestationStatus;
  attestation?: string;
  timestamp: number;
  attempts: number;
  error?: string;
}

export interface AttestationConfig {
  apiEndpoint: string;
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout: number;
}

export interface AttestationMetrics {
  totalRequests: number;
  successfulAttestations: number;
  failedAttestations: number;
  averageTime: number;
  fastestTime: number;
  slowestTime: number;
  pendingCount: number;
}

interface MonitoredTransfer {
  messageHash: string;
  startTime: number;
  attempts: number;
  status: AttestationStatus;
  retryTimeout?: NodeJS.Timeout;
  completionTime?: number;
}

export class AttestationMonitor extends EventEmitter {
  private config: AttestationConfig;
  private axiosInstance: AxiosInstance;
  private monitoredTransfers: Map<string, MonitoredTransfer> = new Map();
  private metrics: AttestationMetrics;
  private isActive: boolean = false;
  private pollingInterval?: NodeJS.Timeout;
  private websocket?: WebSocket;

  constructor(isTestnet: boolean = false, customConfig?: Partial<AttestationConfig>) {
    super();

    this.config = {
      apiEndpoint: isTestnet
        ? 'https://iris-api-sandbox.circle.com/v1/attestations'
        : 'https://iris-api.circle.com/v1/attestations',
      maxRetries: 60,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 1.5,
      timeout: 300000, // 5 minutes
      ...customConfig,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.apiEndpoint,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.metrics = {
      totalRequests: 0,
      successfulAttestations: 0,
      failedAttestations: 0,
      averageTime: 0,
      fastestTime: Infinity,
      slowestTime: 0,
      pendingCount: 0,
    };
  }

  /**
   * Start monitoring for attestations
   */
  start(): void {
    if (this.isActive) {
      console.warn('Attestation monitor is already active');
      return;
    }

    this.isActive = true;
    console.log('Attestation monitor started');

    // Start batch polling for all pending attestations
    this.startBatchPolling();

    // Attempt to establish WebSocket connection for real-time updates
    this.connectWebSocket();

    this.emit('started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isActive = false;

    // Clear all timeouts
    this.monitoredTransfers.forEach(transfer => {
      if (transfer.retryTimeout) {
        clearTimeout(transfer.retryTimeout);
      }
    });

    // Stop batch polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval as NodeJS.Timeout);
      this.pollingInterval = undefined;
    }

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    console.log('Attestation monitor stopped');
    this.emit('stopped');
  }

  /**
   * Monitor a specific message hash for attestation
   */
  async monitorAttestation(messageHash: string): Promise<string> {
    if (this.monitoredTransfers.has(messageHash)) {
      console.log(`Already monitoring attestation for ${messageHash}`);
      return this.waitForCompletion(messageHash);
    }

    const transfer: MonitoredTransfer = {
      messageHash,
      startTime: Date.now(),
      attempts: 0,
      status: AttestationStatus.PENDING,
    };

    this.monitoredTransfers.set(messageHash, transfer);
    this.metrics.totalRequests++;
    this.metrics.pendingCount++;

    this.emit('attestation:pending', {
      messageHash,
      status: AttestationStatus.PENDING,
      timestamp: transfer.startTime,
      attempts: 0,
    } as AttestationEvent);

    // Start polling for this specific attestation
    this.pollAttestation(messageHash);

    return this.waitForCompletion(messageHash);
  }

  /**
   * Poll for a specific attestation
   */
  private async pollAttestation(messageHash: string): Promise<void> {
    const transfer = this.monitoredTransfers.get(messageHash);
    if (!transfer || !this.isActive) {
      return;
    }

    transfer.attempts++;

    try {
      const response = await this.axiosInstance.get(`/${messageHash}`);

      if (response.data && response.data.attestation) {
        // Attestation complete
        this.handleAttestationComplete(messageHash, response.data.attestation);
      } else if (response.data && response.data.status === 'pending_confirmations') {
        // Still processing
        transfer.status = AttestationStatus.PROCESSING;
        this.emit('attestation:processing', {
          messageHash,
          status: AttestationStatus.PROCESSING,
          timestamp: Date.now(),
          attempts: transfer.attempts,
        } as AttestationEvent);
        
        this.scheduleRetry(messageHash);
      } else {
        // Not found or still pending
        this.scheduleRetry(messageHash);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Message not yet available, keep polling
        this.scheduleRetry(messageHash);
      } else {
        console.error(`Error polling attestation for ${messageHash}:`, error);
        
        if (transfer.attempts >= this.config.maxRetries) {
          this.handleAttestationFailed(messageHash, error.message);
        } else {
          this.scheduleRetry(messageHash);
        }
      }
    }
  }

  /**
   * Schedule a retry for attestation polling
   */
  private scheduleRetry(messageHash: string): void {
    const transfer = this.monitoredTransfers.get(messageHash);
    if (!transfer || !this.isActive) {
      return;
    }

    // Check timeout
    const elapsed = Date.now() - transfer.startTime;
    if (elapsed > this.config.timeout) {
      this.handleAttestationFailed(messageHash, 'Timeout exceeded');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, transfer.attempts - 1),
      this.config.maxDelay
    );

    transfer.retryTimeout = setTimeout(() => {
      this.pollAttestation(messageHash);
    }, delay);
  }

  /**
   * Handle successful attestation
   */
  private handleAttestationComplete(messageHash: string, attestation: string): void {
    const transfer = this.monitoredTransfers.get(messageHash);
    if (!transfer) {
      return;
    }

    transfer.status = AttestationStatus.COMPLETE;
    transfer.completionTime = Date.now();

    const duration = transfer.completionTime - transfer.startTime;

    // Update metrics
    this.metrics.successfulAttestations++;
    this.metrics.pendingCount--;
    this.updateAverageTime(duration);
    this.metrics.fastestTime = Math.min(this.metrics.fastestTime, duration);
    this.metrics.slowestTime = Math.max(this.metrics.slowestTime, duration);

    // Clear retry timeout
    if (transfer.retryTimeout) {
      clearTimeout(transfer.retryTimeout);
    }

    // Emit completion event
    this.emit('attestation:complete', {
      messageHash,
      status: AttestationStatus.COMPLETE,
      attestation,
      timestamp: transfer.completionTime,
      attempts: transfer.attempts,
    } as AttestationEvent);

    // Clean up after a delay
    setTimeout(() => {
      this.monitoredTransfers.delete(messageHash);
    }, 60000); // Keep for 1 minute for reference
  }

  /**
   * Handle failed attestation
   */
  private handleAttestationFailed(messageHash: string, error: string): void {
    const transfer = this.monitoredTransfers.get(messageHash);
    if (!transfer) {
      return;
    }

    transfer.status = AttestationStatus.FAILED;
    transfer.completionTime = Date.now();

    // Update metrics
    this.metrics.failedAttestations++;
    this.metrics.pendingCount--;

    // Clear retry timeout
    if (transfer.retryTimeout) {
      clearTimeout(transfer.retryTimeout);
    }

    // Emit failure event
    this.emit('attestation:failed', {
      messageHash,
      status: AttestationStatus.FAILED,
      error,
      timestamp: transfer.completionTime,
      attempts: transfer.attempts,
    } as AttestationEvent);

    // Clean up
    this.monitoredTransfers.delete(messageHash);
  }

  /**
   * Start batch polling for all pending attestations
   */
  private startBatchPolling(): void {
    if (this.pollingInterval) {
      return;
    }

    this.pollingInterval = setInterval(() => {
      const pendingTransfers = Array.from(this.monitoredTransfers.values())
        .filter(t => t.status === AttestationStatus.PENDING || t.status === AttestationStatus.PROCESSING);

      if (pendingTransfers.length > 0) {
        this.batchCheckAttestations(pendingTransfers.map(t => t.messageHash));
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Batch check multiple attestations
   */
  private async batchCheckAttestations(messageHashes: string[]): Promise<void> {
    if (messageHashes.length === 0) {
      return;
    }

    console.log(`Batch checking ${messageHashes.length} attestations`);

    // Check attestations in parallel (up to 10 at a time)
    const batchSize = 10;
    for (let i = 0; i < messageHashes.length; i += batchSize) {
      const batch = messageHashes.slice(i, i + batchSize);
      await Promise.all(batch.map(hash => this.checkSingleAttestation(hash)));
    }
  }

  /**
   * Check a single attestation without scheduling retry
   */
  private async checkSingleAttestation(messageHash: string): Promise<void> {
    try {
      const response = await this.axiosInstance.get(`/${messageHash}`);
      
      if (response.data && response.data.attestation) {
        this.handleAttestationComplete(messageHash, response.data.attestation);
      }
    } catch (error) {
      // Silent fail for batch checks, individual polling will handle retries
    }
  }

  /**
   * Connect to WebSocket for real-time attestation updates
   */
  private connectWebSocket(): void {
    try {
      // Note: Circle doesn't provide a public WebSocket endpoint for attestations
      // This is a placeholder for future implementation
      console.log('WebSocket connection not available for attestations');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  /**
   * Wait for attestation completion
   */
  private waitForCompletion(messageHash: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const transfer = this.monitoredTransfers.get(messageHash);
        
        if (!transfer) {
          reject(new Error('Transfer not found'));
          return;
        }

        if (transfer.status === AttestationStatus.COMPLETE) {
          this.off('attestation:complete', onComplete);
          this.off('attestation:failed', onFailed);
          resolve(messageHash);
        } else if (transfer.status === AttestationStatus.FAILED) {
          this.off('attestation:complete', onComplete);
          this.off('attestation:failed', onFailed);
          reject(new Error('Attestation failed'));
        }
      };

      const onComplete = (event: AttestationEvent) => {
        if (event.messageHash === messageHash) {
          this.off('attestation:failed', onFailed);
          resolve(event.attestation!);
        }
      };

      const onFailed = (event: AttestationEvent) => {
        if (event.messageHash === messageHash) {
          this.off('attestation:complete', onComplete);
          reject(new Error(event.error || 'Attestation failed'));
        }
      };

      // Check current status
      checkStatus();

      // Listen for events
      this.on('attestation:complete', onComplete);
      this.on('attestation:failed', onFailed);
    });
  }

  /**
   * Update average attestation time
   */
  private updateAverageTime(newTime: number): void {
    const total = this.metrics.successfulAttestations;
    this.metrics.averageTime = 
      (this.metrics.averageTime * (total - 1) + newTime) / total;
  }

  /**
   * Get current metrics
   */
  getMetrics(): AttestationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get status of a specific attestation
   */
  getAttestationStatus(messageHash: string): MonitoredTransfer | null {
    return this.monitoredTransfers.get(messageHash) || null;
  }

  /**
   * Get all pending attestations
   */
  getPendingAttestations(): string[] {
    return Array.from(this.monitoredTransfers.entries())
      .filter(([_, transfer]) => 
        transfer.status === AttestationStatus.PENDING || 
        transfer.status === AttestationStatus.PROCESSING
      )
      .map(([hash, _]) => hash);
  }

  /**
   * Clear completed attestations from memory
   */
  clearCompleted(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.monitoredTransfers.forEach((transfer, hash) => {
      if (
        transfer.status === AttestationStatus.COMPLETE &&
        transfer.completionTime &&
        now - transfer.completionTime > 60000 // 1 minute old
      ) {
        toDelete.push(hash);
      }
    });

    toDelete.forEach(hash => this.monitoredTransfers.delete(hash));
    console.log(`Cleared ${toDelete.length} completed attestations`);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulAttestations: 0,
      failedAttestations: 0,
      averageTime: 0,
      fastestTime: Infinity,
      slowestTime: 0,
      pendingCount: this.monitoredTransfers.size,
    };
  }

  /**
   * Export metrics for monitoring dashboards
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify({
      ...metrics,
      timestamp: Date.now(),
      successRate: metrics.totalRequests > 0 
        ? (metrics.successfulAttestations / metrics.totalRequests) * 100 
        : 0,
      averageTimeSeconds: metrics.averageTime / 1000,
      fastestTimeSeconds: metrics.fastestTime === Infinity ? 0 : metrics.fastestTime / 1000,
      slowestTimeSeconds: metrics.slowestTime / 1000,
    }, null, 2);
  }
}

// Singleton instance
let attestationMonitorInstance: AttestationMonitor | null = null;

export const getAttestationMonitor = (isTestnet: boolean = false): AttestationMonitor => {
  if (!attestationMonitorInstance) {
    attestationMonitorInstance = new AttestationMonitor(isTestnet);
    attestationMonitorInstance.start();
  }
  return attestationMonitorInstance;
};

export const stopAttestationMonitor = (): void => {
  if (attestationMonitorInstance) {
    attestationMonitorInstance.stop();
    attestationMonitorInstance = null;
  }
};
