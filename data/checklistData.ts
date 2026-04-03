import catalog from './checklistCatalog.json';
import { accessModeLabel, buildFeatureRegistry, featureRegistryByPlatform } from '../logic/checklistEngine.js';

export type Category = 'web' | 'mobile' | 'desktop';
export type SheetType = 'baseline' | 'custom';
export type Access = 'blackbox' | 'greybox' | 'both';
export type RowType = 'test' | 'setup';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SourceType = 'excel' | 'curated';

export interface ChecklistCatalogRow {
  id: string;
  stdRef: string;
  group: string;
  title: string;
  objective: string;
  access: Access;
  rowType: RowType;
  severity: Severity;
  status: string;
  platform: Category;
  section: SheetType;
  featureKey: string | null;
  featureLabel: string | null;
  source: SourceType;
  sourceSheet: string | null;
  sourceRef: string;
  tags: string[];
  tech: string[];
}

export interface ChecklistRow extends ChecklistCatalogRow {
  ref: string;
  testCase: string;
  type: 'Test' | 'Setup';
  category: Category;
  sheetType: SheetType;
  feature: string | null;
  mode: 'Black-Box' | 'Grey-Box' | 'Both';
  severityLabel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
}

const severityLabel = (severity: Severity): ChecklistRow['severityLabel'] =>
  ({
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    info: 'Info',
  })[severity];

const rowTypeLabel = (rowType: RowType): ChecklistRow['type'] => (rowType === 'setup' ? 'Setup' : 'Test');

export const CATALOG_ROWS: ChecklistCatalogRow[] = catalog.rows as ChecklistCatalogRow[];

export const ALL_ROWS: ChecklistRow[] = CATALOG_ROWS.map((row) => ({
  ...row,
  ref: row.id,
  testCase: row.title,
  type: rowTypeLabel(row.rowType),
  category: row.platform,
  sheetType: row.section,
  feature: row.featureLabel,
  mode: accessModeLabel(row.access) as ChecklistRow['mode'],
  severityLabel: severityLabel(row.severity),
}));

export const FEATURE_REGISTRY = buildFeatureRegistry(CATALOG_ROWS);
export const FEATURE_GROUPS = featureRegistryByPlatform(CATALOG_ROWS) as Record<Category, typeof FEATURE_REGISTRY>;
export const FEATURES: Record<Category, string[]> = {
  web: FEATURE_GROUPS.web.map((feature) => feature.label),
  mobile: FEATURE_GROUPS.mobile.map((feature) => feature.label),
  desktop: FEATURE_GROUPS.desktop.map((feature) => feature.label),
};
