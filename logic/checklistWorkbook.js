export const WORKBOOK_LAYOUT = [
  { category: 'web', sheetType: 'baseline', name: 'WEB - Baseline' },
  { category: 'web', sheetType: 'custom', name: 'WEB - Custom' },
  { category: 'mobile', sheetType: 'baseline', name: 'MOBILE - Baseline' },
  { category: 'mobile', sheetType: 'custom', name: 'MOBILE - Custom' },
  { category: 'desktop', sheetType: 'baseline', name: 'DESKTOP - Baseline' },
  { category: 'desktop', sheetType: 'custom', name: 'DESKTOP - Custom' },
];

export const WORKBOOK_HEADERS = {
  baseline: ['#', 'Test Case', 'Objective', 'Type', 'Tools', 'Severity', 'Status', 'Notes'],
  custom: ['#', 'Feature', 'Test Case', 'Objective', 'Tools', 'Present?', 'Type', 'Severity', 'Status', 'Notes'],
};

export const WORKBOOK_COLUMN_WIDTHS = {
  baseline: [5, 42, 48, 10, 24, 10, 12, 35, { wch: 18, hidden: true }],
  custom: [5, 20, 38, 46, 24, 10, 8, 10, 12, 35, { wch: 18, hidden: true }],
  summary: [24, 72, 16],
  markdown: [24, 110, { wch: 32, hidden: true }, { wch: 110, hidden: true }],
};

const SEVERITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const CATEGORY_LABELS = {
  web: 'Web / API',
  mobile: 'Mobile (Android)',
  desktop: 'Desktop / Thick Client',
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
  const type = row.type ?? ROW_TYPE_LABELS[row.rowType] ?? 'Test';
  const severityLabel = row.severityLabel ?? SEVERITY_LABELS[row.severity] ?? row.severity ?? 'Medium';

  return {
    category,
    sheetType,
    ref,
    group: row.group ?? '',
    testCase,
    objective: row.objective ?? '',
    feature,
    type,
    tools: Array.isArray(row.tools) ? row.tools : [],
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



function summaryAreaName(row) {
  const sheetName = getWorkbookSheetName(row.category, row.sheetType);
  return row.sheetType === 'custom'
    ? `${sheetName}: ${row.feature || row.group || 'Feature-specific'}`
    : `${sheetName}: ${row.group || 'General'}`;
}

function markdownSectionName(row) {
  const platformLabel = CATEGORY_LABELS[row.category] ?? row.category;
  const sectionLabel = row.sheetType === 'custom'
    ? row.feature || row.group || 'Feature-specific'
    : row.group || 'General';

  return `${platformLabel} - ${sectionLabel}`.replace(/\s+/g, ' ').trim();
}



function buildWorkbookAreas(normalizedRows) {
  const areas = new Map();

  for (const row of normalizedRows) {
    const sheetName = getWorkbookSheetName(row.category, row.sheetType);
    const areaName = summaryAreaName(row);

    if (!areas.has(areaName)) {
      areas.set(areaName, { name: areaName, markdownName: markdownSectionName(row), sheetName, sheetType: row.sheetType });
    }
  }

  return [...areas.values()];
}

function buildSummaryRows(normalizedRows) {
  // Group rows by platform then by area name for a clean static table
  const areas = buildWorkbookAreas(normalizedRows);
  return areas.map((area, index) => [
    createDataCell(`${index + 1}. ${area.name}`),
    createDataCell(''),   // Status — fill in manually
    createDataCell(''),   // Notes
  ]);
}

function buildSummarySheet(normalizedRows) {
  const data = [];

  data.push([
    createStyledCell('Checklist Summary', titleStyle, 'title'),
    createStyledCell('', titleStyle, 'title'),
    createStyledCell('', titleStyle, 'title'),
  ]);
  data.push([
    createStyledCell('Use this sheet to track overall progress. Fill in Status and Notes as you work through each area.', metaValueStyle, 'meta-value'),
    createStyledCell('', metaValueStyle, 'meta-value'),
    createStyledCell('', metaValueStyle, 'meta-value'),
  ]);
  data.push(['Area', 'Status', 'Notes'].map((header) => createHeaderCell(header)));

  const summaryRows = buildSummaryRows(normalizedRows);
  if (summaryRows.length === 0) {
    data.push([
      createDataCell('No checklist rows for this configuration'),
      createDataCell(''),
      createDataCell(''),
    ]);
  } else {
    data.push(...summaryRows);
  }

  return {
    name: 'Summary',
    category: 'summary',
    sheetType: 'summary',
    rows: [],
    data,
    merges: [],
    columnWidths: WORKBOOK_COLUMN_WIDTHS.summary,
  };
}

function buildMarkdownSheet(normalizedRows) {
  const data = [];

  data.push([
    createStyledCell('Markdown Export', titleStyle, 'title'),
    createStyledCell('', titleStyle, 'title'),
  ]);
  data.push([
    createStyledCell('Copy the markdown from column B. Each row is a section ready to paste into your report.', metaValueStyle, 'meta-value'),
    createStyledCell('', metaValueStyle, 'meta-value'),
  ]);
  data.push(['Section', 'Markdown'].map((header) => createHeaderCell(header)));

  const areas = buildWorkbookAreas(normalizedRows);
  if (areas.length === 0) {
    data.push([
      createDataCell('No rows for this configuration'),
      createDataCell(''),
    ]);
  } else {
    for (const area of areas) {
      // Collect the test cases that belong to this area
      const areaRows = normalizedRows.filter((row) => summaryAreaName(row) === area.name);
      const lines = areaRows.map((row) => `- ${row.testCase}${row.objective ? ` : ${row.objective}` : ''}`);
      const markdownText = `### ${area.markdownName}\n${lines.join('\n')}`;
      data.push([
        createDataCell(area.name),
        createDataCell(markdownText),
      ]);
    }
  }

  return {
    name: 'Markdown',
    category: 'markdown',
    sheetType: 'markdown',
    rows: [],
    data,
    merges: [],
    columnWidths: WORKBOOK_COLUMN_WIDTHS.markdown,
  };
}

export function buildWorkbookSheets(rows, { metadataRows = [], includeEmptySheets = false, customFeatures = [] } = {}) {
  const normalizedRows = rows.map(normalizeWorkbookRow);
  const sheets = [buildSummarySheet(normalizedRows), buildMarkdownSheet(normalizedRows)];

  for (const sheet of WORKBOOK_LAYOUT) {
    const sheetRows = normalizedRows.filter((row) => row.category === sheet.category && row.sheetType === sheet.sheetType);
    if (!sheetRows.length && !includeEmptySheets) continue;

    const data = [];
    const merges = [];
    let currentRow = 0;
    const colCount = WORKBOOK_HEADERS[sheet.sheetType].length;

    // Add metadata to first sheet only
    if (sheets.length === 2 && metadataRows.length > 0) {
      metadataRows.forEach((row) => {
        const styledRow = [];
        if (row.length === 1 && row[0].includes('—')) {
          styledRow.push(createStyledCell(row[0], titleStyle, 'title'));
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount - 1 } });
        } else if (row.length === 2) {
          styledRow.push(createStyledCell(row[0], metaLabelStyle, 'meta-label'));
          styledRow.push(createStyledCell(row[1], metaValueStyle, 'meta-value'));
          for (let i = 2; i < colCount; i++) {
            styledRow.push(createDataCell(''));
          }
          merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount - 1 } });
        } else {
          row.forEach((cell, idx) => {
            if (idx < colCount) styledRow.push(createDataCell(cell || ''));
          });
        }
        data.push(styledRow);
        currentRow++;
      });
    }

    // Add section title for this sheet
    const titleRow = [createStyledCell(sheet.name, titleStyle, 'title')];
    for (let i = 1; i < colCount; i++) {
      titleRow.push(createStyledCell('', titleStyle, 'title'));
    }
    data.push(titleRow);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount - 1 } });
    currentRow++;
    data.push([]);
    currentRow++;

    // Add headers
    const headerRow = [...WORKBOOK_HEADERS[sheet.sheetType], 'Summary Area'].map(h => createHeaderCell(h));
    data.push(headerRow);
    currentRow++;

    let counter = 1;
    const groups = orderedGroups(sheetRows);

    if (groups.length === 0) {
      const emptyRow = [createDataCell('No items for this configuration')];
      for (let i = 1; i < colCount; i++) {
        emptyRow.push(createDataCell(''));
      }
      data.push(emptyRow);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount - 1 } });
      currentRow++;
    }

    for (const group of groups) {
      const groupRows = sheetRows.filter((entry) => entry.group === group);
      if (groupRows.length === 0) continue;

      // Group header row
      const groupRow = [createGroupCell(group.toUpperCase())];
      for (let i = 1; i < colCount; i++) {
        groupRow.push(createGroupCell(''));
      }
      groupRow.push(createGroupCell(''));
      data.push(groupRow);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount } });
      currentRow++;

      for (const row of groupRows) {
        const dataRow = [];
        const summaryArea = summaryAreaName(row);
        if (sheet.sheetType === 'baseline') {
          dataRow.push(createDataCell(counter++, 'center'));
          dataRow.push(createDataCell(row.testCase));
          dataRow.push(createDataCell(row.objective));
          dataRow.push(createDataCell(row.type, 'center'));
          dataRow.push(createDataCell(row.tools.join(', ')));
          dataRow.push(createSeverityCell(row.severityLabel));
          dataRow.push(createDataCell(row.status, 'center'));
          dataRow.push(createDataCell(''));
          dataRow.push(createDataCell(summaryArea));
        } else {
          dataRow.push(createDataCell(counter++, 'center'));
          dataRow.push(createDataCell(row.feature || row.group));
          dataRow.push(createDataCell(row.testCase));
          dataRow.push(createDataCell(row.objective));
          dataRow.push(createDataCell(row.tools.join(', ')));
          dataRow.push(createDataCell('—', 'center'));
          dataRow.push(createDataCell(row.type, 'center'));
          dataRow.push(createSeverityCell(row.severityLabel));
          dataRow.push(createDataCell(row.status, 'center'));
          dataRow.push(createDataCell(''));
          dataRow.push(createDataCell(summaryArea));
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

  // Generate sheets for user-defined custom features
  for (const customFeature of customFeatures) {
    const sheetName = String(customFeature).substring(0, 31); // Max Excel sheet length
    const colCount = WORKBOOK_HEADERS.custom.length;
    const data = [];
    const merges = [];
    let currentRow = 0;

    // Add section title
    const titleRow = [createStyledCell(customFeature, titleStyle, 'title')];
    for (let i = 1; i < colCount; i++) {
      titleRow.push(createStyledCell('', titleStyle, 'title'));
    }
    data.push(titleRow);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: colCount - 1 } });
    currentRow++;
    data.push([]);
    currentRow++;

    // Add headers
    const headerRow = [...WORKBOOK_HEADERS.custom, 'Summary Area'].map(h => createHeaderCell(h));
    data.push(headerRow);
    currentRow++;

    // Add one placeholder row
    const emptyRow = [createDataCell('—', 'center')]; // #
    emptyRow.push(createDataCell(customFeature)); // Feature
    emptyRow.push(createDataCell('N/A')); // Test Case
    emptyRow.push(createDataCell('N/A')); // Objective
    emptyRow.push(createDataCell('—')); // Tools
    emptyRow.push(createDataCell('—', 'center')); // Present?
    emptyRow.push(createDataCell('—', 'center')); // Type
    emptyRow.push(createDataCell('—', 'center')); // Severity
    emptyRow.push(createDataCell('Not Started', 'center')); // Status
    emptyRow.push(createDataCell('')); // Notes
    emptyRow.push(createDataCell(`Custom: ${customFeature}`)); // Summary Area
    
    data.push(emptyRow);
    currentRow++;

    sheets.push({
      name: sheetName,
      category: 'custom',
      sheetType: 'custom',
      rows: [], // User-defined feature has no initial catalog rows
      data,
      merges,
      columnWidths: WORKBOOK_COLUMN_WIDTHS.custom,
    });
  }

  return sheets;
}
