import React, { useState, useEffect } from 'react';
import { ChecklistGenerator } from './tools/ChecklistGenerator';
import { KHQRTool } from './tools/KHQRTool';
import { BurpToPythonTool } from './tools/BurpToPythonTool';
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

  const handleBack = () => { setActiveToolId(null); if (setView) setView('tools'); };
  const handleSelectTool = (id: string) => { setActiveToolId(id); if (setView) setView(id); };
  const filteredTools = tools.filter(t => activeCategory === 'All' || t.category === activeCategory);
  const activeToolData = tools.find(t => t.id === activeToolId);

  if (activeToolId && activeToolData) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-6">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group" title="Back to Tools">
              <ArrowLeft className="w-4 h-4 htb-text-muted group-hover:htb-text transition-colors group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                <activeToolData.icon className="w-6 h-6 text-[#22d3ee]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold htb-text tracking-tight leading-none mb-1">{activeToolData.name}</h2>
                <p className="text-xs htb-text-faint font-medium tracking-tight">HackBook Offensive Intelligence / {activeToolData.category}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-md">
            <Hash className="w-3 h-3 text-[#22d3ee]/40" />
            <span className="text-[10px] font-mono htb-text-faint uppercase tracking-widest">{activeToolId}</span>
          </div>
        </div>

        <div className="relative min-h-[500px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a1117]/96 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-4">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] pointer-events-none" />
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#22d3ee]/5 blur-[90px] pointer-events-none" />
          {(() => {
            switch (activeToolId) {
              case 'tool-burp-converter': return <BurpToPythonTool />;
              case 'tool-checklist': return <ChecklistGenerator />;
              case 'tool-khqr': return <KHQRTool />;
              default: return <div className="htb-text-faint italic">Tool not found: {activeToolId}</div>;
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
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-tight rounded-md transition-all border ${activeCategory === cat ? 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.05)]' : 'bg-white/5 border-white/5 htb-text-faint hover:border-white/20 hover:htb-text-muted'}`}>
            {cat}
          </button>
        ))}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTools.map((tool) => (
          <div key={tool.id} onClick={() => handleSelectTool(tool.id)} className="htb-card p-6 group cursor-pointer hover:translate-y-[-2px] transition-all flex flex-col h-full relative overflow-hidden">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-5 border border-white/5 group-hover:border-[#22d3ee]/20 transition-colors">
              <tool.icon className="w-5 h-5 htb-text-faint group-hover:text-[#22d3ee] transition-colors" />
            </div>
            <div className="space-y-2.5 flex-grow">
              <h3 className="text-base font-bold htb-text tracking-tight group-hover:text-[#22d3ee] transition-colors leading-tight">{tool.name}</h3>
              <p className="text-[12px] htb-text-muted leading-relaxed font-medium tracking-tight">{tool.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
              {tool.tags.map(tag => (
                <span key={tag} className="text-[8px] font-bold htb-text-faint uppercase tracking-widest group-hover:htb-text-muted transition-colors">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
