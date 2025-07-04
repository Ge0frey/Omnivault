import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-white/10">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="flex-shrink-0 relative">
                  <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-primary-500/25 group-hover:scale-105">
                    <span className="text-white font-bold text-lg">OV</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-500/20 to-primary-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gradient tracking-tight">OmniVault</h1>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">Cross-Chain Yield Optimizer</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group ${
                    isActive(item.href)
                      ? 'text-white bg-white/10 shadow-lg border border-white/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  {isActive(item.href) && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-sm"></div>
                  )}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ))}
            </div>

            {/* Wallet Button & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <div className="wallet-button-container">
                <WalletMultiButton />
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  type="button"
                  className="relative p-2.5 rounded-lg glass-effect border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-64 glass-effect border-l border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg glass-effect border border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-white bg-white/10 border border-white/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="relative z-10">{item.name}</span>
                  {isActive(item.href) && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-sm"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-20"></div>
    </>
  );
}; 