import React, { useEffect, useState, useMemo } from 'react';
import {
  FileDown, ChevronDown, ChevronUp, Globe, Smartphone, Monitor,
  Eye, AlertTriangle, Download, Building2, Building, X, RotateCcw,
} from 'lucide-react';
import { ALL_ROWS, FEATURE_GROUPS, FEATURE_REGISTRY, FEATURE_SUBGROUPS, ChecklistRow, Category, Scope } from '../../data/checklistData';
import { filterCatalogRows } from '../../logic/checklistEngine.js';
import { applyPreviewExclusions, buildPreviewGroups, buildPreviewSections, checklistRowRef, prunePreviewExclusions } from '../../logic/checklistPreview.js';
import { buildWorkbookMetadataRows, buildWorkbookSheets } from '../../logic/checklistWorkbook.js';
import { saveWorkbookFile } from '../../logic/checklistWorkbookXlsx.js';

// ─── Types ─────────────────────────────────────────────────────────────────────
type EngagementType = 'Black-Box' | 'Grey-Box' | 'All';

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
  customFeatures: string[];
}

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
  const sheets = buildWorkbookSheets(filtered, { metadataRows, includeEmptySheets: false, customFeatures: cfg.customFeatures });
  saveWorkbookFile(sheets, filename);
}

