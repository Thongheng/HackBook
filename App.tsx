import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ToolsPage } from './pages/ToolsPage';
import { GuidesPage } from './pages/GuidesPage';
import { ReferencesPage } from './pages/ReferencesPage';
import { GlobalSearch } from './components/GlobalSearch';

type View = 'dashboard' | 'tools' | 'guides' | 'reference' | string;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchResultSelect = (type: 'tool' | 'guide' | 'reference', id: string | number) => {
    if (type === 'tool') {
      setCurrentView(id as string);
    } else if (type === 'guide') {
      // For guides, we route to the guides page. 
      // Enhanced: If guides page had specific routing we could pass state, 
      // but for now we navigate to the page.
      setCurrentView('guides');
    } else if (type === 'reference') {
      setCurrentView('reference');
    }
    setIsSearchOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setView={setCurrentView} />;
      case 'tools': return <ToolsPage setView={setCurrentView} />;
      case 'guides': return <GuidesPage />;
      case 'reference': return <ReferencesPage />;
      default:
        if (currentView.startsWith('tool-')) return <ToolsPage initialTool={currentView} setView={setCurrentView} />;
        return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar setView={setCurrentView} currentView={currentView} onOpenSearch={() => setIsSearchOpen(true)} />
      
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelect={handleSearchResultSelect} 
      />

      <main className="flex-1 pt-24 pb-20 px-6 md:px-10 lg:px-16">
        <div className="max-w-[1440px] mx-auto">
          {renderContent()}
        </div>
      </main>
      
      <footer className="py-12 border-t border-white/5 text-center">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
           &copy; 2025 HACKBOOK | AUTHORIZED ACCESS ONLY
         </p>
      </footer>
    </div>
  );
};

export default App;
