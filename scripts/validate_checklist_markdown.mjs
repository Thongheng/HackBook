import fs from 'node:fs';
import path from 'node:path';

import { filterCatalogRows } from '../logic/checklistEngine.js';
import { buildChecklistMarkdown } from '../logic/checklistMarkdown.js';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8')).rows;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const rows = filterCatalogRows(catalog, {
  engagementType: 'Grey-Box',
  categories: ['web'],
  scope: 'external',
  techStack: {
    web: { php: false, aspnet: false, tomcat: false, nodejs: false },
    mobile: { native: true, flutter: false, reactnative: false },
    desktop: { dotnet: true, electron: false, java: false },
  },
  features: {
    'web:login': true,
    'web:file-upload': true,
  },
});

const markdown = buildChecklistMarkdown(rows);
const lines = markdown.trimEnd().split('\n');
const nonEmptyLines = lines.filter(Boolean);

assert(markdown.endsWith('\n'), 'markdown must end with a newline');
assert(!lines.some((line) => line.startsWith('#')), 'markdown must not include heading markers');
assert(!markdown.includes('- [ ]'), 'markdown must not include task-list bullets');
assert(!lines.some((line) => line.startsWith('Tools:')), 'markdown must not include tools metadata');
assert(!lines.some((line) => line.startsWith('Mode:')), 'markdown must not include mode metadata');
assert(nonEmptyLines.some((line) => line === 'Web / API - Recon'), 'markdown must include plain section names');
assert(nonEmptyLines.some((line) => line.startsWith('- ') && line.includes(' : ')), 'markdown must include bulleted test case : description rows');
assert(
  nonEmptyLines.every((line) => !line.includes(' : ') || /^- [^:]+ : .+$/.test(line)),
  'test rows must use exactly the - test case : description shape'
);

console.log(`PASS markdown export: ${rows.length} rows rendered in minimal section/test format`);
