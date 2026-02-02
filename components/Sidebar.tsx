
import React from 'react';
import { LayoutGrid, Terminal, BookOpen, Share2, Settings, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'tools', label: 'OffSec Tools', icon: Terminal },
    { id: 'guides', label: 'Guides', icon: BookOpen },
    { id: 'reference', label: 'Reference', icon: Share2 },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800 bg-[#070b10] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Core Platform</p>
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  currentView === item.id 
                    ? 'bg-[#9fef00]/10 text-[#9fef00]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-[#9fef00]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quick Tools</p>
          <div className="space-y-1">
            <button onClick={() => setView('tool-csrf')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              CSRF Generator
            </button>
            <button onClick={() => setView('tool-jwt')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              JWT Exploit
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
          <Settings className="w-4 h-4 text-slate-500" />
          Platform Settings
        </button>
      </div>
    </aside>
  );
};
