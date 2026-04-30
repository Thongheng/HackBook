import React, { useState, useMemo } from 'react';
import {
  FileDown, ChevronDown, ChevronUp, Globe, Smartphone, Monitor,
  Eye, EyeOff, AlertTriangle, Download, Building2, Building,
} from 'lucide-react';
import { ALL_ROWS, FEATURE_GROUPS, FEATURE_REGISTRY, ChecklistRow, Category, Scope } from '../../data/checklistData';
import { filterCatalogRows } from '../../logic/checklistEngine.js';
import { buildChecklistReviewHtml } from '../../logic/checklistReviewHtml.js';
import { buildWorkbookMetadataRows, buildWorkbookSheets } from '../../logic/checklistWorkbook.js';
import { saveWorkbookFile } from '../../logic/checklistWorkbookXlsx.js';

// ─── Types ─────────────────────────────────────────────────────────────────────
type EngagementType = 'Black-Box' | 'Grey-Box';

interface TechStack {
  web: { php: boolean; aspnet: boolean; tomcat: boolean; nodejs: boolean; };
  mobile: { native: boolean; flutter: boolean; reactnative: boolean; };
  desktop: { dotnet: boolean; electron: boolean; java: boolean; };
}

interface Config {
  targetName: string;
  engagementType: EngagementType;
  scope: Scope;
  categories: Category[];
  techStack: TechStack;
  features: Record<string, boolean>;
}

// ─── Feature sub-group definitions ────────────────────────────────────────────
const WEB_FEATURE_SUBGROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Authentication & Authorization',
    keys: [
      'web:login', 'web:password-change', 'web:password-reset',
      'web:sso-magic-link', 'web:registration', 'web:session',
      'web:admin', 'web:users-mgmt', 'web:invitations-membership',
    ],
  },
  {
    label: 'Data & Files',
    keys: ['web:file-upload', 'web:file-download', 'web:import', 'web:export'],
  },
  {
    label: 'Feature',
    keys: [
      'web:search', 'web:comments-rich-text', 'web:announcement',
      'web:set-language', 'web:api-webhook', 'web:api-keys-tokens',
      'web:email-notify', 'web:profile', 'web:vendor-profile', 'web:reports-dashboard',
    ],
  },
  {
    label: 'API & Protocols',
    keys: ['web:graphql', 'web:websocket', 'web:oauth-oidc'],
  },
  {
    label: 'Payment',
    keys: ['web:payment', 'web:coupon-promo', 'web:billing-subscription', 'web:qr-khqr'],
  },
];

const MOBILE_FEATURE_SUBGROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Authentication',
    keys: ['mobile:login-biometric', 'mobile:registration-otp', 'mobile:password-reset', 'mobile:device-binding'],
  },
  {
    label: 'Data & Storage',
    keys: [
      'mobile:secure-storage', 'mobile:file-handling', 'mobile:file-upload',
      'mobile:file-download', 'mobile:backup-restore', 'mobile:offline-sync',
      'mobile:import', 'mobile:export',
    ],
  },
  {
    label: 'Feature',
    keys: ['mobile:push-notifications', 'mobile:deep-links', 'mobile:intent-share', 'mobile:webview', 'mobile:update-remote-config'],
  },
  {
    label: 'Payment',
    keys: ['mobile:payment', 'mobile:coupon-promo', 'mobile:billing-subscription', 'mobile:qr-khqr'],
  },
  {
    label: 'API',
    keys: ['mobile:api-backend', 'mobile:graphql', 'mobile:websocket', 'mobile:oauth-oidc'],
  },
];

const DESKTOP_FEATURE_SUBGROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Authentication',
    keys: ['desktop:login', 'desktop:license'],
  },
  {
    label: 'Data & Storage',
    keys: [
      'desktop:file-handling', 'desktop:file-upload', 'desktop:file-download',
      'desktop:local-db-cache', 'desktop:import', 'desktop:export',
    ],
  },
  {
    label: 'Feature',
    keys: ['desktop:webview', 'desktop:ipc', 'desktop:protocol-handlers', 'desktop:plugins-extensions', 'desktop:background-service'],
  },
  {
    label: 'API & Protocols',
    keys: ['desktop:graphql', 'desktop:websocket', 'desktop:oauth-oidc'],
  },
  {
    label: 'Payment',
    keys: ['desktop:payment', 'desktop:coupon-promo', 'desktop:billing-subscription', 'desktop:qr-khqr'],
  },
  {
    label: 'Installer & Updates',
    keys: ['desktop:installer-repair', 'desktop:auto-update', 'desktop:updater-config'],
  },
];

