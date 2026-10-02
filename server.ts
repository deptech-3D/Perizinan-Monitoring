import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_LICENSES, INITIAL_USERS } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'server-db.json');

// Ensure database file exists
function loadDb() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // fallback
    }
  }
  const initialDb = {
    licenses: INITIAL_LICENSES,
    users: INITIAL_USERS,
    webAppUrl: '',
    driveFolderId: '',
    lastUpdated: new Date().toISOString()
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to init db file', err);
  }
  return initialDb;
}

function saveDb(db: any) {
  db.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file', err);
  }
}

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/licenses', (_req, res) => {
  const db = loadDb();
  res.json({ success: true, data: db.licenses || [] });
});

app.post('/api/licenses', (req, res) => {
  const db = loadDb();
  const nextLicenses = req.body.licenses;
  if (Array.isArray(nextLicenses)) {
    db.licenses = nextLicenses;
    saveDb(db);
    return res.json({ success: true, count: db.licenses.length });
  }
  res.status(400).json({ success: false, message: 'Invalid licenses data' });
});

app.delete('/api/licenses/:id', (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.licenses = (db.licenses || []).filter((l: any) => l.id !== id);
  saveDb(db);
  res.json({ success: true, message: 'Deleted successfully' });
});

// Users API (Shared user credentials across PC and HP)
app.get('/api/users', (_req, res) => {
  const db = loadDb();
  const rawUsers = db.users || INITIAL_USERS;
  const filtered = rawUsers.filter((u: any) => u.id !== 'usr-2' && u.id !== 'usr-3' && u.username !== 'staff' && u.username !== 'hendra');
  if (filtered.length !== rawUsers.length) {
    db.users = filtered;
    saveDb(db);
  }
  res.json({ success: true, data: filtered });
});

app.post('/api/users', (req, res) => {
  const db = loadDb();
  const nextUsers = req.body.users;
  if (Array.isArray(nextUsers)) {
    db.users = nextUsers;
    saveDb(db);
    return res.json({ success: true, count: db.users.length });
  }
  res.status(400).json({ success: false, message: 'Invalid users array' });
});

app.get('/api/config', (_req, res) => {
  const db = loadDb();
  res.json({ 
    success: true, 
    webAppUrl: db.webAppUrl || '', 
    spreadsheetUrl: db.spreadsheetUrl || '',
    driveFolderId: db.driveFolderId || '',
    lastUpdated: db.lastUpdated 
  });
});

app.post('/api/config', (req, res) => {
  const db = loadDb();
  if (req.body.webAppUrl !== undefined) {
    db.webAppUrl = req.body.webAppUrl;
  }
  if (req.body.spreadsheetUrl !== undefined) {
    db.spreadsheetUrl = req.body.spreadsheetUrl;
  }
  if (req.body.driveFolderId !== undefined) {
    db.driveFolderId = req.body.driveFolderId;
  }
  saveDb(db);
  res.json({ 
    success: true, 
    webAppUrl: db.webAppUrl, 
    spreadsheetUrl: db.spreadsheetUrl,
    driveFolderId: db.driveFolderId 
  });
});