async function exportFullCatalogXLSX(rows: ChecklistRow[]) {
  const metadataRows = buildWorkbookMetadataRows({
    scope: 'full', totalItems: rows.length, sourceLabel: 'JSON catalog',
  });
  const sheets = buildWorkbookSheets(rows, { metadataRows, includeEmptySheets: true });
  saveWorkbookFile(sheets, 'checklist_catalog_full.xlsx');
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

const PreviewModal: React.FC<{
  rows: ChecklistRow[];
  excludedRefs: Set<string>;
  onToggleRow: (ref: string) => void;
  onClearExclusions: () => void;
  onClose: () => void;
}> = ({ rows, excludedRefs, onToggleRow, onClearExclusions, onClose }) => {
  const sections = useMemo(() => buildPreviewSections(rows), [rows]);
  const [activeSectionName, setActiveSectionName] = useState(sections[0]?.name ?? '');

  useEffect(() => {
    if (!sections.length) {
      setActiveSectionName('');
      return;
    }
    if (!sections.some((section: any) => section.name === activeSectionName)) {
      setActiveSectionName(sections[0].name);
    }
  }, [sections, activeSectionName]);

  const activeSection = sections.find((section: any) => section.name === activeSectionName) ?? sections[0];
  const excludedCount = rows.filter(row => excludedRefs.has(checklistRowRef(row))).length;
  const exportCount = rows.length - excludedCount;
  const showFeatureColumn = activeSection?.sheetType === 'custom';
  const headers = showFeatureColumn
    ? ['Ref', 'Feature', 'Test Case', 'Tools', 'Sev', 'Mode', 'Type', 'Export']
    : ['Ref', 'Test Case', 'Tools', 'Sev', 'Mode', 'Type', 'Export'];
  const activeGroups = useMemo(() => buildPreviewGroups(activeSection?.rows ?? []), [activeSection]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[var(--htb-bg)] px-3 py-4 overscroll-contain">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[var(--htb-border)] bg-[var(--htb-surface)] shadow-[0_28px_90px_var(--htb-shadow)]">
        <div className="flex flex-col gap-3 border-b border-[var(--htb-border)] bg-[var(--htb-bg)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] htb-text">Checklist Preview</p>
              <span className="rounded border border-[#9fef00]/20 bg-[#9fef00]/8 px-2 py-0.5 text-[9px] font-bold text-[#9fef00]/75">
                {exportCount} export / {rows.length} selected
              </span>
              {excludedCount > 0 && (
                <span className="rounded border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-300/70">
                  {excludedCount} excluded
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] htb-text-faint">Click a row to grey it out from filtered export. Click it again to restore.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearExclusions}
              disabled={excludedCount === 0}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                excludedCount === 0
                  ? 'cursor-not-allowed border-[var(--htb-border)] bg-[var(--htb-overlay)] htb-text-faint'
                  : 'border-[var(--htb-border)] bg-[var(--htb-surface)] htb-text hover:bg-[var(--htb-overlay-hover)]'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear exclusions
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--htb-border)] bg-[var(--htb-surface)] htb-text transition-colors hover:bg-[var(--htb-overlay-hover)]"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="border-b border-[var(--htb-border)] bg-[var(--htb-bg)] p-3 lg:border-b-0 lg:border-r">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible">
              {sections.map((section: any) => {
                const active = activeSection?.name === section.name;
                const sectionExcluded = section.rows.filter((row: ChecklistRow) => excludedRefs.has(checklistRowRef(row))).length;
                return (
                  <button
                    key={section.name}
                    onClick={() => setActiveSectionName(section.name)}
                    className={`min-w-[190px] rounded-xl border px-3 py-3 text-left transition-colors lg:min-w-0 ${
                      active
                        ? 'border-[#9fef00]/25 bg-[#9fef00]/8 text-[#9fef00]'
                        : 'border-[var(--htb-border)] bg-[var(--htb-surface)] htb-text hover:bg-[var(--htb-overlay-hover)]'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em]">{section.name}</div>
                    <div className="mt-1 text-[9px] opacity-65">
                      {section.rows.length - sectionExcluded} export / {section.rows.length} rows
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-auto bg-[var(--htb-surface)]">
            {activeSection ? (
              <table className="w-full min-w-[880px] text-left">
                <thead className="sticky top-0 z-10 bg-[var(--htb-bg)]">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="border-b border-[var(--htb-border)] px-3 py-3 text-[9px] font-bold uppercase tracking-widest htb-text whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeGroups.map((group: any) => {
                    const groupExcluded = group.rows.filter((row: ChecklistRow) => excludedRefs.has(checklistRowRef(row))).length;
                    return (
                      <React.Fragment key={group.name}>
                        <tr className="bg-[var(--htb-overlay-hover)]">
                          <td colSpan={headers.length} className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] htb-text">
                            <div className="flex items-center justify-between gap-3">
                              <span>{group.name}</span>
                              <span className="text-[9px] font-bold htb-text-muted">{group.rows.length - groupExcluded} export / {group.rows.length} rows</span>
                            </div>
                          </td>
                        </tr>
                        {group.rows.map((row: ChecklistRow, index: number) => {
                          const ref = checklistRowRef(row);
                          const excluded = excludedRefs.has(ref);
                          return (
                            <tr
                              key={ref}
                              role="button"
                              tabIndex={0}
                              onClick={() => onToggleRow(ref)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  onToggleRow(ref);
                                }
                              }}
                              className={`cursor-pointer border-b border-[var(--htb-border)] transition-colors ${
                                excluded
                                  ? 'bg-slate-500/10 text-slate-500 opacity-65'
                                  : index % 2 === 0
                                    ? 'bg-[var(--htb-surface)] hover:bg-[var(--htb-overlay-hover)]'
                                    : 'bg-[var(--htb-overlay)] hover:bg-[var(--htb-overlay-hover)]'
                              }`}
                            >
                              <td className={`px-3 py-3 text-[10px] font-mono whitespace-nowrap ${excluded ? 'text-slate-500 line-through' : 'htb-text'}`}>{ref}</td>
                              {showFeatureColumn && (
                                <td className={`px-3 py-3 text-[10px] font-semibold max-w-[160px] ${excluded ? 'text-slate-500 line-through' : 'htb-text'}`}>
                                  {row.feature || row.group}
                                </td>
                              )}
                              <td className={`px-3 py-3 text-[11px] max-w-[340px] ${excluded ? 'text-slate-500 line-through' : 'htb-text'}`}>{row.testCase}</td>
                              <td className={`px-3 py-3 text-[10px] max-w-[240px] ${excluded ? 'text-slate-500' : 'htb-text'}`}>{row.tools.length ? row.tools.join(', ') : '-'}</td>
                              <td className="px-3 py-3">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${excluded ? 'border-slate-600/30 bg-slate-700/10 text-slate-500' : SEV_COLOR[row.severity]}`}>{row.severityLabel}</span>
                              </td>
                              <td className={`px-3 py-3 text-[10px] whitespace-nowrap ${excluded ? 'text-slate-500' : 'htb-text'}`}>{row.mode}</td>
                              <td className={`px-3 py-3 text-[10px] ${excluded ? 'text-slate-500' : 'htb-text'}`}>{row.type}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                                  excluded
                                    ? 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                                    : 'border-[#9fef00]/20 bg-[#9fef00]/8 text-[#9fef00]/75'
                                }`}>
                                  {excluded ? 'Excluded' : 'Included'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-[11px] htb-text-faint">
                No rows available for the current filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    customFeatures: [],
  });

  const [newCustomFeature, setNewCustomFeature] = useState('');

  const updateCategories = (newCats: Category[]) => {
    setCfg(p => {
      const newFeatures: Record<string, boolean> = {};
      FEATURE_REGISTRY.forEach(f => { newFeatures[f.key] = newCats.includes(f.platform); });
      return { ...p, categories: newCats, features: newFeatures };
    });
  };

  const handleSelectAll = () => {
    const allFeatures: Record<string, boolean> = {};
    FEATURE_REGISTRY.forEach(f => { allFeatures[f.key] = true; });
    setCfg(p => ({
      ...p,
      scope: 'external',
      engagementType: 'All',
      categories: ['web', 'mobile', 'desktop'],
      techStack: {
        web: { php: true, aspnet: true, tomcat: true, nodejs: true },
        mobile: { native: true, flutter: true, reactnative: true },
        desktop: { dotnet: true, electron: true, java: true },
      },
      features: allFeatures,
      customFeatures: p.customFeatures,
    }));
    setExcludedRefs(new Set());
  };

  const [exportingAction, setExportingAction] = useState<null | 'filtered' | 'full'>(null);
  const [isPreviewOpen,   setIsPreviewOpen]   = useState(false);
  const [excludedRefs,    setExcludedRefs]    = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => filterCatalogRows(ALL_ROWS, cfg), [cfg]);
  const exportRows = useMemo(() => applyPreviewExclusions(filtered, excludedRefs), [filtered, excludedRefs]);
  const excludedCount = filtered.length - exportRows.length;

  useEffect(() => {
    setExcludedRefs(previous => {
      const next = prunePreviewExclusions(filtered, previous);
      if (next.size === previous.size && [...next].every(ref => previous.has(ref))) return previous;
      return next;
    });
  }, [filtered]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isPreviewOpen]);

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

  const togglePreviewExclusion = (ref: string) => {
    setExcludedRefs(previous => {
      const next = new Set(previous);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!exportRows.length) return;
    setExportingAction('filtered');
    try {
      await exportXLSX(exportRows, cfg);
    } finally { setExportingAction(null); }
  };
  const handleExportFullCatalog = async () => {
    if (!ALL_ROWS.length) return;
    setExportingAction('full');
    try { await exportFullCatalogXLSX(ALL_ROWS); } finally { setExportingAction(null); }
  };

  const previewFilename = cfg.targetName
    ? `${safeFilename(cfg.targetName)}_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`
    : 'Target_Checklist_<date>.xlsx';

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Pill stats */}
      <div className="flex items-center justify-between">
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
        <button onClick={handleSelectAll} className="text-[10px] font-bold htb-text-muted hover:text-[#9fef00] transition-colors uppercase tracking-widest border border-white/10 hover:border-[#9fef00]/30 rounded-lg px-3 py-1.5 bg-[#141d26]/60 hover:bg-[#9fef00]/10">
          Select All Items
        </button>
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
              {(['Black-Box','Grey-Box','All'] as EngagementType[]).map(et => (
                <button key={et} onClick={() => setCfg(p => ({ ...p, engagementType: et }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    cfg.engagementType === et
                      ? 'bg-[#9fef00]/6 border-[#9fef00]/25 text-[#9fef00]'
                      : `${QUIET_CONTROL} htb-text-muted ${QUIET_CONTROL_HOVER} hover:htb-text`
                  }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 transition-colors ${cfg.engagementType === et ? 'bg-[#9fef00] border-[#9fef00]' : 'border-white/20'}`} />
                  <p className="text-[12px] font-bold leading-tight flex-1">{et}</p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border opacity-60">
                    {et === 'Black-Box' ? 'Black-Box + Both' : et === 'Grey-Box' ? 'Grey-Box + Both' : 'All test cases'}
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

        {/* ── Right: Profile + Features ── */}
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

            {cfg.categories.length > 0 && contributingFeatureCount === 0 && cfg.customFeatures.length === 0 && (
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

            {/* Custom Features UI */}
            <div className="pt-4 mt-2 border-t border-white/[0.04]">
              <p className="text-[10px] font-bold htb-text-muted uppercase tracking-[0.18em] mb-3">User-Defined Custom Features</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={newCustomFeature}
                  onChange={e => setNewCustomFeature(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCustomFeature.trim()) {
                      setCfg(p => ({ ...p, customFeatures: [...p.customFeatures, newCustomFeature.trim()] }));
                      setNewCustomFeature('');
                    }
                  }}
                  placeholder="e.g. Chatbot AI"
                  className="flex-1 bg-[#0a0f16]/60 border border-white/[0.08] rounded-lg px-3 py-2 text-sm htb-text-muted placeholder-htb-text-faint focus:outline-none focus:border-[#9fef00]/30"
                />
                <button
                  onClick={() => {
                    if (newCustomFeature.trim()) {
                      setCfg(p => ({ ...p, customFeatures: [...p.customFeatures, newCustomFeature.trim()] }));
                      setNewCustomFeature('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#141d26]/80 border border-white/10 hover:bg-[#9fef00]/10 hover:border-[#9fef00]/30 hover:text-[#9fef00] transition-colors text-[11px] font-bold uppercase tracking-widest htb-text-muted"
                >
                  Add
                </button>
              </div>
              
              {cfg.customFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cfg.customFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9fef00]/8 border border-[#9fef00]/25 text-[#9fef00] text-[11px] font-bold tracking-tight">
                      <span>{feat}</span>
                      <button 
                        onClick={() => setCfg(p => ({ ...p, customFeatures: p.customFeatures.filter((_, i) => i !== idx) }))}
                        className="p-0.5 hover:bg-[#9fef00]/20 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

        </div>
      </div>

      {isPreviewOpen && (
        <PreviewModal
          rows={filtered}
          excludedRefs={excludedRefs}
          onToggleRow={togglePreviewExclusion}
          onClearExclusions={() => setExcludedRefs(new Set())}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Export panel */}
      <div className={`${PANEL_SHELL} rounded-2xl overflow-hidden`}>
        <div className={`px-4 py-3 ${PANEL_HEADER} border-b border-white/[0.06]`}>
          <span className="text-[10px] font-bold htb-text-muted uppercase tracking-[0.18em]">Export</span>
        </div>
        <div className={`px-4 py-3 ${PANEL_BODY} space-y-2`}>
          <button
            onClick={() => filtered.length > 0 && setIsPreviewOpen(true)}
            disabled={filtered.length === 0}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
              filtered.length === 0
                ? 'border-white/[0.05] bg-white/[0.03] htb-text-faint cursor-not-allowed'
                : 'border-white/[0.08] bg-[#141d26]/94 htb-text-muted hover:bg-[#18222d] hover:htb-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                {filtered.length === 0 ? 'No preview available' : `Output Preview (${exportRows.length})`}
              </span>
            </div>
            <span className="text-[9px] font-bold htb-text-faint">
              {excludedCount > 0 ? `${excludedCount} excluded` : `${filtered.length} selected`}
            </span>
          </button>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={exportingAction !== null || exportRows.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-[0.12em] transition-all ${
                exportRows.length === 0
                  ? 'bg-white/5 border border-white/5 htb-text-faint cursor-not-allowed'
                  : exportingAction === 'filtered'
                    ? 'bg-[#9fef00]/10 border border-[#9fef00]/20 htb-text-muted cursor-wait'
                    : 'bg-[#9fef00] text-black hover:shadow-[0_0_25px_rgba(159,239,0,0.2)] active:scale-[0.99]'
              }`}>
              <Download className="w-4 h-4" />
              {exportingAction === 'filtered' ? 'Building…' : filtered.length === 0 ? 'Select category' : exportRows.length === 0 ? 'All rows excluded' : `Export ${exportRows.length}`}
            </button>
          </div>
          <p className="text-[9px] htb-text-faint leading-relaxed font-mono">
            {previewFilename}
          </p>
        </div>
      </div>
    </div>
  );
};