const FEATURE_SUBGROUPS: Partial<Record<Category, { label: string; keys: string[] }[]>> = {
  web:     WEB_FEATURE_SUBGROUPS,
  mobile:  MOBILE_FEATURE_SUBGROUPS,
  desktop: DESKTOP_FEATURE_SUBGROUPS,
};

// ─── Constants ──────────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  info:     'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const CAT_LABEL: Record<Category, string> = {
  web: 'Web / API', mobile: 'Mobile (Android)', desktop: 'Desktop / Thick Client',
};
const CAT_ICON: Record<Category, React.FC<any>> = {
  web: Globe, mobile: Smartphone, desktop: Monitor,
};
const CAT_COLOR: Record<Category, string> = {
  web:     'text-blue-400 border-blue-500/25 bg-blue-500/8',
  mobile:  'text-green-400 border-green-500/25 bg-green-500/8',
  desktop: 'text-purple-400 border-purple-500/25 bg-purple-500/8',
};

const PANEL_SHELL        = 'border border-white/[0.08] bg-[#101821]/96 shadow-[0_22px_60px_rgba(0,0,0,0.28)]';
const PANEL_HEADER       = 'bg-[#070b10]';
const PANEL_BODY         = 'bg-[#141d26]/94';
const QUIET_CONTROL      = 'bg-[#111921]/92 border-white/[0.08]';
const QUIET_CONTROL_HOVER= 'hover:border-white/15 hover:bg-[#16202a]';

