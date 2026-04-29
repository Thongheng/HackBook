const CATEGORY_LABEL = {
  web: 'Web / API',
  mobile: 'Mobile (Android)',
  desktop: 'Desktop / Thick Client',
};

const SECTION_LABEL = {
  baseline: 'Baseline',
  custom: 'Feature-Specific',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function rowRef(row) {
  return row.ref || row.id;
}

function rowTypeLabel(row) {
  if (row.type) return row.type;
  return row.rowType === 'setup' ? 'Setup' : 'Test';
}

function rowModeLabel(row) {
  return row.mode || (row.access === 'blackbox' ? 'Black-Box' : row.access === 'greybox' ? 'Grey-Box' : 'Both');
}

function rowSeverityLabel(row) {
  return row.severityLabel || String(row.severity || '').replace(/^./, (value) => value.toUpperCase());
}

function rowToolsLabel(row) {
  return Array.isArray(row.tools) && row.tools.length ? row.tools.join(', ') : '—';
}

export function getChecklistReviewRecommendation(row) {
  if (row.rowType === 'setup' || row.type === 'Setup') return 'Review';
  if (row.source === 'curated') return 'Keep';
  if (row.severity === 'critical' || row.severity === 'high') return 'Keep';
  if (row.severity === 'low' || row.severity === 'info') return 'Review';
  return 'Keep';
}

function renderRow(row) {
  return `
    <tr data-review-row="${escapeHtml(rowRef(row))}">
      <td class="mono">${escapeHtml(rowRef(row))}</td>
      <td><span class="sev sev-${escapeHtml(row.severity)}">${escapeHtml(rowSeverityLabel(row))}</span></td>
      <td>${escapeHtml(rowTypeLabel(row))}</td>
      <td class="title-cell">
        <div class="title">${escapeHtml(row.title || row.testCase)}</div>
        <div class="meta">${escapeHtml(row.stdRef)} · ${escapeHtml(rowModeLabel(row))} · ${escapeHtml(SECTION_LABEL[row.section || row.sheetType] || '')}</div>
      </td>
      <td class="objective">${escapeHtml(row.objective)}</td>
      <td class="tools">${escapeHtml(rowToolsLabel(row))}</td>
      <td class="review-cell">
        <select class="review-select" aria-label="Keep or remove ${escapeHtml(rowRef(row))}">
          <option value="">-</option>
          <option value="Keep">Keep</option>
          <option value="Remove">Remove</option>
        </select>
      </td>
      <td class="recommendation">${escapeHtml(getChecklistReviewRecommendation(row))}</td>
    </tr>
  `.trim();
}

function renderGroup(groupName, rows) {
  return `
    <details class="group" open>
      <summary>
        <span>${escapeHtml(groupName)}</span>
        <span class="count">${rows.length}</span>
      </summary>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Severity</th>
              <th>Type</th>
              <th>Test case</th>
              <th>Objective</th>
              <th>Tools</th>
              <th>Keep / Remove</th>
              <th>Agent recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(renderRow).join('\n')}
          </tbody>
        </table>
      </div>
    </details>
  `.trim();
}

function renderCategory(category, rows) {
  const groups = [...new Set(rows.map((row) => row.group))];

  return `
    <section class="category-section" id="section-${escapeHtml(category)}">
      <div class="category-header">
        <h2>${escapeHtml(CATEGORY_LABEL[category] || category)}</h2>
        <span>${rows.length} rows</span>
      </div>
      <div class="group-stack">
        ${groups
          .map((group) => renderGroup(group, rows.filter((row) => row.group === group)))
          .join('\n')}
      </div>
    </section>
  `.trim();
}

export function buildChecklistReviewHtml(rows) {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const categories = ['web', 'mobile', 'desktop'];
  const categoryLinks = categories
    .filter((category) => rows.some((row) => (row.category || row.platform) === category))
    .map((category) => `<a href="#section-${escapeHtml(category)}">${escapeHtml(CATEGORY_LABEL[category])}</a>`)
    .join('');

  const sections = categories
    .map((category) => {
      const categoryRows = rows.filter((row) => (row.category || row.platform) === category);
      if (!categoryRows.length) return '';
      return renderCategory(category, categoryRows);
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Checklist Review</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1116;
      --panel: #121a22;
      --panel-alt: #18222d;
      --border: #243140;
      --text: #e5edf5;
      --muted: #9db0c2;
      --accent: #9fef00;
      --critical: #ef4444;
      --high: #f97316;
      --medium: #eab308;
      --low: #60a5fa;
      --info: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.45;
    }
    .page {
      width: min(1600px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 24px 0 40px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      background: linear-gradient(180deg, rgba(11,17,22,0.98), rgba(11,17,22,0.88));
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(36,49,64,0.75);
    }
    .title-block h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
    }
    .title-block p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .toolbar button,
    .jump-links a {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      text-decoration: none;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .toolbar button.primary {
      background: rgba(159, 239, 0, 0.12);
      border-color: rgba(159, 239, 0, 0.32);
      color: var(--accent);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin: 20px 0;
    }
    .summary-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .summary-card strong {
      display: block;
      font-size: 24px;
      line-height: 1;
    }
    .summary-card span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .jump-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .category-section {
      margin-top: 28px;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
    }
    .category-header h2 {
      margin: 0;
      font-size: 22px;
    }
    .category-header span {
      color: var(--muted);
      font-size: 13px;
    }
    .group-stack {
      display: grid;
      gap: 12px;
    }
    .group {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .group > summary {
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      font-weight: 700;
      background: var(--panel-alt);
    }
    .group > summary::-webkit-details-marker { display: none; }
    .count {
      color: var(--muted);
      font-size: 12px;
    }
    .table-wrap {
      overflow: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1100px;
    }
    th, td {
      padding: 12px 10px;
      border-top: 1px solid rgba(36,49,64,0.72);
      text-align: left;
      vertical-align: top;
      font-size: 13px;
    }
    thead th {
      position: sticky;
      top: 0;
      background: #0f161d;
      z-index: 2;
      border-top: 0;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    tbody tr:nth-child(even) {
      background: rgba(255,255,255,0.02);
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: var(--muted);
      white-space: nowrap;
    }
    .title {
      font-weight: 700;
    }
    .meta {
      margin-top: 4px;
      font-size: 11px;
      color: var(--muted);
    }
    .objective {
      min-width: 280px;
      color: #d4dde7;
    }
    .tools {
      min-width: 180px;
      color: var(--muted);
    }
    .review-cell {
      white-space: nowrap;
    }
    .review-select {
      width: 112px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #0f161d;
      color: var(--text);
      font: inherit;
    }
    .recommendation {
      font-weight: 700;
      color: var(--accent);
    }
    .sev {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .sev-critical { color: var(--critical); border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.08); }
    .sev-high { color: var(--high); border-color: rgba(249,115,22,0.35); background: rgba(249,115,22,0.08); }
    .sev-medium { color: var(--medium); border-color: rgba(234,179,8,0.35); background: rgba(234,179,8,0.08); }
    .sev-low { color: var(--low); border-color: rgba(96,165,250,0.35); background: rgba(96,165,250,0.08); }
    .sev-info { color: var(--info); border-color: rgba(148,163,184,0.35); background: rgba(148,163,184,0.08); }
    @media (max-width: 900px) {
      .page {
        width: calc(100vw - 20px);
        padding-top: 16px;
      }
      .topbar {
        position: static;
      }
    }
    @media print {
      .topbar {
        position: static;
        border-bottom: 0;
      }
      .toolbar {
        display: none;
      }
      .group {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div class="title-block">
        <h1>Checklist Review</h1>
        <p>Full catalog review artifact. Set <strong>Keep / Remove</strong>, then save a reviewed copy for downstream pruning. Generated ${escapeHtml(generatedOn)}.</p>
      </div>
      <div class="toolbar">
        <button type="button" class="primary" id="save-reviewed-copy">Save Reviewed Copy</button>
        <button type="button" id="mark-all-keep">Mark Visible Keep</button>
        <button type="button" id="clear-all">Clear Visible</button>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card"><strong>${rows.length}</strong><span>Total rows</span></div>
      <div class="summary-card"><strong>${rows.filter((row) => (row.section || row.sheetType) === 'baseline').length}</strong><span>Baseline</span></div>
      <div class="summary-card"><strong>${rows.filter((row) => (row.section || row.sheetType) === 'custom').length}</strong><span>Feature-specific</span></div>
      <div class="summary-card"><strong>${rows.filter((row) => row.source === 'curated').length}</strong><span>Curated</span></div>
    </div>

    <div class="jump-links">${categoryLinks}</div>

    ${sections}
  </div>

  <script>
    const selects = () => [...document.querySelectorAll('.review-select')];

    function updateSelectedAttributes(doc) {
      doc.querySelectorAll('.review-select').forEach((select) => {
        [...select.options].forEach((option) => {
          option.selected = option.value === select.value;
        });
      });
    }

    document.getElementById('mark-all-keep')?.addEventListener('click', () => {
      selects().forEach((select) => {
        select.value = 'Keep';
      });
    });

    document.getElementById('clear-all')?.addEventListener('click', () => {
      selects().forEach((select) => {
        select.value = '';
      });
    });

    document.getElementById('save-reviewed-copy')?.addEventListener('click', () => {
      updateSelectedAttributes(document);
      const html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'checklist_review_reviewed.html';
      link.click();
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>`;
}
