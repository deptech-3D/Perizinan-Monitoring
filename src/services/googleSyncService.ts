import { LicenseItem, UserAccount } from '../types';

export interface SyncStatus {
  isConnected: boolean;
  webAppUrl: string;
  lastSyncedAt: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  autoSync: boolean;
}

const STORAGE_KEY_WEBAPP_URL = 'simperizinan_webapp_url';
const STORAGE_KEY_AUTOSYNC = 'simperizinan_autosync';

export const getStoredWebAppUrl = (): string => {
  return localStorage.getItem(STORAGE_KEY_WEBAPP_URL) || '';
};

export const setStoredWebAppUrl = (url: string): void => {
  if (url) {
    localStorage.setItem(STORAGE_KEY_WEBAPP_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_WEBAPP_URL);
  }
};

export const getStoredAutoSync = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_AUTOSYNC) === 'true';
};

export const setStoredAutoSync = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEY_AUTOSYNC, enabled ? 'true' : 'false');
};

/**
 * Extract Google Spreadsheet ID from a Google Sheets URL
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch licenses directly from Google Sheets (via gviz/tq API or Google Apps Script Web App)
 */
export async function fetchLicensesFromGoogleSheets(urlOrWebApp: string): Promise<{ success: boolean; data?: LicenseItem[]; message?: string }> {
  if (!urlOrWebApp || !urlOrWebApp.startsWith('http')) {
    return { success: false, message: 'URL belum valid atau kosong.' };
  }

  const cleanUrl = urlOrWebApp.trim();

  // Mode 1: Direct Google Spreadsheet Link (docs.google.com/spreadsheets/d/...)
  const sheetId = extractSpreadsheetId(cleanUrl);
  if (sheetId) {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&t=${Date.now()}`;
      const response = await fetch(gvizUrl);
      if (!response.ok) {
        throw new Error(`Gagal membuka Spreadsheet (Status ${response.status}). Pastikan Akses Berbagi diatur ke 'Siapa saja yang memiliki link'.`);
      }
      const text = await response.text();
      // Format Google Visualization: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Format data Google Sheets tidak dikenali.');
      }
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      const rows = parsed?.table?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        return { success: true, data: [] };
      }

      const items: LicenseItem[] = rows.map((r: any, idx: number) => {
        const c = r.c || [];
        const getVal = (i: number) => {
          if (!c[i] || c[i].v === null || c[i].v === undefined) return '';
          return String(c[i].f || c[i].v).trim();
        };

        const today = new Date();
        today.setHours(0,0,0,0);
        let expStr = getVal(5);
        let remDays = 0;
        if (expStr) {
          const expD = new Date(expStr);
          if (!isNaN(expD.getTime())) {
            expD.setHours(0,0,0,0);
            remDays = Math.ceil((expD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        return {
          id: getVal(0) || `LIC-SHT-${idx + 1}`,
          documentName: getVal(1) || `Izin ${idx + 1}`,
          licenseNumber: getVal(2) || '-',
          issuer: getVal(3) || 'Instansi Terkait',
          issueDate: getVal(4) || '',
          expiryDate: expStr || '',
          remainingDays: remDays,
          picName: getVal(7) || 'PIC',
          picEmail: getVal(8) || 'pic@example.com',
          fileUrl: getVal(9) || '',
          status: (getVal(10) as any) || 'Belum Diproses',
          notes: getVal(11) || '',
          lastNotifSent: getVal(12) || '-'
        };
      }).filter(item => item.documentName && item.documentName !== 'Nama_Dokumen');

      return { success: true, data: items };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal membaca Google Spreadsheet: ${err.message}. Pastikan tombol 'Bagikan' di Sheets sudah diatur ke 'Siapa saja yang memiliki link'.`
      };
    }
  }

  // Mode 2: Google Apps Script Web App Deployment URL (.../exec)
  try {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const targetUrl = `${cleanUrl}${separator}action=getLicenses&t=${Date.now()}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (json && json.success && Array.isArray(json.data)) {
      return { success: true, data: json.data };
    } else if (Array.isArray(json)) {
      return { success: true, data: json };
    } else {
      return { success: false, message: json.message || 'Format data dari Google Apps Script tidak dikenali.' };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungkan ke Google Apps Script: ${err.message || err}. Pastikan Web App di-deploy dengan akses 'Anyone' (Siapa saja).`
    };
  }
}

