import fs from 'node:fs';
import path from 'node:path';
import * as CFBModule from 'cfb';

import { buildWorkbookMetadataRows, buildWorkbookSheets, WORKBOOK_LAYOUT } from '../logic/checklistWorkbook.js';
import { buildWorkbookBuffer, WORKBOOK_XLSX_STYLE_INDEX } from '../logic/checklistWorkbookXlsx.js';

const CFB = CFBModule.default ?? CFBModule;

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8')).rows;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const metadataRows = buildWorkbookMetadataRows({
  scope: 'full',
  totalItems: catalog.length,
  sourceLabel: 'JSON catalog',
});

const sheets = buildWorkbookSheets(catalog, { metadataRows, includeEmptySheets: true });

assert(sheets.length === WORKBOOK_LAYOUT.length + 2, `expected ${WORKBOOK_LAYOUT.length + 2} sheets, got ${sheets.length}`);
assert(
  sheets.map((sheet) => sheet.name).join('|') === ['Summary', 'Markdown', ...WORKBOOK_LAYOUT.map((sheet) => sheet.name)].join('|'),
  'workbook sheet names/order do not include Summary and Markdown before the canonical six-sheet layout'
);

// Summary sheet: static (no formulas)
assert(sheets[0].data[0]?.[0]?.v === 'Checklist Summary', 'summary sheet must start with the summary title');
const summaryHeaderIndex = sheets[0].data.findIndex((row) => row.map((cell) => cell?.v).join('|') === 'Area|Status|Notes');
assert(summaryHeaderIndex >= 0, 'summary sheet must include Area/Status/Notes headers');
const summaryRows = sheets[0].data.slice(summaryHeaderIndex + 1);
assert(summaryRows.length > 0, 'summary sheet must include at least one area row');
assert(summaryRows[0][0]?.v, 'summary area cells must have a text value');
assert(summaryRows.every((row) => !row[0]?.f && !row[1]?.f), 'summary sheet must be fully static (no formulas)');

// Markdown sheet: static pre-rendered markdown (no formulas)
assert(sheets[1].data[0]?.[0]?.v === 'Markdown Export', 'markdown sheet must start with the markdown title');
const markdownHeaderIndex = sheets[1].data.findIndex((row) => row.map((cell) => cell?.v).slice(0, 2).join('|') === 'Section|Markdown');
assert(markdownHeaderIndex >= 0, 'markdown sheet must include Section/Markdown headers');
const markdownRows = sheets[1].data.slice(markdownHeaderIndex + 1);
assert(markdownRows.length > 0, 'markdown sheet must include at least one row');
const firstMarkdownRow = markdownRows[0];
assert(firstMarkdownRow[0]?.v, 'markdown section cell must have a text value');
assert(firstMarkdownRow[1]?.v?.includes('###'), 'markdown content cell must include a heading marker');
assert(!firstMarkdownRow[1]?.f, 'markdown content cell must be static text, not a formula');

assert(sheets[2].data[0]?.[0]?.v === 'PENTEST CHECKLIST — FULL CATALOG', 'first detail sheet must start with the workbook title');

function findHeaderRow(sheet, firstCell) {
  return sheet.data.find((row) => row.some((cell) => cell?.v === firstCell));
}

const baselineHeaderRow = findHeaderRow(sheets[2], 'Test Case');
const customHeaderRow = findHeaderRow(sheets[3], 'Feature');
assert(baselineHeaderRow?.some((cell) => cell?.v === 'Tools'), 'baseline workbook header must include a Tools column');
assert(customHeaderRow?.some((cell) => cell?.v === 'Tools'), 'custom workbook header must include a Tools column');
assert(sheets[2].columnWidths.some((column) => typeof column === 'object' && column.hidden), 'baseline detail sheets must include a hidden helper column');
assert(sheets[3].columnWidths.some((column) => typeof column === 'object' && column.hidden), 'custom detail sheets must include a hidden helper column');

const exportedRefs = new Set();
let jsUrlAnalysisRow = null;

