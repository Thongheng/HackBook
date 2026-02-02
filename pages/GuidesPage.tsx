import React, { useState } from 'react';
import { Hash, ChevronRight, BookOpen, Terminal, Share2, Monitor } from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';
import { guides } from '../data/guides';

export const GuidesPage: React.FC = () => {
  const [activeGuideId, setActiveGuideId] = useState<number>(0);

  const activeGuide = guides[activeGuideId];

  // Grouping guides by category for the sidebar
  const categories = Array.from(new Set(guides.map(g => g.category)));

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[70vh]">
      {/* Guides Sidebar */}
      <aside className="w-full lg:w-80 shrink-0 space-y-8 bg-[#05080a] p-2 rounded-xl border border-white/5 lg:border-none lg:bg-transparent">
        <div className="space-y-6 lg:bg-[#05080a] lg:p-4 lg:rounded-xl lg:border lg:border-white/5">
          {categories.map(cat => (
            <div key={cat} className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                {cat}
              </h4>
              <div className="space-y-1">
                {guides
                  .map((g, idx) => ({ ...g, originalIndex: idx }))
                  .filter(g => g.category === cat)
                  .map((guide) => (
                    <button
                      key={guide.originalIndex}
                      onClick={() => setActiveGuideId(guide.originalIndex)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all group ${
                        activeGuideId === guide.originalIndex
                          ? 'bg-[#9fef00]/10 text-[#9fef00] border border-[#9fef00]/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <span className="truncate pr-2">{guide.title}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${
                        activeGuideId === guide.originalIndex ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                      }`} />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 htb-card border-dashed border-white/5 bg-[#05080a]">
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            Select a tactic from the manifest to view deployment instructions and shell commands.
          </p>
        </div>
      </aside>

      {/* Guide Content Area */}
      <main className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#9fef00]/5 border border-[#9fef00]/20 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(159,239,0,0.05)]">
              <activeGuide.icon className="w-6 h-6 text-[#9fef00]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#9fef00] opacity-40" />
                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
                  {activeGuide.title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                  {activeGuide.category}
                </span>
                <span className="text-[10px] font-mono text-[#9fef00]/60 uppercase tracking-widest">
                  REF: OPSEC-{100 + activeGuideId}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              Operational Briefing
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium tracking-tight max-w-4xl">
              {activeGuide.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500" />
              Deployment Sequence
            </h3>
            <div className="max-w-[1000px]">
              <CodeBlock 
                code={activeGuide.code} 
                language={activeGuide.language as any} 
                title={`${activeGuide.title} Console Output`} 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="inline-flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl max-w-2xl">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.2em]">OPSEC Critical Alert</p>
                <p className="text-xs text-rose-300/60 leading-relaxed">
                  Always verify payload signatures and destination routing before execution. Ensure all tunneling sessions are terminated post-engagement to prevent persistent backdoors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};