/**
 * Send license data to deployed Google Apps Script to write into Google Sheets
 */
export async function saveLicenseToGoogleSheets(
  webAppUrl: string,
  license: Partial<LicenseItem>
): Promise<{ success: boolean; id?: string; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Web App belum dikonfigurasi.' };
  }

  try {
    const separator = webAppUrl.includes('?') ? '&' : '?';
    // Google Apps Script handles both GET and POST with URL parameters or payload
    const payload = JSON.stringify({
      action: 'saveLicenseData',
      licenseData: license
    });

    // Try standard POST with text/plain to prevent CORS preflight block in Apps Script
    const response = await fetch(`${webAppUrl}${separator}action=saveLicenseData`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    // If CORS prevents JSON response read on POST, Apps Script might still have processed it or we fallback
    return {
      success: false,
      message: `Error koneksi ke Google Sheets: ${err.message || err}`
    };
  }
}

/**
 * Delete license from Google Sheets
 */
export async function deleteLicenseFromGoogleSheets(
  webAppUrl: string,
  licenseId: string
): Promise<{ success: boolean; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Web App belum dikonfigurasi.' };
  }

  try {
    const separator = webAppUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${webAppUrl}${separator}action=deleteLicense&id=${encodeURIComponent(licenseId)}`, {
      method: 'GET',
      redirect: 'follow'
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghapus data di Google Sheets.' };
  }
}

/**
 * Test connection to Google Apps Script Web App
 */
export async function testGoogleAppsScriptConnection(webAppUrl: string): Promise<{ success: boolean; message: string; rowCount?: number }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'Masukkan URL Web App terlebih dahulu.' };
  }

  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.includes('script.google.com') && !cleanUrl.includes('spreadsheets') && !cleanUrl.startsWith('http')) {
    return { success: false, message: 'Format URL harus URL Google Apps Script (/exec) atau Link Google Spreadsheet (docs.google.com/spreadsheets/d/...).' };
  }

  try {
    const res = await fetchLicensesFromGoogleSheets(cleanUrl);
    if (res.success && res.data) {
      return {
        success: true,
        message: `Koneksi berhasil! Terhubung ke Google Sheets dan menemukan ${res.data.length} baris data perizinan.`,
        rowCount: res.data.length
      };
    } else {
      return {
        success: false,
        message: res.message || 'Gagal menerima respon valid dari Google Apps Script.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Tidak dapat menghubungi server Apps Script'}`
    };
  }
}

/**
 * Batch save/import multiple licenses to Google Sheets so all devices (PC & HP) stay synchronized
 */
export async function batchSaveLicensesToGoogleSheets(
  webAppUrl: string,
  licenses: LicenseItem[]
): Promise<{ success: boolean; count?: number; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Web App belum dikonfigurasi.' };
  }

  try {
    const separator = webAppUrl.includes('?') ? '&' : '?';
    const payload = JSON.stringify({
      action: 'batchSaveLicenses',
      licenses: licenses
    });

    const response = await fetch(`${webAppUrl}${separator}action=batchSaveLicenses`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    // If CORS prevents JSON parse or batch action isn't deployed yet, fallback to saving individually
    let successCount = 0;
    try {
      for (const item of licenses) {
        await saveLicenseToGoogleSheets(webAppUrl, item);
        successCount++;
      }
      return {
        success: true,
        count: successCount,
        message: `Tersimpan ${successCount} data ke Google Sheets.`
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: `Error koneksi: ${err.message || fallbackErr.message}`
      };
    }
  }
}

/**
 * Extract Google Drive Folder ID from link or raw ID
 */