for (const sheet of sheets) {
  for (const row of sheet.rows) {
    const platform = row.category ?? row.platform;
    const section = row.sheetType ?? row.section;
    const expectedSheet = WORKBOOK_LAYOUT.find((entry) => entry.category === platform && entry.sheetType === section)?.name;

    assert(expectedSheet === sheet.name, `${row.ref ?? row.id} was placed in ${sheet.name} instead of ${expectedSheet}`);
    assert(Array.isArray(row.tools) && row.tools.length >= 1 && row.tools.length <= 3, `${row.ref ?? row.id} must export 1-3 tools`);
    exportedRefs.add(row.ref ?? row.id);
    if ((row.ref ?? row.id) === 'WEB-BL-004') {
      jsUrlAnalysisRow = row;
    }
  }
}

assert(exportedRefs.size === catalog.length, `expected ${catalog.length} exported refs, got ${exportedRefs.size}`);
assert(jsUrlAnalysisRow, 'expected merged WEB-BL-004 in exported workbook rows');
assert(
  Array.isArray(jsUrlAnalysisRow.tools) &&
    jsUrlAnalysisRow.tools.includes('xnLinkFinder') &&
    jsUrlAnalysisRow.tools.includes('Katana'),
  'WEB-BL-004 must carry merged xnLinkFinder and Katana tool metadata'
);

for (const ref of ['WEB-CT-064', 'MOB-CT-023', 'DSK-CT-022']) {
  assert(exportedRefs.has(ref), `missing curated row in full export: ${ref}`);
}
for (const ref of ['WEB-BL-021', 'MOB-CT-042', 'DSK-CT-040', 'MOB-CT-019']) {
  assert(exportedRefs.has(ref), `missing protocol feature row in full export: ${ref}`);
}

function findStyledCellRef(sheet, predicate) {
  for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < sheet.data[rowIndex].length; columnIndex += 1) {
      const cell = sheet.data[rowIndex][columnIndex];
      if (!cell || typeof cell !== 'object') continue;
      if (predicate(cell)) {
        return { ref: `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`, cell };
      }
    }
  }

  return null;
}

const workbookBytes = buildWorkbookBuffer(sheets);
const zip = CFB.read(Array.from(workbookBytes), { type: 'array' });
const stylesXml = Buffer.from(CFB.find(zip, '/xl/styles.xml').content).toString('utf8');
const firstSheetXml = Buffer.from(CFB.find(zip, '/xl/worksheets/sheet1.xml').content).toString('utf8');
const firstDetailSheetXml = Buffer.from(CFB.find(zip, '/xl/worksheets/sheet3.xml').content).toString('utf8');

assert(stylesXml.includes('<name val="Aptos"/>'), 'styles.xml must include Aptos font definitions');
assert(stylesXml.includes('fgColor rgb="FF1F2937"'), 'styles.xml must include the dark header fill');

const headerCell = findStyledCellRef(sheets[0], (cell) => cell.styleKey === 'header');
assert(headerCell, 'expected a header cell in the first sheet');
assert(
  new RegExp(`<c[^>]*r="${headerCell.ref}"[^>]*s="${WORKBOOK_XLSX_STYLE_INDEX.header}"`).test(firstSheetXml),
  `expected ${headerCell.ref} to reference the header style index`
);
assert(!/\<f\>IFERROR\(TEXTJOIN/.test(firstSheetXml), 'summary worksheet XML must NOT contain formula cells');
assert(/hidden="(?:1|true)"/.test(firstDetailSheetXml), 'detail worksheet XML must include a hidden helper column');

const severityCell = sheets
  .map((sheet, sheetIndex) => {
    const match = findStyledCellRef(sheet, (cell) => String(cell.styleKey || '').startsWith('severity-'));
    return match ? { ...match, sheetIndex } : null;
  })
  .find(Boolean);
assert(severityCell, 'expected at least one styled severity cell in the workbook');

const severitySheetXml = Buffer.from(
  CFB.find(zip, `/xl/worksheets/sheet${severityCell.sheetIndex + 1}.xml`).content
).toString('utf8');
const expectedSeverityIndex = WORKBOOK_XLSX_STYLE_INDEX[severityCell.cell.styleKey];
assert(
  new RegExp(`<c[^>]*r="${severityCell.ref}"[^>]*s="${expectedSeverityIndex}"`).test(severitySheetXml),
  `expected ${severityCell.ref} to reference severity style index ${expectedSeverityIndex}`
);

console.log(`PASS export shape+styles: ${sheets.length} sheets, ${exportedRefs.size} rows, curated rows and XLSX styles included`);
