import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash', title }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-code-block="true"
      className="relative group rounded-xl overflow-hidden shadow-2xl transition-all"
      style={{ background: 'var(--htb-code-bg)', border: '1px solid var(--htb-border)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,0.3)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--htb-border)'}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'var(--htb-border)',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#22d3ee]/60" />
          <span className="text-[10px] uppercase tracking-widest font-bold htb-text-faint">{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md transition-all active:scale-90"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          title="Copy command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#22d3ee]" /> : <Copy className="w-3.5 h-3.5 htb-text-faint" />}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed">
          <code>
            {code.split('\n').map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.trim().startsWith('#')
                    ? (isDark ? '#64748b' : '#94a3b8')
                    : (isDark ? 'rgba(34,211,238,0.85)' : '#0e7490'),
                }}
              >
                {line}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
