import { ClipboardList, ScanLine, Code, Terminal } from 'lucide-react';

export const tools = [
  // Planning
  { id: 'tool-checklist', name: 'Checklist Generator', description: 'Generate a tailored pentest checklist from a curated web, mobile, and thick-client engagement catalog.', tags: ['Planning', 'Web', 'Mobile', 'Desktop'], category: 'Planning', icon: ClipboardList },
  // Web
  { id: 'tool-burp-converter', name: 'Burp to Python', description: 'Paste a raw Burp request or cURL and get a Python function for your session/BASE_URL template — browser noise headers stripped.', tags: ['Web', 'Scripting'], category: 'Web', icon: Code },
  // Red Team
  { id: 'tool-redsploit', name: 'RedSploit', description: 'Session-aware red team command builder. Set your target, creds and domain once — get ready-to-copy nmap, gobuster, Impacket, BloodHound, and file-transfer commands.', tags: ['Red Team', 'Command Builder', 'Infra', 'AD', 'Web'], category: 'Red Team', icon: Terminal },
  // Cambodia
  { id: 'tool-khqr', name: 'KHQR Decoder & Rebuilder', description: 'Paste a KHQR screenshot to decode its TLV fields, then edit and rebuild with a live CRC-16 checksum.', tags: ['KHQR', 'QR', 'Cambodia', 'Fintech'], category: 'Cambodia', icon: ScanLine },
];

export const toolCategories = ['All', 'Planning', 'Web', 'Red Team', 'Cambodia'];
