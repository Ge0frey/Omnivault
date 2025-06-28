import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChartBarIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Cross-Chain Optimization',
    description: 'Automatically optimize your yield across multiple blockchains using LayerZero V2 technology.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Real-Time Analytics',
    description: 'Track your positions and performance with comprehensive analytics and insights.',
    icon: ChartBarIcon,
  },
  {
    name: 'Secure & Audited',
    description: 'Built with security-first principles and audited smart contracts for peace of mind.',
    icon: ShieldCheckIcon,
  },
];

export const Landing = () => {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="gradient-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative py-24 sm:py-32 lg:py-40">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Cross-Chain Yield
                  <br />
                  <span className="text-primary-200">Optimization</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-100">
                  Maximize your DeFi yields across multiple blockchains with OmniVault's intelligent 
                  cross-chain optimization powered by LayerZero V2.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/dashboard"
                    className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
                  >
                    Launch App
                  </Link>
                  <Link
                    to="/strategies"
                    className="text-sm font-semibold leading-6 text-white hover:text-primary-200 flex items-center gap-2 transition-colors"
                  >
                    View Strategies <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
                <div className="absolute top-40 right-20 w-16 h-16 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why Choose OmniVault?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Experience the future of DeFi with our cutting-edge cross-chain yield optimization platform.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-50 dark:bg-gray-800 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Trusted by DeFi Users Worldwide
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Join thousands of users optimizing their yields across chains
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-white dark:bg-gray-700 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">Total Value Locked</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">$2.4M</dd>
              </div>
              <div className="flex flex-col bg-white dark:bg-gray-700 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">Active Users</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">1,247</dd>
              </div>
              <div className="flex flex-col bg-white dark:bg-gray-700 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">Supported Chains</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">8</dd>
              </div>
              <div className="flex flex-col bg-white dark:bg-gray-700 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">Average APY</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">12.5%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden gradient-bg px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start Optimizing Your Yields Today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Connect your wallet and begin maximizing your DeFi returns across multiple blockchains.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/dashboard"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 