const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const apiDir = path.join(__dirname, 'api');

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicDir));

app.use('/api/*', (req, res) => {
  const route = req.path.replace(/^\/api\//, '').replace(/\/$/, '');
  const moduleName = route || 'index';
  const modulePath = path.join(apiDir, `${moduleName}.js`);

  if (!fs.existsSync(modulePath)) {
    return res.status(404).json({ error: 'API route not found' });
  }

  try {
    const handler = require(modulePath);
    return handler(req, res);
  } catch (error) {
    console.error('API handler error', route, error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Tracker app running at http://localhost:${port}`);
});
