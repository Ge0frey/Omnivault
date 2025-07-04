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
          <div className="flex w-full items-center justify-between py-3 sm:py-4">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center group">
                <div className="flex-shrink-0 relative">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-primary-500/25 group-hover:scale-105">
                    <span className="text-white font-bold text-sm sm:text-lg">OV</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-500/20 to-primary-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="ml-2 sm:ml-4 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gradient tracking-tight truncate">OmniVault</h1>
                  <p className="text-xs text-gray-400 font-medium tracking-wide hidden sm:block">Cross-Chain Yield Optimizer</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-3 xl:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group ${
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
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="wallet-button-container hidden sm:block">
                <WalletMultiButton />
              </div>
              
              {/* Mobile wallet button - smaller */}
              <div className="wallet-button-container sm:hidden">
                <WalletMultiButton />
              </div>
              
              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  className="relative p-2 sm:p-2.5 rounded-lg glass-effect border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 touch-target"
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-sm glass-effect border-l border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg glass-effect border border-white/10 text-gray-300 hover:text-white transition-colors touch-target"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile wallet button in menu */}
            <div className="mb-6 sm:hidden">
              <div className="wallet-button-container w-full">
                <WalletMultiButton />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative block px-4 py-3 sm:py-4 rounded-lg text-base sm:text-sm font-medium transition-all duration-300 touch-target ${
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

            {/* Mobile menu footer */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2">OmniVault</p>
                <p className="text-xs text-gray-500">Cross-Chain Yield Optimizer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20"></div>
    </>
  );
}; 