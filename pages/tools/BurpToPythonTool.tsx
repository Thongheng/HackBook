import React, { useState, useCallback, useMemo } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { convertBurpRequest, HeaderMode } from '../../logic/burpToPython';
import { ClipboardPaste, X } from 'lucide-react';

const PLACEHOLDER = [
  "POST /login HTTP/1.1",
  "Host: target",
  "Content-Type: application/x-www-form-urlencoded",
  "",
  "user=admin&pass=admin",
  "",
  "— or —",
  "",
  "curl 'http://target/login' \\",
  "  -H 'Content-Type: application/x-www-form-urlencoded' \\",
  "  --data-raw 'user=admin&pass=admin'",
].join('\n');

const HEADER_MODES: Array<[HeaderMode, string]> = [
  ['clean', 'clean (default)'],
  ['keep', 'keep all'],
];

export const BurpToPythonTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [headerMode, setHeaderMode] = useState<HeaderMode>('clean');
  const [funcName, setFuncName] = useState('');

  const result = useMemo(
    () => (input.trim() ? convertBurpRequest(input, { headerMode, funcName }) : null),
    [input, headerMode, funcName],
  );

  const handlePaste = useCallback(async () => {
    try {
      setInput(await navigator.clipboard.readText());
    } catch { /* clipboard permission denied */ }
  }, []);

  const inputType = input.trim() ? (/^\s*curl\s/i.test(input) ? 'cURL' : 'Raw HTTP') : null;

  return (
    <div className="space-y-4 p-1">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs htb-text-muted font-medium">
          Paste a raw Burp request or <span className="text-[#22d3ee]">Copy as cURL</span>.
          Output is a function for your <span className="text-[#22d3ee]">session</span> / <span className="text-[#22d3ee]">BASE_URL</span> template.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {inputType && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 htb-text-faint">
              {inputType}
            </span>
          )}
          <div className="flex rounded-md border border-white/10 overflow-hidden">
            {HEADER_MODES.map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setHeaderMode(mode)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  headerMode === mode
                    ? 'bg-[#22d3ee]/10 text-[#22d3ee]'
                    : 'bg-white/[0.02] htb-text-faint hover:htb-text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Function name */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest htb-text-faint shrink-0">
          function name
        </label>
        <input
          value={funcName}
          onChange={e => setFuncName(e.target.value)}
          placeholder="auto (from method + path)"
          spellCheck={false}
          className="flex-1 font-mono text-[12px] border rounded-md px-3 py-1.5 htb-text placeholder:htb-text-faint focus:outline-none focus:border-[#22d3ee]/30"
          style={{ background: 'var(--htb-surface)', borderColor: 'var(--htb-border)' }}
        />
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="w-full h-52 resize-none font-mono text-[12px] border rounded-xl p-4 htb-text placeholder:htb-text-faint focus:outline-none focus:border-[#22d3ee]/30 transition-colors leading-relaxed"
          style={{ background: 'var(--htb-surface)', borderColor: 'var(--htb-border)' }}
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

      {/* Warnings */}
      {result && !result.error && result.warnings.length > 0 && (
        <ul className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
          {result.warnings.map((w, i) => (
            <li key={i} className="font-mono text-[11px] text-amber-400">• {w}</li>
          ))}
        </ul>
      )}

      {/* Output */}
      {result ? (
        result.error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="font-mono text-xs text-red-400">Parse error: {result.error}</p>
          </div>
        ) : (
          <CodeBlock code={result.code} title="Python Function" language="python" />
        )
      ) : (
        <div className="h-32 flex items-center justify-center rounded-xl border border-dashed border-white/10">
          <p className="text-xs htb-text-faint">Output will appear here</p>
        </div>
      )}
    </div>
  );
};
