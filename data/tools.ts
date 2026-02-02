
import { Globe, ShieldCheck, Zap, Cpu, Terminal } from 'lucide-react';

export const tools = [
  { 
    id: 'tool-csrf', 
    name: 'CSRF Generator', 
    description: 'Convert HTTP POST to HTML PoC exploits.', 
    tags: ['Web', 'Forms'], 
    category: 'Web', 
    icon: Globe 
  },
  { 
    id: 'tool-jwt', 
    name: 'JWT Exploit', 
    description: 'Decode and manipulate JSON Web Tokens.', 
    tags: ['Auth', 'Web'], 
    category: 'Auth', 
    icon: ShieldCheck 
  },
  { 
    id: 'tool-encoding', 
    name: 'Data Encoding', 
    description: 'Base64, Hex, URL, and CharCode conversions.', 
    tags: ['General', 'Evasion'], 
    category: 'General', 
    icon: Zap 
  },
  { 
    id: 'tool-phpfilter', 
    name: 'PHP Filter Chain', 
    description: 'Generate complex iconv filter chains for LFI.', 
    tags: ['Web', 'LFI'], 
    category: 'Web', 
    icon: Cpu 
  },
  { 
    id: 'tool-msfvenom', 
    name: 'MSFVenom Builder', 
    description: 'Construct complex payload generation commands.', 
    tags: ['Windows', 'Payloads'], 
    category: 'Payloads', 
    icon: Terminal 
  },
  { 
    id: 'tool-xss', 
    name: 'XSS Obfuscator', 
    description: 'Bypass WAFs with JS encoding wrappers.', 
    tags: ['Web', 'JS'], 
    category: 'Web', 
    icon: Globe 
  },
];

export const toolCategories = ['All', 'Web', 'Auth', 'Payloads', 'General'];
