#!/usr/bin/env node

/**
 * Setup script for Cyber Job Tracker
 * Generates environment variables and creates .env.local file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function generateSecrets() {
  console.log('\n🔐 Cyber Job Tracker - Setup Helper\n');
  console.log('This script will help you generate environment variables.\n');

  // Get password from user
  const password = await question('Enter your app password (min 8 chars): ');
  
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  // Generate hash
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  // Generate random token secret
  const tokenSecret = crypto.randomBytes(32).toString('hex');

  // Create .env.local content
  const envContent = `# Generated environment variables for Cyber Job Tracker
# DO NOT COMMIT THIS FILE TO GIT

APP_PASSWORD_HASH=${hash}
TOKEN_SECRET=${tokenSecret}

# Optional: Storage adapter (file | memory)
# STORAGE_ADAPTER=file

# Optional: Environment mode
# NODE_ENV=development
`;

  // Write to .env.local
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\n⚠️  .env.local already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipped.');
      rl.close();
      return;
    }
  }

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment variables generated!\n');
  console.log('📁 File saved: .env.local\n');
  console.log('Your credentials:');
  console.log(`  Password Hash: ${hash}`);
  console.log(`  Token Secret:  ${tokenSecret}`);
  console.log('\n💡 Tips:');
  console.log('  1. Keep .env.local secure (it\'s in .gitignore)');
  console.log('  2. For production, set these in your Vercel dashboard:');
  console.log('     - APP_PASSWORD_HASH');
  console.log('     - TOKEN_SECRET');
  console.log('  3. Test locally: npm run dev\n');

  rl.close();
}

generateSecrets().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
