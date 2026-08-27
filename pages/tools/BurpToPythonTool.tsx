import React, { useState, useCallback } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { convertBurpRequest } from '../../logic/toolLogic';
import { ClipboardPaste, X } from 'lucide-react';

type Mode = 'inline' | 'function';
type Caller = 'session' | 'requests';

const PLACEHOLDER = [
  "curl 'http://target/api/login' \\",
  "  -H 'X-CSRF-Token: abc123' \\",
  "  --data-raw 'username=admin&password=secret'",
  '',
  '# — or paste a raw Burp request —',
  '',
  'POST /api/login HTTP/1.1',
  'Host: target',
  'X-CSRF-Token: abc123',
  '',
  'username=admin&password=secret',
].join('\n');

export const BurpToPythonTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('inline');
  const [caller, setCaller] = useState<Caller>('requests');
  const [parametrize, setParametrize] = useState(false);

  const output = input.trim() ? convertBurpRequest(input, { mode, caller, parametrize }) : '';
  const isParseError = output.startsWith('# Parse error:');
  const inputType = input.trim().startsWith('curl ') ? 'cURL' : input.trim() ? 'Raw HTTP' : null;

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch { /* clipboard permission denied */ }
  }, []);

  const segmented = (
    items: string[],
    active: string,
    onSelect: (v: any) => void,
  ) => (
    <div className="flex rounded-md border border-white/10 overflow-hidden">
      {items.map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
            active === m
              ? 'bg-[#9fef00]/10 text-[#9fef00]'
              : 'bg-white/[0.02] htb-text-faint hover:htb-text-muted'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 p-1">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs htb-text-muted font-medium">
          Paste a <span className="text-[#9fef00]">Copy as cURL</span> or raw Burp request.
          Auth headers are auto-detected; noise is stripped.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {inputType && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 htb-text-faint">
              {inputType}
            </span>
          )}
          {segmented(['requests', 'session'], caller, setCaller)}
          {segmented(['inline', 'function'], mode, setMode)}
          <button
            onClick={() => setParametrize(!parametrize)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md border ${
              parametrize
                ? 'bg-[#9fef00]/10 text-[#9fef00] border-[#9fef00]/30'
                : 'bg-white/[0.02] htb-text-faint border-white/10 hover:htb-text-muted'
            }`}
          >
            var
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="w-full h-52 resize-none font-mono text-[12px] bg-[#0a0f16]/80 border border-white/10 rounded-xl p-4 htb-text placeholder:htb-text-faint focus:outline-none focus:border-[#9fef00]/30 transition-colors leading-relaxed"
        />
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          {input && (
            <button
              onClick={() => setInput('')}
              className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all"
              title="Clear"
            >
              <X className="w-3.5 h-3.5 htb-text-faint" />
            </button>
          )}
          <button
            onClick={handlePaste}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 htb-text-faint" />
          </button>
        </div>
      </div>

      {/* Output */}
      {output ? (
        isParseError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="font-mono text-xs text-red-400">{output}</p>
          </div>
        ) : (
          <CodeBlock code={output} title="Python Snippet" language="python" />
        )
      ) : (
        <div className="h-32 flex items-center justify-center rounded-xl border border-dashed border-white/10">
          <p className="text-xs htb-text-faint">Output will appear here</p>
        </div>
      )}
    </div>
  );
};
