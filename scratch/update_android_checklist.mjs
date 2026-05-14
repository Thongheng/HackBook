import fs from 'fs';

const catalogPath = 'data/checklistCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Update MOB-BL-059
const mobBl059 = catalog.rows.find(r => r.id === 'MOB-BL-059');
if (mobBl059) {
    mobBl059.objective = 'Verify search decompiled code and network traffic for AWS S3, GCP, or Azure blob URLs, as well as hardcoded Firebase Realtime Database URLs (*.firebaseio.com). Test buckets for anonymous read/write access or directory listing using tools like CloudEnum, and test Firebase URLs by appending /.json to check for unauthenticated data access.';
}

// Update MOB-BL-030
const mobBl030 = catalog.rows.find(r => r.id === 'MOB-BL-030');
if (mobBl030) {
    mobBl030.objective = 'Verify inspect WebView implementations for setJavaScriptEnabled(true), addJavascriptInterface() abuse, setAllowFileAccess(true), and setAllowFileAccessFromFileURLs(true) allowing XSS to native bridge execution or local file inclusion/theft.';
}

// Update MOB-BL-009
const mobBl009 = catalog.rows.find(r => r.id === 'MOB-BL-009');
if (mobBl009) {
    if (!mobBl009.tools.includes('drozer')) {
        mobBl009.tools.push('drozer');
    }
}

// Update MOB-BL-075
const mobBl075 = catalog.rows.find(r => r.id === 'MOB-BL-075');
if (mobBl075) {
    if (!mobBl075.tools.includes('drozer')) {
        mobBl075.tools.push('drozer');
    }
    // ensure tools length is max 3 as per schema validation requirements
    if (mobBl075.tools.length > 3) {
        mobBl075.tools = mobBl075.tools.slice(0, 3);
    }
}
if (mobBl009 && mobBl009.tools.length > 3) {
    mobBl009.tools = mobBl009.tools.slice(0, 3);
}


fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Successfully updated Android test cases based on Medium article review.');
