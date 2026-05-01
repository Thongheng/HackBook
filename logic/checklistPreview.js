import { WORKBOOK_LAYOUT } from './checklistWorkbook.js';

export function checklistRowRef(row) {
  return row.ref ?? row.id;
}

export function applyPreviewExclusions(rows, excludedRefs = new Set()) {
  const excluded = excludedRefs instanceof Set ? excludedRefs : new Set(excludedRefs);
  return rows.filter((row) => !excluded.has(checklistRowRef(row)));
}

export function prunePreviewExclusions(rows, excludedRefs = new Set()) {
  const currentRefs = new Set(rows.map(checklistRowRef));
  const excluded = excludedRefs instanceof Set ? excludedRefs : new Set(excludedRefs);
  return new Set([...excluded].filter((ref) => currentRefs.has(ref)));
}

export function buildPreviewSections(rows) {
  return WORKBOOK_LAYOUT
    .map((section) => ({
      ...section,
      rows: rows.filter((row) => {
        const category = row.category ?? row.platform;
        const sheetType = row.sheetType ?? row.section;
        return category === section.category && sheetType === section.sheetType;
      }),
    }))
    .filter((section) => section.rows.length > 0);
}

export function buildPreviewGroups(rows) {
  const seen = new Set();
  const groups = [];

  for (const row of rows) {
    const group = row.group || 'Other';
    if (seen.has(group)) continue;
    seen.add(group);
    groups.push({
      name: group,
      rows: rows.filter((entry) => (entry.group || 'Other') === group),
    });
  }

  return groups;
}
