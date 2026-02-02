import React from 'react';

export enum ToolCategory {
  WEB = 'Web',
  WINDOWS = 'Windows',
  LINUX = 'Linux',
  AD = 'Active Directory',
  NETWORK = 'Network',
  GENERAL = 'General'
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  tags: ToolCategory[];
  // Fix: Added React import to resolve missing 'React' namespace for React.FC
  component: React.FC;
}

export interface GuideStep {
  title: string;
  content: string;
  language: 'bash' | 'powershell' | 'python' | 'javascript';
}

export interface ResourceLink {
  title: string;
  description: string;
  url: string;
  category: string;
}