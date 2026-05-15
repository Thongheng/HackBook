import fs from 'fs';

const catalogPath = 'data/checklistCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Update WEB-BL-004
const webBl004 = catalog.rows.find(r => r.id === 'WEB-BL-004');
if (webBl004) {
    webBl004.objective = 'Check JS bundles and source maps for exposed source, hardcoded keys (e.g., unrestricted Google API keys that can incur billing charges or access GCP resources), internal endpoint references, URLs, API routes, hidden paths, and parameterized endpoints. Use static extraction plus crawling to correlate JS-linked endpoints with reachable attack surface.';
}

// 2. Update MOB-BL-010
const mobBl010 = catalog.rows.find(r => r.id === 'MOB-BL-010');
if (mobBl010) {
    mobBl010.objective = 'Verify jadx decompile to search for API keys (e.g., unrestricted Google API keys that can incur billing charges or access GCP resources), tokens, DB credentials, internal URLs in strings.xml and code.';
}

// 3. Update DSK-BL-006
const dskBl006 = catalog.rows.find(r => r.id === 'DSK-BL-006');
if (dskBl006) {
    dskBl006.objective = 'Review strings, Ghidra, dnSpy to search decompiled/disassembled code for passwords, API keys (e.g., unrestricted Google API keys that can incur billing charges or access GCP resources), connection strings.';
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Successfully updated Google API key descriptions across all platforms.');
