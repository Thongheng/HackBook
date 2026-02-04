import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group bg-[#0a0f16]/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl transition-all group-hover:border-[#9fef00]/20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#9fef00]/60" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/5 rounded-md transition-all active:scale-90"
          title="Copy command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#9fef00]" /> : <Copy className="w-3.5 h-3.5 text-white/20 hover:text-white/60" />}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        <pre className="font-mono text-sm text-[#9fef00]/80 leading-relaxed">
          <code>
            {code.split('\n').map((line, i) => (
              <div key={i} className={line.trim().startsWith('#') ? 'text-slate-500' : 'text-[#9fef00]/80'}>
                {line}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};