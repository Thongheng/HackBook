import fs from 'fs';

const catalogPath = 'data/checklistCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Update MOB-BL-070 (Mobile Login 2FA Bypass)
const mobBl070 = catalog.rows.find(r => r.id === 'MOB-BL-070');
if (mobBl070) {
    mobBl070.objective = 'Verify intercept MFA/OTP submission. Test: replay a used OTP, swap OTP from another account, and verify time-based expiry enforcement. Test forced browsing bypass: while on the 2FA page without inputting the code, try to access an authenticated page directly.';
}

// Update WEB-BL-022 (Web Login 2FA Bypass)
const webBl022 = catalog.rows.find(r => r.id === 'WEB-BL-022');
if (webBl022) {
    webBl022.objective = 'Test OTP brute force, response manipulation, backup-code abuse, step skipping, used-code replay, cross-account OTP reuse, and channel swapping. Test forced browsing bypass: while on the 2FA page without inputting the code, try to access an authenticated page directly.';
}

// Update MOB-CT-023 (Mobile Registration OTP Brute Force) - Removing "Replay" overlap
const mobCt023 = catalog.rows.find(r => r.id === 'MOB-CT-023');
if (mobCt023) {
    mobCt023.title = 'OTP Brute Force And Rate Limit Testing';
    mobCt023.objective = 'Verify abuse of OTP resend endpoints (spamming) or parallel brute-force guessing of OTP codes to complete registration without owning the channel.';
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Successfully updated 2FA bypass and brute force descriptions.');
