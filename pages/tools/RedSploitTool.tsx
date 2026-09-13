import React, { useState, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import {
  DEFAULT_SESSION,
  MODULES,
  getMissingVars,
  groupByCategory,
  type RedSession,
  type ToolDef,
} from '../../logic/redSploitLogic';
import { X } from 'lucide-react';

const STORAGE_KEY = 'redsploit-session';

function loadSession(): RedSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SESSION, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SESSION };
}

function saveSession(s: RedSession) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

const inputClass =
  'w-full px-3 py-1.5 text-[12px] font-mono rounded-lg border focus:outline-none focus:border-[#22d3ee]/40 transition-colors htb-text placeholder:htb-text-faint';
const inputStyle = { background: 'var(--htb-surface)', borderColor: 'var(--htb-border)' };

interface SessionFieldProps {
  label: string;
  placeholder: string;
  value: string;
  mono?: boolean;
  onChange: (v: string) => void;
}

const SessionField: React.FC<SessionFieldProps> = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-widest htb-text-faint">{label}</label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className={inputClass}
      style={inputStyle}
    />
  </div>
);

export const RedSploitTool: React.FC = () => {
  const [session, setSession] = useState<RedSession>(loadSession);
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [activeTool, setActiveTool] = useState<string>(MODULES[0].tools[0].id);

  useEffect(() => { saveSession(session); }, [session]);

  const set = useCallback((field: keyof RedSession) => (v: string) =>
    setSession(prev => ({ ...prev, [field]: v })), []);

  const currentModule = MODULES.find(m => m.id === activeModule)!;
  const currentTool: ToolDef | undefined = currentModule.tools.find(t => t.id === activeTool)
    ?? currentModule.tools[0];
  const grouped = groupByCategory(currentModule.tools);
  const missing = currentTool ? getMissingVars(currentTool, session) : [];
  const command = currentTool ? currentTool.gen(session) : '';

  const handleModuleSwitch = (moduleId: string) => {
    setActiveModule(moduleId);
    const mod = MODULES.find(m => m.id === moduleId)!;
    setActiveTool(mod.tools[0].id);
  };

  const clearSession = () => {
    setSession({ ...DEFAULT_SESSION });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4 p-1">
      {/* ── Session inputs — single horizontal row ────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest htb-text-faint">Session</span>
          <button
            onClick={clearSession}
            className="flex items-center gap-1 text-[10px] htb-text-faint hover:htb-text-muted transition-colors"
            title="Clear all session variables"
          >
            <X className="w-3 h-3" />
            clear
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <SessionField label="Target" placeholder="10.10.10.10" value={session.target} onChange={set('target')} />
          <SessionField label="User:Pass" placeholder="admin:Password1" value={session.userpass} onChange={set('userpass')} />
          <SessionField label="Domain" placeholder="corp.local" value={session.domain} onChange={set('domain')} />
          <SessionField label="NTLM Hash" placeholder="aad3b435..." value={session.hash} onChange={set('hash')} />
          <SessionField label="LHOST" placeholder="10.10.14.5" value={session.lhost} onChange={set('lhost')} />
          <SessionField label="LPORT" placeholder="4444" value={session.lport} onChange={set('lport')} />
          <div className={`transition-opacity ${activeModule === 'file' ? 'opacity-100' : 'opacity-40'}`}>
            <SessionField label="Filename" placeholder="linpeas.sh" value={session.filename} onChange={set('filename')} />
          </div>
        </div>
      </div>

      {/* ── Module tabs + tool browser + command ─────────────────────── */}
      <div className="space-y-3">
        {/* Module tabs */}
        <div className="flex rounded-md border border-white/10 overflow-hidden">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModuleSwitch(m.id)}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                activeModule === m.id
                  ? 'bg-[#22d3ee]/10 text-[#22d3ee]'
                  : 'bg-white/[0.02] htb-text-faint hover:htb-text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 min-h-0">
          {/* Tool list */}
          <div className="w-40 shrink-0 space-y-3 overflow-y-auto max-h-[380px]">
            {Array.from(grouped.entries()).map(([cat, tools]) => (
              <div key={cat}>
                <p className="text-[9px] font-bold uppercase tracking-widest htb-text-faint mb-1 px-1">{cat}</p>
                {tools.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    className={`w-full text-left px-2 py-1.5 text-[11px] font-mono rounded-md transition-colors mb-0.5 border ${
                      activeTool === t.id
                        ? 'bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20'
                        : 'border-transparent htb-text-faint hover:htb-text-muted hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Command output */}
          <div className="flex-1 min-w-0 space-y-2">
            {currentTool && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 htb-text-faint">
                  {currentModule.label} / {currentTool.category}
                </span>
                <span className="text-[11px] htb-text-muted">{currentTool.desc}</span>
              </div>
            )}

            <div className={`overflow-hidden transition-all duration-150 ${missing.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <p className="text-[11px] text-amber-400/80">
                  Missing: <span className="font-mono">{missing.join(', ')}</span> — placeholders shown in command
                </p>
              </div>
            </div>

            {command ? (
              <CodeBlock code={command} language="bash" title={currentTool?.label ?? ''} />
            ) : (
              <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-white/10">
                <p className="text-xs htb-text-faint">Select a tool</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
