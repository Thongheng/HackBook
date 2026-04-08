import fs from 'node:fs';
import path from 'node:path';

import { buildWorkbookMetadataRows, buildWorkbookSheets, WORKBOOK_LAYOUT } from '../logic/checklistWorkbook.js';

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

assert(sheets[0].data.some((row) => row[0] === 'Source' && row[1] === 'JSON catalog'), 'first sheet metadata must declare JSON catalog source');

const exportedRefs = new Set();

for (const sheet of sheets) {
  for (const row of sheet.rows) {
    const platform = row.category ?? row.platform;
    const section = row.sheetType ?? row.section;
    const expectedSheet = WORKBOOK_LAYOUT.find((entry) => entry.category === platform && entry.sheetType === section)?.name;

    assert(expectedSheet === sheet.name, `${row.ref ?? row.id} was placed in ${sheet.name} instead of ${expectedSheet}`);
    exportedRefs.add(row.ref ?? row.id);
  }
}

assert(exportedRefs.size === catalog.length, `expected ${catalog.length} exported refs, got ${exportedRefs.size}`);

for (const ref of ['WEB-CT-082', 'MOB-CT-023', 'DSK-CT-022']) {
  assert(exportedRefs.has(ref), `missing curated row in full export: ${ref}`);
}

console.log(`PASS export shape: ${sheets.length} sheets, ${exportedRefs.size} rows, curated rows included`);