export function extractDriveFolderId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) return folderMatch[1];
  const idMatch = trimmed.match(/id=([a-zA-Z0-9-_]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

/**
 * Upload file/photo to Google Drive with automatic public access (ANYONE_WITH_LINK, VIEW)
 */
export async function uploadFileToGoogleDrive(
  webAppUrl: string,
  base64Data: string,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<{ success: boolean; fileUrl?: string; fileId?: string; fileName?: string; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Web App belum dikonfigurasi.' };
  }

  try {
    const separator = webAppUrl.includes('?') ? '&' : '?';
    const cleanFolderId = folderId ? extractDriveFolderId(folderId) : undefined;
    
    const payload = JSON.stringify({
      action: 'uploadFileToDrive',
      base64Data,
      fileName,
      mimeType: mimeType || 'image/jpeg',
      folderId: cleanFolderId
    });

    const response = await fetch(`${webAppUrl}${separator}action=uploadFileToDrive`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      message: `Error upload ke Google Drive: ${err.message || err}`
    };
  }
}

/**
 * Validate login credentials directly against Google Sheets (Sheet "Users")
 */
export async function checkLoginWithGoogleSheets(
  webAppUrl: string,
  username: string,
  pass: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum tersambung.' };
  }

  const cleanUrl = webAppUrl.trim();
  const separator = cleanUrl.includes('?') ? '&' : '?';

  // Try via POST first
  try {
    const payload = JSON.stringify({
      action: 'checkLogin',
      username: username.trim(),
      password: pass.trim()
    });

    const res = await fetch(`${cleanUrl}${separator}action=checkLogin`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.user) {
        return {
          success: true,
          user: {
            id: String(data.user.id || `usr-${Date.now()}`),
            username: String(data.user.username),
            fullName: String(data.user.fullName || data.user.username),
            email: String(data.user.email || ''),
            role: data.user.role === 'Admin' ? 'Admin' : 'Staff',
            password: pass.trim(),
            active: true
          }
        };
      }
      if (data && !data.success) {
        return { success: false, message: data.message };
      }
    }
  } catch (postErr) {
    console.warn('POST checkLogin failed, trying GET fallback:', postErr);
  }

  // GET fallback
  try {
    const getUrl = `${cleanUrl}${separator}action=checkLogin&username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(pass.trim())}`;
    const resGet = await fetch(getUrl);
    if (resGet.ok) {
      const data = await resGet.json();
      if (data && data.success && data.user) {
        return {
          success: true,
          user: {
            id: String(data.user.id || `usr-${Date.now()}`),
            username: String(data.user.username),
            fullName: String(data.user.fullName || data.user.username),
            email: String(data.user.email || ''),
            role: data.user.role === 'Admin' ? 'Admin' : 'Staff',
            password: pass.trim(),
            active: true
          }
        };
      }
      return { success: false, message: data.message || 'Login gagal.' };
    }
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  return { success: false, message: 'Tidak dapat memvalidasi ke Google Sheets.' };
}

/**
 * Fetch all registered users from Google Sheets
 */
export async function fetchUsersFromGoogleSheets(
  webAppUrl: string
): Promise<{ success: boolean; data?: UserAccount[]; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL belum dikonfigurasi.' };
  }

  const cleanUrl = webAppUrl.trim();
  const separator = cleanUrl.includes('?') ? '&' : '?';

  try {
    const res = await fetch(`${cleanUrl}${separator}action=getUsers`, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message || 'Gagal mengambil user.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Save / Add user to Google Sheets
 */
export async function saveUserToGoogleSheets(
  webAppUrl: string,
  user: UserAccount
): Promise<{ success: boolean; message?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL belum dikonfigurasi.' };
  }

  const cleanUrl = webAppUrl.trim();
  const separator = cleanUrl.includes('?') ? '&' : '?';

  try {
    const payload = JSON.stringify({
      action: 'saveUser',
      userData: user
    });

    const res = await fetch(`${cleanUrl}${separator}action=saveUser`, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
