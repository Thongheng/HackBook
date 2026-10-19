/**
 * Burp / cURL request -> Python function for a `session` + `BASE_URL` template.
 *
 * Output uses the template's names: session, BASE_URL, step(), check(), log().
 */

export type HeaderMode = 'clean' | 'keep';

export interface BurpConvertOptions {
  headerMode: HeaderMode;
  funcName?: string;
}

export interface BurpConvertResult {
  code: string;
  warnings: string[];
  error?: string;
}

// Browser-only headers. Removed in 'clean' mode.
export const CLEAN_REMOVE_HEADERS = [
  'upgrade-insecure-requests',
  'priority',
  'connection',
  'keep-alive',
  'accept-encoding',
  'accept-language',
  'dnt',
  'sec-gpc',
  'pragma',
  'cache-control',
  'te',
];
const CLEAN_REMOVE_PREFIXES = ['sec-fetch-', 'sec-ch-'];

// Always removed: requests computes these itself, a stale value breaks the request.
const ALWAYS_REMOVE_HEADERS = ['content-length', 'transfer-encoding'];

const STANDARD_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

// curl flags that take an argument. Their argument must not be mistaken for the URL.
const CURL_VALUE_FLAGS = new Set([
  '-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary',
  '--data-ascii', '--data-urlencode', '--json', '-b', '--cookie', '-u', '--user',
  '-A', '--user-agent', '-e', '--referer', '-m', '--max-time', '--connect-timeout',
  '-x', '--proxy', '-o', '--output', '-F', '--form', '-T', '--upload-file', '-c',
  '--cookie-jar', '-w', '--write-out', '--resolve', '--cacert', '--cert', '--key',
  '-K', '--config', '--url', '--retry', '-E', '--cert-type', '-Y', '--speed-limit',
  '-y', '--speed-time', '--interface', '--dns-server', '--max-redirs', '-D', '--dump-header',
]);

interface ParsedRequest {
  method: string;
  target: string; // path + raw query, or absolute URL
  headers: Array<[string, string]>; // ordered, duplicates kept
  body: string | null;
  warnings: string[];
}

// ---------- tokenizing ----------

// Splits a shell command line into words, honouring '...', "...", $'...' and backslashes.
function tokenizeShell(cmd: string): string[] {
  const src = cmd.replace(/\\\r?\n/g, ' ');
  const tokens: string[] = [];
  let cur = '';
  let has = false;
  let i = 0;
  const push = () => { if (has) tokens.push(cur); cur = ''; has = false; };
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { push(); i++; continue; }
    if (ch === "'") {
      has = true;
      const end = src.indexOf("'", i + 1);
      if (end === -1) throw new Error('unterminated single quote');
      cur += src.slice(i + 1, end);
      i = end + 1;
    } else if (ch === '$' && src[i + 1] === "'") {
      has = true;
      i += 2;
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\' && i + 1 < src.length) {
          const nx = src[i + 1];
          const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', e: '\x1b' };
          if (nx === 'x' && /^[0-9a-fA-F]{1,2}$/.test(src.slice(i + 2, i + 4))) {
            const hex = src.slice(i + 2, i + 4).match(/^[0-9a-fA-F]{1,2}/)![0];
            cur += String.fromCharCode(parseInt(hex, 16));
            i += 2 + hex.length;
            continue;
          }
          if (nx in map) { cur += map[nx]; i += 2; continue; }
          cur += '\\' + nx; i += 2; continue;
        }
        cur += src[i++];
      }
      if (i >= src.length) throw new Error('unterminated $\' quote');
      i++; // closing '
    } else if (ch === '"') {
      has = true;
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length && '"\\$`\n'.includes(src[i + 1])) {
          cur += src[i + 1]; i += 2;
        } else {
          cur += src[i++];
        }
      }
      if (i >= src.length) throw new Error('unterminated double quote');
      i++;
    } else if (ch === '\\' && i + 1 < src.length) {
      has = true;
      cur += src[i + 1];
      i += 2;
    } else {
      has = true;
      cur += ch;
      i++;
    }
  }
  push();
  return tokens;
}

