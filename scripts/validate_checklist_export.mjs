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

assert(sheets.length === WORKBOOK_LAYOUT.length, `expected ${WORKBOOK_LAYOUT.length} sheets, got ${sheets.length}`);
assert(
  sheets.map((sheet) => sheet.name).join('|') === WORKBOOK_LAYOUT.map((sheet) => sheet.name).join('|'),
  'workbook sheet names/order do not match the canonical six-sheet layout'
);

assert(sheets[0].data[0]?.[0]?.v === 'PENTEST CHECKLIST — FULL CATALOG', 'first sheet must start with the workbook title');

function findHeaderRow(sheet, firstCell) {
  return sheet.data.find((row) => row.some((cell) => cell?.v === firstCell));
}

const baselineHeaderRow = findHeaderRow(sheets[0], 'Test Case');
const customHeaderRow = findHeaderRow(sheets[1], 'Feature');
assert(baselineHeaderRow?.some((cell) => cell?.v === 'Tools'), 'baseline workbook header must include a Tools column');
assert(customHeaderRow?.some((cell) => cell?.v === 'Tools'), 'custom workbook header must include a Tools column');

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
    if ((row.ref ?? row.id) === 'WEB-BL-087') {
      jsUrlAnalysisRow = row;
    }
  }
}

assert(exportedRefs.size === catalog.length, `expected ${catalog.length} exported refs, got ${exportedRefs.size}`);
assert(jsUrlAnalysisRow, 'expected WEB-BL-087 in exported workbook rows');
assert(
  Array.isArray(jsUrlAnalysisRow.tools) &&
    jsUrlAnalysisRow.tools.join('|') === 'xnLinkFinder|Katana',
  'WEB-BL-087 must carry xnLinkFinder and Katana tool metadata'
);

for (const ref of ['WEB-CT-082', 'MOB-CT-023', 'DSK-CT-022']) {
  assert(exportedRefs.has(ref), `missing curated row in full export: ${ref}`);
}
for (const ref of ['WEB-BL-021', 'MOB-CT-042', 'DSK-CT-040']) {
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

assert(stylesXml.includes('<name val="Aptos"/>'), 'styles.xml must include Aptos font definitions');
assert(stylesXml.includes('fgColor rgb="FF1F2937"'), 'styles.xml must include the dark header fill');

const headerCell = findStyledCellRef(sheets[0], (cell) => cell.styleKey === 'header');
assert(headerCell, 'expected a header cell in the first sheet');
assert(
  new RegExp(`<c[^>]*r="${headerCell.ref}"[^>]*s="${WORKBOOK_XLSX_STYLE_INDEX.header}"`).test(firstSheetXml),
  `expected ${headerCell.ref} to reference the header style index`
);

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
