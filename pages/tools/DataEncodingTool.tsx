import React, { useState } from 'react';
import { RefreshCw, Copy } from 'lucide-react';

export const DataEncodingTool: React.FC = () => {
  const [input, setInput] = useState('HackBook Offensive');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [type, setType] = useState<'base64' | 'url' | 'hex' | 'quotes' | 'html'>('base64');

  const processData = () => {
    let res = '';
    try {
      if (type === 'base64') {
        res = mode === 'encode' ? btoa(input) : atob(input);
      } else if (type === 'url') {
        res = mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
      } else if (type === 'hex') {
        if (mode === 'encode') {
          res = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        } else {
          const cleanHex = input.replace(/\s/g, '');
          for (let i = 0; i < cleanHex.length; i += 2) {
            res += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
          }
        }
      } else if (type === 'quotes') {
        res = input.replace(/['"]/g, '\\$&');
      } else if (type === 'html') {
        if (mode === 'encode') {
          res = input.replace(/[\u00A0-\u9999<>&]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
          });
        } else {
          const parser = new DOMParser();
          const decoded = parser.parseFromString(`<!doctype html><body>${input}`, 'text/html').body.textContent;
          res = decoded || '';
        }
      }
      setOutput(res);
    } catch (e) {
      setOutput('Error processing data. Check format.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Algorithm</label>
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
                {(['base64', 'url', 'hex', 'quotes', 'html'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-1.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${type === t ? 'bg-[#9fef00] text-black shadow-lg shadow-[#9fef00]/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Direction</label>
              <div className="flex gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
                {(['encode', 'decode'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === m ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Input Character Sequence</label>
            <textarea
              className="w-full h-44 bg-[#0a0f16]/60 border border-white/5 rounded-xl p-4 font-mono text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[#9fef00]/40 transition-all resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to transform..."
            />
          </div>

          <button
            onClick={processData}
            className="w-full py-4 bg-[#9fef00] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(159,239,0,0.3)] transition-all uppercase tracking-[0.2em] text-[11px] hover:scale-[1.01] active:scale-[0.99]"
          >
            Execute Transformation
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Processed Output</label>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-[9px] text-white/30 hover:text-[#9fef00] flex items-center gap-1.5 uppercase tracking-[0.2em] transition-colors font-bold"
              >
                <Copy className="w-3 h-3" /> Copy To Clipboard
              </button>
            </div>
            <div className="w-full h-[330px] bg-black/40 border border-white/5 rounded-xl p-5 font-mono text-sm text-[#9fef00] break-all overflow-y-auto leading-relaxed scrollbar-thin">
              {output || <span className="text-white/10 italic">Awaiting transform execution...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};