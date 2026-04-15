const logs = [];

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
  return [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function addLog(input) {
  const log = normalizeLog(input);
  logs.push(log);
  return log;
}

module.exports = {
  getLogs,
  addLog
};
