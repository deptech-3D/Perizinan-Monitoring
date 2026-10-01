import { LicenseItem, LicenseStatus } from '../types';

export function calculateRemainingDays(expiryDateStr: string, baseDate = new Date()): number {
  if (!expiryDateStr) return 0;
  const expiry = new Date(expiryDateStr);
  const now = new Date(baseDate);
  // Reset hours to compare purely by calendar day
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface HumanDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  isPast: boolean;
  shortText: string; // e.g. "10 Thn 1 Bln 24 Hr" or "14 Hari"
  fullText: string;  // e.g. "10 Tahun 1 Bulan 24 Hari"
}

/**
 * Menghitung rincian selisih waktu dalam Tahun, Bulan, dan Hari kalender secara akurat
 */
export function getHumanDuration(expiryDateStr: string, baseDate = new Date()): HumanDuration {
  if (!expiryDateStr) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      isPast: false,
      shortText: '0 Hari',
      fullText: '0 Hari'
    };
  }

  const expiry = new Date(expiryDateStr);
  const now = new Date(baseDate);
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - now.getTime();
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isPast = totalDays < 0;

  const earlier = isPast ? new Date(expiry) : new Date(now);
  const later = isPast ? new Date(now) : new Date(expiry);

  let years = later.getFullYear() - earlier.getFullYear();
  let months = later.getMonth() - earlier.getMonth();
  let days = later.getDate() - earlier.getDate();

  if (days < 0) {
    const prevMonthDays = new Date(later.getFullYear(), later.getMonth(), 0).getDate();
    days += prevMonthDays;
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  const fullParts: string[] = [];
  const shortParts: string[] = [];

  if (years > 0) {
    fullParts.push(`${years} Tahun`);
    shortParts.push(`${years} Thn`);
  }
  if (months > 0) {
    fullParts.push(`${months} Bulan`);
    shortParts.push(`${months} Bln`);
  }
  if (days > 0 || (years === 0 && months === 0)) {
    fullParts.push(`${days} Hari`);
    shortParts.push(`${days} Hr`);
  }

  return {
    years,
    months,
    days,
    totalDays,
    isPast,
    shortText: shortParts.join(' '),
    fullText: fullParts.join(' ')
  };
}

export type ExpiryStatusType = 'safe' | 'warning' | 'expired' | 'completed';

export interface ExpiryStatusInfo {
  type: ExpiryStatusType;
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
  duration: HumanDuration;
}

