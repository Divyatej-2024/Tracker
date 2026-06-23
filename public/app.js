const TOKEN_KEY = 'job_tracker_auth_token';

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const logForm = document.getElementById('log-form');
const logMessage = document.getElementById('log-message');
const historyBody = document.getElementById('history-body');
const deadlinesList = document.getElementById('deadlines-list');
const logoutBtn = document.getElementById('logout-btn');
const dateInput = document.getElementById('date');
const appSearch = document.getElementById('app-search');
const applicationForm = document.getElementById('application-form');
const appTitle = document.getElementById('app-title');
const appCompany = document.getElementById('app-company');
const appDate = document.getElementById('app-date');
const appStatus = document.getElementById('app-status');
const appTags = document.getElementById('app-tags');
const appNotes = document.getElementById('app-notes');
const applicationsList = document.getElementById('applications-list');
const kanbanToggle = document.getElementById('kanban-toggle');
const kanbanBoard = document.getElementById('kanban-board');
const appCancel = document.getElementById('app-cancel');

let applications = [];
let editingAppId = null;

// CV / Docs UI
const cvUpload = document.getElementById('cv-upload');
const cvRefresh = document.getElementById('cv-refresh');
const docsList = document.getElementById('docs-list');
const profileForm = document.getElementById('profile-form');
const generateCvBtn = document.getElementById('generate-cv');
const cvPreview = document.getElementById('cv-preview');

// ATS UI
const jdText = document.getElementById('jd-text');
const cvSource = document.getElementById('cv-source');
const cvTextArea = document.getElementById('cv-text');
const cvDocSelect = document.getElementById('cv-doc-select');
const runAtsBtn = document.getElementById('run-ats');
const atsResults = document.getElementById('ats-results');

// CV Humanizer UI
const humanizeCvSource = document.getElementById('humanize-cv-source');
const humanizeCvTextArea = document.getElementById('humanize-cv-text');
const humanizeCvDocSelect = document.getElementById('humanize-cv-doc-select');
const humanizeCvBtn = document.getElementById('humanize-cv');
const humanizeResults = document.getElementById('humanize-results');

// CV Templates UI (Phase 8)
const templateSelect = document.getElementById('template-select');
const renderTemplateBtn = document.getElementById('render-template');
const exportCvBtn = document.getElementById('export-cv');
const exportFormat = document.getElementById('export-format');
const templatePreview = document.getElementById('template-preview');

// Interview Prep UI (Phase 9)
const interviewCategory = document.getElementById('interview-category');
const getQuestionBtn = document.getElementById('get-question');
const showTipsBtn = document.getElementById('show-tips');
const questionDisplay = document.getElementById('question-display');
const interviewAnswer = document.getElementById('interview-answer');
const interviewTips = document.getElementById('interview-tips');

// Recruiter CRM UI (Phase 10)
const recruiterForm = document.getElementById('recruiter-form');
const rName = document.getElementById('r-name');
const rCompany = document.getElementById('r-company');
const rEmail = document.getElementById('r-email');
const rPhone = document.getElementById('r-phone');
const rNotes = document.getElementById('r-notes');
const recruitersList = document.getElementById('recruiters-list');

// Analytics UI (Phase 11)
const loadAnalyticsBtn = document.getElementById('load-analytics');
const exportDataBtn = document.getElementById('export-data');
const analyticsDisplay = document.getElementById('analytics-display');

async function populateCvDocs() {
  try {
    const data = await api('/api/docs', { method: 'GET' });
    const docs = data.documents || [];

    const builds = [
      { select: cvDocSelect, placeholder: 'Select uploaded doc' },
      { select: humanizeCvDocSelect, placeholder: 'Select uploaded doc for humanizer' }
    ];

    builds.forEach(({ select, placeholder }) => {
      if (!select) return;
      select.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      select.appendChild(opt);
      docs.forEach((d) => {
        const o = document.createElement('option');
        o.value = d.id;
        o.textContent = d.name;
        select.appendChild(o);
      });
    });
  } catch (err) {
    console.error('Could not populate docs', err);
  }
}

