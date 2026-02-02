import React, { useState, useEffect } from 'react';
import { CSRFTool } from './tools/CSRFTool';
import { JWTTool } from './tools/JWTTool';
import { DataEncodingTool } from './tools/DataEncodingTool';
import { PHPFilterChainTool } from './tools/PHPFilterChainTool';
import { MSFVenomBuilder } from './tools/MSFVenomBuilder';
import { XSSTool } from './tools/XSSTool';
import { tools, toolCategories } from '../data/tools';
import { ArrowLeft, Hash } from 'lucide-react';

interface ToolsPageProps {
  initialTool?: string;
  setView?: (view: string) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ initialTool, setView }) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(initialTool?.startsWith('tool-') ? initialTool : null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (initialTool?.startsWith('tool-')) {
      setActiveToolId(initialTool);
    } else if (initialTool === 'tools') {
      setActiveToolId(null);
    }
  }, [initialTool]);

  const handleBack = () => {
    setActiveToolId(null);
    if (setView) setView('tools');
  };

  const handleSelectTool = (id: string) => {
    setActiveToolId(id);
    if (setView) setView(id);
  };

  const filteredTools = tools.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesCategory;
  });

  const activeToolData = tools.find(t => t.id === activeToolId);

  if (activeToolId && activeToolData) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
              title="Back to Tools"
            >
              <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white transition-colors group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#9fef00]/10 border border-[#9fef00]/20 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(159,239,0,0.05)]">
                <activeToolData.icon className="w-6 h-6 text-[#9fef00]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
                  {activeToolData.name}
                </h2>
                <p className="text-xs text-white/40 font-medium tracking-tight">
                  HackBook Offensive Intelligence / {activeToolData.category}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-md">
            <Hash className="w-3 h-3 text-[#9fef00]/40" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{activeToolId}</span>
          </div>
        </div>

        <div className="htb-card p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
          {/* Subtle background ambient light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9fef00]/5 blur-[100px] -z-10 rounded-full" />
          
          {(() => {
            switch (activeToolId) {
              case 'tool-csrf': return <CSRFTool />;
              case 'tool-jwt': return <JWTTool />;
              case 'tool-encoding': return <DataEncodingTool />;
              case 'tool-phpfilter': return <PHPFilterChainTool />;
              case 'tool-msfvenom': return <MSFVenomBuilder />;
              case 'tool-xss': return <XSSTool />;
              default: return <div className="text-white/20 italic">Tool logic not found for {activeToolId}</div>;
            }
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-center gap-2.5 border-b border-white/5 pb-6">
        {toolCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all border ${
              activeCategory === cat 
                ? 'bg-[#9fef00]/10 border-[#9fef00]/30 text-[#9fef00] shadow-[0_0_20px_rgba(159,239,0,0.05)]' 
                : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => handleSelectTool(tool.id)}
            className="htb-card p-6 group cursor-pointer hover:translate-y-[-2px] transition-all flex flex-col h-full relative overflow-hidden"
          >
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-5 border border-white/5 group-hover:border-[#9fef00]/20 transition-colors">
              <tool.icon className="w-5 h-5 text-white/40 group-hover:text-[#9fef00] transition-colors" />
            </div>
            
            <div className="space-y-2.5 flex-grow">
              <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#9fef00] transition-colors leading-tight">
                {tool.name}
              </h3>
              <p className="text-[12px] text-white/50 leading-relaxed font-medium tracking-tight">
                {tool.description}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
              {tool.tags.map(tag => (
                <span key={tag} className="text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};