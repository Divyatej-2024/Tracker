const path = require('path');

function storageFactory() {
  const adapterName = (process.env.STORAGE_ADAPTER || 'file').toLowerCase();
  const allowed = ['file', 'memory'];

  if (!allowed.includes(adapterName)) {
    throw new Error(`Unknown STORAGE_ADAPTER: ${adapterName}`);
  }

  const adapterPath = path.join(__dirname, 'storage.adapters', `${adapterName}.js`);
  return require(adapterPath);
}

module.exports = storageFactory();
