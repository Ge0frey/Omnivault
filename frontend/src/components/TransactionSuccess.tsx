import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';

interface TransactionSuccessProps {
  signature: string;
  title?: string;
  description?: string;
  onClose?: () => void;
}

export const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  signature,
  title = "Transaction Successful",
  description = "Your transaction has been confirmed on the Solana blockchain.",
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy signature:', err);
    }
  };

  const formatSignature = (sig: string) => {
    if (sig.length < 16) return sig;
    return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
  };

  const getExplorerUrl = (explorer: string) => {
    const baseUrls = {
      solscan: 'https://solscan.io',
      solanafm: 'https://solana.fm',
      explorer: 'https://explorer.solana.com'
    };
    
    // Determine network parameter based on environment
    const isDevnet = import.meta.env.DEV;
    const networkParam = isDevnet ? '?cluster=devnet' : '';
    
    return `${baseUrls[explorer as keyof typeof baseUrls]}/tx/${signature}${networkParam}`;
  };

  return (
    <div className="card border border-green-500/30 bg-green-500/5 relative overflow-hidden">
      {/* Success gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-sm"></div>
      
      <div className="relative z-10 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-300 mb-6">
              {description}
            </p>
            
            {/* Transaction Signature */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Transaction Signature
                  </label>
                  <div className="flex items-center space-x-3">
                    <code className="text-sm font-mono text-gray-200 break-all flex-1">
                      {formatSignature(signature)}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      title="Copy full signature"
                    >
                      {copied ? (
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-400" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Explorer Links */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-3">
                View on Explorer
              </label>
              <div className="flex flex-wrap gap-3">
                <a
                  href={getExplorerUrl('solscan')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 group"
                >
                  Solscan
                  <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <a
                  href={getExplorerUrl('solanafm')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-300 group"
                >
                  Solana FM
                  <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <a
                  href={getExplorerUrl('explorer')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-all duration-300 group"
                >
                  Solana Explorer
                  <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Close Button */}
            {onClose && (
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-green-300 hover:text-green-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 