app.post('/api/upload', (req, res) => {
  try {
    const { fileName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'No file data received' });
    }
    const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = path.extname(fileName || '') || '.jpg';
    const safeName = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);
    res.json({ 
      success: true, 
      fileUrl: `/uploads/${safeName}`, 
      fileName: safeName 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CSV parser helper
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

function parseRowsToLicenses(rows: string[][]): any[] {
  const isHeader = rows[0]?.some(cell => 
    cell.toLowerCase().includes('dokumen') || 
    cell.toLowerCase().includes('nomor') ||
    cell.toLowerCase().includes('id')
  );
  const dataRows = isHeader ? rows.slice(1) : rows;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dataRows.map((r, idx) => {
    const getVal = (col: number) => (r[col] || '').trim();
    const expStr = getVal(5);
    let remDays = 0;
    if (expStr) {
      const expD = new Date(expStr);
      if (!isNaN(expD.getTime())) {
        expD.setHours(0, 0, 0, 0);
        remDays = Math.ceil((expD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: getVal(0) || `LIC-SHT-${idx + 1}`,
      documentName: getVal(1) || `Perizinan ${idx + 1}`,
      licenseNumber: getVal(2) || '-',
      issuer: getVal(3) || 'Instansi Terkait',
      issueDate: getVal(4) || '',
      expiryDate: expStr || '',
      remainingDays: remDays,
      picName: getVal(7) || 'PIC',
      picEmail: getVal(8) || 'admengmidtownhotelsmd@gmail.com',
      fileUrl: getVal(9) || '',
      status: getVal(10) || 'Belum Diproses',
      notes: getVal(11) || '',
      lastNotifSent: getVal(12) || '-'
    };
  }).filter(item => item.documentName && !item.documentName.toLowerCase().includes('nama_dokumen'));
}

function parseGvizToLicenses(rows: any[]): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.map((r, idx) => {
    const c = r.c || [];
    const getVal = (i: number) => {
      if (!c[i] || c[i].v === null || c[i].v === undefined) return '';
      return String(c[i].f || c[i].v).trim();
    };

    let expStr = getVal(5);
    let remDays = 0;
    if (expStr) {
      const expD = new Date(expStr);
      if (!isNaN(expD.getTime())) {
        expD.setHours(0, 0, 0, 0);
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
      picEmail: getVal(8) || 'admengmidtownhotelsmd@gmail.com',
      fileUrl: getVal(9) || '',
      status: (getVal(10) as any) || 'Belum Diproses',
      notes: getVal(11) || '',
      lastNotifSent: getVal(12) || '-'
    };
  }).filter(item => item.documentName && item.documentName !== 'Nama_Dokumen');
}

// Backend Proxy Route for Live Google Sync (Bypasses CORS & diagnose permissions)
app.post('/api/sync/fetch-licenses', async (req, res) => {
  const db = loadDb();
  const inputUrl = (req.body.url || db.spreadsheetUrl || db.webAppUrl || '').trim();

  if (!inputUrl) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL Google Apps Script atau Google Spreadsheet belum dimasukkan.' 
    });
  }

  // 1. Check if it's a Google Spreadsheet URL
  const sheetMatch = inputUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    try {
      // Try CSV export first
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=Data_Perizinan`;
      const csvResp = await fetch(csvUrl, { redirect: 'follow' });
      const csvText = await csvResp.text();

      if (csvText.includes('<html') || csvText.includes('ServiceLogin') || csvText.includes('accounts.google.com')) {
        return res.json({
          success: false,
          errorType: 'SPREADSHEET_RESTRICTED',
          message: 'Google Spreadsheet Anda masih berstatus "Dibatasi" (Private). Silakan buka spreadsheet Anda di Google Drive, klik tombol hijau "Bagikan" (Share) di pojok kanan atas, lalu ubah Akses Umum menjadi "Siapa saja yang memiliki link" -> Pengamat (Viewer).'
        });
      }

      const rows = parseCSV(csvText);
      if (rows.length > 1) {
        const licenses = parseRowsToLicenses(rows);
        if (licenses.length > 0) {
          db.licenses = licenses;
          db.lastUpdated = new Date().toISOString();
          saveDb(db);
          return res.json({ success: true, data: licenses, source: 'spreadsheet-csv' });
        }
      }

      // Try default sheet gid=0 CSV export
      const defaultCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const defCsvResp = await fetch(defaultCsvUrl, { redirect: 'follow' });
      const defCsvText = await defCsvResp.text();
      if (!defCsvText.includes('<html') && !defCsvText.includes('ServiceLogin')) {
        const defRows = parseCSV(defCsvText);
        if (defRows.length > 1) {
          const licenses = parseRowsToLicenses(defRows);
          if (licenses.length > 0) {
            db.licenses = licenses;
            db.lastUpdated = new Date().toISOString();
            saveDb(db);
            return res.json({ success: true, data: licenses, source: 'spreadsheet-csv-default' });
          }
        }
      }

      // Try gviz query
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
      const gvizResp = await fetch(gvizUrl, { redirect: 'follow' });
      const gvizText = await gvizResp.text();
      if (gvizText.includes('{') && gvizText.includes('}')) {
        const jsonStart = gvizText.indexOf('{');
        const jsonEnd = gvizText.lastIndexOf('}');
        const parsed = JSON.parse(gvizText.substring(jsonStart, jsonEnd + 1));
        const gvizRows = parsed?.table?.rows;
        if (Array.isArray(gvizRows) && gvizRows.length > 0) {
          const licenses = parseGvizToLicenses(gvizRows);
          if (licenses.length > 0) {
            db.licenses = licenses;
            db.lastUpdated = new Date().toISOString();
            saveDb(db);
            return res.json({ success: true, data: licenses, source: 'spreadsheet-gviz' });
          }
        }
      }

      return res.json({
        success: true,
        data: [],
        message: 'Spreadsheet berhasil diakses, namun belum ada baris data pada sheet Data_Perizinan.'
      });
    } catch (err: any) {
      return res.json({
        success: false,
        message: `Gagal membaca Google Spreadsheet: ${err.message}`
      });
    }
  }

  // 2. Otherwise treat as Google Apps Script Web App Deployment URL
  try {
    const separator = inputUrl.includes('?') ? '&' : '?';
    const targetUrl = `${inputUrl}${separator}action=getLicenses&t=${Date.now()}`;
    const resp = await fetch(targetUrl, { redirect: 'follow' });
    const text = await resp.text();

    if (text.includes('GANTI_DENGAN_SPREADSHEET_ID_ANDA') || text.includes('Illegal spreadsheet id')) {
      return res.json({
        success: false,
        errorType: 'APPS_SCRIPT_TEMPLATE_ID',
        message: 'Google Apps Script Anda masih berisi template "GANTI_DENGAN_SPREADSHEET_ID_ANDA". Silakan buka tab "Kode Sumber Apps Script", salin kode Code.gs yang sudah terisi ID Anda, lalu tempel di script.google.com dan klik Deploy > Versi Baru.'
      });
    }

    try {
      const data = JSON.parse(text);
      if (data && data.success && Array.isArray(data.data)) {
        db.licenses = data.data;
        db.lastUpdated = new Date().toISOString();
        saveDb(db);
        return res.json({ success: true, data: data.data, source: 'apps-script' });
      } else if (Array.isArray(data)) {
        db.licenses = data;
        db.lastUpdated = new Date().toISOString();
        saveDb(db);
        return res.json({ success: true, data: data, source: 'apps-script-array' });
      }
      return res.json({ success: false, message: data.message || 'Format data dari Apps Script tidak dikenali.' });
    } catch {
      return res.json({ success: false, message: 'Apps Script mengembalikan respon non-JSON. Pastikan Web App di-deploy dengan akses Anyone.' });
    }
  } catch (err: any) {
    return res.json({ success: false, message: `Koneksi ke Apps Script gagal: ${err.message}` });
  }
});

// Vite middleware in dev or static serve in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