// ---------- curl parsing ----------

function parseCurl(raw: string): ParsedRequest {
  const tokens = tokenizeShell(raw);
  const warnings: string[] = [];
  let method: string | null = null;
  let target: string | null = null;
  const headers: Array<[string, string]> = [];
  const dataParts: string[] = [];
  const formFields: string[] = [];
  let getMode = false;
  let headOnly = false;
  let jsonBody = false;

  const addHeader = (name: string, value: string) => {
    const idx = headers.findIndex(([n]) => n.toLowerCase() === name.toLowerCase());
    if (idx >= 0 && name.toLowerCase() === 'cookie') {
      headers[idx][1] += '; ' + value;
    } else {
      headers.push([name, value]);
    }
  };

  let i = tokens[0] === 'curl' ? 1 : 0;
  while (i < tokens.length) {
    let tok = tokens[i];
    // -XPOST / -H'...' style attached values
    if (/^-X.+/.test(tok) && !tok.startsWith('--')) { tok = '-X'; tokens.splice(i + 1, 0, tokens[i].slice(2)); }
    if (/^-H.+/.test(tok) && !tok.startsWith('--')) { tok = '-H'; tokens.splice(i + 1, 0, tokens[i].slice(2)); }
    const takesValue = CURL_VALUE_FLAGS.has(tok);
    const val = takesValue ? tokens[i + 1] : undefined;
    if (takesValue && val === undefined) { warnings.push(`curl flag ${tok} has no value`); break; }
    switch (tok) {
      case '-X': case '--request': method = val!.toUpperCase(); break;
      case '-I': case '--head': headOnly = true; break;
      case '-G': case '--get': getMode = true; break;
      case '--url': target = val!; break;
      case '-H': case '--header': {
        const v = val!;
        const ci = v.indexOf(':');
        if (ci > 0) {
          const name = v.slice(0, ci).trim();
          const value = v.slice(ci + 1).trim();
          if (value !== '') addHeader(name, value);
        }
        break;
      }
      case '-b': case '--cookie':
        if (val!.includes('=')) addHeader('Cookie', val!);
        else warnings.push(`cookie file "${val}" not read — paste the cookie string instead`);
        break;
      case '-A': case '--user-agent': addHeader('User-Agent', val!); break;
      case '-e': case '--referer': addHeader('Referer', val!); break;
      case '-u': case '--user':
        addHeader('Authorization', 'Basic ' + base64Utf8(val!));
        break;
      case '-d': case '--data': case '--data-raw': case '--data-binary': case '--data-ascii':
        if (val!.startsWith('@')) warnings.push(`${val} is a file reference — sent as literal text`);
        dataParts.push(val!);
        break;
      case '--data-urlencode': {
        const v = val!;
        const eq = v.indexOf('=');
        dataParts.push(eq > 0 ? `${v.slice(0, eq)}=${encodeURIComponent(v.slice(eq + 1))}` : encodeURIComponent(v.replace(/^=/, '')));
        break;
      }
      case '--json':
        jsonBody = true;
        dataParts.push(val!);
        break;
      case '-F': case '--form':
        if (/=@/.test(val!)) warnings.push(`file upload ${val} not converted (multipart -F is not supported)`);
        else formFields.push(val!);
        break;
      case '-T': case '--upload-file':
        warnings.push(`upload ${val} not converted`);
        break;
      case '-x': case '--proxy':
        warnings.push(`proxy ${val} ignored — add proxies= to the session if you want Burp in the path`);
        break;
      default:
        if (takesValue) break; // other value flags: argument is consumed, ignored
        if (tok.startsWith('-')) break; // no-arg flags: -s, -k, -L, --compressed, -i ...
        if (target === null) target = tok;
        else warnings.push(`extra argument "${tok}" ignored`);
    }
    i += takesValue ? 2 : 1;
  }

  if (!target) throw new Error('no URL found in curl command');
  if (formFields.length) {
    // simple -F fields become urlencoded data so the request still carries them
    dataParts.push(formFields.map(f => {
      const eq = f.indexOf('=');
      return eq > 0 ? `${f.slice(0, eq)}=${encodeURIComponent(f.slice(eq + 1))}` : f;
    }).join('&'));
    warnings.push('-F fields were sent as urlencoded form data (multipart boundary not preserved)');
  }

  let body: string | null = dataParts.length ? dataParts.join('&') : null;
  if (getMode) {
    if (body !== null) {
      target += (target.includes('?') ? '&' : '?') + body;
      body = null;
    }
    method = method ?? 'GET';
  } else if (headOnly) {
    method = method ?? 'HEAD';
  } else {
    method = method ?? (body !== null ? 'POST' : 'GET');
  }

  if (jsonBody) {
    if (!headers.some(([n]) => n.toLowerCase() === 'content-type')) headers.push(['Content-Type', 'application/json']);
    if (!headers.some(([n]) => n.toLowerCase() === 'accept')) headers.push(['Accept', 'application/json']);
  }

  return { method, target, headers, body, warnings };
}

