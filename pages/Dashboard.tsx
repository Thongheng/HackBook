import React from 'react';
import { Shield, Zap, BookOpen, Share2, ArrowRight, Terminal, Cpu, Target } from 'lucide-react';

interface DashboardProps {
  setView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#9fef00]/10 border border-[#9fef00]/20 rounded-full mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9fef00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9fef00]"></span>
          </span>
          <span className="text-[10px] font-bold text-[#9fef00] uppercase tracking-widest">HackBook Terminal: Online</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          HackBook <span className="text-white/40">Offensive Intel</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium tracking-tight">
          A centralized command center for <span className="text-[#9fef00] font-semibold">Red Teamers</span> and <span className="text-white font-semibold">Penetration Testers</span>.
          Weaponized tooling, tactical guides, and deep-web resources curated for the modern security specialist.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setView('tools')}
            className="px-8 py-3 bg-[#9fef00] text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(159,239,0,0.3)] transition-all uppercase tracking-widest text-xs"
          >
            Access Tooling
          </button>
          <button
            onClick={() => setView('guides')}
            className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
          >
            Tactical Guides
          </button>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Weaponized Tooling',
            icon: Zap,
            color: 'bg-[#9fef00]/10 text-[#9fef00]',
            desc: 'Custom-built exploit generators and obfuscators designed to bypass modern WAF and EDR solutions during engagements.'
          },
          {
            title: 'Tactical Manuals',
            icon: BookOpen,
            color: 'bg-blue-500/10 text-blue-400',
            desc: 'Step-by-step operational guides for PTY upgrades, pivoting, and Active Directory exploitation with copy-ready commands.'
          },
          {
            title: 'Intelligence Database',
            icon: Share2,
            color: 'bg-purple-500/10 text-purple-400',
            desc: 'A curated collection of the industries most critical cheatsheets, CVE write-ups, and open-source intelligence links.'
          }
        ].map((f, i) => (
          <div key={i} className="htb-card p-8 space-y-4 hover:border-[#9fef00]/20 transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} border border-current/10 group-hover:scale-110 transition-transform`}>
              <f.icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium tracking-tight">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Platform Statistics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Offensive Tools', value: '12+' },
          { label: 'Tactical Guides', value: '25' },
          { label: 'Intel References', value: '50+' },
          { label: 'Op-Sec Ready', value: '100%' }
        ].map((s, i) => (
          <div key={i} className="bg-[#0b1217] border border-white/5 rounded-xl p-8 text-center space-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#9fef00]/5 -rotate-45 translate-x-8 -translate-y-8" />
            <div className="text-4xl font-black text-white tracking-tighter group-hover:text-[#9fef00] transition-colors">{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">{s.label}</div>
          </div>
        ))}
      </section>





      {/* Professional Mandate */}
      <section className="space-y-6 pb-12">
        <div className="htb-card p-8 bg-black/40 border-rose-500/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <Shield className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase mb-1">Operational Mandate & Security Policy</h3>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Authorized access and ethical utilization protocol.</p>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                The tools and guides provided within <span className="text-white font-bold">HackBook</span> are strictly for professional security auditing and research purposes. Unauthorized access to computer systems is illegal. Users are expected to comply with local and international laws.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Restriction I</p>
                  <p className="text-[10px] text-slate-500">No production testing without written consent.</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Restriction II</p>
                  <p className="text-[10px] text-slate-500">Payload signatures must be logged and audited.</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Restriction III</p>
                  <p className="text-[10px] text-slate-500">All exfiltrated data must be encrypted at rest.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};