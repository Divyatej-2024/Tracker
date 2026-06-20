const path = require('path');
const fs = require('fs');

console.log('Running tests...');

const testsDir = path.join(__dirname);
const files = fs.readdirSync(testsDir).filter((f) => f.endsWith('.test.js'));
let failed = 0;

files.forEach((file) => {
  try {
    const mod = require(path.join(testsDir, file));
    if (typeof mod === 'function') mod();
    console.log(`✓ ${file}`);
  } catch (err) {
    failed += 1;
    console.error(`✗ ${file}`);
    console.error(err && err.stack ? err.stack : err);
  }
});

if (failed) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}

console.log('All tests passed');
