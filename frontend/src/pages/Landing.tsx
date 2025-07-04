import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, GlobeAltIcon, SparklesIcon, ArrowPathIcon, CubeTransparentIcon, QuestionMarkCircleIcon, DocumentTextIcon, CurrencyDollarIcon, PlusIcon, ArrowDownIcon, ArrowUpIcon, EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Cross-Chain Optimization',
    description: 'Automatically optimize your yield across multiple blockchains using LayerZero V2 technology with intelligent routing and real-time monitoring.',
    icon: GlobeAltIcon,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Real-Time Analytics',
    description: 'Track your positions and performance with comprehensive analytics, advanced insights, and predictive yield forecasting.',
    icon: ChartBarIcon,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Secure & Audited',
    description: 'Built with security-first principles, audited smart contracts, and enterprise-grade infrastructure for peace of mind.',
    icon: ShieldCheckIcon,
    gradient: 'from-green-500 to-emerald-500'
  },
];

const howToSteps = [
  {
    step: 1,
    title: 'Connect Your Wallet',
    description: 'Connect your Solana wallet (Phantom, Solflare, etc.) to get started with OmniVault.',
    icon: CurrencyDollarIcon,
    page: 'Dashboard'
  },
  {
    step: 2,
    title: 'Create a Vault',
    description: 'Choose your risk profile (Conservative, Moderate, or Aggressive) and create your first vault.',
    icon: PlusIcon,
    page: 'Dashboard'
  },
  {
    step: 3,
    title: 'Deposit Funds',
    description: 'Deposit SOL or supported tokens into your vault to start earning optimized yields.',
    icon: ArrowDownIcon,
    page: 'Deposit'
  },
  {
    step: 4,
    title: 'Monitor Performance',
    description: 'Track your yields, analyze performance, and watch your investments grow across chains.',
    icon: EyeIcon,
    page: 'Analytics'
  },
  {
    step: 5,
    title: 'Withdraw Anytime',
    description: 'Access your funds whenever you need them with flexible withdrawal options.',
    icon: ArrowUpIcon,
    page: 'Withdraw'
  }
];

const faqs = [
  {
    question: 'What is OmniVault?',
    answer: 'OmniVault is a cross-chain yield optimization platform built on Solana using LayerZero V2. It automatically finds and moves your funds to the highest-yielding opportunities across multiple blockchains.'
  },
  {
    question: 'How does cross-chain optimization work?',
    answer: 'Our system continuously monitors yield opportunities across different blockchains and automatically rebalances your portfolio to maximize returns while managing risk according to your chosen profile.'
  },
  {
    question: 'What are the different risk profiles?',
    answer: 'Conservative focuses on stable yields with lower risk, Moderate balances risk and return, and Aggressive targets higher yields with increased risk exposure.'
  },
  {
    question: 'What tokens can I deposit?',
    answer: 'Currently, you can deposit SOL, USDC, and USDT. We plan to support additional tokens based on community feedback and market demand.'
  },
  {
    question: 'Are there any fees?',
    answer: 'Yes, there is a small performance fee on withdrawals to cover cross-chain operations and protocol maintenance. The exact fee is displayed before each transaction.'
  },
  {
    question: 'Is my money safe?',
    answer: 'Security is our top priority. Our smart contracts are audited, and we follow industry best practices. However, DeFi involves inherent risks, so please only invest what you can afford to lose.'
  },
  {
    question: 'Can I withdraw my funds anytime?',
    answer: 'Yes, you can withdraw your funds at any time. Withdrawals are subject to a small fee and may take a few minutes to process across chains.'
  },
  {
    question: 'How often does rebalancing occur?',
    answer: 'Our system monitors opportunities continuously and triggers rebalancing when significantly better yields are detected, typically optimizing for both returns and gas costs.'
  }
];

