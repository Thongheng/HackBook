import fs from 'node:fs';
import path from 'node:path';

import { buildFeatureRegistry, filterCatalogRows, getAllowedAccess } from '../logic/checklistEngine.js';

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/checklistCatalog.json'), 'utf8')).rows;
const featureRegistry = buildFeatureRegistry(catalog);

const defaultStack = {
  web: { php: false, aspnet: false, tomcat: false, nodejs: false },
  mobile: { native: true, flutter: false, reactnative: false },
  desktop: { dotnet: true, electron: false, java: false },
};

function cloneDefaultStack() {
  return JSON.parse(JSON.stringify(defaultStack));
}

function cfg(overrides = {}) {
  return {
    engagementType: 'Grey-Box',
    categories: ['web'],
    techStack: cloneDefaultStack(),
    features: {},
    ...overrides,
  };
}

function enableRowTech(row, stack) {
  for (const tech of row.tech || []) {
    if (stack[row.platform] && tech in stack[row.platform]) {
      stack[row.platform][tech] = true;
    }
  }
  return stack;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function severitySort(a, b) {
  const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  return order[b.severity] - order[a.severity];
}

const failures = [];
let passCount = 0;

function runCheck(name, fn) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

for (const feature of featureRegistry) {
  const featureRows = catalog
    .filter((row) => row.featureKey === feature.key)
    .sort(severitySort);

  const representative = featureRows[0];
  const allowed = getAllowedAccess(representative.access === 'blackbox' ? 'Black-Box' : 'Grey-Box');
  const recommendedEngagementType = allowed.has('greybox') && representative.access !== 'blackbox' ? 'Grey-Box' : 'Black-Box';

  runCheck(`feature selected exports representative row: ${feature.key}`, () => {
    const techStack = enableRowTech(representative, cloneDefaultStack());
    const rows = filterCatalogRows(
      catalog,
      cfg({
        categories: [feature.platform],
        engagementType: recommendedEngagementType,
        techStack,
        features: { [feature.key]: true },
      })
    );
    assert(rows.some((row) => row.id === representative.id), `missing representative row ${representative.id}`);
    assert(rows.every((row) => row.platform === feature.platform), 'unexpected platform rows leaked in');
  });

  runCheck(`feature disabled excludes custom rows: ${feature.key}`, () => {
    const techStack = enableRowTech(representative, cloneDefaultStack());
    const rows = filterCatalogRows(
      catalog,
      cfg({
        categories: [feature.platform],
        engagementType: recommendedEngagementType,
        techStack,
      })
    );
    assert(!rows.some((row) => row.featureKey === feature.key), 'feature rows exported while feature toggle is off');
  });

  runCheck(`feature selected but platform unselected stays out: ${feature.key}`, () => {
    const otherPlatforms = ['web', 'mobile', 'desktop'].filter((platform) => platform !== feature.platform);
    const techStack = enableRowTech(representative, cloneDefaultStack());
    const rows = filterCatalogRows(
      catalog,
      cfg({
        categories: [otherPlatforms[0]],
        engagementType: recommendedEngagementType,
        techStack,
        features: { [feature.key]: true },
      })
    );
    assert(!rows.some((row) => row.featureKey === feature.key), 'feature rows exported while platform is not selected');
  });

  if (feature.access.greybox > 0 && feature.access.blackbox === 0 && feature.access.both === 0) {
    runCheck(`greybox-only feature blocked in blackbox: ${feature.key}`, () => {
      const techStack = enableRowTech(representative, cloneDefaultStack());
      const rows = filterCatalogRows(
        catalog,
        cfg({
          categories: [feature.platform],
          engagementType: 'Black-Box',
          techStack,
          features: { [feature.key]: true },
        })
      );
      assert(!rows.some((row) => row.featureKey === feature.key), 'greybox-only feature leaked into blackbox');
    });
  }
}

const techCases = [
  { platform: 'web', tech: 'php' },
  { platform: 'web', tech: 'aspnet' },
  { platform: 'web', tech: 'tomcat' },
  { platform: 'web', tech: 'nodejs' },
  { platform: 'mobile', tech: 'flutter' },
  { platform: 'mobile', tech: 'reactnative' },
  { platform: 'mobile', tech: 'native' },
  { platform: 'desktop', tech: 'electron' },
  { platform: 'desktop', tech: 'java' },
  { platform: 'desktop', tech: 'dotnet' },
];

for (const techCase of techCases) {
  const taggedRows = catalog.filter((row) => row.platform === techCase.platform && (row.tech || []).includes(techCase.tech));
  if (taggedRows.length === 0) continue;

  runCheck(`tech toggle removes ${techCase.platform}:${techCase.tech} rows`, () => {
    const onStack = cloneDefaultStack();
    onStack[techCase.platform][techCase.tech] = true;
    const rows = filterCatalogRows(
      catalog,
      cfg({
        categories: [techCase.platform],
        engagementType: 'Grey-Box',
        techStack: onStack,
        features: Object.fromEntries(
          featureRegistry
            .filter((feature) => feature.platform === techCase.platform)
            .map((feature) => [feature.key, true])
        ),
      })
    );
    const baselineCount = rows.filter((row) => (row.tech || []).includes(techCase.tech)).length;
    const offStack = cloneDefaultStack();
    offStack[techCase.platform][techCase.tech] = false;
    if (techCase.platform === 'mobile' && techCase.tech === 'native') {
      offStack.mobile.native = false;
    }
    const filteredOff = filterCatalogRows(
      catalog,
      cfg({
        categories: [techCase.platform],
        engagementType: 'Grey-Box',
        techStack: offStack,
        features: Object.fromEntries(
          featureRegistry
            .filter((feature) => feature.platform === techCase.platform)
            .map((feature) => [feature.key, true])
        ),
      })
    );
    const offCount = filteredOff.filter((row) => (row.tech || []).includes(techCase.tech)).length;
    assert(baselineCount > 0, 'expected tagged rows before tech filter');
    assert(offCount === 0, `tagged rows remain after disabling ${techCase.tech}`);
  });
}

const outputCoverage = ['xlsx', 'markdown', 'findings'];
for (const outputFormat of outputCoverage) {
  runCheck(`output format config accepted: ${outputFormat}`, () => {
    const rows = filterCatalogRows(
      catalog,
      cfg({
        categories: ['web', 'mobile'],
        engagementType: 'Grey-Box',
        features: { 'web:login': true, 'mobile:payment': true },
        outputFormat,
      })
    );
    assert(rows.length > 0, 'expected rows for output coverage config');
  });
}

console.log(`\nMatrix validation: ${passCount} checks run.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} matrix check(s) failed:`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('All matrix checks passed.');