// ---------- raw HTTP parsing ----------

function parseRaw(raw: string): ParsedRequest {
  const warnings: string[] = [];
  const sep = raw.match(/\r?\n\r?\n/);
  const head = sep ? raw.slice(0, sep.index) : raw;
  let body: string | null = sep ? raw.slice(sep.index! + sep[0].length) : null;
  if (body !== null) {
    body = body.replace(/(\r?\n)+$/, ''); // editor/paste trailing newline is not part of the body
    if (body === '') body = null;
  }

  const lines = head.split(/\r?\n/);
  const reqLine = lines[0].trim().split(/\s+/);
  if (reqLine.length < 2) throw new Error('first line must be "METHOD /path HTTP/1.1"');
  const method = reqLine[0].toUpperCase();
  const target = reqLine[1];

  const headers: Array<[string, string]> = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const ci = line.indexOf(':');
    if (ci <= 0) { warnings.push(`skipped malformed header line: ${line}`); continue; }
    const name = line.slice(0, ci).trim();
    const value = line.slice(ci + 1).trim();
    const existing = headers.find(([n]) => n.toLowerCase() === name.toLowerCase());
    if (existing && name.toLowerCase() === 'cookie') existing[1] += '; ' + value;
    else if (existing) { existing[1] += ', ' + value; warnings.push(`duplicate ${name} header joined with ", "`); }
    else headers.push([name, value]);
  }
  return { method, target, headers, body, warnings };
}

// ---------- Python emitting ----------

function pyBody(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (c < 0x20 || c === 0x7f) out += '\\x' + c.toString(16).padStart(2, '0');
    else if (c >= 0xd800 && c <= 0xdfff) out += '\\u' + c.toString(16).padStart(4, '0');
    else out += ch;
  }
  return out;
}

const pyStr = (s: string) => `"${pyBody(s)}"`;

// Lays out pre-rendered entries. One line when short, one entry per line otherwise.
function pyLayout(open: string, close: string, rows: string[], indent: string): string {
  if (rows.length === 0) return open + close;
  const compact = `${open}${rows.join(', ')}${close}`;
  if (compact.length <= 80) return compact;
  const inner = indent + '    ';
  return `${open}\n${rows.map(r => `${inner}${r},`).join('\n')}\n${indent}${close}`;
}

function pyDictFromPairs(pairs: Array<[string, string]>, indent: string): string {
  return pyLayout('{', '}', pairs.map(([k, v]) => `${pyStr(k)}: ${pyStr(v)}`), indent);
}

