/**
 * Utility functions for generating Solana explorer URLs
 */

export type ExplorerType = 'solscan' | 'solanafm' | 'explorer';

export interface ExplorerUrls {
  solscan: string;
  solanafm: string;
  explorer: string;
}

/**
 * Get the appropriate network cluster based on environment configuration
 */
export function getSolanaCluster(): 'devnet' | 'mainnet-beta' | 'localnet' {
  const useLocalValidator = import.meta.env.VITE_USE_LOCAL_VALIDATOR === 'true';
  const rpcEndpoint = import.meta.env.VITE_SOLANA_RPC_ENDPOINT;
  
  // Check if using local validator
  if (useLocalValidator) {
    return 'localnet';
  }
  
  // Check if explicitly using mainnet
  const isMainnet = rpcEndpoint && (
    rpcEndpoint.includes('mainnet') || 
    rpcEndpoint.includes('api.mainnet-beta.solana.com')
  );
  
  // Default to devnet unless explicitly mainnet (since app defaults to devnet)
  return isMainnet ? 'mainnet-beta' : 'devnet';
}

/**
 * Generate explorer URL for a transaction signature
 */
export function getTransactionExplorerUrl(
  signature: string, 
  explorer: ExplorerType = 'explorer'
): string {
  const baseUrls: Record<ExplorerType, string> = {
    solscan: 'https://solscan.io',
    solanafm: 'https://solana.fm',
    explorer: 'https://explorer.solana.com'
  };
  
  const cluster = getSolanaCluster();
  
  // Only add cluster param for non-mainnet
  const clusterParam = cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : '';
  
  return `${baseUrls[explorer]}/tx/${signature}${clusterParam}`;
}

/**
 * Generate explorer URL for an account/address
 */
export function getAccountExplorerUrl(
  address: string, 
  explorer: ExplorerType = 'explorer'
): string {
  const baseUrls: Record<ExplorerType, string> = {
    solscan: 'https://solscan.io',
    solanafm: 'https://solana.fm',
    explorer: 'https://explorer.solana.com'
  };
  
  const cluster = getSolanaCluster();
  
  // Only add cluster param for non-mainnet
  const clusterParam = cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : '';
  
  return `${baseUrls[explorer]}/address/${address}${clusterParam}`;
}

/**
 * Get all explorer URLs for a transaction
 */
export function getAllTransactionExplorerUrls(signature: string): ExplorerUrls {
  return {
    solscan: getTransactionExplorerUrl(signature, 'solscan'),
    solanafm: getTransactionExplorerUrl(signature, 'solanafm'),
    explorer: getTransactionExplorerUrl(signature, 'explorer')
  };
}

/**
 * Get all explorer URLs for an account
 */
export function getAllAccountExplorerUrls(address: string): ExplorerUrls {
  return {
    solscan: getAccountExplorerUrl(address, 'solscan'),
    solanafm: getAccountExplorerUrl(address, 'solanafm'),
    explorer: getAccountExplorerUrl(address, 'explorer')
  };
}

