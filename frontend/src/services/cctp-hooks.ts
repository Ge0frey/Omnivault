import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum HookType {
  DEPOSIT_VAULT = 1,
  REBALANCE = 2,
  COMPOUND = 3,
  SWAP = 4,
  STAKE = 5,
  PROVIDE_LIQUIDITY = 6,
  CUSTOM = 255,
}

export interface HookCondition {
  type: 'amount_threshold' | 'yield_threshold' | 'time_based' | 'price_based';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: BN | number;
}

export interface HookAction {
  type: HookType;
  priority: number;
  gasLimit?: number;
  enabled: boolean;
  conditions: HookCondition[];
  metadata: Record<string, any>;
}

export interface VaultDepositHook extends HookAction {
  type: HookType.DEPOSIT_VAULT;
  metadata: {
    vaultId: number;
    minDeposit: BN;
    maxDeposit?: BN;
    autoCompound: boolean;
  };
}

export interface RebalanceHook extends HookAction {
  type: HookType.REBALANCE;
  metadata: {
    vaultId: number;
    targetChainId?: number;
    targetDomain?: number;
    minYieldImprovement: number; // basis points
    maxSlippage: number; // basis points
  };
}

export interface CompoundHook extends HookAction {
  type: HookType.COMPOUND;
  metadata: {
    vaultId: number;
    minCompoundAmount: BN;
    frequency: 'daily' | 'weekly' | 'monthly' | 'threshold';
    reinvestRatio: number; // percentage to reinvest (0-100)
  };
}

export interface SwapHook extends HookAction {
  type: HookType.SWAP;
  metadata: {
    fromToken: PublicKey | string;
    toToken: PublicKey | string;
    dexProtocol: string;
    minOutputAmount: BN;
    maxSlippage: number;
  };
}

export interface StakeHook extends HookAction {
  type: HookType.STAKE;
  metadata: {
    stakingProtocol: string;
    stakingPool: PublicKey | string;
    lockDuration?: number; // seconds
    autoRestake: boolean;
  };
}

export interface LiquidityHook extends HookAction {
  type: HookType.PROVIDE_LIQUIDITY;
  metadata: {
    poolAddress: PublicKey | string;
    tokenA: PublicKey | string;
    tokenB: PublicKey | string;
    ratioTolerance: number; // percentage
    minLiquidity: BN;
  };
}

export interface CustomHook extends HookAction {
  type: HookType.CUSTOM;
  metadata: {
    programId: PublicKey | string;
    instructionData: Uint8Array;
    accounts: Array<{
      pubkey: PublicKey | string;
      isWritable: boolean;
      isSigner: boolean;
    }>;
  };
}

export type Hook = 
  | VaultDepositHook 
  | RebalanceHook 
  | CompoundHook 
  | SwapHook 
  | StakeHook 
  | LiquidityHook 
  | CustomHook;

export class HookBuilder {
  private hooks: Hook[] = [];
  private maxHookSize: number = 1024; // Maximum size in bytes
  private maxHooksPerTransfer: number = 5;