async function handleRunAts() {
  const jd = jdText ? jdText.value : '';
  let cvText = '';
  const source = cvSource ? cvSource.value : 'generated';
  if (source === 'paste') cvText = cvTextArea ? cvTextArea.value : '';
  if (source === 'generated') cvText = cvPreview ? cvPreview.textContent || cvPreview.innerText || '' : '';
  let cvDocId = null;
  if (source === 'uploaded') cvDocId = cvDocSelect ? cvDocSelect.value : null;
  try {
    const payload = { jdText: jd, cvText, cvDocId };
    const res = await api('/api/ats-scan', { method: 'POST', body: JSON.stringify(payload) });
    if (!atsResults) return;
    atsResults.innerHTML = `<div><strong>Score</strong>: ${res.score}%</div><div><strong>Suggested missing keywords</strong>: ${res.suggestedSkills.slice(0,10).join(', ')}</div>`;
  } catch (err) {
    console.error('ATS scan failed', err);
  }
}

function renderHumanizeResults(result) {
  if (!humanizeResults) return;
  humanizeResults.innerHTML = '';
  const wrapper = document.createElement('div');
  const score = document.createElement('div');
  score.innerHTML = `<strong>Humanization score</strong>: ${result.score}%`;
  wrapper.appendChild(score);
  if (result.genericPhrases && result.genericPhrases.length) {
    const gen = document.createElement('div');
    gen.innerHTML = `<strong>Generic phrases detected</strong>: ${result.genericPhrases.join(', ')}`;
    wrapper.appendChild(gen);
  }
  if (result.suggestions && result.suggestions.length) {
    const sug = document.createElement('div');
    sug.innerHTML = `<strong>Suggested improvements</strong>: ${result.suggestions.join(', ')}`;
    wrapper.appendChild(sug);
  }
  const beforeBlock = document.createElement('pre');
  beforeBlock.className = 'humanize-block';
  beforeBlock.textContent = `Before:\n${result.before}`;
  const afterBlock = document.createElement('pre');
  afterBlock.className = 'humanize-block humanize-after';
  afterBlock.textContent = `After:\n${result.after}`;
  wrapper.appendChild(beforeBlock);
  wrapper.appendChild(afterBlock);
  humanizeResults.appendChild(wrapper);
}

