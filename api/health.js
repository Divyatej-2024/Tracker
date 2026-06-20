const { json } = require('./_lib/auth');
const fs = require('fs');
const path = require('path');

const startTime = Date.now();

function getHealthStatus() {
  const uptime = Date.now() - startTime;
  const memUsage = process.memoryUsage();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime / 1000),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    }
  };
}

function getStorageSize() {
  const DATA_DIR = path.join(__dirname, '..', '..', 'data');
  let totalSize = 0;

  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      });
    }
  } catch (err) {
    // ignore
  }

  return {
    storageSize: Math.round(totalSize / 1024),
    unit: 'KB'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const health = getHealthStatus();
  const storage = getStorageSize();

  return json(res, 200, {
    ...health,
    storage,
    performance: {
      cacheStrategy: 'in-memory with file persistence',
      rateLimiting: 'enabled',
      compression: 'enabled on response'
    }
  });
};
