import React, { useState } from 'react';
import { generateCSRFPoC } from '../../logic/toolLogic';
import { CodeBlock } from '../../components/CodeBlock';
import { Globe, Settings, Code2 } from 'lucide-react';

export const CSRFTool: React.FC = () => {
  const [input, setInput] = useState(`POST /v1/user/delete HTTP/1.1
Host: api.target.com
Content-Type: application/x-www-form-urlencoded
Cookie: session=123456

user_id=1337&confirm=true`);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [poc, setPoc] = useState('');

  const handleGenerate = () => {
    const result = generateCSRFPoC(input, autoSubmit);
    setPoc(result);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Raw HTTP Request Source</label>
          <textarea 
            className="w-full h-64 bg-[#0a0f16]/60 border border-white/5 rounded-xl p-4 font-mono text-sm text-[#9fef00] focus:outline-none focus:ring-1 focus:ring-[#9fef00]/40 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw POST request here..."
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-white/20" />
            <span className="text-sm font-medium text-white/60">Auto-submit form script</span>
          </div>
          <button 
            onClick={() => setAutoSubmit(!autoSubmit)}
            className={`w-12 h-6 rounded-full transition-all relative ${autoSubmit ? 'bg-[#9fef00]' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg ${autoSubmit ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        <button 
          onClick={handleGenerate}
          className="w-full py-4 bg-[#9fef00] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(159,239,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-[11px]"
        >
          Generate HTML Proof-of-Concept
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-white/20" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Output Manifest</span>
          </div>
        </div>

        {poc ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
             <CodeBlock code={poc} language="html" title="HTML PoC Template" />
             <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
               <p className="text-[11px] text-yellow-500/60 leading-relaxed font-medium">
                 <span className="font-bold text-yellow-500 uppercase mr-2 tracking-wider">Operational Note:</span> 
                 This generator creates a standard POST form. Bypassing <code>SameSite</code> cookies or modern anti-CSRF protections may require secondary tactics like Origin reflection or XSS.
               </p>
             </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01] min-h-[400px]">
            <p className="text-white/20 italic text-sm font-medium">Initialize parameters and build payload...</p>
          </div>
        )}
      </div>
    </div>
  );
};