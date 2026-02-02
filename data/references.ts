
import { Shield, Terminal, Globe, Book } from 'lucide-react';

export const referenceCategories = [
  {
    name: 'Red Team',
    icon: Shield,
    links: [
      { title: 'Red Teaming Notes', url: 'https://www.ired.team/', desc: 'Comprehensive tactics and experiments by spotheplanet.' },
      { title: 'Internal All The Things', url: 'https://swisskyrepo.github.io/InternalAllTheThings/', desc: 'Active Directory and Internal Pentest Cheatsheets.' },
      { title: 'AD Enums & Attack', url: 'https://adminions.ca/books/active-directory-enumeration-and-exploitation', desc: 'Cheatsheets for attacking AD environments.' }
    ]
  },
  {
    name: 'Linux & Windows',
    icon: Terminal,
    links: [
      { title: 'GTFOBins', url: 'https://gtfobins.github.io/', desc: 'Unix binaries that can be used to bypass security restrictions.' },
      { title: 'LOLBAS', url: 'https://lolbas-project.github.io/', desc: 'Living Off The Land Binaries for Windows.' },
      { title: 'WADComs', url: 'https://wadcoms.github.io/', desc: 'Interactive cheat sheet for Windows/AD offensive tools.' }
    ]
  },
  {
    name: 'Application',
    icon: Globe,
    links: [
      { title: 'Payloads All The Things', url: 'https://swisskyrepo.github.io/PayloadsAllTheThings/', desc: 'Useful payloads and bypasses for Web App Security.' },
      { title: 'CSP Bypass', url: 'https://cspbypass.com/', desc: 'Tool designed to help ethical hackers bypass restrictive CSP.' },
      { title: 'HackTricks', url: 'https://book.hacktricks.wiki/', desc: 'A massive wiki of All in One hacking tricks and techniques.' }
    ]
  },
  {
    name: 'General',
    icon: Book,
    links: [
      { title: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', desc: 'The Swiss Army Knife of data analysis and conversion.' },
      { title: 'RevShell Generator', url: 'https://www.revshells.com/', desc: 'One-stop shop for all reverse shell commands.' },
      { title: 'CTF Guide', url: 'https://book.jorianwoltjer.com/', desc: 'Collection of notes for CTF challenges.' },
      { title: 'Cipher Identifier', url: 'https://www.dcode.fr/cipher-identifier', desc: 'Identify unknown encryption or encoding methods.' }
    ]
  }
];

export const referenceTabs = ['All', 'Red Team', 'Linux & Windows', 'Application', 'General'];