async function handleHumanizeCv() {
  let cvText = '';
  let cvDocId = null;
  const source = humanizeCvSource ? humanizeCvSource.value : 'generated';

  if (source === 'paste') {
    cvText = humanizeCvTextArea ? humanizeCvTextArea.value.trim() : '';
  } else if (source === 'generated') {
    cvText = cvPreview ? cvPreview.textContent || cvPreview.innerText || '' : '';
  } else if (source === 'uploaded') {
    cvDocId = humanizeCvDocSelect ? humanizeCvDocSelect.value : null;
  }

  if (!cvText && !cvDocId) {
    alert('Please provide CV text or select an uploaded document.');
    return;
  }

  try {
    const payload = { cvText, cvDocId };
    const res = await api('/api/humanize-cv', { method: 'POST', body: JSON.stringify(payload) });
    renderHumanizeResults(res);
  } catch (err) {
    console.error('CV humanization failed', err);
  }
}
// Phase 8: CV Templates & Export
async function loadCvTemplates() {
  try {
    const res = await api('/api/cv-templates', { method: 'GET' });
    if (!templateSelect || !res.templates) return;
    templateSelect.innerHTML = '';
    res.templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} - ${t.description}`;
      templateSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Could not load templates', err);
  }
}

async function handleRenderTemplate() {
  const templateId = templateSelect ? templateSelect.value : '';
  const profile = {
    name: document.getElementById('p-name').value.trim(),
    email: document.getElementById('p-email').value.trim(),
    phone: document.getElementById('p-phone').value.trim(),
    summary: document.getElementById('p-summary').value.trim(),
    skills: (document.getElementById('p-skills').value || '').split(',').map(s => s.trim()).filter(Boolean),
    experience: []
  };

  try {
    const res = await api('/api/cv-templates', { method: 'POST', body: JSON.stringify({ profile, templateId }) });
    if (templatePreview) templatePreview.innerHTML = res.html || 'No preview';
  } catch (err) {
    console.error('Template render failed', err);
  }
}

async function handleExportCv() {
  const profile = {
    name: document.getElementById('p-name').value.trim(),
    email: document.getElementById('p-email').value.trim(),
    phone: document.getElementById('p-phone').value.trim(),
    summary: document.getElementById('p-summary').value.trim(),
    skills: (document.getElementById('p-skills').value || '').split(',').map(s => s.trim()).filter(Boolean),
    experience: []
  };
  const format = exportFormat ? exportFormat.value : 'json';

  try {
    const res = await api('/api/cv-export', { method: 'POST', body: JSON.stringify({ profile, format }) });
    const blob = new Blob([res.content], { type: res.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('CV export failed', err);
  }
}

// Phase 9: Interview Prep
async function handleGetQuestion() {
  try {
    const category = interviewCategory ? interviewCategory.value : 'all';
    const payload = { action: 'get-random', category: category !== 'all' ? category : null };
    const res = await api('/api/interview-prep', { method: 'POST', body: JSON.stringify(payload) });

    if (questionDisplay) {
      questionDisplay.innerHTML = `<div class="question-block"><strong>Question:</strong><p>${escapeHtml(res.question.question)}</p></div>`;
    }
    if (interviewAnswer) {
      interviewAnswer.style.display = 'block';
      interviewAnswer.value = '';
    }
  } catch (err) {
    console.error('Could not get question', err);
  }
}

async function handleShowTips() {
  try {
    const res = await api('/api/interview-prep', { method: 'GET' });
    if (!interviewTips || !res.tips) return;

    interviewTips.innerHTML = '<strong>Interview Tips:</strong>';
    res.tips.slice(0, 5).forEach(tip => {
      const div = document.createElement('div');
      div.className = 'tip-item';
      div.innerHTML = `<strong>${escapeHtml(tip.title)}</strong><p>${escapeHtml(tip.content)}</p>`;
      interviewTips.appendChild(div);
    });
  } catch (err) {
    console.error('Could not load tips', err);
  }
}

// Phase 10: Recruiter CRM
async function handleRecruiterSubmit(event) {
  event.preventDefault();

  const payload = {
    name: rName ? rName.value.trim() : '',
    company: rCompany ? rCompany.value.trim() : '',
    email: rEmail ? rEmail.value.trim() : '',
    phone: rPhone ? rPhone.value.trim() : '',
    notes: rNotes ? rNotes.value.trim() : ''
  };

  if (!payload.name || !payload.email) {
    alert('Name and email are required');
    return;
  }

  try {
    await api('/api/recruiters', { method: 'POST', body: JSON.stringify(payload) });
    recruiterForm.reset();
    await loadRecruiters();
  } catch (err) {
    console.error('Failed to add recruiter', err);
  }
}

async function loadRecruiters() {
  try {
    const res = await api('/api/recruiters', { method: 'GET' });
    if (!recruitersList || !res.recruiters) return;

    recruitersList.innerHTML = '';
    (res.recruiters || []).forEach(r => {
      const div = document.createElement('div');
      div.className = 'recruiter-item card';
      div.innerHTML = `
        <strong>${escapeHtml(r.name)}</strong> - ${escapeHtml(r.company)}<br>
        <small>${escapeHtml(r.email)} | ${escapeHtml(r.phone)}</small><br>
        <em>${escapeHtml(r.notes)}</em><br>
        <button class="secondary" data-id="${r.id}" onclick="handleDeleteRecruiter(event)">Delete</button>
      `;
      recruitersList.appendChild(div);
    });
  } catch (err) {
    console.error('Could not load recruiters', err);
  }
}

async function handleDeleteRecruiter(event) {
  const btn = event.target;
  const id = btn.dataset.id;
  if (!id || !confirm('Delete this recruiter?')) return;

  try {
    await api('/api/recruiters', { method: 'DELETE', body: JSON.stringify({ id }) });
    await loadRecruiters();
  } catch (err) {
    console.error('Delete failed', err);
  }
}

// Phase 11: Analytics
async function handleLoadAnalytics() {
  try {
    const res = await api('/api/analytics', { method: 'GET' });
    if (!analyticsDisplay) return;

    const html = `
      <div><strong>Success Rate:</strong> ${res.summary.successRate}%</div>
      <div><strong>Avg Applications/Day:</strong> ${res.summary.avgApplicationsPerDay}</div>
      <div><strong>Weekly Trend:</strong> ${res.summary.weeklyTrend} applications</div>
      <div style="margin-top:12px;"><strong>Status Breakdown:</strong></div>
      <div>${Object.entries(res.statusBreakdown).map(([k, v]) => `<div>${k}: ${v}</div>`).join('')}</div>
    `;
    analyticsDisplay.innerHTML = html;
  } catch (err) {
    console.error('Could not load analytics', err);
  }
}

async function handleExportData() {
  try {
    const res = await api('/api/export-data', { method: 'POST', body: JSON.stringify({ format: 'json' }) });
    const blob = new Blob([res.content], { type: res.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Data export failed', err);
  }
}
async function refreshDocs() {
  try {
    const data = await api('/api/docs', { method: 'GET' });
    const docs = data.documents || [];
    if (!docsList) return;
    docsList.innerHTML = '';
    docs.forEach(d => {
      const div = document.createElement('div');
      div.className = 'doc-item';
      const left = document.createElement('div');
      left.textContent = `${d.name} (${d.mimeType || 'file'})`;
      const actions = document.createElement('div');
      const dl = document.createElement('a');
      dl.href = `/api/docs?download=${encodeURIComponent(d.id)}`;
      dl.textContent = 'Download';
      dl.setAttribute('target', '_blank');
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'secondary';
      del.addEventListener('click', async () => { await api('/api/docs', { method: 'DELETE', body: JSON.stringify({ id: d.id }) }); await refreshDocs(); });
      actions.appendChild(dl);
      actions.appendChild(del);
      div.appendChild(left);
      div.appendChild(actions);
      docsList.appendChild(div);
    });
  } catch (err) {
    console.error('Could not refresh docs', err);
  }
}

async function handleUploadFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('File too large (max 5MB)'); return; }
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(',')[1] || '';
    await api('/api/docs', { method: 'POST', body: JSON.stringify({ name: file.name, mimeType: file.type, contentBase64: base64 }) });
    await refreshDocs();
  };
  reader.readAsDataURL(file);
}

async function handleGenerateCv() {
  const profile = {
    name: document.getElementById('p-name').value.trim(),
    email: document.getElementById('p-email').value.trim(),
    phone: document.getElementById('p-phone').value.trim(),
    summary: document.getElementById('p-summary').value.trim(),
    skills: (document.getElementById('p-skills').value || '').split(',').map(s=>s.trim()).filter(Boolean),
    experience: []
  };
  try {
    const data = await api('/api/generate-cv', { method: 'POST', body: JSON.stringify({ profile, type: 'Graduate' }) });
    if (cvPreview) cvPreview.innerHTML = data.html || 'No preview';
  } catch (err) {
    console.error('CV generation failed', err);
  }
}

const deadlines = [
  { name: 'Course End', date: '2026-05-16' },
  { name: 'Graduation', date: '2026-07-13' },
  { name: 'Visa Expiry', date: '2026-09-15' }
];

// Theme toggle and accessibility
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Ignore storage failures in browsers that disallow localStorage
  }
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initTheme() {
  const saved = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

const LOCAL_DATA_KEY = 'tracker_local_data_v1';
const LOCAL_FALLBACK_TOKEN = 'local-fallback-token';
const FALLBACK_TEMPLATES = [
  { id: 'modern', name: 'Modern CV', description: 'Simple one-page CV template.' },
  { id: 'classic', name: 'Classic CV', description: 'Clean classic layout.' }
];

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (!raw) {
      const payload = { logs: [], applications: [], recruiters: [], documents: [], templates: FALLBACK_TEMPLATES };
      localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(payload));
      return payload;
    }
    const parsed = JSON.parse(raw || '{}');
    return Object.assign({ logs: [], applications: [], recruiters: [], documents: [], templates: FALLBACK_TEMPLATES }, parsed);
  } catch (error) {
    console.warn('Local storage unavailable', error);
    return { logs: [], applications: [], recruiters: [], documents: [], templates: FALLBACK_TEMPLATES };
  }
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Could not save local data', error);
  }
}

function localGenerateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateLocalLog(input) {
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

function downloadBase64File(base64, name, mimeType = 'application/octet-stream') {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function localApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : (options.body || {});
  const data = getLocalData();
  const token = getToken();
  const isAuthenticated = token === LOCAL_FALLBACK_TOKEN;

  if (path === '/api/login' && method === 'POST') {
    if (!body.password) {
      throw new Error('Password is required for offline mode');
    }
    setToken(LOCAL_FALLBACK_TOKEN);
    return { token: LOCAL_FALLBACK_TOKEN };
  }

  if (path === '/api/logout' && method === 'POST') {
    clearToken();
    return { ok: true };
  }

  if (!isAuthenticated) {
    throw new Error('Unauthorized (offline mode)');
  }

  if (path === '/api/logs') {
    if (method === 'GET') {
      return { logs: [...data.logs].sort((a, b) => (a.date < b.date ? 1 : -1)) };
    }
    if (method === 'POST') {
      const log = validateLocalLog(body);
      data.logs.push(log);
      saveLocalData(data);
      return { log };
    }
  }

  if (path === '/api/applications') {
    if (method === 'GET') {
      return { applications: [...data.applications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) };
    }
    if (method === 'POST') {
      const app = {
        id: localGenerateId(),
        title: String(body.title || '').trim(),
        company: String(body.company || '').trim(),
        dateApplied: String(body.dateApplied || '').trim(),
        status: String(body.status || 'Saved'),
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map((s) => s.trim()).filter(Boolean) : []),
        notes: String(body.notes || '').trim(),
        archived: !!body.archived,
        createdAt: new Date().toISOString()
      };
      data.applications.push(app);
      saveLocalData(data);
      return { application: app };
    }
    if (method === 'PUT') {
      const id = body.id;
      if (!id) throw new Error('Missing id');
      const idx = data.applications.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Not found');
      const updated = Object.assign({}, data.applications[idx], body);
      data.applications[idx] = updated;
      saveLocalData(data);
      return { application: updated };
    }
    if (method === 'DELETE') {
      const id = body.id || (options.query && options.query.id);
      if (!id) throw new Error('Missing id');
      data.applications = data.applications.filter((a) => a.id !== id);
      saveLocalData(data);
      return { ok: true };
    }
  }

  if (path === '/api/recruiters') {
    if (method === 'GET') {
      return { recruiters: [...data.recruiters].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) };
    }
    if (method === 'POST') {
      const now = new Date().toISOString();
      const recruiter = {
        id: localGenerateId(),
        name: String(body.name || '').trim(),
        company: String(body.company || '').trim(),
        email: String(body.email || '').trim(),
        phone: String(body.phone || '').trim(),
        notes: String(body.notes || '').trim(),
        lastContact: body.lastContact || now,
        interactions: Number(body.interactions || 0),
        createdAt: now
      };
      if (!recruiter.name || !recruiter.email) {
        throw new Error('Name and email are required');
      }
      data.recruiters.push(recruiter);
      saveLocalData(data);
      return { recruiter };
    }
    if (method === 'DELETE') {
      const id = body.id || (options.query && options.query.id);
      if (!id) throw new Error('ID required');
      data.recruiters = data.recruiters.filter((r) => r.id !== id);
      saveLocalData(data);
      return { ok: true };
    }
  }

  if (path === '/api/docs') {
    if (method === 'GET') {
      return { documents: [...data.documents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) };
    }
    if (method === 'POST') {
      const now = new Date().toISOString();
      const doc = {
        id: localGenerateId(),
        name: String(body.name || 'document').trim(),
        mimeType: String(body.mimeType || 'application/octet-stream'),
        contentBase64: String(body.contentBase64 || ''),
        createdAt: now
      };
      data.documents.push(doc);
      saveLocalData(data);
      return { document: doc };
    }
    if (method === 'DELETE') {
      const id = body.id;
      if (!id) throw new Error('ID required');
      data.documents = data.documents.filter((d) => d.id !== id);
      saveLocalData(data);
      return { ok: true };
    }
  }

  if (path === '/api/cv-templates') {
    if (method === 'GET') {
      return { templates: data.templates };
    }
    if (method === 'POST') {
      const profile = body.profile || {};
      const html = `
        <div class="cv-preview-template">
          <h2>${escapeHtml(profile.name || 'Your Name')}</h2>
          <p>${escapeHtml(profile.summary || 'Profile summary here.')}</p>
          <h3>Skills</h3>
          <ul>${(profile.skills || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
      `;
      return { html };
    }
  }

  if (path === '/api/ats-scan') {
    const suggestedSkills = ['communication', 'teamwork', 'leadership', 'problem-solving', 'adaptability'];
    const score = Math.min(100, Math.max(40, Math.floor(Math.random() * 30) + 55));
    return { score, suggestedSkills };
  }

  if (path === '/api/humanize-cv') {
    const original = body.cvText || '';
    const after = original.replace(/\b(responsible for|worked on)\b/gi, 'led');
    return {
      score: 75,
      genericPhrases: ['Responsible for', 'Worked on', 'Assisted with'],
      suggestions: ['Use action verbs', 'Quantify achievements', 'Focus on outcomes'],
      before: original,
      after: after || original
    };
  }

  if (path === '/api/interview-prep') {
    if (method === 'GET') {
      return { tips: [
        { title: 'Be specific', content: 'Use examples that show what you accomplished.' },
        { title: 'Practice STAR', content: 'Describe Situation, Task, Action, and Result.' }
      ] };
    }
    if (method === 'POST') {
      return { question: { question: 'Tell me about a time you solved a difficult problem at work.' } };
    }
  }

  if (path === '/api/export-data' && method === 'POST') {
    return {
      content: JSON.stringify(data, null, 2),
      mimeType: 'application/json',
      filename: `tracker-export-${Date.now()}.json`
    };
  }

  throw new Error(`Offline fallback route not available: ${path}`);
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(path, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (err) {
    if (path.startsWith('/api/')) {
      console.warn('Using offline local-storage fallback for', path, err.message);
      return localApi(path, options);
    }
    throw err;
  }
}

function setAuthState(isLoggedIn) {
  document.body.classList.toggle('login-active', !isLoggedIn);
  authSection.classList.toggle('hidden', isLoggedIn);
  dashboardSection.classList.toggle('hidden', !isLoggedIn);
}

function formatDateForDisplay(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
}

function renderHistory(logs) {
  // Render rows safely using textContent to avoid injecting HTML
  historyBody.innerHTML = '';

  if (!logs || logs.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '4');
    cell.textContent = 'No logs yet. Add your first entry.';
    row.appendChild(cell);
    historyBody.appendChild(row);
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDateForDisplay(log.date);
    const appCell = document.createElement('td');
    appCell.textContent = String(log.applications);
    const recCell = document.createElement('td');
    recCell.textContent = String(log.recruiters);
    const phCell = document.createElement('td');
    phCell.textContent = String(log.projectHours);
    row.appendChild(dateCell);
    row.appendChild(appCell);
    row.appendChild(recCell);
    row.appendChild(phCell);
    historyBody.appendChild(row);
  });
}

function daysUntil(dateString) {
  const target = new Date(`${dateString}T00:00:00Z`).getTime();
  const now = Date.now();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function renderDeadlines() {
  deadlinesList.innerHTML = '';

  deadlines.forEach((item) => {
    const li = document.createElement('li');
    const remaining = daysUntil(item.date);
    const status = remaining >= 0 ? `${remaining} day(s) left` : `${Math.abs(remaining)} day(s) overdue`;
    li.textContent = `${item.name} (${formatDateForDisplay(item.date)}): ${status}`;
    deadlinesList.appendChild(li);
  });
}

async function loadLogs() {
  const data = await api('/api/logs', { method: 'GET' });
  renderHistory(data.logs || []);
}

// Applications feature
async function loadApplications() {
  try {
    const data = await api('/api/applications', { method: 'GET' });
    applications = data.applications || [];
    renderApplicationsList();
    renderKanban();
  } catch (err) {
    console.error('Could not load applications', err);
  }
}

function escapeHtml(text) {
  return String(text || '').replace(/[&"'<>]/g, function (m) {
    return ({'&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;"})[m];
  });
}

function renderApplicationsList() {
  if (!applicationsList) return;
  const q = appSearch && appSearch.value ? appSearch.value.trim().toLowerCase() : '';
  applicationsList.innerHTML = '';
  const filtered = applications.filter((a) => {
    if (a.archived) return false;
    if (!q) return true;
    return (a.title && a.title.toLowerCase().includes(q)) || (a.company && a.company.toLowerCase().includes(q)) || (a.tags && a.tags.join(',').toLowerCase().includes(q));
  });
  if (!filtered.length) {
    const p = document.createElement('p');
    p.textContent = 'No applications found.';
    applicationsList.appendChild(p);
    return;
  }

  filtered.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'app-item';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(a.title || '-')}</strong><div>${escapeHtml(a.company || '')} • ${a.dateApplied || ''}</div><div>${(a.tags||[]).join(', ')}</div>`;
    const actions = document.createElement('div');
    actions.className = 'app-actions';
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.dataset.action = 'edit';
    edit.dataset.id = a.id;
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'secondary';
    del.dataset.action = 'delete';
    del.dataset.id = a.id;
    const dup = document.createElement('button');
    dup.textContent = 'Duplicate';
    dup.dataset.action = 'duplicate';
    dup.dataset.id = a.id;
    const arch = document.createElement('button');
    arch.textContent = a.archived ? 'Unarchive' : 'Archive';
    arch.className = 'secondary';
    arch.dataset.action = 'archive';
    arch.dataset.id = a.id;
    actions.appendChild(edit);
    actions.appendChild(dup);
    actions.appendChild(arch);
    actions.appendChild(del);
    div.appendChild(left);
    div.appendChild(actions);
    applicationsList.appendChild(div);
  });
}

