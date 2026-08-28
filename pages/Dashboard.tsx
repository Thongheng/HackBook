import React, { useState, useEffect } from 'react';
import {
  Star, Zap, BookOpen, Share2, Pin,
  ClipboardList, ExternalLink, Trash2, Code,
  Plus, X, Search, ArrowRight
} from 'lucide-react';
import { tools } from '../data/tools';
import { guides } from '../data/guides';
import { referenceCategories } from '../data/references';

interface DashboardProps {
  setView: (view: string) => void;
}

const LS_KEY = 'hackbook_favorites_v1';

interface FavTool { kind: 'tool'; id: string; name: string; category: string; }
interface FavGuide { kind: 'guide'; idx: number; title: string; category: string; }
interface FavRef { kind: 'ref'; url: string; title: string; category: string; }
type FavItem = FavTool | FavGuide | FavRef;

function loadFavs(): FavItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveFavs(f: FavItem[]) { localStorage.setItem(LS_KEY, JSON.stringify(f)); }

const TOOL_ICONS: Record<string, React.FC<any>> = {
  'tool-checklist': ClipboardList,
  'tool-burp-converter': Code,
};

const CAT_COLORS: Record<string, string> = {
  Web: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Auth: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  General: 'text-[#22d3ee] bg-[#22d3ee]/10 border-[#22d3ee]/20',
  Planning: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

// ─── Quick-add picker modal ────────────────────────────────────────────────────
const QuickAdd: React.FC<{ onAdd: (item: FavItem) => void; onClose: () => void; existingFavs: FavItem[] }> = ({ onAdd, onClose, existingFavs }) => {
  const [tab, setTab] = useState<'tools' | 'guides' | 'refs'>('tools');
  const [q, setQ] = useState('');

  const isToolFaved = (id: string) => existingFavs.some(f => f.kind === 'tool' && f.id === id);
  const isGuideFaved = (idx: number) => existingFavs.some(f => f.kind === 'guide' && f.idx === idx);
  const isRefFaved = (url: string) => existingFavs.some(f => f.kind === 'ref' && f.url === url);
  const allRefs = referenceCategories.flatMap(cat => cat.links.map(l => ({ ...l, category: cat.name })));

  const filteredTools = tools.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  const filteredGuides = guides.map((g, i) => ({ ...g, idx: i })).filter(g => g.title.toLowerCase().includes(q.toLowerCase()));
  const filteredRefs = allRefs.filter(r => r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--htb-surface)', border: '1px solid var(--htb-border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
          <h3 className="text-sm font-bold htb-text tracking-tight">Pin to Favorites</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 htb-text-muted" />
          </button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 htb-text-faint" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-sm htb-text-muted placeholder-htb-text-faint focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30" />
          </div>
        </div>
        <div className="flex border-b border-white/5 px-5">
          {(['tools', 'guides', 'refs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors -mb-px ${tab === t ? 'border-[#22d3ee] text-[#22d3ee]' : 'border-transparent htb-text-faint hover:htb-text-muted'}`}>
              {t === 'refs' ? 'Refs' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="max-h-60 overflow-y-auto px-3 py-2 space-y-0.5">
          {tab === 'tools' && filteredTools.map(tool => {
            const faved = isToolFaved(tool.id);
            return (
              <button key={tool.id} disabled={faved} onClick={() => { onAdd({ kind: 'tool', id: tool.id, name: tool.name, category: tool.category }); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${faved ? 'opacity-30 cursor-default' : 'hover:bg-white/[0.04] cursor-pointer'}`}>
                <span className="text-[12px] htb-text-muted font-medium">{tool.name}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${CAT_COLORS[tool.category] || 'htb-text-faint bg-white/5 border-white/10'}`}>{faved ? 'Pinned' : tool.category}</span>
              </button>
            );
          })}
          {tab === 'guides' && filteredGuides.map(g => {
            const faved = isGuideFaved(g.idx);
            return (
              <button key={g.idx} disabled={faved} onClick={() => { onAdd({ kind: 'guide', idx: g.idx, title: g.title, category: g.category }); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${faved ? 'opacity-30 cursor-default' : 'hover:bg-white/[0.04] cursor-pointer'}`}>
                <span className="text-[12px] htb-text-muted font-medium">{g.title}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-slate-400 bg-slate-500/10 border-slate-500/20">{faved ? 'Pinned' : g.category}</span>
              </button>
            );
          })}
          {tab === 'refs' && filteredRefs.map(r => {
            const faved = isRefFaved(r.url);
            return (
              <button key={r.url} disabled={faved} onClick={() => { onAdd({ kind: 'ref', url: r.url, title: r.title, category: r.category }); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${faved ? 'opacity-30 cursor-default' : 'hover:bg-white/[0.04] cursor-pointer'}`}>
                <span className="text-[12px] htb-text-muted font-medium">{r.title}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/20">{faved ? 'Pinned' : r.category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Favorite card — styled like old tool cards ────────────────────────────────
const FavCard: React.FC<{ item: FavItem; onRemove: () => void; onClick: () => void }> = ({ item, onRemove, onClick }) => {
  let IconEl: React.FC<any>;
  let label: string;
  let sub: string;
  let iconColor: string;
  let tagLabel: string;

  if (item.kind === 'tool') {
    IconEl = TOOL_ICONS[item.id] || Zap;
    label = item.name; sub = item.category; tagLabel = item.category;
    iconColor = CAT_COLORS[item.category] || 'htb-text-faint bg-white/5 border-white/10';
  } else if (item.kind === 'guide') {
    IconEl = BookOpen;
    label = item.title; sub = item.category; tagLabel = 'Guide';
    iconColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  } else {
    IconEl = ExternalLink;
    label = item.title; sub = item.category; tagLabel = 'Reference';
    iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }

  return (
    <div onClick={onClick}
      className="htb-card p-6 group cursor-pointer hover:translate-y-[-2px] transition-all flex flex-col h-full relative overflow-hidden hover:border-[#22d3ee]/20">
      {/* remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 htb-text-faint transition-all z-10">
        <Trash2 className="w-3 h-3" />
      </button>

      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 border ${iconColor} group-hover:scale-110 transition-transform`}>
        <IconEl className="w-5 h-5" />
      </div>

      <div className="space-y-2 flex-grow">
        <h3 className="text-base font-bold htb-text tracking-tight group-hover:text-[#22d3ee] transition-colors leading-tight">{label}</h3>
        <p className="text-[12px] htb-text-faint font-medium tracking-tight capitalize">{sub}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[8px] font-bold htb-text-faint uppercase tracking-widest group-hover:htb-text-muted transition-colors">#{tagLabel}</span>
        {item.kind === 'ref' && <ExternalLink className="w-3 h-3 htb-text-faint group-hover:text-[#22d3ee]/50 transition-colors" />}
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [favs, setFavs] = useState<FavItem[]>(loadFavs);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { saveFavs(favs); }, [favs]);

  const addFav = (item: FavItem) => { setFavs(prev => [...prev, item]); setShowPicker(false); };
  const removeFav = (idx: number) => setFavs(prev => prev.filter((_, i) => i !== idx));

  const handleFavClick = (item: FavItem) => {
    if (item.kind === 'tool') setView(item.id);
    if (item.kind === 'guide') setView('guides');
    if (item.kind === 'ref') window.open(item.url, '_blank', 'noopener noreferrer');
  };

  return (
    <div className="space-y-16 py-8">
      {showPicker && <QuickAdd onAdd={addFav} onClose={() => setShowPicker(false)} existingFavs={favs} />}

      {/* Header — minimal status line + title */}
      <section className="space-y-5 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3ee]"></span>
          </span>
          <span className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-widest">HackBook Terminal: Online</span>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold htb-text tracking-tight leading-tight">
            Welcome <span className="htb-text-faint">Hacker</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium tracking-tight text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Pinned Favorites */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pin className="w-4 h-4 text-[#22d3ee]/60" />
            <h2 className="text-lg font-bold htb-text tracking-tight">Pinned Favorites</h2>
            {favs.length > 0 && (
              <span className="text-[10px] font-bold htb-text-faint bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">{favs.length}</span>
            )}
          </div>
          <button onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 htb-text-muted font-bold rounded-lg hover:bg-white/10 hover:htb-text transition-all text-[11px] uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" /> Pin Item
          </button>
        </div>

        {favs.length === 0 ? (
          <div onClick={() => setShowPicker(true)}
            className="htb-card border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#22d3ee]/20 hover:bg-[#22d3ee]/[0.015] transition-all group">
            <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#22d3ee]/20 transition-colors">
              <Star className="w-6 h-6 htb-text-faint group-hover:text-[#22d3ee]/40 transition-colors" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold htb-text-faint">No favorites pinned yet</p>
              <p className="text-[12px] htb-text-faint">Pin tools, guides, or references for fast access during engagements.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#22d3ee]/50 group-hover:text-[#22d3ee] transition-colors uppercase tracking-widest">
              <Plus className="w-3.5 h-3.5" /> Pin your first item
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {favs.map((item, i) => (
              <FavCard key={i} item={item} onRemove={() => removeFav(i)} onClick={() => handleFavClick(item)} />
            ))}
            <div onClick={() => setShowPicker(true)}
              className="htb-card border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#22d3ee]/20 hover:bg-[#22d3ee]/[0.015] transition-all group min-h-[140px]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#22d3ee]/20 transition-colors">
                <Plus className="w-5 h-5 htb-text-faint group-hover:text-[#22d3ee]/50 transition-colors" />
              </div>
              <span className="text-[10px] font-bold htb-text-faint group-hover:htb-text-muted uppercase tracking-widest transition-colors">Add Item</span>
            </div>
          </div>
        )}
      </section>

      {/* Navigation cards — the 3 pillars as large clickable entries */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-8">
        {[
          {
            title: 'Tooling',
            icon: Zap,
            color: 'bg-[#22d3ee]/10 text-[#22d3ee]',
            border: 'hover:border-[#22d3ee]/30',
            glow: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.06)]',
            badge: `${tools.length} tools`,
            badgeColor: 'text-[#22d3ee]/60 bg-[#22d3ee]/8 border-[#22d3ee]/15',
            desc: 'Exploit generators, encoders, payload builders.',
            action: () => setView('tools'),
          },
          {
            title: 'Guides',
            icon: BookOpen,
            color: 'bg-blue-500/10 text-blue-400',
            border: 'hover:border-blue-500/25',
            glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]',
            badge: `${guides.length} guides`,
            badgeColor: 'text-blue-400/60 bg-blue-500/8 border-blue-500/15',
            desc: 'PTY upgrades, pivoting, AD exploitation.',
            action: () => setView('guides'),
          },
          {
            title: 'References',
            icon: Share2,
            color: 'bg-purple-500/10 text-purple-400',
            border: 'hover:border-purple-500/25',
            glow: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.06)]',
            badge: `${referenceCategories.reduce((a, c) => a + c.links.length, 0)}+ links`,
            badgeColor: 'text-purple-400/60 bg-purple-500/8 border-purple-500/15',
            desc: 'Cheatsheets, CVE write-ups, OSINT resources.',
            action: () => setView('reference'),
          },
        ].map((f, i) => (
          <div key={i} onClick={f.action}
            className={`htb-card p-8 space-y-5 transition-all group cursor-pointer ${f.border} ${f.glow} hover:translate-y-[-2px]`}>
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} border border-current/10 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${f.badgeColor} uppercase tracking-widest`}>{f.badge}</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold htb-text tracking-tight">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium tracking-tight">{f.desc}</p>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold htb-text-faint group-hover:htb-text-muted uppercase tracking-widest transition-colors">
              Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
