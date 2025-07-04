import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, GlobeAltIcon, SparklesIcon, ArrowPathIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

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

const stats = [
  { label: 'Total Value Locked', value: '$12.4M', change: '+23.4%' },
  { label: 'Active Users', value: '5,247', change: '+18.2%' },
  { label: 'Supported Chains', value: '12', change: '+3' },
  { label: 'Average APY', value: '15.8%', change: '+2.3%' },
];

export const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-bg"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative py-24 sm:py-32 lg:py-40">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect border border-white/20 mb-8">
                <SparklesIcon className="h-4 w-4 text-accent-500 mr-2" />
                <span className="text-sm font-medium text-white">Powered by LayerZero V2</span>
              </div>

              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white mb-6">
                <span className="block">Cross-Chain Yield</span>
                <span className="block text-gradient mt-2">Optimization</span>
              </h1>
              
              <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-gray-300 font-light">
                Maximize your DeFi yields across multiple blockchains with OmniVault's intelligent 
                cross-chain optimization. Powered by LayerZero V2 for seamless omnichain experiences.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/dashboard"
                  className="group relative px-8 py-4 btn-accent text-lg font-semibold rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center">
                    Launch App
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <Link
                  to="/strategies"
                  className="group flex items-center text-lg font-semibold text-white hover:text-accent-400 transition-colors"
                >
                  View Strategies 
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* Stats Section */}
      <div className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by DeFi Users Worldwide
            </h2>
            <p className="text-xl text-gray-300 font-light">
              Join thousands of users optimizing their yields across chains
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={stat.label} className="stat-card group">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-400 mb-2">{stat.label}</div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs font-medium">
                    <ArrowRightIcon className="h-3 w-3 mr-1 rotate-[-45deg]" />
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Why Choose OmniVault?
            </h2>
            <p className="text-xl text-gray-300 font-light">
              Experience the future of DeFi with our cutting-edge cross-chain yield optimization platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.name} className="card-elevated p-8 group hover:scale-105 transition-all duration-500">
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient} shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="ml-4 text-xl font-bold text-white">{feature.name}</h3>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed flex-grow">{feature.description}</p>
                  
                  <div className="mt-6 flex items-center text-accent-400 text-sm font-medium group-hover:text-accent-300 transition-colors">
                    Learn more 
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative card-elevated p-12 text-center overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-500/20 to-secondary-600/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Start Optimizing Your Yields Today
              </h2>
              <p className="text-xl text-gray-300 mb-8 font-light max-w-2xl mx-auto">
                Connect your wallet and begin maximizing your DeFi returns across multiple blockchains 
                with intelligent automation and real-time optimization.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/dashboard"
                  className="group relative px-8 py-4 btn-accent text-lg font-semibold rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <Link
                  to="/analytics"
                  className="group flex items-center text-lg font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  View Analytics
                  <ChartBarIcon className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 