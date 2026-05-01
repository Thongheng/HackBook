import fs from 'node:fs';
import path from 'node:path';

import { buildChecklistReviewHtml } from '../logic/checklistReviewHtml.js';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8')).rows;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = buildChecklistReviewHtml(catalog);

assert(html.includes('Checklist Review'), 'review html must include the review title');
assert(html.includes('Keep / Remove'), 'review html must include the Keep / Remove column');
assert(html.includes('Agent recommendation'), 'review html must include the agent recommendation column');
assert(html.includes('<th>Tools</th>'), 'review html must include the Tools column');
assert(html.includes('Save Reviewed Copy'), 'review html must expose a save action for the reviewed artifact');
assert(html.includes('xnLinkFinder'), 'review html must render xnLinkFinder tool metadata');
assert(html.includes('Katana'), 'review html must render Katana tool metadata');
assert(html.includes('Burp Suite'), 'review html must render populated tool metadata beyond the JS analysis row');

for (const ref of ['WEB-BL-001', 'WEB-BL-004', 'WEB-BL-021', 'MOB-CT-019', 'MOB-CT-042', 'DSK-CT-040', 'WEB-CT-064', 'MOB-CT-023', 'DSK-CT-022']) {
  assert(html.includes(ref), `review html missing catalog row ${ref}`);
}

for (const removedRef of ['WEB-BL-087', 'WEB-BL-063', 'MOB-BL-033', 'WEB-CT-082', 'WEB-CT-083', 'WEB-CT-084', 'WEB-CT-085']) {
  assert(!html.includes(removedRef), `review html should not include removed catalog row ${removedRef}`);
}

const rowCount = (html.match(/data-review-row=/g) || []).length;
assert(rowCount === catalog.length, `expected ${catalog.length} review rows, got ${rowCount}`);

console.log(`PASS review html: ${rowCount} rows with review columns and save action`);
