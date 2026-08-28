import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  onOpenSearch: () => void;
}

const HackBookLogo = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#22D3EE" />
    <path d="M8 8H12V24H8V8Z" fill="black" />
    <path d="M14 8H24V10H14V8Z" fill="black" fillOpacity="0.8" />
    <path d="M14 12H21V14H14V12Z" fill="black" fillOpacity="0.8" />
    <path d="M14 16H24V18H14V16Z" fill="black" fillOpacity="0.8" />
    <rect x="14" y="20" width="5" height="4" fill="black" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tools', label: 'Tools' },
  { id: 'guides', label: 'Guides' },
  { id: 'reference', label: 'Reference' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, onOpenSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const isActive = (id: string) =>
    currentView === id || (id === 'tools' && currentView.startsWith('tool-'));

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 md:px-10 lg:px-16 pt-3">
      <nav
        style={{
          background: isDark ? 'rgba(11, 18, 23, 0.92)' : 'rgba(255,255,255,0.97)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(0,0,0,0.04)',
          borderRadius: '14px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="relative w-full max-w-[1440px] h-14 flex items-center px-5 gap-4"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          onClick={() => setView('dashboard')}
        >
          <HackBookLogo />
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
          >
            HackBook
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-5 w-px shrink-0"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        />

        {/* Nav Links — absolutely centered in the card */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{
                color: isActive(item.id)
                  ? (isDark ? '#ffffff' : '#0f172a')
                  : (isDark ? '#64748b' : '#64748b'),
                background: isActive(item.id)
                  ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                  : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive(item.id)) {
                  (e.currentTarget as HTMLElement).style.color = isDark ? '#cbd5e1' : '#1e293b';
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(item.id)) {
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {item.label}
              {isActive(item.id) && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full"
                  style={{ background: '#22d3ee' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            onClick={onOpenSearch}
            title="Search (Ctrl+K)"
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-sm font-medium transition-all"
            style={{
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#64748b' : '#94a3b8',
            }}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:block text-xs tracking-wide">Search</span>
            <span
              className="hidden lg:block text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }}
            >
              ⌘K
            </span>
          </button>

          <button
            id="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <span
              key={theme}
              style={{ display: 'inline-flex', animation: 'spin-in 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              {isDark
                ? <Sun className="w-3.5 h-3.5" style={{ color: '#facc15' }} />
                : <Moon className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
              }
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
