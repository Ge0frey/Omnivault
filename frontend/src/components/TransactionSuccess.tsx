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
    <div className="card p-6 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-green-900 dark:text-green-200">
            {title}
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {description}
          </p>
          
          {/* Transaction Signature */}
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Transaction Signature
                </label>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                    {formatSignature(signature)}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy full signature"
                  >
                    {copied ? (
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Explorer Links */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              View on Explorer
            </label>
            <div className="flex flex-wrap gap-2">
              <a
                href={getExplorerUrl('solscan')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Solscan
                <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
              </a>
              <a
                href={getExplorerUrl('solanafm')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                Solana FM
                <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
              </a>
              <a
                href={getExplorerUrl('explorer')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Solana Explorer
                <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="text-sm font-medium text-green-700 hover:text-green-600 dark:text-green-300 dark:hover:text-green-400"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 