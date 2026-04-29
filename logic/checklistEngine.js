export const ACCESS_MODE_LABEL = {
  blackbox: 'Black-Box',
  greybox: 'Grey-Box',
  both: 'Both',
};

export function accessModeLabel(access) {
  return ACCESS_MODE_LABEL[access] || 'Both';
}

export function getAllowedAccess(engagementType) {
  return engagementType === 'Black-Box'
    ? new Set(['blackbox', 'both'])
    : new Set(['greybox', 'both']);
}

export function isTechRelevant(row, stack) {
  const tech = new Set(row.tech || []);

  if (row.platform === 'web') {
    // Server tech filters — tech-specific rows only shown when that tech is selected
    if (tech.has('php') && !stack.web.php) return false;
    if (tech.has('aspnet') && !stack.web.aspnet) return false;
    if (tech.has('tomcat') && !stack.web.tomcat) return false;
    if (tech.has('nodejs') && !stack.web.nodejs) return false;
  }

  if (row.platform === 'mobile') {
    if (tech.has('flutter') && !stack.mobile.flutter) return false;
    if (tech.has('reactnative') && !stack.mobile.reactnative) return false;
    if (tech.has('native') && !stack.mobile.native) return false;
  }

  if (row.platform === 'desktop') {
    if (tech.has('electron') && !stack.desktop.electron) return false;
    if (tech.has('java') && !stack.desktop.java) return false;
    if (tech.has('dotnet') && !stack.desktop.dotnet) return false;
  }

  return true;
}

// Rows tagged external_only are suppressed for internal engagements
export function isScopeRelevant(row, scope) {
  if (scope === 'internal') {
    return !(row.tags || []).includes('external_only');
  }
  return true; // external: show everything
}

export function filterCatalogRows(rows, cfg) {
  const allowedAccess = getAllowedAccess(cfg.engagementType);
  const scope = cfg.scope || 'external';

  return rows.filter((row) => {
    if (!cfg.categories.includes(row.platform)) return false;
    if (!allowedAccess.has(row.access)) return false;
    if (row.section === 'custom' && row.featureKey && !cfg.features[row.featureKey]) return false;
    if (!isTechRelevant(row, cfg.techStack)) return false;
    if (!isScopeRelevant(row, scope)) return false;
    return true;
  });
}

export function buildFeatureRegistry(rows) {
  const map = new Map();

  for (const row of rows) {
    if (row.section !== 'custom' || !row.featureKey || !row.featureLabel) continue;
    const current = map.get(row.featureKey) || {
      key: row.featureKey,
      label: row.featureLabel,
      platform: row.platform,
      count: 0,
      access: { blackbox: 0, greybox: 0, both: 0 },
    };
    current.count += 1;
    current.access[row.access] += 1;
    map.set(row.featureKey, current);
  }

  return [...map.values()].sort((a, b) => {
    if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
    return a.label.localeCompare(b.label);
  });
}

export function featureRegistryByPlatform(rows) {
  return buildFeatureRegistry(rows).reduce((acc, feature) => {
    if (!acc[feature.platform]) acc[feature.platform] = [];
    acc[feature.platform].push(feature);
    return acc;
  }, { web: [], mobile: [], desktop: [] });
}

export function getScenarioSummary(rows) {
  return {
    total: rows.length,
    customCount: rows.filter((row) => row.section === 'custom').length,
    includedFeatures: [...new Set(rows.filter((row) => row.featureLabel).map((row) => row.featureLabel))].sort(),
    platforms: rows.reduce((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {}),
  };
}
