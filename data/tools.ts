import { ShieldCheck, Zap, Terminal, ClipboardList, ScanLine } from 'lucide-react';

export const tools = [
  // Planning
  { id: 'tool-checklist', name: 'Checklist Generator', description: 'Generate a tailored pentest checklist from a curated web, mobile, and thick-client engagement catalog.', tags: ['Planning', 'Web', 'Mobile', 'Desktop'], category: 'Planning', icon: ClipboardList },
  // Web
  { id: 'tool-jwt', name: 'JWT Exploit', description: 'Decode, inspect, and manipulate JSON Web Tokens for auth bypass.', tags: ['Auth', 'Web'], category: 'Auth', icon: ShieldCheck },
  // General
  { id: 'tool-encoding', name: 'Data Encoding', description: 'Base64, Hex, URL encoding, and CharCode conversions for payload crafting.', tags: ['General', 'Evasion'], category: 'General', icon: Zap },
  { id: 'tool-msfvenom', name: 'MSFVenom Builder', description: 'Build complex msfvenom payload commands with options for format, encoder, and listener.', tags: ['General', 'Evasion'], category: 'General', icon: Terminal },
  // Cambodia
  { id: 'tool-khqr', name: 'KHQR Decoder & Rebuilder', description: 'Paste a KHQR screenshot to decode its TLV fields, then edit and rebuild with a live CRC-16 checksum.', tags: ['KHQR', 'QR', 'Cambodia', 'Fintech'], category: 'Cambodia', icon: ScanLine },
];

export const toolCategories = ['All', 'Planning', 'Web', 'Auth', 'General', 'Cambodia'];
