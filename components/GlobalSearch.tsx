import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Terminal, BookOpen, Share2, Command } from 'lucide-react';
import { tools } from '../data/tools';
import { guides } from '../data/guides';
import { referenceCategories } from '../data/references';

interface SearchResult {
  id: string;
  type: 'tool' | 'guide' | 'reference';
  title: string;
  description: string;
  originalId: string | number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'tool' | 'guide' | 'reference', id: string | number) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search Tools
    tools.forEach(tool => {
      if (tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || tool.tags.some(t => t.toLowerCase().includes(q))) {
        searchResults.push({
          id: `tool-${tool.id}`,
          type: 'tool',
          title: tool.name,
          description: tool.description,
          originalId: tool.id
        });
      }
    });

    // Search Guides
    guides.forEach((guide, idx) => {
      if (guide.title.toLowerCase().includes(q) || guide.description.toLowerCase().includes(q)) {
        searchResults.push({
          id: `guide-${idx}`,
          type: 'guide',
          title: guide.title,
          description: guide.description,
          originalId: idx
        });
      }
    });

    // Search References
    referenceCategories.forEach(cat => {
      cat.links.forEach((link, linkIdx) => {
        if (link.title.toLowerCase().includes(q) || link.desc.toLowerCase().includes(q)) {
          searchResults.push({
            id: `ref-${cat.name}-${linkIdx}`,
            type: 'reference',
            title: link.title,
            description: link.desc,
            originalId: 'reference' // References just go to the page
          });
        }
      });
    });

    setResults(searchResults.slice(0, 8));
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const res = results[selectedIndex];
      onSelect(res.type, res.originalId);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-[#0b1217] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-4 px-6 h-16 border-b border-white/5 bg-white/[0.02]">
          <Search className="w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-white/20 font-medium"
            placeholder="Search tactical modules, guides, or intel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-white/20 border border-white/10 px-1.5 py-0.5 rounded">ESC</span>
             <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
               <X className="w-5 h-5 text-white/40" />
             </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((res, idx) => (
                <button
                  key={res.id}
                  onClick={() => onSelect(res.type, res.originalId)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${
                    idx === selectedIndex ? 'bg-[#9fef00]/10 border border-[#9fef00]/20' : 'bg-transparent border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    idx === selectedIndex ? 'bg-[#9fef00]/20 text-[#9fef00]' : 'bg-white/5 text-white/20'
                  }`}>
                    {res.type === 'tool' && <Terminal className="w-5 h-5" />}
                    {res.type === 'guide' && <BookOpen className="w-5 h-5" />}
                    {res.type === 'reference' && <Share2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <h4 className={`text-sm font-bold tracking-tight truncate ${idx === selectedIndex ? 'text-[#9fef00]' : 'text-white'}`}>
                        {res.title}
                      </h4>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                        {res.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate font-medium mt-0.5">{res.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Search className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white font-bold tracking-tight">No intelligence found for "{query}"</p>
              <p className="text-xs text-white/30">Verify target spelling or try broader tactical keywords.</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 px-2">Recently Accessed / Quick Links</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onSelect('tool', 'tool-phpfilter')} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#9fef00]/20 transition-all text-left group">
                  <Terminal className="w-4 h-4 text-white/20 group-hover:text-[#9fef00]" />
                  <span className="text-xs font-bold text-white/60 group-hover:text-white">PHP Filter Chain</span>
                </button>
                <button onClick={() => onSelect('guide', 0)} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#9fef00]/20 transition-all text-left group">
                  <BookOpen className="w-4 h-4 text-white/20 group-hover:text-[#9fef00]" />
                  <span className="text-xs font-bold text-white/60 group-hover:text-white">TTY Upgrade</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/40">↑↓</kbd>
               <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Navigate</span>
             </div>
             <div className="flex items-center gap-1.5">
               <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/40">Enter</kbd>
               <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Execute</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Command className="w-3 h-3 text-[#9fef00]/40" />
             <span className="text-[9px] text-[#9fef00]/40 font-bold uppercase tracking-widest">Search Module v1.0</span>
           </div>
        </div>
      </div>
    </div>
  );
};