// Python literal for a JSON value, keeping numbers exactly as written.
function jsonToPy(src: string, indent: string): string | null {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const fail = (): never => { throw new SyntaxError('bad json'); };
  const str = (): string => {
    if (src[i] !== '"') fail();
    const start = i++;
    while (i < src.length && src[i] !== '"') {
      if (src[i] === '\\') i++;
      i++;
    }
    if (i >= src.length) fail();
    i++;
    return JSON.parse(src.slice(start, i)) as string;
  };
  const value = (ind: string): string => {
    ws();
    const c = src[i];
    const inner = ind + '    ';
    if (c === '{') {
      i++; ws();
      if (src[i] === '}') { i++; return '{}'; }
      const entries: string[] = [];
      for (;;) {
        ws();
        const k = str();
        ws();
        if (src[i++] !== ':') fail();
        entries.push(`${inner}${pyStr(k)}: ${value(inner)},`);
        ws();
        const d = src[i++];
        if (d === ',') continue;
        if (d === '}') break;
        fail();
      }
      return `{\n${entries.join('\n')}\n${ind}}`;
    }
    if (c === '[') {
      i++; ws();
      if (src[i] === ']') { i++; return '[]'; }
      const items: string[] = [];
      for (;;) {
        items.push(`${inner}${value(inner)},`);
        ws();
        const d = src[i++];
        if (d === ',') continue;
        if (d === ']') break;
        fail();
      }
      return `[\n${items.join('\n')}\n${ind}]`;
    }
    if (c === '"') return pyStr(str());
    if (src.startsWith('true', i)) { i += 4; return 'True'; }
    if (src.startsWith('false', i)) { i += 5; return 'False'; }
    if (src.startsWith('null', i)) { i += 4; return 'None'; }
    const m = src.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    if (m) { i += m[0].length; return m[0]; }
    return fail();
  };
  try {
    const out = value(indent);
    ws();
    if (i !== src.length) return null;
    return out;
  } catch {
    return null;
  }
}

// Form body -> pairs, decoding + as space. Keeps duplicate keys in order.
function parseForm(body: string): Array<[string, string]> {
  const dec = (s: string) => {
    const spaced = s.replace(/\+/g, ' ');
    try { return decodeURIComponent(spaced); } catch { return spaced; }
  };
  return body.split('&').filter(p => p !== '').map(p => {
    const eq = p.indexOf('=');
    return eq === -1 ? [dec(p), ''] : [dec(p.slice(0, eq)), dec(p.slice(eq + 1))];
  }) as Array<[string, string]>;
}

