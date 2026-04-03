import { Globe, ShieldCheck, Zap, Cpu, Terminal, ClipboardList } from 'lucide-react';

export const tools = [
  // Planning
  { id: 'tool-checklist', name: 'Checklist Generator', description: 'Generate a tailored pentest checklist from a curated web, mobile, and thick-client engagement catalog.', tags: ['Planning', 'Web', 'Mobile', 'Desktop'], category: 'Planning', icon: ClipboardList },
  // Web
  { id: 'tool-csrf', name: 'CSRF Generator', description: 'Convert HTTP POST requests to ready-to-use HTML PoC exploits.', tags: ['Web', 'Forms'], category: 'Web', icon: Globe },
  { id: 'tool-jwt', name: 'JWT Exploit', description: 'Decode, inspect, and manipulate JSON Web Tokens for auth bypass.', tags: ['Auth', 'Web'], category: 'Auth', icon: ShieldCheck },
  { id: 'tool-phpfilter', name: 'PHP Filter Chain', description: 'Generate complex iconv filter chains for LFI to RCE escalation.', tags: ['Web', 'LFI'], category: 'Web', icon: Cpu },
  { id: 'tool-xss', name: 'XSS Payload Arsenal', description: 'Context-aware XSS payload generation with WAF bypass variants.', tags: ['Web', 'XSS'], category: 'Web', icon: Globe },
  // General
  { id: 'tool-encoding', name: 'Data Encoding', description: 'Base64, Hex, URL encoding, and CharCode conversions for payload crafting.', tags: ['General', 'Evasion'], category: 'General', icon: Zap },
  { id: 'tool-msfvenom', name: 'MSFVenom Builder', description: 'Build complex msfvenom payload commands with options for format, encoder, and listener.', tags: ['General', 'Evasion'], category: 'General', icon: Terminal },
];

export const toolCategories = ['All', 'Planning', 'Web', 'Auth', 'General'];