export function getExpiryStatus(license: LicenseItem, baseDate = new Date()): ExpiryStatusInfo {
  const duration = getHumanDuration(license.expiryDate, baseDate);
  const absDays = Math.abs(duration.totalDays);

  if (license.status === 'Selesai') {
    return {
      type: 'completed',
      label: 'Selesai Diperpanjang',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
      dotColor: 'bg-emerald-500',
      description: 'Proses perizinan telah selesai dan dokumen baru aktif',
      duration
    };
  }

  if (duration.isPast) {
    // Jika lewat, tampilkan lewat berapa lamanya saja sesuai permintaan pengguna
    // Contoh: "Lewat 10 Thn 1 Bln 25 Hari" atau "Lewat 15 Hari"
    const timeFormatted = absDays >= 30 ? duration.shortText : `${absDays} Hari`;

    return {
      type: 'expired',
      label: `Lewat ${timeFormatted}`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20 font-semibold',
      dotColor: 'bg-rose-600',
      description: `Dokumen telah lewat jatuh tempo selama ${duration.fullText}. Wajib segera diperpanjang!`,
      duration
    };
  }

  if (duration.totalDays <= 60) {
    return {
      type: 'warning',
      label: `H-${duration.totalDays} (${duration.totalDays} Hari Tersisa)`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20 font-semibold',
      dotColor: 'bg-amber-500 animate-pulse',
      description: 'Mendekati batas kedaluwarsa H-60 (butuh pengurusan segera)',
      duration
    };
  }

  // Waktu aman (> 60 hari): jika durasi lama, tampilkan Tahun / Bulan / Hari
  const safeTimeFormatted = (duration.years > 0 || duration.months > 0)
    ? `${duration.shortText} Lagi`
    : `${duration.totalDays} Hari Lagi`;

  return {
    type: 'safe',
    label: safeTimeFormatted,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
    dotColor: 'bg-blue-500',
    description: `Status perizinan masih aman (${duration.fullText} tersisa)`,
    duration
  };
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generateEmailHtmlTemplate(
  license: LicenseItem,
  daysRemaining: number,
  adminEmail: string
): { subject: string; body: string } {
  const isUrgent = daysRemaining <= 30;
  const isExpired = daysRemaining < 0;

  const statusTitle = isExpired
    ? '🚨 PERINGATAN DARURAT: PERIZINAN TELAH KEDALUWARSA!'
    : isUrgent
    ? `⚠️ PERINGATAN MENDESAK H-${daysRemaining}: PERIZINAN SEGERA HABIS`
    : `🔔 PENGINGAT H-60: PERIZINAN AKAN KEDALUWARSA DALAM ${daysRemaining} HARI`;

  const bannerColor = isExpired ? '#e11d48' : isUrgent ? '#ea580c' : '#d97706';

  const subject = `[SIMPERIZINAN] Pengingat H-60: ${license.documentName} (${license.licenseNumber}) - Sisa ${daysRemaining} Hari`;

  const body = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 20px; background-color: #f8fafc; }
      .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
      .header { background: ${bannerColor}; color: #ffffff; padding: 24px; text-align: center; }
      .header h2 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
      .content { padding: 28px; }
      .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; color: #92400e; }
      .table-info { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      .table-info td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
      .table-info td.label { font-weight: 600; color: #64748b; width: 38%; background-color: #f8fafc; }
      .table-info td.val { color: #0f172a; font-weight: 500; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; margin-top: 10px; }
      .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>${statusTitle}</h2>
      </div>
      <div class="content">
        <p>Yth. <strong>${license.picName || 'Penanggung Jawab / PIC'}</strong>,</p>
        <p>Sistem Monitoring Perizinan Otomatis (Google Workspace Ecosystem) mendeteksi bahwa dokumen perizinan berikut memerlukan perpanjangan atau peninjauan segera:</p>
        
        <div class="alert-box">
          <strong>Pemberitahuan Sistem:</strong> Sisa waktu masa berlaku dokumen ini tersisa <strong>${daysRemaining > 0 ? daysRemaining + ' hari' : 'SUDAH KEDALUWARSA'}</strong> dari tanggal jatuh tempo <strong>${formatDateIndo(license.expiryDate)}</strong>. Mohon segera melengkapi berkas persyaratan pengajuan ke instansi terkait.
        </div>

        <table class="table-info">
          <tr>
            <td class="label">Nama Dokumen / Izin</td>
            <td class="val"><strong>${license.documentName}</strong></td>
          </tr>
          <tr>
            <td class="label">Nomor Perizinan</td>
            <td class="val"><code>${license.licenseNumber}</code></td>
          </tr>
          <tr>
            <td class="label">Instansi Penerbit</td>
            <td class="val">${license.issuer}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Terbit</td>
            <td class="val">${formatDateIndo(license.issueDate)}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Kedaluwarsa</td>
            <td class="val"><span class="badge">${formatDateIndo(license.expiryDate)} (${daysRemaining} Hari)</span></td>
          </tr>
          <tr>
            <td class="label">Status Perpanjangan</td>
            <td class="val"><strong>${license.status}</strong></td>
          </tr>
          <tr>
            <td class="label">Penanggung Jawab (PIC)</td>
            <td class="val">${license.picName} (${license.picEmail})</td>
          </tr>
          ${license.notes ? `<tr><td class="label">Catatan Tambahan</td><td class="val">${license.notes}</td></tr>` : ''}
        </table>

        ${license.fileUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${license.fileUrl}" class="btn" target="_blank">📂 Buka Salinan Dokumen di Google Drive</a>
          </div>
        ` : ''}

        <p style="font-size: 13px; color: #475569; margin-top: 20px;">
          Email ini dikirimkan secara otomatis oleh Google Apps Script Trigger Harian ke PIC bersangkutan dan ditembuskan (CC) ke Admin: <code>${adminEmail}</code>.
        </p>
      </div>
      <div class="footer">
        SIMPERIZINAN &copy; ${new Date().getFullYear()} &bull; Google Apps Script, Google Sheets & Google Drive Integration
      </div>
    </div>
  </body>
  </html>
  `;

  return { subject, body };
}

export function exportLicensesToCsv(licenses: LicenseItem[]): void {
  const headers = [
    'ID',
    'Nama Dokumen / Izin',
    'Nomor Perizinan',
    'Instansi Penerbit',
    'Tanggal Terbit',
    'Tanggal Kedaluwarsa',
    'Sisa Hari',
    'Penanggung Jawab (PIC)',
    'Email PIC',
    'Status Perpanjangan',
    'Link Google Drive',
    'Catatan',
    'Terakhir Notif'
  ];

  const rows = licenses.map((item) => {
    const sisa = calculateRemainingDays(item.expiryDate);
    return [
      `"${item.id}"`,
      `"${(item.documentName || '').replace(/"/g, '""')}"`,
      `"${(item.licenseNumber || '').replace(/"/g, '""')}"`,
      `"${(item.issuer || '').replace(/"/g, '""')}"`,
      `"${item.issueDate || ''}"`,
      `"${item.expiryDate || ''}"`,
      sisa,
      `"${(item.picName || '').replace(/"/g, '""')}"`,
      `"${(item.picEmail || '').replace(/"/g, '""')}"`,
      `"${item.status || ''}"`,
      `"${(item.fileUrl || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${item.lastNotifSent || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Laporan_Perizinan_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse CSV text (supports comma and semicolon delimiters, quoted cells, newline in cells)
 */
export function parseLicensesFromCsv(csvText: string): LicenseItem[] {
  if (!csvText || !csvText.trim()) return [];

  // Robust CSV line parser taking quotes into account
  const parseRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuote = false;

    // Detect delimiter: semicolon or comma
    const firstLine = text.split('\n')[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const rawRows = parseRows(csvText.replace(/^\uFEFF/, '')); // strip BOM if present
  if (rawRows.length === 0) return [];

  // Determine if row 0 is a header
  let startIndex = 0;
  const headerCandidates = ['id', 'nama', 'dokumen', 'nomor', 'perizinan', 'instansi', 'tanggal', 'pic', 'status'];
  const firstRowJoined = rawRows[0].join(' ').toLowerCase();
  const isHeader = headerCandidates.some(h => firstRowJoined.includes(h));
  if (isHeader) {
    startIndex = 1;
  }

  const cleanDate = (val: string): string => {
    if (!val) return '';
    const trimmed = val.trim();
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  };

  const results: LicenseItem[] = [];

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length === 0 || row.every(c => !c)) continue;

    const idVal = row[0] || `LIC-IMP-${Date.now()}-${i}`;
    const docName = row[1] || `Dokumen Izin ${i}`;
    const licNum = row[2] || '-';
    const issuer = row[3] || 'Instansi Terkait';
    const issueDate = cleanDate(row[4]);
    const expDate = cleanDate(row[5]);
    const picName = row[7] || row[6] || 'PIC Operasional';
    const picEmail = row[8] || 'admengmidtownhotelsmd@gmail.com';
    const statusVal = row[9] || 'Belum Diproses';
    const fileUrl = row[10] || '';
    const notes = row[11] || '';
    const lastNotif = row[12] || '-';

    results.push({
      id: idVal,
      documentName: docName,
      licenseNumber: licNum,
      issuer: issuer,
      issueDate: issueDate,
      expiryDate: expDate,
      picName: picName,
      picEmail: picEmail,
      status: (statusVal as any) || 'Belum Diproses',
      fileUrl: fileUrl,
      notes: notes,
      lastNotifSent: lastNotif
    });
  }

  return results;
}
