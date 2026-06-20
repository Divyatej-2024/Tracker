const fs = require('fs');
const path = require('path');

module.exports = function storageTest() {
  const storage = require('../api/_lib/storage');
  const logsPath = storage._internal.LOGS_FILE;
  const backupPath = path.join(__dirname, '_logs_backup.json');

  // Backup existing file if present
  try {
    if (fs.existsSync(logsPath)) {
      fs.copyFileSync(logsPath, backupPath);
    }
  } catch (e) {
    // ignore
  }

  // Ensure a clean state
  fs.writeFileSync(logsPath, '[]', 'utf8');

  return storage.addLog({ date: '2026-01-01', applications: 1, recruiters: 0, projectHours: 2 })
    .then(() => storage.getLogs())
    .then((logs) => {
      if (!Array.isArray(logs)) throw new Error('getLogs did not return an array');
      if (!logs.length) throw new Error('No logs found after addLog');
      const l = logs.find((x) => x.date === '2026-01-01');
      if (!l) throw new Error('Added log not found');
    })
    .finally(() => {
      // restore backup
      try {
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, logsPath);
          fs.unlinkSync(backupPath);
        }
      } catch (e) {
        // ignore
      }
    });
};
