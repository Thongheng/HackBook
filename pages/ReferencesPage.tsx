import React, { useState } from 'react';
import { ExternalLink, Hash } from 'lucide-react';
import { referenceCategories, referenceTabs } from '../data/references';

export const ReferencesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredLinks = activeTab === 'All' 
    ? referenceCategories.flatMap(cat => cat.links.map(l => ({ ...l, category: cat.name, icon: cat.icon })))
    : referenceCategories
        .filter(cat => cat.name === activeTab)
        .flatMap(cat => cat.links.map(l => ({ ...l, category: cat.name, icon: cat.icon })));

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-center gap-2.5 border-b border-white/5 pb-6">
        {referenceTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all border ${
              activeTab === tab 
                ? 'bg-[#9fef00]/10 border-[#9fef00]/30 text-[#9fef00] shadow-[0_0_20px_rgba(159,239,0,0.05)]' 
                : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredLinks.map((link, idx) => (
          <a 
            key={`${link.category}-${idx}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="htb-card group p-6 flex flex-col h-full hover:translate-y-[-2px] transition-all relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-[#9fef00]/20 transition-colors">
                <link.icon className="w-5 h-5 text-white/40 group-hover:text-[#9fef00] transition-colors" />
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-2 flex-grow">
              <div className="text-[9px] font-bold text-[#9fef00] uppercase tracking-widest opacity-80">{link.category}</div>
              <h3 className="text-base font-bold text-white group-hover:text-[#9fef00] transition-colors leading-tight tracking-tight">
                {link.title}
              </h3>
              <p className="text-[12px] text-white/50 font-medium leading-relaxed tracking-tight line-clamp-2">
                {link.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-[8px] font-mono text-white/20 truncate block group-hover:text-white/40 transition-colors tracking-widest">
                {link.url.replace('https://', '').replace('www.', '').split('/')[0]}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};