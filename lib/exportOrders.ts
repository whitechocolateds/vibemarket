/**
 * Izvoz u .xls preko HTML tabele (Excel to otvara nativno) - za razliku od .csv, ovde možemo
 * definisati širinu kolona po sadržaju, pa se sve lepo vidi bez ručnog razvlačenja ćelija.
 * Namerno bez SheetJS/xlsx paketa (poznate neispravljene bezbednosne ranjivosti u toj biblioteci).
 */
export interface XlsColumn {
  header: string;
  width: number; // px
  /** Zadrži kao tekst i kad sadržaj izgleda kao broj (telefon, poštanski broj - da ne izgubi vodeću nulu ili ode u naučnu notaciju) */
  forceText?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function downloadXls(filename: string, columns: XlsColumn[], rows: (string | number)[][]): void {
  const colGroup = columns.map((c) => `<col style="width:${c.width}px">`).join('');
  const headerRow = columns
    .map((c) => `<th style="background:#12213B;color:#fff;padding:8px 10px;text-align:left;font-weight:bold;white-space:nowrap;">${escapeHtml(c.header)}</th>`)
    .join('');
  const bodyRows = rows
    .map(
      (row) =>
        '<tr>' +
        row
          .map((cell, i) => {
            const forceText = columns[i]?.forceText;
            const style = `padding:6px 10px;white-space:nowrap;${forceText ? " mso-number-format:'\\@';" : ''}`;
            return `<td style="${style}">${escapeHtml(String(cell))}</td>`;
          })
          .join('') +
        '</tr>'
    )
    .join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"></head>
<body><table border="1" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:12px;"><colgroup>${colGroup}</colgroup><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
