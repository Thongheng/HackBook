import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checklistGenerator = fs.readFileSync(path.join(root, 'pages/tools/ChecklistGenerator.tsx'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!checklistGenerator.includes('buildChecklistMarkdown'), 'web checklist generator must not import markdown export builder');
assert(!checklistGenerator.includes('exportMarkdown'), 'web checklist generator must not define markdown download export');
assert(!checklistGenerator.includes("'markdown'"), 'web checklist generator must not expose markdown as an export format');
assert(!checklistGenerator.includes('_Checklist_${date}.md'), 'web checklist generator must not generate markdown filenames');

console.log('PASS web checklist export: markdown option removed from web UI');
