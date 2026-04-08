import { accessModeLabel } from './checklistEngine.js';

export const WORKBOOK_LAYOUT = [
  { category: 'web', sheetType: 'baseline', name: 'WEB - Baseline' },
  { category: 'web', sheetType: 'custom', name: 'WEB - Custom' },
  { category: 'mobile', sheetType: 'baseline', name: 'MOBILE - Baseline' },
  { category: 'mobile', sheetType: 'custom', name: 'MOBILE - Custom' },
  { category: 'desktop', sheetType: 'baseline', name: 'DESKTOP - Baseline' },
  { category: 'desktop', sheetType: 'custom', name: 'DESKTOP - Custom' },
];

export const WORKBOOK_HEADERS = {
  baseline: ['#', 'Ref ID', 'Std Ref', 'Group', 'Test Case', 'Objective / What to Look For', 'Mode', 'Type', 'Severity', 'Status', 'Tested On', 'Evidence / Notes'],
  custom: ['#', 'Ref ID', 'Std Ref', 'Feature', 'Test Case', 'Objective / What to Look For', 'Feature Present?', 'Mode', 'Type', 'Severity', 'Status', 'Tested On', 'Evidence / Notes'],
};

export const WORKBOOK_COLUMN_WIDTHS = {
  baseline: [4, 14, 14, 18, 46, 42, 12, 10, 11, 13, 12, 42],
  custom: [4, 14, 14, 18, 46, 42, 14, 12, 10, 11, 13, 12, 42],
};

const SEVERITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const ROW_TYPE_LABELS = {
  setup: 'Setup',
  test: 'Test',
};

export function getWorkbookSheetName(category, sheetType) {
  const match = WORKBOOK_LAYOUT.find((sheet) => sheet.category === category && sheet.sheetType === sheetType);
  return match?.name ?? `${String(category).toUpperCase()} - ${sheetType === 'baseline' ? 'Baseline' : 'Custom'}`;
}

function normalizeWorkbookRow(row) {
  const category = row.category ?? row.platform;
  const sheetType = row.sheetType ?? row.section;
  const ref = row.ref ?? row.id;
  const testCase = row.testCase ?? row.title;
  const feature = row.feature ?? row.featureLabel ?? row.group ?? null;
  const mode = row.mode ?? accessModeLabel(row.access);
  const type = row.type ?? ROW_TYPE_LABELS[row.rowType] ?? 'Test';
  const severityLabel = row.severityLabel ?? SEVERITY_LABELS[row.severity] ?? row.severity ?? 'Medium';

  return {
    category,
    sheetType,
    ref,
    stdRef: row.stdRef ?? '',
    group: row.group ?? '',
    testCase,
    objective: row.objective ?? '',
    feature,
    mode,
    type,
    severityLabel,
    status: row.status ?? 'Not Started',
  };
}

function orderedGroups(rows) {
  const seen = new Set();
  const groups = [];

  for (const row of rows) {
    if (seen.has(row.group)) continue;
    seen.add(row.group);
    groups.push(row.group);
  }

  return groups;
}

export function buildWorkbookMetadataRows({
  scope = 'filtered',
  generatedAt = new Date().toLocaleString(),
  engagementName = '',
  targetName = '',
  engagementType = '',
  categories = [],
  totalItems = 0,
  sourceLabel = 'JSON catalog',
} = {}) {
  if (scope === 'full') {
    return [
      ['PENTEST CHECKLIST CATALOG — HACKBOOK'],
      [],
      ['Generated', generatedAt],
      ['Source', sourceLabel],
      ['Export Scope', 'Full catalog'],
      ['Sheets', 'WEB / MOBILE / DESKTOP'],
      ['Total Items', String(totalItems)],
      [],
    ];
  }

  return [
    ['PENTEST CHECKLIST — HACKBOOK GENERATOR v3'],
    [],
    ['Generated', generatedAt],
    ['Source', sourceLabel],
    ['Export Scope', 'Filtered selection'],
    ['Engagement', engagementName || '—'],
    ['Target', targetName || '—'],
    ['Engagement Type', engagementType || '—'],
    ['Categories', categories.length ? categories.join(', ') : '—'],
    ['Total Items', String(totalItems)],
    [],
  ];
}

export function buildWorkbookSheets(rows, { metadataRows = [], includeEmptySheets = false } = {}) {
  const normalizedRows = rows.map(normalizeWorkbookRow);
  const sheets = [];
  let metadataPending = metadataRows.length > 0;

  for (const sheet of WORKBOOK_LAYOUT) {
    const sheetRows = normalizedRows.filter((row) => row.category === sheet.category && row.sheetType === sheet.sheetType);
    if (!sheetRows.length && !includeEmptySheets) continue;

    const data = [];
    if (metadataPending) {
      metadataRows.forEach((row) => data.push(row));
      metadataPending = false;
    }

    data.push(WORKBOOK_HEADERS[sheet.sheetType]);

    let counter = 1;
    for (const group of orderedGroups(sheetRows)) {
      data.push([group]);
      for (const row of sheetRows.filter((entry) => entry.group === group)) {
        if (sheet.sheetType === 'baseline') {
          data.push([counter++, row.ref, row.stdRef, row.group, row.testCase, row.objective, row.mode, row.type, row.severityLabel, row.status, '', '']);
        } else {
          data.push([counter++, row.ref, row.stdRef, row.feature || row.group, row.testCase, row.objective, '—', row.mode, row.type, row.severityLabel, row.status, '', '']);
        }
      }
    }

    sheets.push({
      ...sheet,
      rows: sheetRows,
      data,
      columnWidths: WORKBOOK_COLUMN_WIDTHS[sheet.sheetType],
    });
  }

  return sheets;
}
