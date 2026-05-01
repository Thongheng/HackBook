const CATEGORY_LABEL = {
  web: 'Web / API',
  mobile: 'Mobile (Android)',
  desktop: 'Desktop / Thick Client',
};

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function sectionName(row) {
  const platform = row.category ?? row.platform;
  const platformLabel = CATEGORY_LABEL[platform] ?? cleanText(platform);
  const sheetType = row.sheetType ?? row.section;
  const sectionLabel = sheetType === 'custom'
    ? cleanText(row.feature ?? row.featureLabel ?? row.group)
    : cleanText(row.group);

  return cleanText(`${platformLabel} - ${sectionLabel}`);
}

function rowTitle(row) {
  return cleanText(row.testCase ?? row.title);
}

function rowDescription(row) {
  return cleanText(row.objective);
}

export function buildChecklistMarkdown(rows) {
  const sections = new Map();

  for (const row of rows) {
    const name = sectionName(row);
    if (!sections.has(name)) sections.set(name, []);
    sections.get(name).push(`- ${rowTitle(row)} : ${rowDescription(row)}`);
  }

  return [...sections.entries()]
    .flatMap(([name, lines]) => [name, ...lines, ''])
    .join('\n')
    .trimEnd() + '\n';
}
