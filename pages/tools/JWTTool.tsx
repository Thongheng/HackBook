import React, { useState, useEffect } from 'react';
import { decodeJWT, createNoneAttack, signJWT } from '../../logic/toolLogic';
import { CodeBlock } from '../../components/CodeBlock';
import { Database, Zap } from 'lucide-react';

export const JWTTool: React.FC = () => {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoyNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [decoded, setDecoded] = useState<any>(null);

  // Offensive State
  const [exploitToken, setExploitToken] = useState('');

  // Signing State
  const [signSecret, setSignSecret] = useState('secret123');
  const [editHeader, setEditHeader] = useState('');
  const [editPayload, setEditPayload] = useState('');
  const [signedToken, setSignedToken] = useState('');

  useEffect(() => {
    const res = decodeJWT(token);
    setDecoded(res);
    if (res) {
      setEditHeader(JSON.stringify(res.header, null, 2));
      setEditPayload(JSON.stringify(res.payload, null, 2));
    }
  }, [token]);

  const handleNoneAttack = () => {
    const res = createNoneAttack(token);
    setExploitToken(res);
  };

  const handleSign = async () => {
    try {
      const h = JSON.parse(editHeader);
      const p = JSON.parse(editPayload);
      const start = Date.now();
      const res = await signJWT(h, p, signSecret);
      setSignedToken(res);
    } catch (e) {
      setSignedToken('Invalid JSON in Header or Payload');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Encoded JWS / JWT Token</label>
        <textarea
          className="w-full bg-[#0a0f16]/60 border border-white/5 rounded-xl p-4 font-mono text-[13px] text-white/80 focus:outline-none focus:ring-1 focus:ring-[#9fef00]/40 break-all h-24 transition-all"
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          placeholder="Paste JWT here..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-[#9fef00]/60" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Decoded Archive</h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-[0.2em]">Header Segment</p>
              <pre className="text-sm text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {decoded ? JSON.stringify(decoded.header, null, 2) : 'Awaiting Valid Input'}
              </pre>
            </div>

            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Payload Claims</p>
              <pre className="text-sm text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {decoded ? JSON.stringify(decoded.payload, null, 2) : 'Awaiting Valid Input'}
              </pre>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#9fef00]/60" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Offensive Modules</h3>
          </div>

          <div className="p-6 bg-[#9fef00]/[0.02] border border-[#9fef00]/10 rounded-2xl space-y-5">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white tracking-tight">None Algorithm Bypass</h4>
              <p className="text-[12px] text-white/40 leading-relaxed font-medium">
                Forces the <code>alg</code> header to <code>none</code> and truncates the signature segment.
              </p>
            </div>
            <button
              onClick={handleNoneAttack}
              className="w-full py-3 bg-[#9fef00]/10 border border-[#9fef00]/30 text-[#9fef00] font-bold rounded-lg hover:bg-[#9fef00]/20 transition-all text-[11px] uppercase tracking-[0.2em]"
            >
              Generate None-Type Exploit
            </button>

            {exploitToken && (
              <div className="animate-in slide-in-from-top-2 duration-300 mt-2">
                <CodeBlock code={exploitToken} title="None-Attack Token" />
              </div>
            )}
          </div>

          <div className="p-6 bg-purple-500/[0.02] border border-purple-500/10 rounded-2xl space-y-5">
            <h4 className="text-sm font-bold text-white tracking-tight">Forge & Sign (HMAC)</h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold">Header</label>
                <textarea
                  value={editHeader}
                  onChange={e => setEditHeader(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white/70 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold">Payload</label>
                <textarea
                  value={editPayload}
                  onChange={e => setEditPayload(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white/70 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold block mb-1.5">Signing Secret</label>
              <input
                type="text"
                value={signSecret}
                onChange={(e) => setSignSecret(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-purple-400 font-mono focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <button
              onClick={handleSign}
              className="w-full py-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold rounded-lg hover:bg-purple-500/20 transition-all text-[11px] uppercase tracking-[0.2em]"
            >
              Sign New Token (HS256)
            </button>

            {signedToken && (
              <div className="animate-in slide-in-from-top-2 duration-300 mt-2">
                <CodeBlock code={signedToken} title="Forged Token" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};