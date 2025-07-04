import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './components/WalletProvider';
import { Header } from './components/Header';
import { CrossChainMessageHandler } from './components/CrossChainMessageHandler';
import { Dashboard } from './pages/Dashboard';
import { Deposit } from './pages/Deposit';
import { Withdraw } from './pages/Withdraw';
import { Strategies } from './pages/Strategies';
import { Analytics } from './pages/Analytics';
import { Landing } from './pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          <div className="min-h-screen relative">
            {/* Global background effects */}
            <div className="fixed inset-0 gradient-bg"></div>
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute top-1/3 right-10 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-secondary-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
            </div>
            
            <Header />
            <CrossChainMessageHandler />
            
            <main className="relative z-10">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/strategies" element={<Strategies />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </main>
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
