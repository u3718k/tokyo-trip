import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Tab } from './types';
import PlanView from './components/PlanView';
import GuideView from './components/GuideView';
import RateView from './components/RateView';
import ListsView from './components/ListsView';
import BookingsView from './components/BookingsView';
import BottomNav from './components/BottomNav';
import { TripProvider, useTripContext } from './contexts/TripContext';
import { Loader2, Cloud, AlertTriangle } from 'lucide-react';

// Simple Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-100 text-stone-600 text-center">
          <h2 className="text-2xl font-bold mb-4 text-stone-800">發生錯誤</h2>
          <p className="mb-4 text-sm">很抱歉，應用程式發生了預期外的錯誤。</p>
          <pre className="bg-white p-4 rounded-lg text-xs text-left overflow-auto w-full max-w-sm mb-6 border border-red-200 text-red-500">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-stone-800 text-white rounded-xl font-bold"
          >
            重新整理網頁
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { isLoading, error, isCloudMode } = useTripContext();
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.PLAN);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  if (isLoading) {
      return (
          <div className="min-h-screen bg-muji-bg flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm font-medium tracking-widest">載入行程資料中...</p>
          </div>
      );
  }

  const handleNavigate = (tab: Tab, targetId?: string) => {
    setCurrentTab(tab);
    if (targetId) {
      setHighlightId(targetId);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    setHighlightId(null);
  };

  const renderContent = () => {
    switch (currentTab) {
      case Tab.PLAN: return <PlanView onNavigate={handleNavigate} />;
      case Tab.GUIDE: return <GuideView highlightId={highlightId} />;
      case Tab.RATE: return <RateView />;
      case Tab.BOOKINGS: return <BookingsView highlightId={highlightId} />;
      case Tab.LISTS: return <ListsView />;
      default: return <PlanView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-muji-bg font-sans text-muji-text selection:bg-stone-200">
      <header className="sticky top-0 bg-muji-bg/80 backdrop-blur-sm z-40 px-6 pt-12 pb-2">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold tracking-widest text-stone-700 flex items-center gap-2">
                    Tokyo Trip 2025
                    {isCloudMode && <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" title="已連線同步"></div>}
                </h1>
                <div className="flex items-center gap-2">
                    {isCloudMode && (
                         <span className="text-[10px] text-sky-600 font-bold bg-sky-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Cloud size={10} /> 雲端同步中
                        </span>
                    )}
                    {error && (
                        <span className="text-[10px] text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle size={10} /> 連線錯誤
                        </span>
                    )}
                </div>
            </div>
        </div>
      </header>
      
      <main className="max-w-md mx-auto min-h-screen relative">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
      
      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      <div className="h-safe-bottom" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </ErrorBoundary>
  );
};

export default App;