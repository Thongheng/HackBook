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
      <aside className="w-full lg:w-80 shrink-0 space-y-8 p-2 rounded-xl lg:border-none" style={{ background: 'var(--htb-surface)', border: '1px solid var(--htb-border)' }}>
        <div className="space-y-6 lg:p-4 lg:rounded-xl" style={{ background: 'var(--htb-surface)' }}>
          {categories.map(cat => (
            <div key={cat} className="space-y-2">
              <h4 className="text-[10px] font-bold htb-text-faint uppercase tracking-[0.2em] px-3 mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--htb-border)' }} />
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
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all group ${activeGuideId === guide.originalIndex
                        ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20'
                        : 'htb-text-muted htb-hover border border-transparent'
                        }`}
                    >
                      <span className="truncate pr-2">{guide.title}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${activeGuideId === guide.originalIndex ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                        }`} />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 htb-card border-dashed">
          <p className="text-[10px] htb-text-faint leading-relaxed italic">
            Select a tactic from the manifest to view deployment instructions and shell commands.
          </p>
        </div>
      </aside>

      {/* Guide Content Area */}
      <main className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8" style={{ borderColor: 'var(--htb-border)' }}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#22d3ee]/5 border border-[#22d3ee]/20 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.05)]">
              <activeGuide.icon className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#22d3ee] opacity-40" />
                <h1 className="text-2xl font-extrabold htb-text tracking-tight leading-none">
                  {activeGuide.title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold htb-text-faint uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: 'var(--htb-overlay)', border: '1px solid var(--htb-overlay-border)' }}>
                  {activeGuide.category}
                </span>
                <span className="text-[10px] font-mono text-[#22d3ee]/60 uppercase tracking-widest">
                  REF: OPSEC-{100 + activeGuideId}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold htb-text uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 htb-text-muted" />
              Operational Briefing
            </h3>
            <p className="text-sm htb-text-muted leading-relaxed font-medium tracking-tight max-w-4xl">
              {activeGuide.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold htb-text uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4 htb-text-muted" />
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


        </div>
      </main>
    </div>
  );
};