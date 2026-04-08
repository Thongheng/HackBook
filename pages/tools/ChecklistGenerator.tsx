import React, { useState, useMemo } from 'react';
import {
  FileDown, ChevronDown, ChevronUp, Globe, Smartphone, Monitor,
  Eye, EyeOff, FileText, AlertTriangle, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ALL_ROWS, FEATURE_GROUPS, FEATURE_REGISTRY, ChecklistRow, Category } from '../../data/checklistData';
import { filterCatalogRows } from '../../logic/checklistEngine.js';
import { buildWorkbookMetadataRows, buildWorkbookSheets } from '../../logic/checklistWorkbook.js';

// ─── Types ─────────────────────────────────────────────────────────────────────
type EngagementType = 'Black-Box' | 'Grey-Box';
type OutputFormat = 'xlsx' | 'markdown' | 'findings';

// Tech stack options per category
interface TechStack {
  web: { graphql: boolean; websocket: boolean; oauth: boolean; };
  mobile: { native: boolean; flutter: boolean; reactnative: boolean; };
  desktop: { dotnet: boolean; electron: boolean; java: boolean; };
}

interface Config {
  engagementName: string;
  targetName: string;
  engagementType: EngagementType;
  categories: Category[];
  techStack: TechStack;
  features: Record<string, boolean>;
  outputFormat: OutputFormat;
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  info: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const CAT_LABEL: Record<Category, string> = {
  web: 'Web / API', mobile: 'Mobile (Android)', desktop: 'Desktop / Thick Client',
};
const CAT_ICON: Record<Category, React.FC<any>> = {
  web: Globe, mobile: Smartphone, desktop: Monitor,
};
const CAT_COLOR: Record<Category, string> = {
  web: 'text-blue-400 border-blue-500/25 bg-blue-500/8',
  mobile: 'text-green-400 border-green-500/25 bg-green-500/8',
  desktop: 'text-purple-400 border-purple-500/25 bg-purple-500/8',
};

const PANEL_SHELL = 'border border-white/[0.08] bg-[#101821]/96 shadow-[0_22px_60px_rgba(0,0,0,0.28)]';
const PANEL_HEADER = 'bg-[#070b10]';
const PANEL_BODY = 'bg-[#141d26]/94';
const QUIET_CONTROL = 'bg-[#111921]/92 border-white/[0.08]';
const QUIET_CONTROL_HOVER = 'hover:border-white/15 hover:bg-[#16202a]';

// ─── XLSX export ───────────────────────────────────────────────────────────────
async function writeWorkbook(sheets: ReturnType<typeof buildWorkbookSheets>, filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.data);
    ws['!cols'] = sheet.columnWidths.map((width) => ({ wch: width }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename);
}

async function exportXLSX(filtered: ChecklistRow[], cfg: Config) {
  const safeName = (cfg.engagementName || 'engagement').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const typeTag = cfg.engagementType.toLowerCase().replace('-', '');
  const metadataRows = buildWorkbookMetadataRows({
    scope: 'filtered',
    engagementName: cfg.engagementName,
    targetName: cfg.targetName,
    engagementType: cfg.engagementType,
    categories: cfg.categories,
    totalItems: filtered.length,
    sourceLabel: 'JSON catalog',
  });
  const sheets = buildWorkbookSheets(filtered, { metadataRows, includeEmptySheets: false });

  await writeWorkbook(sheets, `checklist_${safeName}_${typeTag}_${dateStr}.xlsx`);
}

async function exportFullCatalogXLSX(rows: ChecklistRow[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const metadataRows = buildWorkbookMetadataRows({
    scope: 'full',
    totalItems: rows.length,
    sourceLabel: 'JSON catalog',
  });
  const sheets = buildWorkbookSheets(rows, { metadataRows, includeEmptySheets: true });

  await writeWorkbook(sheets, `checklist_catalog_full_${dateStr}.xlsx`);
}

// ─── Markdown export ───────────────────────────────────────────────────────────
function exportMarkdown(filtered: ChecklistRow[], cfg: Config) {
  const lines: string[] = [];
  lines.push(`# Pentest Checklist — ${cfg.engagementName || 'Engagement'}`);
  lines.push(`**Target:** ${cfg.targetName || '—'}  `);
  lines.push(`**Type:** ${cfg.engagementType}  `);
  lines.push(`**Generated:** ${new Date().toLocaleDateString()}  `);
  lines.push(`**Total Items:** ${filtered.length}  `);
  lines.push('');
  lines.push('---');
  lines.push('');

  const cats: Category[] = ['web', 'mobile', 'desktop'];
  for (const cat of cats) {
    const catRows = filtered.filter(r => r.category === cat);
    if (!catRows.length) continue;
    lines.push(`## ${CAT_LABEL[cat]}`);
    lines.push('');

    for (const sheetType of ['baseline', 'custom'] as const) {
      const sheetRows = catRows.filter(r => r.sheetType === sheetType);
      if (!sheetRows.length) continue;
      lines.push(`### ${sheetType === 'baseline' ? 'Baseline Tests' : 'Feature-Specific Tests'}`);
      lines.push('');

      const groups = Array.from(new Set(sheetRows.map(r => r.group)));
      for (const grp of groups) {
        lines.push(`#### ${grp}`);
        lines.push('');
        const grpRows = sheetRows.filter(r => r.group === grp);
        for (const r of grpRows) {
          lines.push(`- [ ] **[${r.severityLabel}]** ${r.testCase}  `);
          lines.push(`  *${r.objective}*  `);
          lines.push(`  \`${r.ref}\` · ${r.stdRef} · Mode: ${r.mode}`);
          lines.push('');
        }
      }
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (cfg.engagementName || 'engagement').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url; a.download = `checklist_${safeName}_${new Date().toISOString().split('T')[0]}.md`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Findings export (Fail rows only) — placeholder until status is set ────────
function exportFindings(filtered: ChecklistRow[], cfg: Config) {
  // "Findings mode" generates a template for each item formatted as a finding skeleton
  const lines: string[] = [];
  lines.push(`# Pentest Finding Summary — ${cfg.engagementName || 'Engagement'}`);
  lines.push(`**Target:** ${cfg.targetName || '—'} | **Type:** ${cfg.engagementType} | **Generated:** ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push('> This is a **finding template skeleton** for each checked test case.');
  lines.push('> Delete items that had no finding. Fill in evidence and CVSS where applicable.');
  lines.push('');
  lines.push('---');
  lines.push('');

  const byCategory = filtered.filter(r => ['critical', 'high', 'medium'].includes(r.severity));
  const bySev = ['critical', 'high', 'medium'] as const;

  for (const sev of bySev) {
    const sevRows = byCategory.filter(r => r.severity === sev);
    if (!sevRows.length) continue;
    lines.push(`## ${sev.charAt(0).toUpperCase() + sev.slice(1)} Severity`);
    lines.push('');
    sevRows.forEach((r, i) => {
      lines.push(`### ${i + 1}. ${r.testCase}`);
      lines.push(`**Ref:** ${r.ref} | **Std Ref:** ${r.stdRef} | **Category:** ${r.category.toUpperCase()}`);
      lines.push('');
      lines.push('**Description:**');
      lines.push(`> ${r.objective}`);
      lines.push('');
      lines.push('**Evidence / PoC:**');
      lines.push('> *(paste screenshot, request/response, or payload here)*');
      lines.push('');
      lines.push('**Impact:**');
      lines.push('> *(describe business impact)*');
      lines.push('');
      lines.push('**Remediation:**');
      lines.push('> *(recommended fix)*');
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (cfg.engagementName || 'engagement').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url; a.download = `findings_${safeName}_${new Date().toISOString().split('T')[0]}.md`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── UI helpers ────────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }> = ({ title, children, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden backdrop-blur-sm`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${PANEL_HEADER} hover:bg-[#18222d] transition-colors`}>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-white/65 uppercase tracking-[0.18em]">{title}</span>
          {badge && <span className="text-[8px] font-bold text-[#9fef00]/60 bg-[#9fef00]/8 px-1.5 py-0.5 rounded border border-[#9fef00]/15">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
      </button>
      {open && <div className={`px-5 py-4 space-y-3 border-t border-white/[0.06] ${PANEL_BODY}`}>{children}</div>}
    </div>
  );
};

const FoldBlock: React.FC<{ title: string; icon: React.ReactNode; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center justify-between px-4 py-3.5 ${PANEL_HEADER} hover:bg-[#18222d] transition-colors`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold text-white/75 uppercase tracking-[0.15em]">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/35" /> : <ChevronDown className="w-3.5 h-3.5 text-white/35" />}
      </button>
      {open && <div className={`px-4 pb-4 border-t border-white/[0.06] ${PANEL_BODY}`}>{children}</div>}
    </div>
  );
};

const Chip: React.FC<{ label: string; count?: number; active: boolean; onClick: () => void; accent?: string }> = ({ label, count, active, onClick, accent }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight border transition-all ${active
        ? accent
          ? `bg-white/8 border-white/20 text-white`
          : 'bg-[#9fef00]/8 border-[#9fef00]/25 text-[#9fef00]'
        : `${QUIET_CONTROL} text-white/72 ${QUIET_CONTROL_HOVER} hover:text-white/92`
      }`}>
    <span>{label}</span>
    {typeof count === 'number' && <span className="ml-2 text-[10px] opacity-60">{count}</span>}
  </button>
);

const Toggle: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <button onClick={onChange}
      className={`relative mt-0.5 w-8 h-4 rounded-full border transition-all shrink-0 ${on ? 'bg-[#9fef00]/20 border-[#9fef00]/40' : 'bg-white/5 border-white/10'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${on ? 'left-4 bg-[#9fef00]' : 'left-0.5 bg-white/20'}`} />
    </button>
    <div className="flex items-center">
      <p className="text-[12px] font-semibold text-white/70 group-hover:text-white/90 transition-colors leading-tight">{label}</p>
    </div>
  </label>
);

const SummaryRail: React.FC<{ filtered: ChecklistRow[] }> = ({ filtered }) => {
  const crit = filtered.filter(r => r.severity === 'critical').length;
  const high = filtered.filter(r => r.severity === 'high').length;
  const med = filtered.filter(r => r.severity === 'medium').length;
  const base = filtered.filter(r => r.sheetType === 'baseline').length;
  const cust = filtered.filter(r => r.sheetType === 'custom').length;

  const stats = [
    { label: 'Selected', val: filtered.length, cls: 'text-white' },
    { label: 'Baseline', val: base, cls: 'text-slate-300' },
    { label: 'Custom', val: cust, cls: 'text-[#9fef00]' },
    { label: 'Critical', val: crit, cls: 'text-red-400' },
    { label: 'High', val: high, cls: 'text-orange-400' },
    { label: 'Medium', val: med, cls: 'text-yellow-400' },
  ];

  return (
    <div className={`${PANEL_SHELL} flex flex-wrap gap-2 rounded-[24px] px-3 py-3 backdrop-blur-sm`}>
      {stats.map(({ label, val, cls }) => (
        <div key={label} className="min-w-[92px] rounded-xl border border-white/[0.08] bg-[#141d26]/94 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className={`text-lg font-black tracking-tight leading-none ${cls}`}>{val}</div>
          <div className="mt-1 text-[8px] font-bold text-white/35 uppercase tracking-[0.18em]">{label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Preview table ─────────────────────────────────────────────────────────────
const PreviewTable: React.FC<{ rows: ChecklistRow[] }> = ({ rows }) => (
  <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
    <div className="overflow-x-auto max-h-72 overflow-y-auto">
      <table className="w-full text-left">
        <thead className={`sticky top-0 ${PANEL_HEADER} z-10`}>
          <tr>
            {['Ref', 'Category', 'Test Case', 'Sev', 'Mode', 'Type'].map(h => (
              <th key={h} className="px-3 py-2.5 text-[9px] font-bold text-white/50 uppercase tracking-widest border-b border-white/[0.08] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={PANEL_BODY}>
          {rows.map((r, i) => (
            <tr key={r.ref} className={i % 2 === 0 ? 'bg-[#101820]/78' : 'bg-[#0c1319]/92'}>
              <td className="px-3 py-2 text-[10px] font-mono text-white/45 whitespace-nowrap">{r.ref}</td>
              <td className="px-3 py-2">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${r.category === 'web' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : r.category === 'mobile' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20'}`}>
                  {r.category.toUpperCase()}
                </span>
              </td>
              <td className="px-3 py-2 text-[11px] text-white/80 max-w-[240px] truncate">{r.testCase}</td>
              <td className="px-3 py-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEV_COLOR[r.severity]}`}>{r.severityLabel}</span>
              </td>
              <td className="px-3 py-2 text-[10px] text-white/45 whitespace-nowrap">{r.mode}</td>
              <td className="px-3 py-2 text-[10px] text-white/45">{r.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const DEFAULT_STACK: TechStack = {
  web: { graphql: false, websocket: false, oauth: false },
  mobile: { native: true, flutter: false, reactnative: false },
  desktop: { dotnet: true, electron: false, java: false },
};

export const ChecklistGenerator: React.FC = () => {
  const [cfg, setCfg] = useState<Config>({
    engagementName: '',
    targetName: '',
    engagementType: 'Black-Box',
    categories: ['web'],
    techStack: DEFAULT_STACK,
    features: {},
    outputFormat: 'xlsx',
  });
  const [exportingAction, setExportingAction] = useState<null | 'filtered' | 'full'>(null);
  const [showPreview, setShowPreview] = useState(false);

  const filtered = useMemo(() => filterCatalogRows(ALL_ROWS, cfg), [cfg]);
  const selectedFeatureGroups = useMemo(
    () => FEATURE_REGISTRY.filter((feature) => cfg.categories.includes(feature.platform)),
    [cfg.categories]
  );
  const contributingFeatureCount = selectedFeatureGroups.filter((feature) => cfg.features[feature.key]).length;

  const toggleCat = (c: Category) => setCfg(p => ({
    ...p, categories: p.categories.includes(c) ? p.categories.filter(x => x !== c) : [...p.categories, c],
  }));

  const toggleFeature = (featureKey: string) => setCfg(p => ({
    ...p, features: { ...p.features, [featureKey]: !p.features[featureKey] },
  }));

  const setAllFeatures = (cat: Category, val: boolean) => {
    const features = FEATURE_GROUPS[cat] || [];
    setCfg(p => ({ ...p, features: { ...p.features, ...Object.fromEntries(features.map(feature => [feature.key, val])) } }));
  };

  const setWebStack = (k: keyof TechStack['web'], v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, web: { ...p.techStack.web, [k]: v } } }));
  const setMobStack = (k: keyof TechStack['mobile'], v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, mobile: { ...p.techStack.mobile, [k]: v } } }));
  const setDeskStack = (k: keyof TechStack['desktop'], v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, desktop: { ...p.techStack.desktop, [k]: v } } }));

  const handleGenerate = async () => {
    if (!filtered.length) return;
    setExportingAction('filtered');
    try {
      if (cfg.outputFormat === 'xlsx') await exportXLSX(filtered, cfg);
      if (cfg.outputFormat === 'markdown') exportMarkdown(filtered, cfg);
      if (cfg.outputFormat === 'findings') exportFindings(filtered, cfg);
    } finally {
      setExportingAction(null);
    }
  };

  const handleExportFullCatalog = async () => {
    if (!ALL_ROWS.length) return;
    setExportingAction('full');
    try {
      await exportFullCatalogXLSX(ALL_ROWS);
    } finally {
      setExportingAction(null);
    }
  };

  const safeName = (cfg.engagementName || 'engagement').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const typeTag = cfg.engagementType.toLowerCase().replace('-', '');
  const ext = cfg.outputFormat === 'xlsx' ? 'xlsx' : 'md';
  const prefix = cfg.outputFormat === 'findings' ? 'findings' : 'checklist';
  const filename = `${prefix}_${safeName}_${typeTag}_${dateStr}.${ext}`;

  const FORMAT_ICONS: Record<OutputFormat, React.FC<any>> = {
    xlsx: FileDown,
    markdown: FileText,
    findings: AlertTriangle,
  };
  const FORMAT_LABELS: Record<OutputFormat, string> = {
    xlsx: 'Filtered XLSX',
    markdown: 'Markdown Checklist',
    findings: 'Finding Report Skeleton',
  };
  const FORMAT_DESC: Record<OutputFormat, string> = {
    xlsx: 'Spreadsheet with all checklist columns — generated from the JSON catalog and filtered to your config.',
    markdown: 'Structured .md checklist — paste into Obsidian, Notion, or your report template.',
    findings: 'Pre-filled finding skeleton for each High/Critical item. Delete what you don\'t find.',
  };

  const selectedCategoryLabels = cfg.categories.map((category) => CAT_LABEL[category]);
  const activeFeatureGroups = FEATURE_REGISTRY.filter((feature) => cfg.features[feature.key]).length;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-white/[0.08] bg-[#141d26]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
          {ALL_ROWS.length} rows
        </span>
        <span className="rounded-full border border-white/[0.08] bg-[#141d26]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
          {FEATURE_REGISTRY.length} features
        </span>
        <span className="rounded-full border border-white/[0.08] bg-[#141d26]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
          {selectedCategoryLabels.length ? selectedCategoryLabels.join(' + ') : 'No target'}
        </span>
      </div>

      <SummaryRail filtered={filtered} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">

        <div className="space-y-4 xl:sticky xl:top-28 self-start">

          <Section title="Setup">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1.5">Engagement Name</label>
                <input value={cfg.engagementName} onChange={e => setCfg(p => ({ ...p, engagementName: e.target.value }))}
                  placeholder="ClientName_Q2_2026"
                  className="w-full bg-[#0a0f16]/60 border border-white/[0.08] rounded-lg p-3 text-sm text-white/90 font-mono placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#9fef00]/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1.5">Target / App Name</label>
                <input value={cfg.targetName} onChange={e => setCfg(p => ({ ...p, targetName: e.target.value }))}
                  placeholder="CustomerPortal"
                  className="w-full bg-[#0a0f16]/60 border border-white/[0.08] rounded-lg p-3 text-sm text-white/90 font-mono placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#9fef00]/30" />
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] font-bold text-white/45 uppercase tracking-[0.18em]">Access Type</p>
              {(['Black-Box', 'Grey-Box'] as EngagementType[]).map(et => (
                <button key={et} onClick={() => setCfg(p => ({ ...p, engagementType: et }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${cfg.engagementType === et
                      ? 'bg-[#9fef00]/6 border-[#9fef00]/25 text-[#9fef00]'
                      : `${QUIET_CONTROL} text-white/50 ${QUIET_CONTROL_HOVER} hover:text-white/72`
                    }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 transition-colors ${cfg.engagementType === et ? 'bg-[#9fef00] border-[#9fef00]' : 'border-white/20'}`} />
                  <p className="text-[12px] font-bold leading-tight flex-1">{et}</p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border opacity-60 ">
                    {et === 'Black-Box' ? 'Black-Box + Both' : 'Grey-Box + Both'}
                  </span>
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] font-bold text-white/45 uppercase tracking-[0.18em]">Target Surface</p>
              {(['web', 'mobile', 'desktop'] as Category[]).map(c => {
                const Icon = CAT_ICON[c];
                const active = cfg.categories.includes(c);
                const count = ALL_ROWS.filter(r => r.category === c).length;
                return (
                  <button key={c} onClick={() => toggleCat(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${active ? CAT_COLOR[c] + ' border-opacity-30' : `${QUIET_CONTROL} text-white/45 ${QUIET_CONTROL_HOVER} hover:text-white/68`
                      }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-bold tracking-tight flex-1">{CAT_LABEL[c]}</span>
                    <span className="text-[9px] font-bold text-white/60">{count} items</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${active ? 'bg-current/20 border-current' : 'border-white/15'}`}>
                      {active && <div className="w-2 h-2 rounded-sm bg-current" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Target Profile" badge="stack filters">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-blue-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Web
                </p>
                <div className="flex flex-wrap gap-3">
                  <Toggle on={cfg.techStack.web.graphql} onChange={() => setWebStack('graphql', !cfg.techStack.web.graphql)} label="GraphQL" />
                  <Toggle on={cfg.techStack.web.websocket} onChange={() => setWebStack('websocket', !cfg.techStack.web.websocket)} label="WebSocket" />
                  <Toggle on={cfg.techStack.web.oauth} onChange={() => setWebStack('oauth', !cfg.techStack.web.oauth)} label="OAuth / OIDC" />
                </div>
              </div>
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-green-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" /> Mobile
                </p>
                <div className="flex flex-wrap gap-3">
                  <Toggle on={cfg.techStack.mobile.native} onChange={() => setMobStack('native', !cfg.techStack.mobile.native)} label="Native (Java/Kotlin)" />
                  <Toggle on={cfg.techStack.mobile.flutter} onChange={() => setMobStack('flutter', !cfg.techStack.mobile.flutter)} label="Flutter" />
                  <Toggle on={cfg.techStack.mobile.reactnative} onChange={() => setMobStack('reactnative', !cfg.techStack.mobile.reactnative)} label="React Native" />
                </div>
              </div>
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-purple-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Monitor className="w-3 h-3" /> Desktop
                </p>
                <div className="flex flex-wrap gap-3">
                  <Toggle on={cfg.techStack.desktop.dotnet} onChange={() => setDeskStack('dotnet', !cfg.techStack.desktop.dotnet)} label=".NET (WPF/WinForms)" />
                  <Toggle on={cfg.techStack.desktop.electron} onChange={() => setDeskStack('electron', !cfg.techStack.desktop.electron)} label="Electron" />
                  <Toggle on={cfg.techStack.desktop.java} onChange={() => setDeskStack('java', !cfg.techStack.desktop.java)} label="Java (Swing/FX)" />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Feature Selection" badge={`${activeFeatureGroups} active`}>
            {(['web', 'mobile', 'desktop'] as Category[]).map(cat => {
              const features = FEATURE_GROUPS[cat] || [];
              if (!features.length) return null;
              const allOn = features.every(feature => cfg.features[feature.key]);
              const anyOn = features.some(feature => cfg.features[feature.key]);
              return (
                <FoldBlock
                  key={cat}
                  title={CAT_LABEL[cat]}
                  icon={React.createElement(CAT_ICON[cat], { className: `w-3 h-3 ${cat === 'web' ? 'text-blue-400/60' : cat === 'mobile' ? 'text-green-400/60' : 'text-purple-400/60'}` })}
                  badge={
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${cfg.categories.includes(cat) ? 'text-[#9fef00]/70 border-[#9fef00]/20 bg-[#9fef00]/8' : 'text-white/20 border-white/10'}`}>
                      {cfg.categories.includes(cat) ? 'selected for export' : 'visible, not exporting'}
                    </span>
                  }
                  defaultOpen={cfg.categories.includes(cat) || anyOn}
                >
                  <div className="space-y-2.5 pt-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setAllFeatures(cat, true)} className="text-[10px] text-[#9fef00]/55 hover:text-[#9fef00] font-bold transition-colors">All</button>
                      <span className="text-white/10">|</span>
                      <button onClick={() => setAllFeatures(cat, false)} className="text-[10px] text-white/30 hover:text-white/60 font-bold transition-colors">None</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {features.map(feature => (
                        <Chip
                          key={feature.key}
                          label={feature.label}
                          count={feature.count}
                          active={!!cfg.features[feature.key]}
                          onClick={() => toggleFeature(feature.key)}
                        />
                      ))}
                    </div>
                    {!cfg.categories.includes(cat) && anyOn && (
                      <p className="text-[10px] text-white/45">
                        These toggles are stored, but {CAT_LABEL[cat]} rows stay out of the export until that target category is selected.
                      </p>
                    )}
                    {cfg.categories.includes(cat) && !anyOn && (
                      <p className="text-[10px] text-white/40">
                        No {CAT_LABEL[cat]} feature groups are active. Only baseline rows will export for this target type.
                      </p>
                    )}
                    {cfg.categories.includes(cat) && allOn && (
                      <p className="text-[10px] text-[#9fef00]/55">
                        All {CAT_LABEL[cat]} custom feature groups are active.
                      </p>
                    )}
                  </div>
                </FoldBlock>
              );
            })}
            {cfg.categories.length > 0 && contributingFeatureCount === 0 && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-300/60 leading-relaxed">
                  No active features contribute to the currently selected target categories — <strong className="text-yellow-300/80">0 custom tests</strong> will be included. You can still pre-toggle other platform features, but they will not export until that platform is selected.
                </p>
              </div>
            )}
            <p className="text-[10px] text-white/45 leading-relaxed pt-1">
              Feature groups are always visible for planning. Exported rows still depend on selected target categories, access model, and stack toggles.
            </p>
          </Section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Section title="Output Preview">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-[#141d26]/94 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Export file</p>
                      <p className="mt-1 text-[12px] font-mono text-white/80 break-all">{filename}</p>
                    </div>
                  </div>
                </div>
                {filtered.length > 0 && (
                  <button onClick={() => setShowPreview(p => !p)}
                    className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-white/[0.08] bg-[#141d26]/92 hover:bg-[#18222d] transition-colors">
                    <div className="flex items-center gap-2">
                      {showPreview ? <EyeOff className="w-3.5 h-3.5 text-white/25" /> : <Eye className="w-3.5 h-3.5 text-white/25" />}
                      <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.18em]">
                        {showPreview ? 'Hide Preview' : `Preview (${filtered.length} rows)`}
                      </span>
                    </div>
                    {showPreview ? <ChevronUp className="w-3.5 h-3.5 text-white/15" /> : <ChevronDown className="w-3.5 h-3.5 text-white/15" />}
                  </button>
                )}
                {showPreview && filtered.length > 0 && <PreviewTable rows={filtered} />}
              </div>
            </Section>

            <Section title="Export Format">
              <div className="space-y-2">
              {(['xlsx', 'markdown', 'findings'] as OutputFormat[]).map(fmt => {
                const Icon = FORMAT_ICONS[fmt];
                return (
                  <button key={fmt} onClick={() => setCfg(p => ({ ...p, outputFormat: fmt }))}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${cfg.outputFormat === fmt
                        ? 'bg-[#9fef00]/6 border-[#9fef00]/25 text-[#9fef00]'
                        : `${QUIET_CONTROL} text-white/35 ${QUIET_CONTROL_HOVER} hover:text-white/58`
                      }`}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold leading-tight">{FORMAT_LABELS[fmt]}</p>
                      <p className="text-[10px] mt-0.5 text-white/55 leading-relaxed">{FORMAT_DESC[fmt]}</p>
                    </div>
                  </button>
                );
              })}
              </div>
            </Section>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={handleGenerate} disabled={exportingAction !== null || filtered.length === 0}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all ${filtered.length === 0
              ? 'bg-white/5 border border-white/5 text-white/15 cursor-not-allowed'
              : exportingAction === 'filtered'
                ? 'bg-[#9fef00]/10 border border-[#9fef00]/20 text-[#9fef00]/50 cursor-wait'
                : 'bg-[#9fef00] text-black hover:shadow-[0_0_35px_rgba(159,239,0,0.25)] active:scale-[0.99]'
            }`}>
          <Download className="w-5 h-5" />
          {exportingAction === 'filtered'
            ? 'Building…'
            : filtered.length === 0
              ? 'Select at least one category'
              : `Export — ${filtered.length} Test Cases`}
        </button>
        <button
          onClick={handleExportFullCatalog}
          disabled={exportingAction !== null || ALL_ROWS.length === 0}
          className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border font-bold text-sm uppercase tracking-[0.15em] transition-all ${
            ALL_ROWS.length === 0
              ? 'bg-white/5 border-white/5 text-white/15 cursor-not-allowed'
              : exportingAction === 'full'
                ? 'bg-white/[0.05] border-white/[0.08] text-white/35 cursor-wait'
                : 'bg-[#141d26]/94 border-white/[0.08] text-white/72 hover:text-white hover:bg-[#18222d]'
          }`}
        >
          <FileDown className="w-4.5 h-4.5" />
          {exportingAction === 'full' ? 'Building Full Catalog…' : 'Export Full Catalog XLSX'}
        </button>
        <p className="text-[10px] text-white/45 leading-relaxed px-1">
          Full catalog export ignores the current filters and rebuilds the six-sheet workbook directly from the JSON catalog.
        </p>
      </div>
    </div>
  );
};