function renderKanban() {
  if (!kanbanBoard) return;
  const columns = kanbanBoard.querySelectorAll('.kanban-column');
  columns.forEach((col) => {
    const status = col.dataset.status;
    const bucket = col.querySelector('.kanban-items');
    bucket.innerHTML = '';
    const items = applications.filter((a) => (a.status || 'Saved') === status && !a.archived);
    items.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.dataset.id = a.id;
      card.textContent = `${a.title || a.company || 'Untitled'}`;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', a.id);
      });
      bucket.appendChild(card);
    });
  });
}

function initKanbanDrag() {
  const cols = document.querySelectorAll('.kanban-column');
  cols.forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    col.addEventListener('drop', async (e) => {
      const id = e.dataTransfer.getData('text/plain');
      const status = col.dataset.status;
      try {
        await api('/api/applications', { method: 'PUT', body: JSON.stringify({ id, status }) });
        await loadApplications();
      } catch (err) {
        console.error('Could not update application status', err);
      }
    });
  });
}

async function handleApplicationSubmit(event) {
  event.preventDefault();
  if (!applicationForm) return;
  const payload = {
    title: appTitle.value.trim(),
    company: appCompany.value.trim(),
    dateApplied: appDate.value,
    status: appStatus.value,
    tags: appTags.value.split(',').map(s => s.trim()).filter(Boolean),
    notes: appNotes.value.trim()
  };
  try {
    if (editingAppId) {
      payload.id = editingAppId;
      await api('/api/applications', { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/api/applications', { method: 'POST', body: JSON.stringify(payload) });
    }
    applicationForm.reset();
    editingAppId = null;
    await loadApplications();
  } catch (err) {
    console.error('Application save failed', err);
  }
}

function fillApplicationForm(app) {
  editingAppId = app.id;
  appTitle.value = app.title || '';
  appCompany.value = app.company || '';
  appDate.value = app.dateApplied || '';
  appStatus.value = app.status || 'Saved';
  appTags.value = (app.tags || []).join(', ');
  appNotes.value = app.notes || '';
}

async function handleApplicationAction(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;
  if (action === 'edit') {
    const app = applications.find(a => a.id === id);
    if (app) fillApplicationForm(app);
    return;
  }
  if (action === 'delete') {
    if (!confirm('Delete this application?')) return;
    await api('/api/applications', { method: 'DELETE', body: JSON.stringify({ id }) });
    await loadApplications();
    return;
  }
  if (action === 'duplicate') {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    const copy = Object.assign({}, app);
    delete copy.id;
    copy.title = `${copy.title} (copy)`;
    await api('/api/applications', { method: 'POST', body: JSON.stringify(copy) });
    await loadApplications();
    return;
  }
  if (action === 'archive') {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    await api('/api/applications', { method: 'PUT', body: JSON.stringify({ id, archived: !app.archived }) });
    await loadApplications();
    return;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  loginMessage.textContent = '';

  const formData = new FormData(loginForm);
  const password = String(formData.get('password') || '');

  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });

    setToken(data.token);
    loginForm.reset();
    setAuthState(true);
    await loadLogs();
    await loadApplications();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
}

async function handleLogSubmit(event) {
  event.preventDefault();
  logMessage.textContent = '';

  const formData = new FormData(logForm);
  const payload = {
    date: formData.get('date'),
    applications: Number(formData.get('applications')),
    recruiters: Number(formData.get('recruiters')),
    projectHours: Number(formData.get('projectHours'))
  };

  try {
    await api('/api/logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    logMessage.style.color = '#0f766e';
    logMessage.textContent = 'Log saved';
    logForm.reset();
    dateInput.valueAsDate = new Date();
    await loadLogs();
  } catch (error) {
    logMessage.style.color = '#9a3412';
    logMessage.textContent = error.message;
  }
}

async function handleLogout() {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    // Always clear client auth even if request fails.
  }
  clearToken();
  setAuthState(false);
}

async function init() {
  initTheme();
  renderDeadlines();
  dateInput.valueAsDate = new Date();

  loginForm.addEventListener('submit', handleLogin);
  logForm.addEventListener('submit', handleLogSubmit);
  logoutBtn.addEventListener('click', handleLogout);

  if (applicationForm) applicationForm.addEventListener('submit', handleApplicationSubmit);
  if (applicationsList) applicationsList.addEventListener('click', handleApplicationAction);
  if (appSearch) appSearch.addEventListener('input', renderApplicationsList);
  if (appCancel) appCancel.addEventListener('click', (e) => { e.preventDefault(); applicationForm.reset(); editingAppId = null; });
  if (kanbanToggle) kanbanToggle.addEventListener('click', () => { kanbanBoard.classList.toggle('hidden'); initKanbanDrag(); });
  if (cvUpload) cvUpload.addEventListener('change', handleUploadFile);
  if (cvRefresh) cvRefresh.addEventListener('click', refreshDocs);
  if (generateCvBtn) generateCvBtn.addEventListener('click', handleGenerateCv);
  if (runAtsBtn) runAtsBtn.addEventListener('click', handleRunAts);
  if (humanizeCvBtn) humanizeCvBtn.addEventListener('click', handleHumanizeCv);

  // Phase 8 listeners
  if (renderTemplateBtn) renderTemplateBtn.addEventListener('click', handleRenderTemplate);
  if (exportCvBtn) exportCvBtn.addEventListener('click', handleExportCv);

  // Phase 9 listeners
  if (getQuestionBtn) getQuestionBtn.addEventListener('click', handleGetQuestion);
  if (showTipsBtn) showTipsBtn.addEventListener('click', handleShowTips);

  // Phase 10 listeners
  if (recruiterForm) recruiterForm.addEventListener('submit', handleRecruiterSubmit);

  // Phase 11 listeners
  if (loadAnalyticsBtn) loadAnalyticsBtn.addEventListener('click', handleLoadAnalytics);
  if (exportDataBtn) exportDataBtn.addEventListener('click', handleExportData);

  await populateCvDocs();
  await loadCvTemplates();

  const token = getToken();
  if (!token) {
    setAuthState(false);
    return;
  }

  try {
    setAuthState(true);
    await loadLogs();
    await loadApplications();
    await loadRecruiters();
  } catch {
    clearToken();
    setAuthState(false);
  }

  initKanbanDrag();
}

init();
