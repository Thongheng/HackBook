import React from 'react';
import { Search } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  onOpenSearch: () => void;
}

const HackBookLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-105">
    <rect width="32" height="32" rx="6" fill="#9FEF00" />
    <path d="M8 8H12V24H8V8Z" fill="black" />
    <path d="M14 8H24V10H14V8Z" fill="black" fillOpacity="0.8" />
    <path d="M14 12H21V14H14V12Z" fill="black" fillOpacity="0.8" />
    <path d="M14 16H24V18H14V16Z" fill="black" fillOpacity="0.8" />
    <rect x="14" y="20" width="5" height="4" fill="black" className="animate-pulse" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, onOpenSearch }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05080a]/80 backdrop-blur-md px-6 md:px-12 lg:px-24 h-20 flex items-center justify-between border-b border-white/5">
      <div
        className="flex items-center gap-3.5 cursor-pointer group"
        onClick={() => setView('dashboard')}
      >
        <HackBookLogo />
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-white tracking-tight">HackBook</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-8 border-r border-white/5 pr-8 mr-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'tools', label: 'Tools' },
            { id: 'guides', label: 'Guides' },
            { id: 'reference', label: 'Reference' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`text-sm font-semibold transition-colors tracking-tight ${currentView === item.id || (item.id === 'tools' && currentView.startsWith('tool-'))
                ? 'text-[#9fef00]'
                : 'text-white/60 hover:text-white'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
        >
          <Search className="w-4 h-4 text-white/40 group-hover:text-white" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-white/20 group-hover:text-white/40 uppercase tracking-widest hidden sm:block">Search...</span>
            <div className="hidden lg:flex items-center gap-0.5 opacity-40 group-hover:opacity-60 transition-opacity">
              <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded border border-white/20 bg-black/20">CTRL</span>
              <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded border border-white/20 bg-black/20">K</span>
            </div>
          </div>
        </button>
      </div>
    </nav>
  );
};