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

      {/* Tactical Manifest */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Tactical Manifest</h2>
            <p className="text-xs text-slate-500 font-medium tracking-tight italic">Top utilized intelligence modules and stealth profiles.</p>
          </div>
          <div className="text-[10px] font-bold text-[#9fef00] uppercase tracking-widest border border-[#9fef00]/20 px-3 py-1 rounded bg-[#9fef00]/5">
            Updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                <th className="pb-6 pr-4">Module Name</th>
                <th className="pb-6 px-4">Category</th>
                <th className="pb-6 px-4">Complexity</th>
                <th className="pb-6 px-4 text-center">Stealth Rating</th>
                <th className="pb-6 pl-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'PHP Filter Chain', cat: 'Web/LFI', comp: 'Advanced', stealth: 9, id: 'tool-phpfilter' },
                { name: 'MSFVenom Builder', cat: 'Payloads', comp: 'Intermediate', stealth: 7, id: 'tool-msfvenom' },
                { name: 'JWT Exploit Node', cat: 'Authentication', comp: 'Basic', stealth: 8, id: 'tool-jwt' },
                { name: 'XSS Obfuscator', cat: 'Web/Client', comp: 'Basic', stealth: 10, id: 'tool-xss' },
                { name: 'CSRF PoC Engine', cat: 'Web/Forms', comp: 'Basic', stealth: 6, id: 'tool-csrf' }
              ].map((row, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#9fef00]/40 group-hover:bg-[#9fef00] transition-colors" />
                      <span className="font-bold text-sm text-white tracking-tight">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      {row.cat}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${row.comp === 'Advanced' ? 'text-rose-400' :
                        row.comp === 'Intermediate' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                      {row.comp}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(10)].map((_, idx) => (
                        <div key={idx} className={`w-1 h-3 rounded-sm ${idx < row.stealth ? 'bg-[#9fef00]' : 'bg-white/5'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="py-5 pl-4 text-right">
                    <button
                      onClick={() => setView(row.id)}
                      className="text-[#9fef00] opacity-0 group-hover:opacity-100 transition-all text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >
                      Initialize -&gt;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Engagement Methodology */}
      <section className="space-y-12 bg-white/[0.01] border border-white/5 rounded-3xl p-10 md:p-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">Engagement Methodology</h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto font-medium tracking-tight">The HackBook standard for systematic infrastructure penetration.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
          {[
            { step: '01', title: 'Reconnaissance', icon: Target, items: ['OSINT Gathering', 'Vulnerability Scanning'], color: 'border-blue-500/20 text-blue-400' },
            { step: '02', title: 'Exploitation', icon: Zap, items: ['Payload Delivery', 'WAF Bypassing'], color: 'border-[#9fef00]/20 text-[#9fef00]' },
            { step: '03', title: 'Pivoting', icon: Cpu, items: ['Ligolo-ng Tunneling', 'AD Lateral Movement'], color: 'border-purple-500/20 text-purple-400' },
            { step: '04', title: 'Exfiltration', icon: Terminal, items: ['Persistence Setup', 'Data Collection'], color: 'border-rose-500/20 text-rose-400' }
          ].map((m, i) => (
            <React.Fragment key={i}>
              <div className={`htb-card p-6 flex-1 space-y-4 border ${m.color.split(' ')[0]} bg-white/[0.02]`}>
                <div className="flex items-center justify-between">
                  <m.icon className={`w-6 h-6 ${m.color.split(' ')[1]}`} />
                  <span className="text-[10px] font-mono opacity-20 text-white font-bold">{m.step}</span>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">{m.title}</h4>
                  <ul className="space-y-1.5">
                    {m.items.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-slate-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-current rounded-full" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {i < 3 && (
                <div className="hidden lg:flex items-center text-white/5">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
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