function base64Utf8(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function toFuncName(method: string, target: string): string {
  const path = target.replace(/^https?:\/\/[^/]+/i, '').split('?')[0];
  const slug = `${method} ${path}`.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const name = slug || 'send_request';
  return /^\d/.test(name) ? `req_${name}` : name;
}

function sanitizeFuncName(name: string): string | null {
  const n = name.trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : null;
}

// ---------- main ----------

export function convertBurpRequest(input: string, opts: BurpConvertOptions): BurpConvertResult {
  if (!input.trim()) return { code: '', warnings: [] };
  const warnings: string[] = [];
  let parsed: ParsedRequest;
  try {
    parsed = /^\s*curl\s/i.test(input) ? parseCurl(input) : parseRaw(input);
  } catch (e) {
    return { code: '', warnings, error: e instanceof Error ? e.message : String(e) };
  }
  warnings.push(...parsed.warnings);

  // Path + query, with the host dropped (BASE_URL in the template supplies it)
  let target = parsed.target;
  const absolute = target.match(/^(https?):\/\/([^/?#]+)(.*)$/i);
  if (absolute) {
    warnings.push(`URL host "${absolute[2]}" replaced by BASE_URL — set BASE_URL to match if it differs`);
    target = absolute[3] || '/';
  }
  if (!target.startsWith('/')) target = '/' + target;

  // Headers: cookies go to cookies=, drop-list applied per mode
  let cookiePairs: Array<[string, string]> = [];
  const kept: Array<[string, string]> = [];
  const removed: string[] = [];
  for (const [name, value] of parsed.headers) {
    const lower = name.toLowerCase();
    if (lower === 'cookie') {
      for (const part of value.split(/;\s*/)) {
        if (!part) continue;
        const eq = part.indexOf('=');
        cookiePairs.push(eq === -1 ? [part, ''] : [part.slice(0, eq), part.slice(eq + 1)]);
      }
      continue;
    }
    if (ALWAYS_REMOVE_HEADERS.includes(lower)) { removed.push(name); continue; }
    if (opts.headerMode === 'clean' &&
        (CLEAN_REMOVE_HEADERS.includes(lower) || CLEAN_REMOVE_PREFIXES.some(p => lower.startsWith(p)))) {
      removed.push(name);
      continue;
    }
    kept.push([name, value]);
  }
  if (removed.length) {
    warnings.push(`${opts.headerMode === 'clean' ? 'removed' : 'dropped'}: ${removed.join(', ')}`);
  }
  if (opts.headerMode === 'keep' && !removed.length) warnings.push('keeping all headers');

  // Body
  const indent = '    ';
  const argIndent = indent + '    ';
  const contentType = (kept.find(([n]) => n.toLowerCase() === 'content-type')?.[1] ?? '').toLowerCase();
  let bodyArg: string | null = null;
  if (parsed.body !== null) {
    const body = parsed.body;
    const looksJson = /^\s*[{[]/.test(body);
    const jsonPy = (contentType.includes('json') || (!contentType && looksJson))
      ? jsonToPy(body, argIndent) : null;
    if (jsonPy !== null) {
      bodyArg = `json=${jsonPy}`;
    } else if (contentType.includes('json') || (!contentType && looksJson)) {
      warnings.push('body is not valid JSON — sent as raw text (edit it if you need JSON)');
      bodyArg = `data=${pyStr(body)}`;
    } else if (contentType.includes('multipart/form-data')) {
      warnings.push('multipart body sent as raw bytes; Content-Type (with boundary) is kept');
      bodyArg = `data=${pyStr(body)}`;
    } else if (contentType.includes('x-www-form-urlencoded') || (!contentType && body.includes('=') && !body.trim().startsWith('<'))) {
      const pairs = parseForm(body);
      // duplicate keys (a=1&a=2) need a list of tuples; a dict would drop one
      const keys = new Set(pairs.map(([k]) => k));
      const val = keys.size === pairs.length
        ? pyDictFromPairs(pairs, argIndent)
        : pyLayout('[', ']', pairs.map(([k, v]) => `(${pyStr(k)}, ${pyStr(v)})`), argIndent);
      bodyArg = `data=${val}`;
    } else {
      bodyArg = `data=${pyStr(body)}`;
    }
  }

  // Method call
  const method = parsed.method.toLowerCase();
  const urlLine = `f"{BASE_URL}${pyBody(target.replace(/[{}]/g, m => m + m))}"`;
  const funcName = (opts.funcName && sanitizeFuncName(opts.funcName)) || toFuncName(parsed.method, target);
  const call = STANDARD_METHODS.has(method)
    ? `session.${method}(`
    : `session.request(${pyStr(parsed.method)}, `;

  const argLines: string[] = [`${argIndent}${urlLine},`];
  if (kept.length) argLines.push(`${argIndent}headers=${pyDictFromPairs(kept, argIndent)},`);
  if (cookiePairs.length) argLines.push(`${argIndent}cookies=${pyDictFromPairs(cookiePairs, argIndent)},`);
  if (bodyArg) argLines.push(`${argIndent}${bodyArg},`);

  const code = [
    `def ${funcName}():`,
    `${indent}step("${funcName}")`,
    `${indent}response = ${call.trimEnd()}`,
    ...argLines,
    `${indent})`,
    `${indent}check(response, note="${funcName}")  # add expect= / contains= / missing=`,
    `${indent}log(f"HTTP {response.status_code}")`,
    `${indent}return response`,
  ].join('\n');

  return { code, warnings };
}
