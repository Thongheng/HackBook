import React, { useState, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { QrCode, Wrench, Copy, Check, ClipboardPaste, ChevronDown, ChevronRight, ArrowRight, X, Trash2, Plus } from 'lucide-react';

// ── TLV tag labels ──────────────────────────────────────────────────────────
const TAG_NAMES: Record<string, string> = {
  '00': 'Payload Format Indicator',
  '01': 'Initiation Method',
  '52': 'Account Category Code',
  '53': 'Transaction Currency',
  '54': 'Transaction Amount',
  '58': 'Country Code',
  '59': 'Account Name',
  '60': 'Account City',
  '61': 'Postal Code',
  '62': 'Additional Data',
  '63': 'CRC-16 Checksum',
  '64': 'Language Template',
  '99': 'Payment System Specific Data',
};
for (let i = 26; i <= 51; i++) TAG_NAMES[i.toString().padStart(2, '0')] = 'Bank Account Info';

const MERCHANT_SUB: Record<string, string> = {
  '00': 'Globally Unique Identifier',
  '01': 'Account ID / Phone',
  '02': 'Account Name / Criteria',
};

const ADDITIONAL_SUB: Record<string, string> = {
  '00': 'Bill Number', '01': 'Mobile Number', '02': 'Store Label',
  '03': 'Loyalty Number', '04': 'Reference Label', '05': 'Customer Label',
  '06': 'Terminal Label', '07': 'Purpose of Transaction',
  '08': 'Consumer Data Request', '09': 'Account Tax ID',
  '10': 'Account Channel', '99': 'Payment System Specific',
};

// ── Types ───────────────────────────────────────────────────────────────────
interface TLVField {
  id: string;
  name: string;
  value: string;
  subfields?: TLVField[];
}

// ── Parser ───────────────────────────────────────────────────────────────────
function parseTLV(str: string, names: Record<string, string>, stopAt63 = false): TLVField[] {
  const fields: TLVField[] = [];
  let i = 0;
  while (i + 4 <= str.length) {
    const id = str.substring(i, i + 2);
    const len = parseInt(str.substring(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const value = str.substring(i + 4, i + 4 + len);
    if (value.length < len) break;
    fields.push({ id, name: names[id] || `Tag ${id}`, value });
    i += 4 + len;
    if (stopAt63 && id === '63') break;
  }
  return fields;
}

function parseKHQR(qr: string): TLVField[] {
  return parseTLV(qr, TAG_NAMES, true).map(f => {
    const n = parseInt(f.id, 10);
    if (n >= 26 && n <= 51) return { ...f, subfields: parseTLV(f.value, MERCHANT_SUB) };
    if (f.id === '62') return { ...f, subfields: parseTLV(f.value, ADDITIONAL_SUB) };
    return f;
  });
}

// ── CRC-16/CCITT (EMVCo: poly=0x1021, init=0xFFFF) ─────────────────────────
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++)
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ── Rebuild ──────────────────────────────────────────────────────────────────
function buildQRString(fields: TLVField[]): string {
  let body = '';
  for (const f of fields) {
    if (f.id === '63') continue;
    let val = f.value;
    if (f.subfields?.length)
      val = f.subfields.map(sf => `${sf.id}${sf.value.length.toString().padStart(2, '0')}${sf.value}`).join('');
    body += `${f.id}${val.length.toString().padStart(2, '0')}${val}`;
  }
  return `${body}6304${crc16(body + '6304')}`;
}

// ── Tag colour helper ─────────────────────────────────────────────────────────
function tagColor(id: string) {
  const n = parseInt(id, 10);
  if (id === '00' || id === '01') return { accent: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
  if (n >= 26 && n <= 51)         return { accent: 'text-[#9fef00]', bg: 'bg-[#9fef00]/10', border: 'border-[#9fef00]/20' };
  if (n >= 52 && n <= 54)         return { accent: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
  if (n >= 58 && n <= 61)         return { accent: 'text-sky-400',   bg: 'bg-sky-400/10',   border: 'border-sky-400/20' };
  if (id === '62')                 return { accent: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
  if (id === '63')                 return { accent: 'text-rose-400',  bg: 'bg-rose-400/10',  border: 'border-rose-400/20' };
  return { accent: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
}

// ── Component ────────────────────────────────────────────────────────────────
export const KHQRTool: React.FC = () => {
  const [tab, setTab] = useState<'decode' | 'rebuild'>('decode');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [rawQR, setRawQR] = useState('');
  const [parsed, setParsed] = useState<TLVField[]>([]);
  const [editFields, setEditFields] = useState<TLVField[]>([]);
  const [rebuiltStr, setRebuiltStr] = useState('');
  const [rebuiltImg, setRebuiltImg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);

  const [newTagId, setNewTagId] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [newTagParent, setNewTagParent] = useState('');

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (tab !== 'decode') return;
    const imgItem = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    const file = imgItem.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setPastedImage(url);
      decodeFromUrl(url);
    };
    reader.readAsDataURL(file);
  }, [tab]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste as EventListener);
    return () => window.removeEventListener('paste', handlePaste as EventListener);
  }, [handlePaste]);

  const decodeFromUrl = (url: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(data.data, data.width, data.height);
      if (result) {
        setStatus('ok'); setErrMsg('');
        setRawQR(result.data);
        const fields = parseKHQR(result.data);
        setParsed(fields);
        setEditFields(JSON.parse(JSON.stringify(fields)));
        setExpanded(new Set([
          'group_tx_acc',
          ...fields.filter(f => f.subfields?.length).map(f => f.id)
        ]));
      } else {
        setStatus('err');
        setErrMsg('No QR code detected. Ensure the screenshot contains a clear, unobstructed QR code.');
      }
    };
    img.src = url;
  };

  const handleClear = () => {
    setPastedImage(null);
    setStatus('idle');
    setErrMsg('');
    setRawQR('');
    setParsed([]);
    setEditFields([]);
  };

  // ── Rebuild QR on field change ─────────────────────────────────────────────
  useEffect(() => {
    if (!editFields.length) return;
    const qr = buildQRString(editFields);
    setRebuiltStr(qr);
    QRCode.toDataURL(qr, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(setRebuiltImg).catch(() => {});
  }, [editFields]);

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true); setTimeout(() => setter(false), 2000);
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const updateField = (id: string, value: string) =>
    setEditFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));

  const updateSub = (pid: string, sid: string, value: string) =>
    setEditFields(prev => prev.map(f =>
      f.id !== pid ? f : { ...f, subfields: f.subfields?.map(sf => sf.id === sid ? { ...sf, value } : sf) }
    ));

  const removeField = (id: string) => {
    setEditFields(prev => prev.filter(f => f.id !== id));
  };

  const removeSubField = (pid: string, sid: string) => {
    setEditFields(prev => prev.map(f =>
      f.id !== pid ? f : { ...f, subfields: f.subfields?.filter(sf => sf.id !== sid) }
    ));
  };

  const addTag = () => {
    if (!newTagId || newTagId.length !== 2 || isNaN(Number(newTagId))) {
      alert("Tag ID must be a 2-digit number (e.g. 01)");
      return;
    }
    const name = TAG_NAMES[newTagId] || `Custom Tag ${newTagId}`;
    
    if (newTagParent) {
      if (newTagParent.length !== 2 || isNaN(Number(newTagParent))) {
        alert("Parent Tag ID must be a 2-digit number (e.g. 62)");
        return;
      }
      setEditFields(prev => {
        const hasParent = prev.find(f => f.id === newTagParent);
        if (!hasParent) {
           return [...prev, { id: newTagParent, name: TAG_NAMES[newTagParent] || `Custom Parent`, value: '', subfields: [{ id: newTagId, name: `Custom SubTag ${newTagId}`, value: newTagValue }] }].sort((a,b) => a.id.localeCompare(b.id));
        }
        return prev.map(f => {
          if (f.id === newTagParent) {
            const subs = f.subfields || [];
            if (subs.find(s => s.id === newTagId)) return f;
            return { ...f, subfields: [...subs, { id: newTagId, name: `Custom SubTag ${newTagId}`, value: newTagValue }].sort((a,b) => a.id.localeCompare(b.id)) };
          }
          return f;
        });
      });
    } else {
      setEditFields(prev => {
        if (prev.find(f => f.id === newTagId)) return prev;
        return [...prev, { id: newTagId, name, value: newTagValue }].sort((a,b) => a.id.localeCompare(b.id));
      });
    }
    setNewTagId('');
    setNewTagValue('');
  };

  // live CRC for display
  const liveCRC = editFields.length ? (() => {
    let body = '';
    for (const f of editFields) {
      if (f.id === '63') continue;
      let val = f.value;
      if (f.subfields?.length)
        val = f.subfields.map(sf => `${sf.id}${sf.value.length.toString().padStart(2, '0')}${sf.value}`).join('');
      body += `${f.id}${val.length.toString().padStart(2, '0')}${val}`;
    }
    return crc16(body + '6304');
  })() : '';

  // ── Rendered field row (shared by both tabs) ───────────────────────────────
  const renderSyntheticGroup = (groupId: string, groupName: string, fields: TLVField[], colorClass: string, isDecode: boolean) => {
    if (fields.length === 0) return null;
    const c = tagColor(colorClass);
    const isOpen = expanded.has(groupId);
    
    return (
      <div key={groupId} className={`rounded-xl border ${c.border} overflow-hidden mb-3`}>
        <div
          className={`flex items-center gap-3 px-4 py-3 ${c.bg} cursor-pointer select-none`}
          onClick={() => toggleExpand(groupId)}
        >
          <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded ${c.bg} border ${c.border} ${c.accent} shrink-0`}>--</span>
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest flex-1">{groupName}</span>
          {isOpen ? <ChevronDown className={`w-3.5 h-3.5 ${c.accent} shrink-0`} /> : <ChevronRight className={`w-3.5 h-3.5 ${c.accent} shrink-0`} />}
        </div>
        {isOpen && (
          <div className="divide-y divide-white/5 bg-black/20">
            {fields.map(sf => (
              isDecode ? (
                <div key={sf.id} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="font-mono text-[9px] font-black text-white/25 shrink-0 mt-0.5">{sf.id}</span>
                  <span className="text-[11px] text-white/40 font-medium flex-1">{sf.name}</span>
                  <span className={`font-mono text-[12px] ${c.accent} break-all text-right max-w-[55%]`}>{sf.value}</span>
                </div>
              ) : (
                <div key={sf.id} className="flex items-center gap-3 px-5 py-2.5 group/item">
                  <span className="font-mono text-[9px] font-black text-white/25 shrink-0">{sf.id}</span>
                  <span className="text-[11px] text-white/40 font-medium w-36 shrink-0">{sf.name}</span>
                  <input
                    className={`flex-1 bg-transparent font-mono text-[12px] ${c.accent} outline-none border-b border-white/10 focus:border-white/30 pb-0.5 transition-colors min-w-0`}
                    value={sf.value}
                    onChange={e => updateField(sf.id, e.target.value)}
                  />
                  <button onClick={() => removeField(sf.id)} className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-rose-400 text-white/20 transition-all shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderLayout = (fields: TLVField[], isDecode: boolean) => {
    const txAccFields = fields.filter(f => ['53', '54', '59', '99'].includes(f.id));
    const bankFields = fields.filter(f => { const n = parseInt(f.id, 10); return n >= 26 && n <= 51; });
    const metaFields = fields.filter(f => !['53', '54', '59', '99', '62', '63'].includes(f.id) && !(parseInt(f.id, 10) >= 26 && parseInt(f.id, 10) <= 51));

    let bankInfoCount = 1;
    bankFields.forEach(f => {
      f.name = `Info ${bankInfoCount++}`;
    });

    const renderSingle = (id: string) => {
      const f = fields.find(x => x.id === id);
      if (!f) return null;
      return <div key={id} className="mb-3">{isDecode ? renderDecodeField(f) : renderEditField(f)}</div>;
    };

    return (
      <div className="space-y-1">
        {renderSyntheticGroup('group_meta', 'Metadata', metaFields, '00', isDecode)}
        {bankFields.map(f => renderSingle(f.id))}
        {renderSyntheticGroup('group_tx_acc', `Info ${bankInfoCount}`, txAccFields, '53', isDecode)}
        {renderSingle('62')}
        {renderSingle('63')}
      </div>
    );
  };

  // ── Rendered field helpers ──────────────────────────────────────────────────
  const renderDecodeField = (f: TLVField) => {
    const c = tagColor(f.id);
    const hasChildren = f.subfields && f.subfields.length > 0;
    const isOpen = expanded.has(f.id);
    return (
      <div key={f.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
        <div
          className={`flex items-center gap-3 px-4 py-3 ${c.bg} ${hasChildren ? 'cursor-pointer select-none' : ''}`}
          onClick={() => hasChildren && toggleExpand(f.id)}
        >
          <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded ${c.bg} border ${c.border} ${c.accent} shrink-0`}>{f.id}</span>
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest flex-1">{f.name}</span>
          {!hasChildren && <span className={`font-mono text-[12px] ${c.accent} break-all text-right`}>{f.value}</span>}
          {hasChildren && (isOpen ? <ChevronDown className={`w-3.5 h-3.5 ${c.accent} shrink-0`} /> : <ChevronRight className={`w-3.5 h-3.5 ${c.accent} shrink-0`} />)}
        </div>
        {hasChildren && isOpen && (
          <div className="divide-y divide-white/5">
            {f.subfields!.map(sf => (
              <div key={sf.id} className="flex items-start gap-3 px-5 py-2.5">
                <span className="font-mono text-[9px] font-black text-white/25 shrink-0 mt-0.5">{sf.id}</span>
                <span className="text-[11px] text-white/40 font-medium flex-1">{sf.name}</span>
                <span className={`font-mono text-[12px] ${c.accent} break-all text-right max-w-[55%]`}>{sf.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderEditField = (f: TLVField) => {
    const c = tagColor(f.id);
    const hasChildren = f.subfields && f.subfields.length > 0;
    const isOpen = expanded.has(f.id);
    const isCRC = f.id === '63';
    return (
      <div key={f.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
        <div
          className={`flex items-center gap-3 px-4 py-2.5 ${c.bg} ${hasChildren ? 'cursor-pointer select-none' : ''} group/header`}
          onClick={() => hasChildren && toggleExpand(f.id)}
        >
          <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded ${c.bg} border ${c.border} ${c.accent} shrink-0`}>{f.id}</span>
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest flex-1">{f.name}</span>
          {!isCRC && (
            <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="opacity-0 group-hover/header:opacity-100 p-1 hover:text-rose-400 text-white/20 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {hasChildren && (isOpen ? <ChevronDown className={`w-3.5 h-3.5 ${c.accent} shrink-0`} /> : <ChevronRight className={`w-3.5 h-3.5 ${c.accent} shrink-0`} />)}
          {isCRC && <span className={`font-mono text-sm font-black ${c.accent}`}>{liveCRC}</span>}
        </div>
        {!hasChildren && !isCRC && (
          <div className="px-4 py-2.5 bg-black/20">
            <input
              className={`w-full bg-transparent font-mono text-[12px] ${c.accent} outline-none border-b border-white/10 focus:border-white/30 pb-1 transition-colors`}
              value={f.value}
              onChange={e => updateField(f.id, e.target.value)}
            />
          </div>
        )}
        {hasChildren && isOpen && (
          <div className="divide-y divide-white/5">
            {f.subfields!.map(sf => (
              <div key={sf.id} className="flex items-center gap-3 px-5 py-2.5 bg-black/10 group/item">
                <span className="font-mono text-[9px] font-black text-white/25 shrink-0">{sf.id}</span>
                <span className="text-[11px] text-white/40 font-medium w-40 shrink-0">{sf.name}</span>
                <input
                  className={`flex-1 bg-transparent font-mono text-[12px] ${c.accent} outline-none border-b border-white/10 focus:border-white/30 pb-0.5 transition-colors min-w-0`}
                  value={sf.value}
                  onChange={e => updateSub(f.id, sf.id, e.target.value)}
                />
                <button onClick={() => removeSubField(f.id, sf.id)} className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-rose-400 text-white/20 transition-all shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-1">
      {/* Tab bar */}
      <div className="flex gap-2">
        {(['decode', 'rebuild'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${
              tab === t
                ? 'bg-[#9fef00]/10 border-[#9fef00]/30 text-[#9fef00]'
                : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'decode' ? <QrCode className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
            {t === 'decode' ? 'Decode QR' : 'Rebuild QR'}
          </button>
        ))}
      </div>

      {/* ── DECODE TAB ─────────────────────────────────────────────────────── */}
      {tab === 'decode' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Paste zone */}
          <div className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden min-h-[180px] flex flex-col items-center justify-center gap-4 px-6
            ${status === 'ok' ? 'border-[#9fef00]/30' : status === 'err' ? 'border-rose-500/30' : 'border-white/10 hover:border-white/20'}`}>
            {pastedImage && (
              <img src={pastedImage} alt="Pasted QR" className="absolute inset-0 w-full h-full object-contain opacity-10 blur-sm pointer-events-none" />
            )}
            {status !== 'ok' && (
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <ClipboardPaste className="w-6 h-6 text-white/30" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/60">Paste QR image here</p>
                  <p className="text-xs text-white/30 mt-1">Take a screenshot of a KHQR code, then press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">⌘V</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Ctrl+V</kbd></p>
                </div>
              </div>
            )}
            {status === 'ok' && pastedImage && (
              <div className="relative flex items-center gap-6 w-full">
                <img src={pastedImage} alt="QR Preview" className="h-28 w-28 object-contain rounded-xl border border-white/10 shrink-0 bg-white/5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-[#9fef00] font-bold uppercase tracking-widest">✓ Decoded Successfully</p>
                    <button 
                      onClick={handleClear} 
                      className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-md text-white/40 transition-colors" 
                      title="Clear and scan new"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-white/30 break-all leading-relaxed line-clamp-3">{rawQR}</p>
                  <button
                    onClick={() => handleCopy(rawQR, setRawCopied)}
                    className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors"
                  >
                    {rawCopied ? <Check className="w-3 h-3 text-[#9fef00]" /> : <Copy className="w-3 h-3" />}
                    {rawCopied ? 'Copied' : 'Copy raw'}
                  </button>
                </div>
              </div>
            )}
            {status === 'err' && (
              <div className="relative flex flex-col items-center gap-3">
                <p className="text-xs text-rose-400 font-medium">{errMsg}</p>
                <button 
                  onClick={handleClear} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-colors"
                >
                  Clear & Try Again
                </button>
              </div>
            )}
          </div>

          {/* Parsed fields */}
          {parsed.length > 0 && (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Parsed TLV Fields ({parsed.length})</p>
                <button
                  onClick={() => { setEditFields(JSON.parse(JSON.stringify(parsed))); setTab('rebuild'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9fef00]/10 border border-[#9fef00]/30 text-[#9fef00] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#9fef00]/20 transition-all"
                >
                  Load into Rebuild <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
              <div className="space-y-2 mt-4">
                {renderLayout(parsed, true)}
              </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REBUILD TAB ────────────────────────────────────────────────────── */}
      {tab === 'rebuild' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {editFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white/20" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/40">No data loaded</p>
                <p className="text-xs text-white/20 mt-1">Decode a KHQR first, then click <strong className="text-white/40">Load into Rebuild</strong></p>
              </div>
              <button
                onClick={() => setTab('decode')}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/40 hover:text-white/60 transition-colors"
              >
                ← Go to Decode
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
              {/* Left: editable fields */}
              <div className="space-y-2 pb-10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Target Fields (CRC live updates)</p>
                {renderLayout(editFields, false)}

                <div className="mt-6 p-4 rounded-xl border border-white/10 bg-black/20 space-y-3">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Add Custom Tag</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Parent ID (opt)"
                      className="w-24 bg-white/5 font-mono text-[11px] text-white outline-none border border-white/10 rounded-lg px-3 py-2 focus:border-white/30 transition-colors"
                      value={newTagParent}
                      onChange={e => setNewTagParent(e.target.value)}
                      maxLength={2}
                    />
                    <input
                      placeholder="Tag ID"
                      className="w-20 bg-white/5 font-mono text-[11px] text-white outline-none border border-white/10 rounded-lg px-3 py-2 focus:border-white/30 transition-colors"
                      value={newTagId}
                      onChange={e => setNewTagId(e.target.value)}
                      maxLength={2}
                    />
                    <input
                      placeholder="Tag Value"
                      className="flex-1 bg-white/5 font-mono text-[11px] text-white outline-none border border-white/10 rounded-lg px-3 py-2 focus:border-white/30 transition-colors min-w-0"
                      value={newTagValue}
                      onChange={e => setNewTagValue(e.target.value)}
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-[#9fef00]/10 hover:bg-[#9fef00]/20 text-[#9fef00] border border-[#9fef00]/20 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: QR preview + output */}
              <div className="space-y-4">
                {rebuiltImg && (
                  <div className="p-4 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(159,239,0,0.06)]">
                    <img src={rebuiltImg} alt="Rebuilt QR" className="w-full max-w-[260px]" />
                  </div>
                )}

                {/* CRC badge */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-rose-400/5 border border-rose-400/20">
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">CRC-16 Checksum</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Recalculated dynamically</p>
                  </div>
                  <span className="font-mono text-lg font-black text-rose-400">{liveCRC}</span>
                </div>

                {/* Raw rebuilt string */}
                {rebuiltStr && (
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Rebuilt QR String</span>
                      <button
                        onClick={() => handleCopy(rebuiltStr, setCopied)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-[#9fef00] transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-[#9fef00]" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-3 max-h-36 overflow-y-auto">
                      <p className="font-mono text-[10px] text-white/30 break-all leading-relaxed">{rebuiltStr}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