  /**
   * Add a vault deposit hook
   */
  addVaultDeposit(
    vaultId: number,
    minDeposit: BN,
    options?: {
      maxDeposit?: BN;
      autoCompound?: boolean;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: VaultDepositHook = {
      type: HookType.DEPOSIT_VAULT,
      priority: options?.priority || 1,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        vaultId,
        minDeposit,
        maxDeposit: options?.maxDeposit,
        autoCompound: options?.autoCompound || false,
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a rebalance hook
   */
  addRebalance(
    vaultId: number,
    minYieldImprovement: number,
    options?: {
      targetChainId?: number;
      targetDomain?: number;
      maxSlippage?: number;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: RebalanceHook = {
      type: HookType.REBALANCE,
      priority: options?.priority || 2,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        vaultId,
        targetChainId: options?.targetChainId,
        targetDomain: options?.targetDomain,
        minYieldImprovement,
        maxSlippage: options?.maxSlippage || 50, // 0.5% default
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a compound hook
   */
  addCompound(
    vaultId: number,
    minCompoundAmount: BN,
    frequency: 'daily' | 'weekly' | 'monthly' | 'threshold',
    options?: {
      reinvestRatio?: number;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: CompoundHook = {
      type: HookType.COMPOUND,
      priority: options?.priority || 3,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        vaultId,
        minCompoundAmount,
        frequency,
        reinvestRatio: options?.reinvestRatio || 100, // 100% reinvest by default
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a swap hook
   */
  addSwap(
    fromToken: PublicKey | string,
    toToken: PublicKey | string,
    minOutputAmount: BN,
    options?: {
      dexProtocol?: string;
      maxSlippage?: number;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: SwapHook = {
      type: HookType.SWAP,
      priority: options?.priority || 4,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        fromToken,
        toToken,
        dexProtocol: options?.dexProtocol || 'jupiter',
        minOutputAmount,
        maxSlippage: options?.maxSlippage || 100, // 1% default
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a staking hook
   */
  addStaking(
    stakingProtocol: string,
    stakingPool: PublicKey | string,
    options?: {
      lockDuration?: number;
      autoRestake?: boolean;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: StakeHook = {
      type: HookType.STAKE,
      priority: options?.priority || 5,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        stakingProtocol,
        stakingPool,
        lockDuration: options?.lockDuration,
        autoRestake: options?.autoRestake || true,
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a liquidity provision hook
   */
  addLiquidityProvision(
    poolAddress: PublicKey | string,
    tokenA: PublicKey | string,
    tokenB: PublicKey | string,
    minLiquidity: BN,
    options?: {
      ratioTolerance?: number;
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: LiquidityHook = {
      type: HookType.PROVIDE_LIQUIDITY,
      priority: options?.priority || 6,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        poolAddress,
        tokenA,
        tokenB,
        ratioTolerance: options?.ratioTolerance || 5, // 5% tolerance
        minLiquidity,
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a custom hook
   */
  addCustom(
    programId: PublicKey | string,
    instructionData: Uint8Array,
    accounts: Array<{
      pubkey: PublicKey | string;
      isWritable: boolean;
      isSigner: boolean;
    }>,
    options?: {
      conditions?: HookCondition[];
      priority?: number;
    }
  ): HookBuilder {
    const hook: CustomHook = {
      type: HookType.CUSTOM,
      priority: options?.priority || 255,
      enabled: true,
      conditions: options?.conditions || [],
      metadata: {
        programId,
        instructionData,
        accounts,
      },
    };

    this.hooks.push(hook);
    return this;
  }

  /**
   * Add a condition to the last added hook
   */
  withCondition(condition: HookCondition): HookBuilder {
    if (this.hooks.length === 0) {
      throw new Error('No hook to add condition to');
    }

    const lastHook = this.hooks[this.hooks.length - 1];
    lastHook.conditions.push(condition);
    return this;
  }

  /**
   * Add an amount threshold condition
   */
  withAmountThreshold(operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq', value: BN): HookBuilder {
    return this.withCondition({
      type: 'amount_threshold',
      operator,
      value,
    });
  }

  /**
   * Add a yield threshold condition
   */
  withYieldThreshold(operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq', value: number): HookBuilder {
    return this.withCondition({
      type: 'yield_threshold',
      operator,
      value,
    });
  }

  /**
   * Add a time-based condition
   */
  withTimeCondition(operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq', timestamp: number): HookBuilder {
    return this.withCondition({
      type: 'time_based',
      operator,
      value: timestamp,
    });
  }

  /**
   * Add a price-based condition
   */
  withPriceCondition(operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq', price: number): HookBuilder {
    return this.withCondition({
      type: 'price_based',
      operator,
      value: price,
    });
  }

  /**
   * Set priority for the last added hook
   */
  withPriority(priority: number): HookBuilder {
    if (this.hooks.length === 0) {
      throw new Error('No hook to set priority for');
    }

    const lastHook = this.hooks[this.hooks.length - 1];
    lastHook.priority = priority;
    return this;
  }

  /**
   * Enable or disable the last added hook
   */
  setEnabled(enabled: boolean): HookBuilder {
    if (this.hooks.length === 0) {
      throw new Error('No hook to enable/disable');
    }

    const lastHook = this.hooks[this.hooks.length - 1];
    lastHook.enabled = enabled;
    return this;
  }

  /**
   * Clear all hooks
   */
  clear(): HookBuilder {
    this.hooks = [];
    return this;
  }

  /**
   * Build and encode hooks for CCTP message
   */
  build(): Uint8Array {
    if (this.hooks.length === 0) {
      return new Uint8Array(0);
    }

    if (this.hooks.length > this.maxHooksPerTransfer) {
      throw new Error(`Too many hooks. Maximum ${this.maxHooksPerTransfer} hooks allowed per transfer`);
    }

    // Sort hooks by priority
    const sortedHooks = [...this.hooks].sort((a, b) => a.priority - b.priority);

    // Encode hooks
    const hookData: number[] = [];

    // Add hook count
    hookData.push(sortedHooks.length);

    for (const hook of sortedHooks) {
      if (!hook.enabled) continue;

      // Add hook type
      hookData.push(hook.type);

      // Encode metadata based on hook type
      const metadataBytes = this.encodeHookMetadata(hook);
      
      // Add metadata length
      hookData.push(metadataBytes.length & 0xff);
      hookData.push((metadataBytes.length >> 8) & 0xff);

      // Add metadata
      hookData.push(...metadataBytes);

      // Encode conditions
      const conditionsBytes = this.encodeConditions(hook.conditions);
      
      // Add conditions length
      hookData.push(conditionsBytes.length & 0xff);
      hookData.push((conditionsBytes.length >> 8) & 0xff);

      // Add conditions
      hookData.push(...conditionsBytes);
    }

    const result = new Uint8Array(hookData);

    if (result.length > this.maxHookSize) {
      throw new Error(`Hook data too large. Maximum ${this.maxHookSize} bytes allowed`);
    }

    return result;
  }

  /**
   * Encode hook metadata
   */
  private encodeHookMetadata(hook: Hook): number[] {
    const encoder = new TextEncoder();
    const metadata = JSON.stringify(hook.metadata);
    return Array.from(encoder.encode(metadata));
  }

  /**
   * Encode hook conditions
   */
  private encodeConditions(conditions: HookCondition[]): number[] {
    const encoder = new TextEncoder();
    const conditionsStr = JSON.stringify(conditions);
    return Array.from(encoder.encode(conditionsStr));
  }

  /**
   * Parse hook data from CCTP message
   */
  static parse(hookData: Uint8Array): Hook[] {
    if (!hookData || hookData.length === 0) {
      return [];
    }

    const hooks: Hook[] = [];
    const decoder = new TextDecoder();
    let offset = 0;

    // Read hook count
    const hookCount = hookData[offset++];

    for (let i = 0; i < hookCount; i++) {
      // Read hook type
      const type = hookData[offset++] as HookType;

      // Read metadata length
      const metadataLength = hookData[offset] | (hookData[offset + 1] << 8);
      offset += 2;

      // Read metadata
      const metadataBytes = hookData.slice(offset, offset + metadataLength);
      offset += metadataLength;
      const metadata = JSON.parse(decoder.decode(metadataBytes));

      // Read conditions length
      const conditionsLength = hookData[offset] | (hookData[offset + 1] << 8);
      offset += 2;

      // Read conditions
      const conditionsBytes = hookData.slice(offset, offset + conditionsLength);
      offset += conditionsLength;
      const conditions = JSON.parse(decoder.decode(conditionsBytes));

      // Reconstruct hook
      const hook: Hook = {
        type,
        priority: i,
        enabled: true,
        conditions,
        metadata,
      } as Hook;

      hooks.push(hook);
    }

    return hooks;
  }

  /**
   * Validate hooks
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.hooks.length === 0) {
      return { valid: true, errors };
    }

    if (this.hooks.length > this.maxHooksPerTransfer) {
      errors.push(`Too many hooks. Maximum ${this.maxHooksPerTransfer} allowed`);
    }

    // Check for conflicting hooks
    const vaultDeposits = this.hooks.filter(h => h.type === HookType.DEPOSIT_VAULT);
    if (vaultDeposits.length > 1) {
      errors.push('Multiple vault deposit hooks not allowed');
    }

    const rebalances = this.hooks.filter(h => h.type === HookType.REBALANCE);
    if (rebalances.length > 1) {
      errors.push('Multiple rebalance hooks not allowed');
    }

    // Validate individual hooks
    for (const hook of this.hooks) {
      const hookErrors = this.validateHook(hook);
      errors.push(...hookErrors);
    }

    // Check encoded size
    try {
      const encoded = this.build();
      if (encoded.length > this.maxHookSize) {
        errors.push(`Encoded hook data too large: ${encoded.length} bytes (max ${this.maxHookSize})`);
      }
    } catch (error: any) {
      errors.push(`Failed to encode hooks: ${error.message}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate individual hook
   */
  private validateHook(hook: Hook): string[] {
    const errors: string[] = [];

    switch (hook.type) {
      case HookType.DEPOSIT_VAULT:
        const depositHook = hook as VaultDepositHook;
        if (depositHook.metadata.minDeposit.lte(new BN(0))) {
          errors.push('Minimum deposit must be greater than 0');
        }
        if (depositHook.metadata.maxDeposit && 
            depositHook.metadata.maxDeposit.lt(depositHook.metadata.minDeposit)) {
          errors.push('Maximum deposit must be greater than minimum deposit');
        }
        break;

      case HookType.REBALANCE:
        const rebalanceHook = hook as RebalanceHook;
        if (rebalanceHook.metadata.minYieldImprovement <= 0) {
          errors.push('Minimum yield improvement must be greater than 0');
        }
        if (rebalanceHook.metadata.maxSlippage >= 10000) {
          errors.push('Maximum slippage must be less than 100%');
        }
        break;

      case HookType.COMPOUND:
        const compoundHook = hook as CompoundHook;
        if (compoundHook.metadata.minCompoundAmount.lte(new BN(0))) {
          errors.push('Minimum compound amount must be greater than 0');
        }
        if (compoundHook.metadata.reinvestRatio < 0 || compoundHook.metadata.reinvestRatio > 100) {
          errors.push('Reinvest ratio must be between 0 and 100');
        }
        break;

      case HookType.SWAP:
        const swapHook = hook as SwapHook;
        if (swapHook.metadata.minOutputAmount.lte(new BN(0))) {
          errors.push('Minimum output amount must be greater than 0');
        }
        if (swapHook.metadata.maxSlippage >= 10000) {
          errors.push('Maximum slippage must be less than 100%');
        }
        break;

      case HookType.CUSTOM:
        const customHook = hook as CustomHook;
        if (!customHook.metadata.instructionData || customHook.metadata.instructionData.length === 0) {
          errors.push('Custom hook must have instruction data');
        }
        if (!customHook.metadata.accounts || customHook.metadata.accounts.length === 0) {
          errors.push('Custom hook must have accounts');
        }
        break;
    }

    return errors;
  }

  /**
   * Get estimated gas for hooks
   */
  estimateGas(): number {
    let totalGas = 0;

    for (const hook of this.hooks) {
      switch (hook.type) {
        case HookType.DEPOSIT_VAULT:
          totalGas += 100000;
          break;
        case HookType.REBALANCE:
          totalGas += 200000;
          break;
        case HookType.COMPOUND:
          totalGas += 150000;
          break;
        case HookType.SWAP:
          totalGas += 250000;
          break;
        case HookType.STAKE:
          totalGas += 120000;
          break;
        case HookType.PROVIDE_LIQUIDITY:
          totalGas += 300000;
          break;
        case HookType.CUSTOM:
          totalGas += (hook as CustomHook).gasLimit || 500000;
          break;
      }
    }

    return totalGas;
  }

  /**
   * Get hooks array
   */
  getHooks(): Hook[] {
    return [...this.hooks];
  }

  /**
   * Get hooks by type
   */
  getHooksByType(type: HookType): Hook[] {
    return this.hooks.filter(h => h.type === type);
  }

  /**
   * Remove hook by index
   */
  removeHook(index: number): HookBuilder {
    if (index >= 0 && index < this.hooks.length) {
      this.hooks.splice(index, 1);
    }
    return this;
  }

  /**
   * Remove hooks by type
   */
  removeHooksByType(type: HookType): HookBuilder {
    this.hooks = this.hooks.filter(h => h.type !== type);
    return this;
  }
}

// Export singleton instance
export const hookBuilder = new HookBuilder();
