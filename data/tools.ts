import { ClipboardList, ScanLine, Code } from 'lucide-react';

export const tools = [
  // Planning
  { id: 'tool-checklist', name: 'Checklist Generator', description: 'Generate a tailored pentest checklist from a curated web, mobile, and thick-client engagement catalog.', tags: ['Planning', 'Web', 'Mobile', 'Desktop'], category: 'Planning', icon: ClipboardList },
  // Web
  { id: 'tool-burp-converter', name: 'Burp to Python', description: 'Paste a cURL or raw Burp request and get a clean Python requests snippet — noise headers stripped, CSRF wired in.', tags: ['Web', 'Scripting'], category: 'Web', icon: Code },
  // Cambodia
  { id: 'tool-khqr', name: 'KHQR Decoder & Rebuilder', description: 'Paste a KHQR screenshot to decode its TLV fields, then edit and rebuild with a live CRC-16 checksum.', tags: ['KHQR', 'QR', 'Cambodia', 'Fintech'], category: 'Cambodia', icon: ScanLine },
];

export const toolCategories = ['All', 'Planning', 'Web', 'Cambodia'];
