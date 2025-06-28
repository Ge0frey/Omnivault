import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full gradient-bg flex items-center justify-center mb-8">
            <CurrencyDollarIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Connect your Solana wallet to access your OmniVault dashboard and start optimizing your yields.
          </p>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Overview of your cross-chain yield optimization portfolio
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Portfolio Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    $12,543.21
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Current APY
                  </dt>
                  <dd className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                    14.2%
                    <ArrowUpIcon className="h-4 w-4 text-success-600 ml-2" />
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    24h P&L
                  </dt>
                  <dd className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                    +$127.43
                    <ArrowUpIcon className="h-4 w-4 text-success-600 ml-2" />
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">5</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Positions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    5 Strategies
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/deposit"
                className="block w-full btn btn-primary text-center"
              >
                Deposit Funds
              </Link>
              <Link
                to="/withdraw"
                className="block w-full btn btn-secondary text-center"
              >
                Withdraw Funds
              </Link>
              <Link
                to="/strategies"
                className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View All Strategies
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Deposit</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Conservative Strategy</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">+$1,000</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Rebalance</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ethereum → Arbitrum</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success-600">+2.1% APY</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Yield Earned</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">All Strategies</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success-600">+$45.67</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Portfolio Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-primary-600 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Conservative Strategy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ethereum, Arbitrum</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">$5,234.12</p>
                <p className="text-sm text-success-600">+8.4% APY</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-success-600 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Moderate Strategy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Polygon, Avalanche</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">$4,567.89</p>
                <p className="text-sm text-success-600">+12.7% APY</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-warning-600 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Aggressive Strategy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Optimism, BSC</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">$2,741.20</p>
                <p className="text-sm text-success-600">+18.9% APY</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 