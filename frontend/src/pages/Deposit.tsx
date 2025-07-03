import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ArrowDownIcon, PlusIcon } from '@heroicons/react/24/outline';

export const Deposit = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deposit</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Deposit funds into OmniVault strategies
          </p>
        </div>
        <div className="mt-8 card p-8 max-w-2xl mx-auto">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Deposit functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};
