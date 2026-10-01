import express from 'express';
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
  res.json({ success: true, data: db.users || INITIAL_USERS });
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
    driveFolderId: db.driveFolderId || '',
    lastUpdated: db.lastUpdated 
  });
});

app.post('/api/config', (req, res) => {
  const db = loadDb();
  if (req.body.webAppUrl !== undefined) {
    db.webAppUrl = req.body.webAppUrl;
  }
  if (req.body.driveFolderId !== undefined) {
    db.driveFolderId = req.body.driveFolderId;
  }
  saveDb(db);
  res.json({ 
    success: true, 
    webAppUrl: db.webAppUrl, 
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

// Vite middleware in dev or static serve in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
