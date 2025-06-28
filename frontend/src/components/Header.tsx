import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Deposit', href: '/deposit' },
  { name: 'Withdraw', href: '/withdraw' },
  { name: 'Strategies', href: '/strategies' },
  { name: 'Analytics', href: '/analytics' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">OV</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gradient">OmniVault</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cross-Chain Yield Optimizer</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton />
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-300'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}; 