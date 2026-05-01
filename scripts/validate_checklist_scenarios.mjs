import fs from 'node:fs';
import path from 'node:path';

import { filterCatalogRows, getScenarioSummary } from '../logic/checklistEngine.js';
import { applyPreviewExclusions, buildPreviewGroups, buildPreviewSections, prunePreviewExclusions } from '../logic/checklistPreview.js';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8')).rows;

const defaultStack = {
  web: { php: false, aspnet: false, tomcat: false, nodejs: false },
  mobile: { native: true, flutter: false, reactnative: false },
  desktop: { dotnet: true, electron: false, java: false },
};

function cfg(overrides) {
  return {
    engagementType: 'Black-Box',
    categories: ['web'],
    techStack: structuredClone(defaultStack),
    features: {},
    ...overrides,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const scenarios = [
  {
    name: 'web + blackbox + no features',
    config: cfg({ categories: ['web'], engagementType: 'Black-Box' }),
    run(rows) {
      assert(rows.length > 0, 'expected rows');
      assert(rows.some((row) => row.id === 'WEB-BL-088'), 'web baseline port scan row missing');
      assert(rows.some((row) => row.id === 'WEB-BL-069'), 'generic HTML injection row missing');
      assert(rows.some((row) => row.id === 'WEB-BL-004'), 'merged JS URL analysis row missing');
      assert(!rows.some((row) => row.id === 'WEB-BL-087'), 'old standalone JS URL analysis row should be merged away');
      assert(rows.every((row) => row.platform === 'web'), 'only web rows should export');
      assert(rows.every((row) => row.section === 'baseline'), 'no custom rows should export');
      assert(rows.every((row) => row.access !== 'greybox'), 'greybox-only rows leaked into blackbox scenario');
    },
  },
  {
    name: 'web + greybox + Login',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:login': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-001'), 'login custom row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-002'), 'HTTP verb confusion login row missing');
      assert(rows.some((row) => row.id === 'WEB-BL-018'), 'merged account enumeration login row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-014'), 'profile row should not appear without Profile feature');
      assert(rows.every((row) => row.platform === 'web'), 'non-web rows leaked into web scenario');
    },
  },
  {
    name: 'web + GraphQL feature',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:graphql': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-BL-057'), 'graphql introspection row missing');
      assert(rows.some((row) => row.id === 'WEB-BL-059'), 'graphql nested query row missing');
      assert(!rows.some((row) => row.id === 'WEB-BL-060'), 'websocket row should not appear without WebSocket feature');
    },
  },
  {
    name: 'web + Payment excludes adjacent business features',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:payment': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-029'), 'web payment transaction row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-036'), 'web payment reference row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-039'), 'coupon row should not appear with Payment only');
      assert(!rows.some((row) => row.id === 'WEB-CT-078'), 'billing row should not appear with Payment only');
      assert(rows.every((row) => row.platform === 'web'), 'non-web rows leaked into payment scenario');
    },
  },
  {
    name: 'web + File Upload excludes File Download',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:file-upload': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-BL-047'), 'merged file upload validation/processing row missing');
      assert(!rows.some((row) => row.id === 'WEB-BL-033'), 'file download row should not appear with File Upload only');
      assert(rows.every((row) => row.platform === 'web'), 'non-web rows leaked into file upload scenario');
    },
  },
  {
    name: 'web + File Download excludes File Upload',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:file-download': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-BL-033'), 'merged file download traversal row missing');
      assert(!rows.some((row) => row.id === 'WEB-BL-047'), 'file upload row should not appear with File Download only');
      assert(rows.every((row) => row.platform === 'web'), 'non-web rows leaked into file download scenario');
    },
  },
  {
    name: 'mobile + OAuth / OIDC feature',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:oauth-oidc': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-042'), 'mobile oauth redirect row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-043'), 'mobile oauth pkce row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile oauth scenario');
    },
  },
  {
    name: 'mobile only + web feature enabled',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'web:login': true } }),
    run(rows) {
      assert(rows.length > 0, 'expected mobile baseline rows');
      assert(rows.every((row) => row.platform === 'mobile'), 'web rows should not export when mobile is the only category');
      assert(!rows.some((row) => row.id.startsWith('WEB-CT-')), 'web custom rows leaked into mobile-only scenario');
    },
  },
  {
    name: 'mobile + Payment',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:payment': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-008'), 'mobile payment tampering row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-011'), 'mobile payment workflow row missing');
      assert(rows.some((row) => row.id.startsWith('MOB-BL-')), 'mobile baseline rows missing');
      assert(!rows.some((row) => row.id.startsWith('WEB-')), 'web rows should not export');
    },
  },
  {
    name: 'mobile + Coupon / Promo',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:coupon-promo': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-050'), 'mobile coupon tampering row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-051'), 'mobile promo replay row missing');
      assert(!rows.some((row) => row.id === 'MOB-CT-008'), 'payment row should not appear with mobile Coupon / Promo only');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile coupon scenario');
    },
  },
  {
    name: 'mobile + Billing / Subscription',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:billing-subscription': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-052'), 'mobile subscription entitlement row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-053'), 'mobile billing callback row missing');
      assert(!rows.some((row) => row.id === 'MOB-CT-008'), 'payment row should not appear with mobile Billing / Subscription only');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile billing scenario');
    },
  },
  {
    name: 'mobile + QR / KHQR',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:qr-khqr': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-010'), 'mobile qr tampering row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-048'), 'mobile qr payload row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile qr scenario');
    },
  },
  {
    name: 'mobile + File Upload excludes File Download',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:file-upload': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-054'), 'mobile file upload validation row missing');
      assert(!rows.some((row) => row.id === 'MOB-CT-055'), 'mobile file download row should not appear with File Upload only');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile file upload scenario');
    },
  },
  {
    name: 'mobile + File Download excludes File Upload',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:file-download': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-055'), 'mobile file download authorization row missing');
      assert(!rows.some((row) => row.id === 'MOB-CT-054'), 'mobile file upload row should not appear with File Download only');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile file download scenario');
    },
  },
  {
    name: 'mobile API backend moved into baseline',
    config: cfg({ categories: ['mobile'], engagementType: 'Black-Box' }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-019'), 'mobile API BOLA row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-037'), 'mobile API misconfiguration row missing');
      assert(rows.some((row) => row.id === 'MOB-BL-056'), 'mobile baseline port scan row missing');
      assert(rows.every((row) => row.featureKey !== 'mobile:api-backend'), 'mobile API Backend feature should be removed');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile API scenario');
    },
  },
  {
    name: 'desktop + WebView + blackbox',
    config: cfg({ categories: ['desktop'], engagementType: 'Black-Box', features: { 'desktop:webview': true } }),
    run(rows) {
      assert(!rows.some((row) => row.id === 'DSK-BL-021'), 'desktop API feature row should not appear with WebView only');
      assert(!rows.some((row) => row.id === 'DSK-CT-050'), 'desktop API port scan row should not appear with WebView only');
      assert(rows.every((row) => row.platform === 'desktop'), 'desktop-only scenario leaked other platforms');
      assert(!rows.some((row) => row.id === 'DSK-CT-015'), 'greybox-only desktop WebView row leaked into blackbox');
      assert(rows.every((row) => row.access !== 'greybox'), 'greybox access rows leaked into blackbox');
    },
  },
  {
    name: 'desktop + API / Backend',
    config: cfg({ categories: ['desktop'], engagementType: 'Black-Box', features: { 'desktop:api-backend': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-BL-021'), 'desktop API feature row missing');
      assert(rows.some((row) => row.id === 'DSK-CT-050'), 'desktop API port scan row missing');
      for (const id of ['DSK-CT-051', 'DSK-CT-052', 'DSK-CT-053', 'DSK-CT-054', 'DSK-CT-055', 'DSK-CT-056', 'DSK-CT-057', 'DSK-CT-058']) {
        assert(rows.some((row) => row.id === id), `${id} desktop API row missing`);
      }
      assert(rows.some((row) => row.featureKey === 'desktop:api-backend'), 'desktop API feature key missing');
      assert(rows.every((row) => row.platform === 'desktop'), 'non-desktop rows leaked into desktop API scenario');
    },
  },
  {
    name: 'desktop + Coupon / Promo',
    config: cfg({ categories: ['desktop'], engagementType: 'Grey-Box', features: { 'desktop:coupon-promo': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-CT-045'), 'desktop coupon tampering row missing');
      assert(!rows.some((row) => row.id === 'DSK-CT-020'), 'desktop payment row should not appear with Coupon / Promo only');
      assert(rows.every((row) => row.platform === 'desktop'), 'non-desktop rows leaked into desktop coupon scenario');
    },
  },
  {
    name: 'desktop + Billing / Subscription',
    config: cfg({ categories: ['desktop'], engagementType: 'Grey-Box', features: { 'desktop:billing-subscription': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-CT-046'), 'merged desktop billing entitlement/status row missing');
      assert(!rows.some((row) => row.id === 'DSK-CT-020'), 'desktop payment row should not appear with Billing / Subscription only');
      assert(rows.every((row) => row.platform === 'desktop'), 'non-desktop rows leaked into desktop billing scenario');
    },
  },
  {
    name: 'desktop + File Upload excludes File Download',
    config: cfg({ categories: ['desktop'], engagementType: 'Grey-Box', features: { 'desktop:file-upload': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-CT-048'), 'desktop file upload validation row missing');
      assert(!rows.some((row) => row.id === 'DSK-CT-049'), 'desktop file download row should not appear with File Upload only');
      assert(rows.every((row) => row.platform === 'desktop'), 'non-desktop rows leaked into desktop file upload scenario');
    },
  },
  {
    name: 'desktop + File Download excludes File Upload',
    config: cfg({ categories: ['desktop'], engagementType: 'Grey-Box', features: { 'desktop:file-download': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-CT-049'), 'desktop file download authorization row missing');
      assert(!rows.some((row) => row.id === 'DSK-CT-048'), 'desktop file upload row should not appear with File Download only');
      assert(rows.every((row) => row.platform === 'desktop'), 'non-desktop rows leaked into desktop file download scenario');
    },
  },
  {
    name: 'mixed platform respects selected categories',
    config: cfg({
      categories: ['web', 'mobile'],
      engagementType: 'Grey-Box',
      features: {
        'web:login': true,
        'mobile:payment': true,
        'desktop:export': true,
      },
    }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-001'), 'web login row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-008'), 'mobile payment row missing');
      assert(!rows.some((row) => row.id.startsWith('DSK-CT-032')), 'desktop rows should not export when desktop is not selected');
    },
  },
  {
    name: 'empty feature selection yields zero custom rows',
    config: cfg({ categories: ['web', 'mobile', 'desktop'], engagementType: 'Grey-Box' }),
    run(rows) {
      assert(rows.filter((row) => row.section === 'custom').length === 0, 'custom rows should be zero with no active features');
      assert(rows.some((row) => row.section === 'baseline'), 'baseline rows should still export');
    },
  },
  {
    name: 'curated export rows appear without import rows',
    config: cfg({
      categories: ['web'],
      engagementType: 'Grey-Box',
      features: {
        'web:export': true,
      },
    }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-064'), 'merged export formula row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-066'), 'export authorization row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-067'), 'curated import row should not appear with Export only');
      assert(rows.some((row) => row.source === 'curated'), 'expected curated rows in export scenario');
    },
  },
  {
    name: 'curated import rows appear without export rows',
    config: cfg({
      categories: ['web'],
      engagementType: 'Grey-Box',
      features: {
        'web:import': true,
      },
    }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-067'), 'merged import parser row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-068'), 'merged import mapping row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-064'), 'curated export row should not appear with Import only');
      assert(rows.some((row) => row.source === 'curated'), 'expected curated rows in import scenario');
    },
  },
  {
    name: 'mobile explicit login/auth feature',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:login-auth': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-BL-022'), 'merged mobile biometric auth row missing');
      assert(rows.some((row) => row.id === 'MOB-BL-024'), 'merged mobile session token lifecycle row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into login/auth scenario');
    },
  },
  {
    name: 'mobile explicit registration OTP feature',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:registration-otp': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-023'), 'mobile registration OTP row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into registration OTP scenario');
    },
  },
];

let failures = 0;

for (const scenario of scenarios) {
  try {
    const rows = filterCatalogRows(catalog, scenario.config);
    scenario.run(rows);
    const summary = getScenarioSummary(rows);
    console.log(`PASS ${scenario.name}: total=${summary.total}, custom=${summary.customCount}, features=${summary.includedFeatures.join(', ') || 'none'}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${scenario.name}: ${error.message}`);
  }
}

try {
  const removedFeatureKeys = new Set([
    'web:admin',
    'web:announcement',
    'web:api-keys-tokens',
    'web:api-webhook',
    'web:reports-dashboard',
    'web:vendor-profile',
    'mobile:api-backend',
    'mobile:intent-share',
    'mobile:push-notifications',
  ]);
  assert(
    !catalog.some((row) => removedFeatureKeys.has(row.featureKey)),
    'removed feature groups should not remain in catalog'
  );
  assert(catalog.some((row) => row.id === 'WEB-BL-004' && row.section === 'baseline'), 'merged WEB-BL-004 must remain baseline');
  assert(!catalog.some((row) => row.id === 'WEB-BL-087'), 'WEB-BL-087 must be merged into WEB-BL-004');
  for (const mergedRef of [
    'WEB-CT-082', 'WEB-CT-083', 'WEB-CT-084', 'WEB-CT-085',
    'WEB-CT-069', 'WEB-BL-044', 'WEB-BL-045', 'WEB-BL-061', 'WEB-BL-072',
    'WEB-BL-048', 'WEB-CT-049', 'WEB-CT-042', 'WEB-CT-045',
    'WEB-CT-046', 'WEB-CT-048', 'WEB-CT-086',
    'WEB-BL-046', 'WEB-CT-043', 'WEB-CT-044', 'WEB-CT-047',
    'WEB-CT-050', 'WEB-CT-065', 'WEB-CT-003', 'WEB-CT-004', 'WEB-CT-005',
    'WEB-CT-009', 'WEB-CT-010', 'WEB-CT-011', 'WEB-CT-017',
    'WEB-CT-032', 'WEB-CT-033', 'WEB-CT-035',
    'MOB-CT-001', 'MOB-CT-002', 'MOB-CT-004', 'MOB-BL-048',
    'MOB-CT-005', 'MOB-CT-006', 'MOB-CT-007',
    'MOB-CT-014', 'MOB-CT-015', 'MOB-CT-016',
    'MOB-CT-028', 'MOB-CT-032', 'MOB-CT-036',
    'MOB-CT-058', 'MOB-CT-059', 'MOB-CT-062', 'MOB-CT-049', 'MOB-CT-063',
    'DSK-CT-012', 'DSK-CT-013', 'DSK-CT-009', 'DSK-CT-010',
    'DSK-CT-017', 'DSK-CT-035', 'DSK-CT-041', 'DSK-CT-047',
  ]) {
    assert(!catalog.some((row) => row.id === mergedRef), `${mergedRef} must be merged into its parent test case`);
  }
  const orderIndex = (id) => catalog.findIndex((row) => row.id === id);
  assert(orderIndex('WEB-BL-009') === orderIndex('WEB-BL-002') + 1, 'WEB-BL-009 must immediately follow subdomain enumeration');
  assert(orderIndex('WEB-BL-070') < orderIndex('WEB-BL-004'), 'WEB-BL-070 discovery must stay in the recon block before JS endpoint analysis');
  assert(orderIndex('WEB-BL-067') < orderIndex('WEB-BL-010'), 'WEB-BL-067 vulnerability scan must stay in the recon block');
  assert(orderIndex('MOB-BL-034') === orderIndex('MOB-BL-006') + 1, 'mobile resilience must start immediately after root bypass setup');
  assert(orderIndex('MOB-BL-032') < orderIndex('MOB-BL-014'), 'MOB-BL-032 status check must stay before storage review');
  assert(!catalog.some((row) => row.group === 'Infra'), 'Infra group should not remain in the catalog');
  assert(!catalog.some((row) => row.group === 'Network'), 'Network group should not remain in the catalog');
  assert(catalog.some((row) => row.id === 'MOB-CT-019' && row.section === 'baseline'), 'MOB-CT-019 must move to baseline');
  assert(catalog.some((row) => row.id === 'MOB-BL-024' && row.featureKey === 'mobile:login-auth'), 'MOB-BL-024 must remain in login/auth feature');
  console.log('PASS cleanup invariants: removed features, merged rows, and moved rows');
} catch (error) {
  failures += 1;
  console.error(`FAIL cleanup invariants: ${error.message}`);
}

try {
  const rows = filterCatalogRows(
    catalog,
    cfg({
      categories: ['web', 'mobile'],
      engagementType: 'Grey-Box',
      features: {
        'web:login': true,
        'mobile:payment': true,
      },
    })
  );
  const webBaseline = rows.find((row) => row.platform === 'web' && row.section === 'baseline');
  const webCustom = rows.find((row) => row.id === 'WEB-CT-001');
  const mobileCustom = rows.find((row) => row.id === 'MOB-CT-008');
  assert(webBaseline && webCustom && mobileCustom, 'preview helper test requires representative baseline and custom rows');

  const excluded = new Set([webBaseline.id, webCustom.id, mobileCustom.id]);
  const exportRows = applyPreviewExclusions(rows, excluded);
  assert(!exportRows.some((row) => row.id === webBaseline.id), 'preview exclusion should remove baseline row from export');
  assert(!exportRows.some((row) => row.id === webCustom.id), 'preview exclusion should remove web custom row from export');
  assert(!exportRows.some((row) => row.id === mobileCustom.id), 'preview exclusion should remove mobile custom row from export');
  assert(rows.some((row) => row.id === webCustom.id), 'preview exclusion should not mutate source rows');

  const sections = buildPreviewSections(rows);
  assert(sections.some((section) => section.name === 'WEB - Baseline' && section.rows.some((row) => row.id === webBaseline.id)), 'preview sections should include WEB - Baseline rows');
  assert(sections.some((section) => section.name === 'WEB - Custom' && section.rows.some((row) => row.id === webCustom.id)), 'preview sections should include WEB - Custom rows');
  assert(sections.some((section) => section.name === 'MOBILE - Custom' && section.rows.some((row) => row.id === mobileCustom.id)), 'preview sections should include MOBILE - Custom rows');
  assert(!sections.some((section) => section.name === 'DESKTOP - Custom'), 'preview sections should hide empty sections');

  const webCustomSection = sections.find((section) => section.name === 'WEB - Custom');
  const previewGroups = buildPreviewGroups(webCustomSection.rows);
  assert(previewGroups.some((group) => group.name === webCustom.group && group.rows.some((row) => row.id === webCustom.id)), 'preview groups should preserve Excel-style group rows');

  const pruned = prunePreviewExclusions(rows.filter((row) => row.id !== mobileCustom.id), excluded);
  assert(pruned.has(webBaseline.id), 'preview pruning should keep refs still present in current filter');
  assert(!pruned.has(mobileCustom.id), 'preview pruning should remove stale refs');
  console.log('PASS preview exclusion helper: export filtering, section grouping, and pruning');
} catch (error) {
  failures += 1;
  console.error(`FAIL preview exclusion helper: ${error.message}`);
}

if (failures > 0) {
  console.error(`\n${failures} scenario(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${scenarios.length} scenarios passed.`);
