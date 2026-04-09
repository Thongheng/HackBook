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
  baseline: ['#', 'Ref ID', 'Std Ref', 'Group', 'Test Case', 'Objective', 'Mode', 'Type', 'Severity', 'Status', 'Tested On', 'Notes'],
  custom: ['#', 'Ref ID', 'Std Ref', 'Feature', 'Test Case', 'Objective', 'Present?', 'Mode', 'Type', 'Severity', 'Status', 'Tested On', 'Notes'],
};

export const WORKBOOK_COLUMN_WIDTHS = {
  baseline: [5, 12, 12, 22, 45, 50, 10, 8, 10, 12, 12, 35],
  custom: [5, 12, 12, 20, 42, 48, 10, 10, 8, 10, 12, 12, 35],
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

// Excel aRGB colors (FF prefix + RGB hex)
const COLORS = {
  headerBg: 'FF1F2937',      // Dark gray
  headerFont: 'FFFFFFFF',    // White
  groupBg: 'FF374151',       // Medium gray
  groupFont: 'FFFFFFFF',     // White
  border: 'FF9CA3AF',        // Gray border
  title: 'FF111827',         // Near black
  // Severity colors (light backgrounds with dark text)
  criticalBg: 'FFFEE2E2',    // Light red
  criticalFont: 'FF991B1B',    // Dark red
  highBg: 'FFFFEDD5',        // Light orange
  highFont: 'FF9A3412',        // Dark orange
  mediumBg: 'FFFEF3C7',      // Light yellow
  mediumFont: 'FF92400E',    // Dark amber
  lowBg: 'FFDBEAFE',         // Light blue
  lowFont: 'FF1E40AF',         // Dark blue
  infoBg: 'FFF3F4F6',         // Light gray
  infoFont: 'FF4B5563',        // Dark gray
};

// Base border style
const baseBorder = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

// Aptos font, size 10
const aptosFont = { name: 'Aptos', sz: 10 };
const aptosFontBold = { name: 'Aptos', sz: 10, bold: true };

// Header style - Dark with white text
const headerStyle = {
  fill: { fgColor: { argb: COLORS.headerBg }, patternType: 'solid' },
  font: { ...aptosFontBold, color: { argb: COLORS.headerFont } },
  border: baseBorder,
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

// Group header style - Medium gray
const groupStyle = {
  fill: { fgColor: { argb: COLORS.groupBg }, patternType: 'solid' },
  font: { ...aptosFontBold, color: { argb: COLORS.groupFont } },
  border: baseBorder,
  alignment: { horizontal: 'left', vertical: 'center' },
};

// Data cell style
const dataStyle = {
  font: aptosFont,
  border: baseBorder,
  alignment: { vertical: 'center', wrapText: true },
};

// Severity styles
const severityStyles = {
  Critical: {
    fill: { fgColor: { argb: COLORS.criticalBg }, patternType: 'solid' },
    font: { ...aptosFontBold, color: { argb: COLORS.criticalFont } },
    border: baseBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  High: {
    fill: { fgColor: { argb: COLORS.highBg }, patternType: 'solid' },
    font: { ...aptosFontBold, color: { argb: COLORS.highFont } },
    border: baseBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  Medium: {
    fill: { fgColor: { argb: COLORS.mediumBg }, patternType: 'solid' },
    font: { ...aptosFontBold, color: { argb: COLORS.mediumFont } },
    border: baseBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  Low: {
    fill: { fgColor: { argb: COLORS.lowBg }, patternType: 'solid' },
    font: { ...aptosFontBold, color: { argb: COLORS.lowFont } },
    border: baseBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  Info: {
    fill: { fgColor: { argb: COLORS.infoBg }, patternType: 'solid' },
    font: { ...aptosFont, color: { argb: COLORS.infoFont } },
    border: baseBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  },
};

// Title style - Large bold
const titleStyle = {
  font: { name: 'Aptos', sz: 14, bold: true, color: { argb: COLORS.title } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

// Metadata label style
const metaLabelStyle = {
  font: { ...aptosFontBold, color: { argb: 'FF6B7280' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

// Metadata value style
const metaValueStyle = {
  font: aptosFont,
  alignment: { horizontal: 'left', vertical: 'center' },
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
  sourceLabel = 'Catalog',
} = {}) {
  return [[scope === 'full' ? 'PENTEST CHECKLIST — FULL CATALOG' : 'PENTEST CHECKLIST — ENGAGEMENT EXPORT'], [], []];
}

function createStyledCell(value, style, styleKey = null) {
  const cell = {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style,
  };

  if (styleKey) {
    cell.styleKey = styleKey;
  }

  return cell;
}

function createSeverityCell(severity) {
  const style = severityStyles[severity] || severityStyles.Info;
  const styleKey = `severity-${String(severity).toLowerCase()}`;
  return createStyledCell(severity, style, styleKey);
}

function createHeaderCell(value) {
  return createStyledCell(value, headerStyle, 'header');
}

function createGroupCell(value) {
  return createStyledCell(value, groupStyle, 'group');
}

function createDataCell(value, align = 'left') {
  const style = { ...dataStyle, alignment: { ...dataStyle.alignment, horizontal: align } };
  const styleKey = align === 'center' ? 'data-center' : 'data-left';
  return createStyledCell(value, style, styleKey);
}

export function buildWorkbookSheets(rows, { metadataRows = [], includeEmptySheets = false } = {}) {
  const normalizedRows = rows.map(normalizeWorkbookRow);
  const sheets = [];

  for (const sheet of WORKBOOK_LAYOUT) {
    const sheetRows = normalizedRows.filter((row) => row.category === sheet.category && row.sheetType === sheet.sheetType);
    if (!sheetRows.length && !includeEmptySheets) continue;

    const data = [];
    const merges = [];
    let currentRow = 0;

    // Add metadata to first sheet only
    if (sheets.length === 0 && metadataRows.length > 0) {
      metadataRows.forEach((row) => {
        const styledRow = [];
        if (row.length === 1 && row[0].includes('—')) {
          styledRow.push(createStyledCell(row[0], titleStyle, 'title'));
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 11 } });
        } else if (row.length === 2) {
          styledRow.push(createStyledCell(row[0], metaLabelStyle, 'meta-label'));
          styledRow.push(createStyledCell(row[1], metaValueStyle, 'meta-value'));
          for (let i = 2; i < 12; i++) {
            styledRow.push(createDataCell(''));
          }
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 11 } });
        } else {
          row.forEach((cell, idx) => {
            if (idx < 12) styledRow.push(createDataCell(cell || ''));
          });
        }
        data.push(styledRow);
        currentRow++;
      });
    }

    // Add section title for this sheet
    const titleRow = [createStyledCell(sheet.name, titleStyle, 'title')];
    for (let i = 1; i < 12; i++) {
      titleRow.push(createStyledCell('', titleStyle, 'title'));
    }
    data.push(titleRow);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 11 } });
    currentRow++;
    data.push([]);
    currentRow++;

    // Add headers
    const headerRow = WORKBOOK_HEADERS[sheet.sheetType].map(h => createHeaderCell(h));
    data.push(headerRow);
    currentRow++;

    let counter = 1;
    const groups = orderedGroups(sheetRows);

    if (groups.length === 0) {
      const emptyRow = [createDataCell('No items for this configuration')];
      for (let i = 1; i < WORKBOOK_HEADERS[sheet.sheetType].length; i++) {
        emptyRow.push(createDataCell(''));
      }
      data.push(emptyRow);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: WORKBOOK_HEADERS[sheet.sheetType].length - 1 } });
      currentRow++;
    }

    for (const group of groups) {
      const groupRows = sheetRows.filter((entry) => entry.group === group);
      if (groupRows.length === 0) continue;

      // Group header row
      const groupRow = [createGroupCell(group.toUpperCase())];
      for (let i = 1; i < WORKBOOK_HEADERS[sheet.sheetType].length; i++) {
        groupRow.push(createGroupCell(''));
      }
      data.push(groupRow);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: WORKBOOK_HEADERS[sheet.sheetType].length - 1 } });
      currentRow++;

      for (const row of groupRows) {
        const dataRow = [];
        if (sheet.sheetType === 'baseline') {
          dataRow.push(createDataCell(counter++, 'center'));
          dataRow.push(createDataCell(row.ref, 'center'));
          dataRow.push(createDataCell(row.stdRef, 'center'));
          dataRow.push(createDataCell(row.group));
          dataRow.push(createDataCell(row.testCase));
          dataRow.push(createDataCell(row.objective));
          dataRow.push(createDataCell(row.mode, 'center'));
          dataRow.push(createDataCell(row.type, 'center'));
          dataRow.push(createSeverityCell(row.severityLabel));
          dataRow.push(createDataCell(row.status, 'center'));
          dataRow.push(createDataCell('', 'center'));
          dataRow.push(createDataCell(''));
        } else {
          dataRow.push(createDataCell(counter++, 'center'));
          dataRow.push(createDataCell(row.ref, 'center'));
          dataRow.push(createDataCell(row.stdRef, 'center'));
          dataRow.push(createDataCell(row.feature || row.group));
          dataRow.push(createDataCell(row.testCase));
          dataRow.push(createDataCell(row.objective));
          dataRow.push(createDataCell('—', 'center'));
          dataRow.push(createDataCell(row.mode, 'center'));
          dataRow.push(createDataCell(row.type, 'center'));
          dataRow.push(createSeverityCell(row.severityLabel));
          dataRow.push(createDataCell(row.status, 'center'));
          dataRow.push(createDataCell('', 'center'));
          dataRow.push(createDataCell(''));
        }
        data.push(dataRow);
        currentRow++;
      }

      // Empty row after each group
      data.push([]);
      currentRow++;
    }

    sheets.push({
      ...sheet,
      rows: sheetRows,
      data,
      merges,
      columnWidths: WORKBOOK_COLUMN_WIDTHS[sheet.sheetType],
    });
  }

  return sheets;
}
