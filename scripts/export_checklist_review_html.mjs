import fs from 'node:fs';
import path from 'node:path';

import { buildChecklistReviewHtml } from '../logic/checklistReviewHtml.js';

const root = process.cwd();
const outputPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, 'output', `checklist_review_${new Date().toISOString().slice(0, 10)}.html`);

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8'));
const rows = catalog.rows;
const html = buildChecklistReviewHtml(rows);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`Wrote checklist review HTML: ${path.relative(root, outputPath)}`);