export const Landing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-bg"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-40 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-20 w-56 h-56 sm:w-80 sm:h-80 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl mobile-padding">
          <div className="relative py-16 sm:py-24 lg:py-32 xl:py-40">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-2 sm:px-4 rounded-full glass-effect border border-white/20 mb-6 sm:mb-8">
                <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 text-accent-500 mr-2" />
                <span className="text-xs sm:text-sm font-medium text-white">Powered by LayerZero V2</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                <span className="block">Cross-Chain Yield</span>
                <span className="block text-gradient mt-1 sm:mt-2">Optimization</span>
              </h1>
              
              <p className="mx-auto mt-6 sm:mt-8 max-w-3xl text-base sm:text-xl leading-7 sm:leading-8 text-gray-300 font-light px-4">
                Maximize your DeFi yields across multiple blockchains with OmniVault's intelligent 
                cross-chain optimization. Powered by LayerZero V2 for seamless omnichain experiences.
              </p>
              
              <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
                <Link
                  to="/dashboard"
                  className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 btn-accent text-base sm:text-lg font-semibold rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Launch App
                    <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <Link
                  to="/strategies"
                  className="group flex items-center justify-center text-base sm:text-lg font-semibold text-white hover:text-accent-400 transition-colors"
                >
                  View Strategies 
                  <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            {/* Floating elements - hidden on small screens for cleaner mobile experience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
              <div className="absolute top-20 left-10 w-20 h-20 glass-effect rounded-2xl animate-float flex items-center justify-center">
                <CubeTransparentIcon className="h-8 w-8 text-primary-400" />
              </div>
              <div className="absolute top-40 right-20 w-16 h-16 glass-effect rounded-xl animate-float flex items-center justify-center" style={{ animationDelay: '2s' }}>
                <ArrowPathIcon className="h-6 w-6 text-accent-500" />
              </div>
              <div className="absolute bottom-32 left-20 w-12 h-12 glass-effect rounded-lg animate-float flex items-center justify-center" style={{ animationDelay: '4s' }}>
                <SparklesIcon className="h-5 w-5 text-secondary-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative mobile-section">
        <div className="mx-auto max-w-7xl mobile-padding">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              How to Get Started
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 font-light max-w-3xl mx-auto px-4">
              Follow these simple steps to begin optimizing your yields across multiple blockchains
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
            {howToSteps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector Line - only show on large screens */}
                {index < howToSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-accent-500/50 to-transparent z-0"></div>
                )}
                
                <div className="card-elevated p-4 sm:p-6 text-center relative z-10 hover:scale-105 transition-all duration-300">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                      <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-accent-400 mb-2">{step.step}</div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{step.title}</h3>
                    <p className="text-sm text-gray-300 mb-3 sm:mb-4 leading-relaxed">{step.description}</p>
                    <Link
                      to={`/${step.page.toLowerCase()}`}
                      className="text-xs text-accent-400 hover:text-accent-300 transition-colors font-medium"
                    >
                      Go to {step.page} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative mobile-section">
        <div className="mx-auto max-w-7xl mobile-padding">
          <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">
              Why Choose OmniVault?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 font-light px-4">
              Experience the future of DeFi with our cutting-edge cross-chain yield optimization platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={feature.name} className="card-elevated p-6 sm:p-8 group hover:scale-105 transition-all duration-500">
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${feature.gradient} shadow-lg`}>
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="ml-3 sm:ml-4 text-lg sm:text-xl font-bold text-white">{feature.name}</h3>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-grow">{feature.description}</p>
                  
                  <div className="mt-4 sm:mt-6 flex items-center text-accent-400 text-sm font-medium group-hover:text-accent-300 transition-colors">
                    Learn more 
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative mobile-section">
        <div className="mx-auto max-w-4xl mobile-padding">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 py-2 sm:px-4 rounded-full glass-effect border border-white/20 mb-4 sm:mb-6">
              <QuestionMarkCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-accent-500 mr-2" />
              <span className="text-xs sm:text-sm font-medium text-white">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 font-light px-4">
              Everything you need to know about OmniVault and cross-chain yield optimization
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card-elevated overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-inset transition-all duration-200 hover:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 mr-3 sm:mr-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                          <span className="text-accent-400 font-bold text-xs sm:text-sm">{index + 1}</span>
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold text-white group-hover:text-accent-400 transition-colors pr-2">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDownIcon 
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                        openFaq === index ? 'transform rotate-180 text-accent-400' : ''
                      }`}
                    />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="ml-9 sm:ml-12 pt-2 border-t border-white/10">
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed mt-3 sm:mt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <div className="card-elevated p-4 sm:p-6">
              <DocumentTextIcon className="h-8 w-8 sm:h-12 sm:w-12 text-accent-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Still have questions?</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 px-4">
                Check out our documentation or reach out to our community for support.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button className="btn btn-accent text-sm w-full sm:w-auto">
                  View Documentation
                </button>
                <button className="btn btn-secondary text-sm w-full sm:w-auto">
                  Join Discord
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative mobile-section">
        <div className="mx-auto max-w-4xl mobile-padding">
          <div className="relative card-elevated p-8 sm:p-12 text-center overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-500/20 to-secondary-600/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">
                Start Optimizing Your Yields Today
              </h2>
              <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 font-light max-w-2xl mx-auto px-4">
                Connect your wallet and begin maximizing your DeFi returns across multiple blockchains 
                with intelligent automation and real-time optimization.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link
                  to="/dashboard"
                  className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 btn-accent text-base sm:text-lg font-semibold rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Get Started
                    <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <Link
                  to="/analytics"
                  className="group flex items-center justify-center text-base sm:text-lg font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  View Analytics
                  <ChartBarIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 