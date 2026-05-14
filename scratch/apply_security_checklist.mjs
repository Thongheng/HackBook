import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('data/checklistCatalog.json', 'utf8'));

// 1. Rename and update MOB-BL-035
const mobBl035 = catalog.rows.find(r => r.id === 'MOB-BL-035');
if (mobBl035) {
  mobBl035.title = 'APK Integrity and Hash Check';
  mobBl035.objective = 'Verify application integrity by checking for hash-based verification bypasses and attempting to repackage, sign, and install modified binaries.';
}

// 2. Update MOB-BL-024
const mobBl024 = catalog.rows.find(r => r.id === 'MOB-BL-024');
if (mobBl024) {
  mobBl024.objective = 'Verify session tokens expire upon logout or new generation, check whether tokens follow an identifiable pattern, and test for invalidation across different devices.';
}

// 3. Update OTP rows for rate limiting
const mobCt023 = catalog.rows.find(r => r.id === 'MOB-CT-023');
if (mobCt023) {
  mobCt023.objective = 'Test for OTP brute-force and replay attacks, and verify that rate limiting is enforced for both OTP generation/sending and validation.';
}

// 4. Update WEB-BL-070
const webBl070 = catalog.rows.find(r => r.id === 'WEB-BL-070');
if (webBl070) {
  webBl070.title = 'Directory and Sensitive File Exposure';
  webBl070.objective = 'Perform directory and content fuzzing to identify hidden files (.git, .env, web.config, config.json), backup paths, and exposed administration or debug panels.';
}

// 5. Update WEB-CT-001
const webCt001 = catalog.rows.find(r => r.id === 'WEB-CT-001');
if (webCt001) {
  webCt001.objective = 'Review for SQLi and NoSQLi in login fields, and verify that all credentials and tokens are submitted securely over encrypted HTTPS channels.';
}

// 6. Add NEW rows: Port Scan and Burp Scan
const insertIdx = catalog.rows.findIndex(r => r.id === 'WEB-BL-004') + 1;
const newRows = [
  {
    'id': 'WEB-BL-005',
    'stdRef': 'OWASP-ASVS-4.0.3-V1.1',
    'group': 'Infrastructure',
    'title': 'Port and Service Discovery',
    'objective': 'Perform active port scanning and service fingerprinting to identify unintended open ports, exposed administration panels, or misconfigured services.',
    'access': 'blackbox',
    'rowType': 'test',
    'severity': 'medium',
    'status': 'Draft',
    'platform': 'web',
    'section': 'baseline',
    'featureKey': null,
    'featureLabel': null,
    'source': 'catalog',
    'sourceSheet': null,
    'sourceRef': '',
    'tags': ['recon'],
    'tech': [],
    'tools': ['nmap', 'naabu', 'masscan']
  },
  {
    'id': 'WEB-BL-007',
    'stdRef': 'OWASP-ASVS-4.0.3-V1.2',
    'group': 'Scanning',
    'title': 'Automated Vulnerability Scan',
    'objective': 'Review and validate findings from automated vulnerability scans (e.g., Burp Suite Professional, OWASP ZAP) to identify common web vulnerabilities.',
    'access': 'blackbox',
    'rowType': 'test',
    'severity': 'info',
    'status': 'Draft',
    'platform': 'web',
    'section': 'baseline',
    'featureKey': null,
    'featureLabel': null,
    'source': 'catalog',
    'sourceSheet': null,
    'sourceRef': '',
    'tags': ['automated'],
    'tech': [],
    'tools': ['burp', 'zap', 'nuclei']
  }
];

// Check if IDs already exist to be safe
if (!catalog.rows.some(r => r.id === 'WEB-BL-005' || r.id === 'WEB-BL-007')) {
    catalog.rows.splice(insertIdx, 0, ...newRows);
}

fs.writeFileSync('data/checklistCatalog.json', JSON.stringify(catalog, null, 2));
console.log('Successfully applied security checklist updates.');
