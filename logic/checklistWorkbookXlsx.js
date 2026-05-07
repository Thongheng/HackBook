import * as XLSX from 'xlsx';
import * as CFBModule from 'cfb';

const CFB = CFBModule.default ?? CFBModule;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const WORKBOOK_XLSX_STYLE_INDEX = {
  header: 1,
  group: 2,
  'data-left': 3,
  'data-center': 4,
  'severity-critical': 5,
  'severity-high': 6,
  'severity-medium': 7,
  'severity-low': 8,
  'severity-info': 9,
  title: 10,
  'meta-label': 11,
  'meta-value': 12,
};

const WORKBOOK_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="9">
    <font><sz val="10"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF9A3412"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF92400E"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E40AF"/><name val="Aptos"/><family val="2"/></font>
    <font><sz val="10"/><color rgb="FF4B5563"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="14"/><color rgb="FF111827"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF6B7280"/><name val="Aptos"/><family val="2"/></font>
  </fonts>
  <fills count="9">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF374151"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFEDD5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF9CA3AF"/></left>
      <right style="thin"><color rgb="FF9CA3AF"/></right>
      <top style="thin"><color rgb="FF9CA3AF"/></top>
      <bottom style="thin"><color rgb="FF9CA3AF"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4"/>
</styleSheet>
`;

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value);
  throw new TypeError(`Unsupported binary payload type: ${typeof value}`);
}

function stripWorkbookCell(cell) {
  if (!cell || typeof cell !== 'object' || !('v' in cell)) return cell;
  const stripped = { v: cell.v, t: cell.t };
  if (cell.f) {
    stripped.f = cell.f;
  }
  return stripped;
}

function toColumnSpec(width) {
  if (typeof width === 'number') return { wch: width };
  return { ...width };
}

function buildWorkbookBytes(sheets) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheetData = sheet.data.map((row) => row.map(stripWorkbookCell));
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = sheet.columnWidths.map(toColumnSpec);
    if (sheet.merges?.length) {
      worksheet['!merges'] = sheet.merges;
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  return toUint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
}

function collectSheetStyleRefs(sheet) {
  const styleRefs = new Map();

  sheet.data.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (!cell || typeof cell !== 'object' || !cell.styleKey) return;

      const styleIndex = WORKBOOK_XLSX_STYLE_INDEX[cell.styleKey];
      if (styleIndex == null) return;

      styleRefs.set(XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex }), styleIndex);
    });
  });

  return styleRefs;
}

function applySheetStyleRefs(sheetXml, styleRefs) {
  return sheetXml.replace(/<c\b([^>]*)>/g, (match, attributes) => {
    const refMatch = attributes.match(/\br="([^"]+)"/);
    if (!refMatch) return match;

    const styleIndex = styleRefs.get(refMatch[1]);
    if (styleIndex == null) return match;

    if (/\bs="\d+"/.test(attributes)) {
      return `<c${attributes.replace(/\bs="\d+"/, ` s="${styleIndex}"`)}>`;
    }

    return `<c${attributes} s="${styleIndex}">`;
  });
}

function patchWorkbookStyles(workbookBytes, sheets) {
  const zip = CFB.read(Array.from(toUint8Array(workbookBytes)), { type: 'array' });
  const stylesEntry = CFB.find(zip, '/xl/styles.xml');

  if (!stylesEntry) {
    throw new Error('Generated XLSX is missing /xl/styles.xml');
  }

  stylesEntry.content = textEncoder.encode(WORKBOOK_STYLES_XML);

  sheets.forEach((sheet, index) => {
    const styleRefs = collectSheetStyleRefs(sheet);
    if (styleRefs.size === 0) return;

    const worksheetEntry = CFB.find(zip, `/xl/worksheets/sheet${index + 1}.xml`);
    if (!worksheetEntry) {
      throw new Error(`Generated XLSX is missing worksheet XML for sheet ${index + 1}`);
    }

    const patchedXml = applySheetStyleRefs(textDecoder.decode(toUint8Array(worksheetEntry.content)), styleRefs);
    worksheetEntry.content = textEncoder.encode(patchedXml);
  });

  return toUint8Array(
    CFB.write(
      zip,
      typeof Buffer !== 'undefined'
        ? { type: 'buffer', fileType: 'zip', compression: true }
        : { fileType: 'zip', compression: true }
    )
  );
}

export function buildWorkbookBuffer(sheets) {
  return patchWorkbookStyles(buildWorkbookBytes(sheets), sheets);
}

export function saveWorkbookFile(sheets, filename) {
  const workbookBytes = buildWorkbookBuffer(sheets);
  const blob = new Blob([workbookBytes], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
