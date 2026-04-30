import fs from 'node:fs';
import path from 'node:path';

import { filterCatalogRows, getScenarioSummary } from '../logic/checklistEngine.js';

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
      assert(rows.some((row) => row.id === 'WEB-BL-069'), 'generic HTML injection row missing');
      assert(rows.some((row) => row.id === 'WEB-BL-087'), 'JS URL analysis row missing');
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
      assert(rows.some((row) => row.id === 'WEB-CT-005'), 'login coverage incomplete');
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
      assert(rows.some((row) => row.id === 'WEB-CT-046'), 'SVG upload XSS row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-086'), 'HTML file upload XSS row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-049'), 'file download row should not appear with File Upload only');
      assert(rows.every((row) => row.platform === 'web'), 'non-web rows leaked into file upload scenario');
    },
  },
  {
    name: 'web + File Download excludes File Upload',
    config: cfg({ categories: ['web'], engagementType: 'Grey-Box', features: { 'web:file-download': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'WEB-CT-049'), 'file download traversal row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-050'), 'file download IDOR row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-046'), 'file upload row should not appear with File Download only');
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
    name: 'mobile + API Backend blackbox',
    config: cfg({ categories: ['mobile'], engagementType: 'Black-Box', features: { 'mobile:api-backend': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-019'), 'mobile API BOLA row missing');
      assert(rows.some((row) => row.id === 'MOB-CT-037'), 'mobile API misconfiguration row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into mobile API scenario');
    },
  },
  {
    name: 'desktop + WebView + blackbox',
    config: cfg({ categories: ['desktop'], engagementType: 'Black-Box', features: { 'desktop:webview': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'DSK-BL-021'), 'desktop API baseline row missing');
      assert(rows.every((row) => row.platform === 'desktop'), 'desktop-only scenario leaked other platforms');
      assert(!rows.some((row) => row.id === 'DSK-CT-015'), 'greybox-only desktop WebView row leaked into blackbox');
      assert(rows.every((row) => row.access !== 'greybox'), 'greybox access rows leaked into blackbox');
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
      assert(rows.some((row) => row.id === 'DSK-CT-046'), 'desktop billing entitlement row missing');
      assert(rows.some((row) => row.id === 'DSK-CT-047'), 'desktop subscription status row missing');
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
      assert(rows.some((row) => row.id === 'WEB-CT-082'), 'curated export row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-083'), 'curated report export row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-084'), 'curated import row should not appear with Export only');
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
      assert(rows.some((row) => row.id === 'WEB-CT-084'), 'curated import row missing');
      assert(rows.some((row) => row.id === 'WEB-CT-085'), 'curated import mapping row missing');
      assert(!rows.some((row) => row.id === 'WEB-CT-082'), 'curated export row should not appear with Import only');
      assert(rows.some((row) => row.source === 'curated'), 'expected curated rows in import scenario');
    },
  },
  {
    name: 'mobile explicit biometric login feature',
    config: cfg({ categories: ['mobile'], engagementType: 'Grey-Box', features: { 'mobile:login-biometric': true } }),
    run(rows) {
      assert(rows.some((row) => row.id === 'MOB-CT-001'), 'mobile biometric login row missing');
      assert(rows.every((row) => row.platform === 'mobile'), 'non-mobile rows leaked into biometric login scenario');
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

if (failures > 0) {
  console.error(`\n${failures} scenario(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${scenarios.length} scenarios passed.`);
