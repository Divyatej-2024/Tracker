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

const deadlines = [
  { name: 'Course End', date: '2026-05-16' },
  { name: 'Graduation', date: '2026-07-13' },
  { name: 'Visa Expiry', date: '2026-09-15' }
];

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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

  const response = await fetch(path, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function setAuthState(isLoggedIn) {
  authSection.classList.toggle('hidden', isLoggedIn);
  dashboardSection.classList.toggle('hidden', !isLoggedIn);
}

function formatDateForDisplay(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
}

function renderHistory(logs) {
  historyBody.innerHTML = '';

  if (!logs.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No logs yet. Add your first entry.</td>';
    historyBody.appendChild(row);
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateForDisplay(log.date)}</td>
      <td>${log.applications}</td>
      <td>${log.recruiters}</td>
      <td>${log.projectHours}</td>
    `;
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
  renderDeadlines();
  dateInput.valueAsDate = new Date();

  loginForm.addEventListener('submit', handleLogin);
  logForm.addEventListener('submit', handleLogSubmit);
  logoutBtn.addEventListener('click', handleLogout);

  const token = getToken();
  if (!token) {
    setAuthState(false);
    return;
  }

  try {
    setAuthState(true);
    await loadLogs();
  } catch {
    clearToken();
    setAuthState(false);
  }
}

init();