// ─── Export helpers ────────────────────────────────────────────────────────────
function safeFilename(name: string) {
  return (name || 'Target').replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function exportXLSX(filtered: ChecklistRow[], cfg: Config) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeFilename(cfg.targetName)}_Checklist_${date}.xlsx`;
  const metadataRows = buildWorkbookMetadataRows({
    scope: 'filtered',
    targetName: cfg.targetName,
    engagementType: cfg.engagementType,
    categories: cfg.categories,
    totalItems: filtered.length,
    sourceLabel: 'JSON catalog',
  });
  const sheets = buildWorkbookSheets(filtered, { metadataRows, includeEmptySheets: false });
  saveWorkbookFile(sheets, filename);
}

async function exportFullCatalogXLSX(rows: ChecklistRow[]) {
  const metadataRows = buildWorkbookMetadataRows({
    scope: 'full', totalItems: rows.length, sourceLabel: 'JSON catalog',
  });
  const sheets = buildWorkbookSheets(rows, { metadataRows, includeEmptySheets: true });
  saveWorkbookFile(sheets, 'checklist_catalog_full.xlsx');
}

function exportReviewHtml(rows: ChecklistRow[]) {
  const html = buildChecklistReviewHtml(rows);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `checklist_review_${new Date().toISOString().split('T')[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportMarkdown(filtered: ChecklistRow[], cfg: Config) {
  const lines: string[] = [];
  const safe = safeFilename(cfg.targetName);
  const date = new Date().toISOString().split('T')[0];
  lines.push(`# Pentest Checklist — ${cfg.targetName || 'Target'}`);
  lines.push(`**Type:** ${cfg.engagementType} | **Scope:** ${cfg.scope} | **Generated:** ${new Date().toLocaleDateString()} | **Total:** ${filtered.length}`);
  lines.push('', '---', '');
  for (const cat of ['web','mobile','desktop'] as Category[]) {
    const catRows = filtered.filter(r => r.category === cat);
    if (!catRows.length) continue;
    lines.push(`## ${CAT_LABEL[cat]}`, '');
    for (const st of ['baseline','custom'] as const) {
      const stRows = catRows.filter(r => r.sheetType === st);
      if (!stRows.length) continue;
      lines.push(`### ${st === 'baseline' ? 'Baseline Tests' : 'Feature Tests'}`, '');
      for (const grp of [...new Set(stRows.map(r => r.group))]) {
        lines.push(`#### ${grp}`, '');
        for (const r of stRows.filter(x => x.group === grp)) {
          lines.push(`- [ ] **[${r.severityLabel}]** ${r.testCase}  `);
          lines.push(`  *${r.objective}*  `);
          if (r.tools.length) lines.push(`  Tools: ${r.tools.join(', ')}  `);
          lines.push(`  \`${r.ref}\` · ${r.stdRef} · Mode: ${r.mode}`, '');
        }
      }
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${safe}_Checklist_${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── UI primitives ─────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }> = ({
  title, children, defaultOpen = true, badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden backdrop-blur-sm`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${PANEL_HEADER} hover:bg-[#18222d] transition-colors`}>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold htb-text-muted uppercase tracking-[0.18em]">{title}</span>
          {badge && <span className="text-[8px] font-bold text-[#9fef00]/60 bg-[#9fef00]/8 px-1.5 py-0.5 rounded border border-[#9fef00]/15">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 htb-text-faint" /> : <ChevronDown className="w-3.5 h-3.5 htb-text-faint" />}
      </button>
      {open && <div className={`px-5 py-4 space-y-3 border-t border-white/[0.06] ${PANEL_BODY}`}>{children}</div>}
    </div>
  );
};

const FoldBlock: React.FC<{ title: string; icon: React.ReactNode; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title, icon, badge, defaultOpen = true, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
      <button onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3.5 ${PANEL_HEADER} hover:bg-[#18222d] transition-colors`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold htb-text-muted uppercase tracking-[0.15em]">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 htb-text-faint" /> : <ChevronDown className="w-3.5 h-3.5 htb-text-faint" />}
      </button>
      {open && <div className={`px-4 pb-4 border-t border-white/[0.06] ${PANEL_BODY}`}>{children}</div>}
    </div>
  );
};

const Chip: React.FC<{ label: string; count?: number; active: boolean; onClick: () => void }> = ({
  label, count, active, onClick,
}) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight border transition-all ${
      active
        ? 'bg-[#9fef00]/8 border-[#9fef00]/25 text-[#9fef00]'
        : `${QUIET_CONTROL} htb-text-muted ${QUIET_CONTROL_HOVER} hover:htb-text`
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
    <p className="text-[12px] font-semibold htb-text-muted group-hover:htb-text transition-colors leading-tight">{label}</p>
  </label>
);

const SummaryRail: React.FC<{ filtered: ChecklistRow[] }> = ({ filtered }) => {
  const crit = filtered.filter(r => r.severity === 'critical').length;
  const high = filtered.filter(r => r.severity === 'high').length;
  const med  = filtered.filter(r => r.severity === 'medium').length;
  const base = filtered.filter(r => r.sheetType === 'baseline').length;
  const cust = filtered.filter(r => r.sheetType === 'custom').length;
  const stats = [
    { label: 'Selected', val: filtered.length, cls: 'htb-text' },
    { label: 'Baseline', val: base, cls: 'text-slate-300' },
    { label: 'Custom',   val: cust, cls: 'text-[#9fef00]' },
    { label: 'Critical', val: crit, cls: 'text-red-400' },
    { label: 'High',     val: high, cls: 'text-orange-400' },
    { label: 'Medium',   val: med,  cls: 'text-yellow-400' },
  ];
  return (
    <div className={`${PANEL_SHELL} flex flex-wrap gap-2 rounded-[24px] px-3 py-3 backdrop-blur-sm`}>
      {stats.map(({ label, val, cls }) => (
        <div key={label} className="min-w-[92px] rounded-xl border border-white/[0.08] bg-[#141d26]/94 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className={`text-lg font-black tracking-tight leading-none ${cls}`}>{val}</div>
          <div className="mt-1 text-[8px] font-bold htb-text-faint uppercase tracking-[0.18em]">{label}</div>
        </div>
      ))}
    </div>
  );
};

const PreviewTable: React.FC<{ rows: ChecklistRow[] }> = ({ rows }) => (
  <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
    <div className="overflow-x-auto max-h-72 overflow-y-auto">
      <table className="w-full text-left">
        <thead className={`sticky top-0 ${PANEL_HEADER} z-10`}>
          <tr>
            {['Ref','Category','Test Case','Tools','Sev','Mode','Type'].map(h => (
              <th key={h} className="px-3 py-2.5 text-[9px] font-bold htb-text-muted uppercase tracking-widest border-b border-white/[0.08] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={PANEL_BODY}>
          {rows.map((r, i) => (
            <tr key={r.ref} className={i % 2 === 0 ? 'bg-[#101820]/78' : 'bg-[#0c1319]/92'}>
              <td className="px-3 py-2 text-[10px] font-mono htb-text-faint whitespace-nowrap">{r.ref}</td>
              <td className="px-3 py-2">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                  r.category === 'web'    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                  r.category === 'mobile' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                            'text-purple-400 bg-purple-500/10 border-purple-500/20'}`}>
                  {r.category.toUpperCase()}
                </span>
              </td>
              <td className="px-3 py-2 text-[11px] htb-text-muted max-w-[240px] truncate">{r.testCase}</td>
              <td className="px-3 py-2 text-[10px] htb-text-faint max-w-[220px] truncate">{r.tools.length ? r.tools.join(', ') : '—'}</td>
              <td className="px-3 py-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEV_COLOR[r.severity]}`}>{r.severityLabel}</span>
              </td>
              <td className="px-3 py-2 text-[10px] htb-text-faint whitespace-nowrap">{r.mode}</td>
              <td className="px-3 py-2 text-[10px] htb-text-faint">{r.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Feature sub-group renderer (web / mobile / desktop) ──────────────────────
const FeatureSubGroups: React.FC<{
  cat: Category;
  features: typeof FEATURE_REGISTRY;
  cfg: Config;
  onToggle: (cat: Category, key: string) => void;
  onSetAll: (cat: Category, val: boolean) => void;
}> = ({ cat, features, cfg, onToggle, onSetAll }) => {
  const featureMap = new Map(features.map(f => [f.key, f]));
  const subgroups  = FEATURE_SUBGROUPS[cat] ?? [];
  const allOn      = features.every(f => cfg.features[f.key]);
  const anyOn      = features.some(f  => cfg.features[f.key]);

  return (
    <div className="space-y-2.5 pt-3">
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => onSetAll(cat, true)}  className="text-[10px] text-[#9fef00]/55 hover:text-[#9fef00] font-bold transition-colors">All</button>
        <span className="htb-text-faint">|</span>
        <button onClick={() => onSetAll(cat, false)} className="text-[10px] htb-text-faint hover:htb-text-muted font-bold transition-colors">None</button>
      </div>
      {subgroups.map(group => {
        const groupFeatures = group.keys.map(k => featureMap.get(k)).filter(Boolean) as typeof FEATURE_REGISTRY;
        if (!groupFeatures.length) return null;
        return (
          <div key={group.label} className="space-y-2">
            <p className="text-[9px] font-bold htb-text-faint uppercase tracking-[0.2em] pt-2 border-t border-white/[0.05]">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {groupFeatures.map(feature => (
                <Chip
                  key={feature.key}
                  label={feature.label}
                  count={feature.count}
                  active={!!cfg.features[feature.key]}
                  onClick={() => onToggle(cat, feature.key)}
                />
              ))}
            </div>
          </div>
        );
      })}
      {/* Fallback: render any features not covered by subgroup definitions */}
      {(() => {
        const coveredKeys = new Set(subgroups.flatMap(g => g.keys));
        const uncovered   = features.filter(f => !coveredKeys.has(f.key));
        if (!uncovered.length) return null;
        return (
          <div className="space-y-2">
            <p className="text-[9px] font-bold htb-text-faint uppercase tracking-[0.2em] pt-2 border-t border-white/[0.05]">Other</p>
            <div className="flex flex-wrap gap-1.5">
              {uncovered.map(feature => (
                <Chip
                  key={feature.key}
                  label={feature.label}
                  count={feature.count}
                  active={!!cfg.features[feature.key]}
                  onClick={() => onToggle(cat, feature.key)}
                />
              ))}
            </div>
          </div>
        );
      })()}
      {cfg.categories.includes(cat) && !anyOn && (
        <p className="text-[10px] htb-text-faint pt-1">No {CAT_LABEL[cat]} features active. Only baseline rows will export.</p>
      )}
      {cfg.categories.includes(cat) && allOn && (
        <p className="text-[10px] text-[#9fef00]/55 pt-1">All {CAT_LABEL[cat]} custom feature groups active.</p>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const DEFAULT_STACK: TechStack = {
  web:     { php: false, aspnet: false, tomcat: false, nodejs: false },
  mobile:  { native: true,  flutter: false, reactnative: false },
  desktop: { dotnet: true,  electron: false, java: false },
};

const getDefaultFeatures = (categories: Category[]): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  FEATURE_REGISTRY.forEach(f => { out[f.key] = categories.includes(f.platform); });
  return out;
};

export const ChecklistGenerator: React.FC = () => {
  const [cfg, setCfg] = useState<Config>({
    targetName:     '',
    engagementType: 'Black-Box',
    scope:          'external',
    categories:     ['web'],
    techStack:      DEFAULT_STACK,
    features:       getDefaultFeatures(['web']),
  });

  const updateCategories = (newCats: Category[]) => {
    setCfg(p => {
      const newFeatures: Record<string, boolean> = {};
      FEATURE_REGISTRY.forEach(f => { newFeatures[f.key] = newCats.includes(f.platform); });
      return { ...p, categories: newCats, features: newFeatures };
    });
  };

  const [exportingAction, setExportingAction] = useState<null | 'filtered' | 'full' | 'review'>(null);
  const [showPreview,     setShowPreview]      = useState(false);

  const filtered = useMemo(() => filterCatalogRows(ALL_ROWS, cfg), [cfg]);

  const selectedFeatureGroups  = useMemo(
    () => FEATURE_REGISTRY.filter(f => cfg.categories.includes(f.platform)),
    [cfg.categories],
  );
  const contributingFeatureCount = selectedFeatureGroups.filter(f => cfg.features[f.key]).length;
  const activeFeatureGroups      = FEATURE_REGISTRY.filter(f => cfg.features[f.key]).length;

  const toggleCat = (c: Category) => {
    const next = cfg.categories.includes(c)
      ? cfg.categories.filter(x => x !== c)
      : [...cfg.categories, c];
    updateCategories(next);
  };

  const toggleFeature = (cat: Category, featureKey: string) => {
    const features = FEATURE_GROUPS[cat] || [];
    const allSelected = features.every(f => cfg.features[f.key]);
    if (allSelected) {
      const newFeatures: Record<string, boolean> = {};
      features.forEach(f => { newFeatures[f.key] = f.key === featureKey; });
      Object.keys(cfg.features).forEach(k => { if (!features.find(f => f.key === k)) newFeatures[k] = cfg.features[k]; });
      setCfg(p => ({ ...p, features: newFeatures }));
    } else {
      setCfg(p => ({ ...p, features: { ...p.features, [featureKey]: !p.features[featureKey] } }));
    }
  };

  const setAllFeatures = (cat: Category, val: boolean) => {
    const features = FEATURE_GROUPS[cat] || [];
    setCfg(p => ({ ...p, features: { ...p.features, ...Object.fromEntries(features.map(f => [f.key, val])) } }));
  };

  const setWebStack  = (k: keyof TechStack['web'],     v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, web:     { ...p.techStack.web,     [k]: v } } }));
  const setMobStack  = (k: keyof TechStack['mobile'],  v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, mobile:  { ...p.techStack.mobile,  [k]: v } } }));
  const setDeskStack = (k: keyof TechStack['desktop'], v: boolean) => setCfg(p => ({ ...p, techStack: { ...p.techStack, desktop: { ...p.techStack.desktop, [k]: v } } }));

  const handleGenerate = async () => {
    if (!filtered.length) return;
    setExportingAction('filtered');
    try { await exportXLSX(filtered, cfg); } finally { setExportingAction(null); }
  };
  const handleExportFullCatalog = async () => {
    if (!ALL_ROWS.length) return;
    setExportingAction('full');
    try { await exportFullCatalogXLSX(ALL_ROWS); } finally { setExportingAction(null); }
  };
  const handleExportReviewHtml = () => {
    if (!ALL_ROWS.length) return;
    setExportingAction('review');
    try { exportReviewHtml(ALL_ROWS); } finally { setExportingAction(null); }
  };

  const previewFilename = cfg.targetName
    ? `${safeFilename(cfg.targetName)}_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`
    : 'Target_Checklist_<date>.xlsx';

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Pill stats */}
      <div className="flex flex-wrap gap-2">
        {[
          `${ALL_ROWS.length} rows`,
          `${FEATURE_REGISTRY.length} features`,
          cfg.categories.length ? cfg.categories.map(c => CAT_LABEL[c]).join(' + ') : 'No target',
        ].map(txt => (
          <span key={txt} className="rounded-full border border-white/[0.08] bg-[#141d26]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] htb-text-muted">
            {txt}
          </span>
        ))}
      </div>

      <SummaryRail filtered={filtered} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:max-h-[calc(100vh-180px)]">

        {/* ── Left: Setup ── */}
        <div className="space-y-4 xl:sticky xl:top-0 self-start xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto pr-1">
          <Section title="Setup">

            {/* Target Name */}
            <div>
              <label className="text-[10px] font-bold htb-text-muted uppercase tracking-widest block mb-1.5">
                Target / App Name
              </label>
              <input
                value={cfg.targetName}
                onChange={e => setCfg(p => ({ ...p, targetName: e.target.value }))}
                placeholder="Facebook"
                className="w-full bg-[#0a0f16]/60 border border-white/[0.08] rounded-lg p-3 text-sm htb-text-muted font-mono placeholder-htb-text-faint focus:outline-none focus:ring-1 focus:ring-[#9fef00]/30"
              />
              {cfg.targetName && (
                <p className="mt-1.5 text-[9px] font-mono htb-text-faint truncate">
                  → {previewFilename}
                </p>
              )}
            </div>

            {/* Scope */}
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] font-bold htb-text-faint uppercase tracking-[0.18em]">Scope</p>
              {([
                { val: 'external' as Scope, label: 'External', desc: 'Includes passive recon, subdomain enum, secrets scan', Icon: Building  },
                { val: 'internal' as Scope, label: 'Internal', desc: 'No public attack surface — passive recon excluded',   Icon: Building2 },
              ]).map(({ val, label, desc, Icon }) => (
                <button key={val} onClick={() => setCfg(p => ({ ...p, scope: val }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    cfg.scope === val
                      ? 'bg-[#9fef00]/6 border-[#9fef00]/25 text-[#9fef00]'
                      : `${QUIET_CONTROL} htb-text-muted ${QUIET_CONTROL_HOVER} hover:htb-text`
                  }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-colors ${cfg.scope === val ? 'bg-[#9fef00] border-[#9fef00]' : 'border-white/20'}`} />
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold leading-tight">{label}</p>
                    <p className="text-[9px] htb-text-faint mt-0.5 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Access Type */}
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] font-bold htb-text-faint uppercase tracking-[0.18em]">Access Type</p>
              {(['Black-Box','Grey-Box'] as EngagementType[]).map(et => (
                <button key={et} onClick={() => setCfg(p => ({ ...p, engagementType: et }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    cfg.engagementType === et
                      ? 'bg-[#9fef00]/6 border-[#9fef00]/25 text-[#9fef00]'
                      : `${QUIET_CONTROL} htb-text-muted ${QUIET_CONTROL_HOVER} hover:htb-text`
                  }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 transition-colors ${cfg.engagementType === et ? 'bg-[#9fef00] border-[#9fef00]' : 'border-white/20'}`} />
                  <p className="text-[12px] font-bold leading-tight flex-1">{et}</p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border opacity-60">
                    {et === 'Black-Box' ? 'Black-Box + Both' : 'Grey-Box + Both'}
                  </span>
                </button>
              ))}
            </div>

            {/* Target Surface */}
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <p className="text-[10px] font-bold htb-text-faint uppercase tracking-[0.18em]">Target Surface</p>
              {(['web','mobile','desktop'] as Category[]).map(c => {
                const Icon   = CAT_ICON[c];
                const active = cfg.categories.includes(c);
                const count  = ALL_ROWS.filter(r => r.category === c).length;
                return (
                  <button key={c} onClick={() => toggleCat(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      active ? CAT_COLOR[c] : `${QUIET_CONTROL} htb-text-faint ${QUIET_CONTROL_HOVER} hover:htb-text-muted`
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-bold tracking-tight flex-1">{CAT_LABEL[c]}</span>
                    <span className="text-[9px] font-bold htb-text-muted">{count} items</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${active ? 'bg-current/20 border-current' : 'border-white/15'}`}>
                      {active && <div className="w-2 h-2 rounded-sm bg-current" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ── Right: Profile + Features + Preview ── */}
        <div className="space-y-5 xl:overflow-y-auto xl:max-h-[calc(100vh-180px)] xl:pr-1">

          {/* Target Profile */}
          <Section title="Target Profile" badge="tech filters">
            <div className="space-y-4">

              {/* Web */}
              <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-blue-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5 pt-0.5">
                  <Globe className="w-3 h-3" /> Web
                </p>
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="flex flex-wrap gap-3">
                      <Toggle on={cfg.techStack.web.php}    onChange={() => setWebStack('php',    !cfg.techStack.web.php)}    label="PHP" />
                      <Toggle on={cfg.techStack.web.aspnet} onChange={() => setWebStack('aspnet', !cfg.techStack.web.aspnet)} label="ASP.NET" />
                      <Toggle on={cfg.techStack.web.tomcat} onChange={() => setWebStack('tomcat', !cfg.techStack.web.tomcat)} label="Java / Tomcat" />
                      <Toggle on={cfg.techStack.web.nodejs} onChange={() => setWebStack('nodejs', !cfg.techStack.web.nodejs)} label="Node.js" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-green-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" /> Mobile
                </p>
                <div className="flex flex-wrap gap-3">
                  <Toggle on={cfg.techStack.mobile.native}      onChange={() => setMobStack('native',      !cfg.techStack.mobile.native)}      label="Native (Java/Kotlin)" />
                  <Toggle on={cfg.techStack.mobile.flutter}     onChange={() => setMobStack('flutter',     !cfg.techStack.mobile.flutter)}     label="Flutter" />
                  <Toggle on={cfg.techStack.mobile.reactnative} onChange={() => setMobStack('reactnative', !cfg.techStack.mobile.reactnative)} label="React Native" />
                </div>
              </div>

              {/* Desktop */}
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
                <p className="min-w-[108px] text-[9px] font-bold text-purple-400/60 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Monitor className="w-3 h-3" /> Desktop
                </p>
                <div className="flex flex-wrap gap-3">
                  <Toggle on={cfg.techStack.desktop.dotnet}   onChange={() => setDeskStack('dotnet',   !cfg.techStack.desktop.dotnet)}   label=".NET (WPF/WinForms)" />
                  <Toggle on={cfg.techStack.desktop.electron} onChange={() => setDeskStack('electron', !cfg.techStack.desktop.electron)} label="Electron" />
                  <Toggle on={cfg.techStack.desktop.java}     onChange={() => setDeskStack('java',     !cfg.techStack.desktop.java)}     label="Java (Swing/FX)" />
                </div>
              </div>
            </div>
          </Section>

          {/* Feature Selection */}
          <Section title="Feature Selection" badge={`${activeFeatureGroups} active`}>
            {(['web','mobile','desktop'] as Category[]).map(cat => {
              const features = FEATURE_GROUPS[cat] || [];
              if (!features.length) return null;

              return (
                <FoldBlock
                  key={cat}
                  title={CAT_LABEL[cat]}
                  icon={React.createElement(CAT_ICON[cat], {
                    className: `w-3 h-3 ${cat === 'web' ? 'text-blue-400/60' : cat === 'mobile' ? 'text-green-400/60' : 'text-purple-400/60'}`,
                  })}
                  badge={
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      cfg.categories.includes(cat)
                        ? 'text-[#9fef00]/70 border-[#9fef00]/20 bg-[#9fef00]/8'
                        : 'htb-text-faint border-white/10'
                    }`}>
                      {cfg.categories.includes(cat) ? 'selected' : 'not exporting'}
                    </span>
                  }
                  defaultOpen={cfg.categories.includes(cat)}
                >
                  <FeatureSubGroups
                    cat={cat}
                    features={features}
                    cfg={cfg}
                    onToggle={toggleFeature}
                    onSetAll={setAllFeatures}
                  />
                </FoldBlock>
              );
            })}

            {cfg.categories.length > 0 && contributingFeatureCount === 0 && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-300/60 leading-relaxed">
                  No custom features selected — <strong className="text-yellow-300/80">0 custom tests</strong> will be included. Only baseline tests will export.
                </p>
              </div>
            )}
            <p className="text-[10px] htb-text-faint leading-relaxed pt-1">
              Feature selection is linked to target categories. Toggle features to include custom tests in your export.
            </p>
          </Section>

          {/* Output Preview */}
          <Section title="Output Preview">
            <div className="space-y-4">
              {filtered.length > 0 && (
                <button onClick={() => setShowPreview(p => !p)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-white/[0.08] bg-[#141d26]/92 hover:bg-[#18222d] transition-colors">
                  <div className="flex items-center gap-2">
                    {showPreview ? <EyeOff className="w-3.5 h-3.5 htb-text-faint" /> : <Eye className="w-3.5 h-3.5 htb-text-faint" />}
                    <span className="text-[11px] font-bold htb-text-muted uppercase tracking-[0.18em]">
                      {showPreview ? 'Hide Preview' : `Preview (${filtered.length} rows)`}
                    </span>
                  </div>
                  {showPreview ? <ChevronUp className="w-3.5 h-3.5 htb-text-faint" /> : <ChevronDown className="w-3.5 h-3.5 htb-text-faint" />}
                </button>
              )}
              {showPreview && filtered.length > 0 && <PreviewTable rows={filtered} />}
            </div>
          </Section>
        </div>
      </div>

      {/* Export panel */}
      <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
        <div className={`px-4 py-3 ${PANEL_HEADER} border-b border-white/[0.06]`}>
          <span className="text-[10px] font-bold htb-text-muted uppercase tracking-[0.18em]">Export</span>
        </div>
        <div className={`px-4 py-3 ${PANEL_BODY} space-y-2`}>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={exportingAction !== null || filtered.length === 0}
              className={`w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-[0.12em] transition-all ${
                filtered.length === 0
                  ? 'bg-white/5 border border-white/5 htb-text-faint cursor-not-allowed'
                  : exportingAction === 'filtered'
                    ? 'bg-[#9fef00]/10 border border-[#9fef00]/20 htb-text-muted cursor-wait'
                    : 'bg-[#9fef00] text-black hover:shadow-[0_0_25px_rgba(159,239,0,0.2)] active:scale-[0.99]'
              }`}>
              <Download className="w-4 h-4" />
              {exportingAction === 'filtered' ? 'Building…' : filtered.length === 0 ? 'Select category' : `Export ${filtered.length}`}
            </button>
            <button onClick={handleExportFullCatalog} disabled={exportingAction !== null || ALL_ROWS.length === 0}
              className={`w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-[11px] uppercase tracking-[0.12em] transition-all ${
                ALL_ROWS.length === 0
                  ? 'bg-white/5 border-white/5 htb-text-faint cursor-not-allowed'
                  : exportingAction === 'full'
                    ? 'bg-white/[0.05] border-white/[0.08] htb-text-faint cursor-wait'
                    : 'bg-[#141d26]/94 border-white/[0.08] htb-text-muted hover:htb-text hover:bg-[#18222d]'
              }`}>
              <FileDown className="w-4 h-4" />
              Full Catalog
            </button>
          </div>
          <button onClick={handleExportReviewHtml} disabled={exportingAction !== null || ALL_ROWS.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-[11px] uppercase tracking-[0.12em] transition-all ${
              ALL_ROWS.length === 0
                ? 'bg-white/5 border-white/5 htb-text-faint cursor-not-allowed'
                : exportingAction === 'review'
                  ? 'bg-white/[0.05] border-white/[0.08] htb-text-faint cursor-wait'
                  : 'bg-[#141d26]/94 border-white/[0.08] htb-text-muted hover:htb-text hover:bg-[#18222d]'
            }`}>
            <FileDown className="w-4 h-4" />
            {exportingAction === 'review' ? 'Building Review…' : 'Review HTML'}
          </button>
          <p className="text-[9px] htb-text-faint leading-relaxed font-mono">
            {previewFilename}
          </p>
        </div>
      </div>
    </div>
  );
};
