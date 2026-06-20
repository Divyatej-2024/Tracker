const fs = require('fs');
const path = require('path');

// Durable storage for local / dev environments. In serverless environments
// (e.g. Vercel) the filesystem is ephemeral; this adapter will attempt to
// persist to disk and gracefully fall back to memory on failure.

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const APPS_FILE = path.join(DATA_DIR, 'applications.json');
const DOCS_FILE = path.join(DATA_DIR, 'documents.json');
const DOCS_DIR = path.join(DATA_DIR, 'docs');

let logs = [];

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(APPS_FILE)) {
      fs.writeFileSync(APPS_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(DOCS_FILE)) {
      fs.writeFileSync(DOCS_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
  } catch (err) {
    // If the platform doesn't allow writes, we'll continue with in-memory.
  }
}

function loadFromFile() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(LOGS_FILE, 'utf8');
    logs = JSON.parse(raw || '[]');
  } catch (err) {
    logs = logs || [];
    console.warn('storage: could not load logs from disk — using in-memory storage');
  }
}

function persistToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.warn('storage: could not persist logs to disk — data remains in-memory');
  }
}

function loadAppsFromFile() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(APPS_FILE, 'utf8');
    const apps = JSON.parse(raw || '[]');
    return apps;
  } catch (err) {
    console.warn('storage: could not load applications from disk — returning empty list');
    return [];
  }
}

function persistAppsToFile(apps) {
  try {
    ensureDataDir();
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.warn('storage: could not persist applications to disk');
  }
}

function loadDocsFromFile() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(DOCS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.warn('storage: could not load documents from disk — returning empty list');
    return [];
  }
}

function persistDocsToFile(docs) {
  try {
    ensureDataDir();
    fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2), 'utf8');
  } catch (err) {
    console.warn('storage: could not persist documents to disk');
  }
}

async function getDocuments() {
  return loadDocsFromFile().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function addDocument({ name, mimeType, contentBase64 }) {
  const docs = loadDocsFromFile();
  const now = new Date().toISOString();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${id}-${name.replace(/[^a-z0-9_.-]/gi, '_')}`;
  try {
    ensureDataDir();
    const buffer = Buffer.from(contentBase64 || '', 'base64');
    fs.writeFileSync(path.join(DOCS_DIR, filename), buffer);
  } catch (err) {
    console.warn('storage: failed to write document file, storing metadata only');
  }
  const doc = { id, name, filename, mimeType, createdAt: now };
  docs.push(doc);
  persistDocsToFile(docs);
  return doc;
}

async function deleteDocument(id) {
  const docs = loadDocsFromFile();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  const doc = docs[idx];
  try {
    const p = path.join(DOCS_DIR, doc.filename || '');
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (err) {
    // ignore
  }
  docs.splice(idx, 1);
  persistDocsToFile(docs);
  return true;
}

async function getDocumentFile(id) {
  const docs = loadDocsFromFile();
  const doc = docs.find((d) => d.id === id);
  if (!doc) return null;
  try {
    const p = path.join(DOCS_DIR, doc.filename || '');
    if (fs.existsSync(p)) return fs.readFileSync(p);
    return null;
  } catch (err) {
    return null;
  }
}

async function getApplications() {
  return loadAppsFromFile().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function addApplication(input) {
  const apps = loadAppsFromFile();
  const now = new Date().toISOString();
  const app = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(input.title || '').trim(),
    company: String(input.company || '').trim(),
    dateApplied: String(input.dateApplied || '').trim(),
    status: String(input.status || 'Saved'),
    tags: Array.isArray(input.tags) ? input.tags : (input.tags ? String(input.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
    notes: String(input.notes || '').trim(),
    archived: !!input.archived,
    createdAt: now
  };
  apps.push(app);
  persistAppsToFile(apps);
  return app;
}

async function updateApplication(id, updates) {
  const apps = loadAppsFromFile();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Not found');
  const app = apps[idx];
  const merged = Object.assign({}, app, updates);
  apps[idx] = merged;
  persistAppsToFile(apps);
  return merged;
}

async function deleteApplication(id) {
  const apps = loadAppsFromFile();
  const filtered = apps.filter((a) => a.id !== id);
  persistAppsToFile(filtered);
  return true;
}

function normalizeLog(input) {
  const date = String(input.date || '').trim();
  const applications = Number(input.applications);
  const recruiters = Number(input.recruiters);
  const projectHours = Number(input.projectHours);

  if (!date) {
    throw new Error('Date is required');
  }

  if (![applications, recruiters, projectHours].every(Number.isFinite)) {
    throw new Error('All metrics must be numeric');
  }

  if ([applications, recruiters, projectHours].some((v) => v < 0)) {
    throw new Error('Values must be >= 0');
  }

  return {
    id: `${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    applications,
    recruiters,
    projectHours,
    createdAt: new Date().toISOString()
  };
}

async function getLogs() {
  if (!logs || logs.length === 0) {
    loadFromFile();
  }
  return [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function addLog(input) {
  const log = normalizeLog(input);
  logs.push(log);
  persistToFile();
  return log;
}

module.exports = {
  getLogs,
  addLog,
  getDocuments,
  addDocument,
  deleteDocument,
  getDocumentFile,
  // Expose internals for testing/migration
  _internal: {
    loadFromFile,
    persistToFile,
    LOGS_FILE,
    APPS_FILE,
    DOCS_FILE,
    loadAppsFromFile,
    persistAppsToFile,
    loadDocsFromFile,
    persistDocsToFile
  },
  getApplications,
  addApplication,
  updateApplication,
  deleteApplication
};

