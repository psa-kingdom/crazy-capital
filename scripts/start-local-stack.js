const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function checkPort(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get({ host: 'localhost', port, path, timeout: 2000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForPorts() {
  console.log('Waiting for all 3 services (:4000, :3000, :3001) to become healthy...');
  for (let i = 0; i < 45; i++) {
    const [apiOk, webOk, adminOk] = await Promise.all([
      checkPort(4000, '/api/v1/health'),
      checkPort(3000, '/'),
      checkPort(3001, '/'),
    ]);
    if (apiOk && webOk && adminOk) {
      console.log('====================================================');
      console.log('✅ ALL SERVICES HEALTHY AND RESPONDING:');
      console.log(' - API:   http://localhost:4000/api/v1/health (HTTP 200)');
      console.log(' - Web:   http://localhost:3000 (HTTP 200)');
      console.log(' - Admin: http://localhost:3001 (HTTP 200)');
      console.log('====================================================');
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Timed out waiting for services to become healthy.');
}

console.log('Starting Crazy Capital Local Stack...');

// 1. API on port 4000 (dist main)
const apiProcess = spawn('node', ['dist/apps/api/src/main.js'], {
  cwd: path.join(rootDir, 'apps', 'api'),
  stdio: 'inherit',
  shell: true,
});

// 2. Web on port 3000 (dev)
const webProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  cwd: path.join(rootDir, 'apps', 'web'),
  stdio: 'inherit',
  shell: true,
});

// 3. Admin on port 3001 (dev)
const adminProcess = spawn('npx', ['next', 'dev', '--port', '3001'], {
  cwd: path.join(rootDir, 'apps', 'admin'),
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  apiProcess.kill();
  webProcess.kill();
  adminProcess.kill();
  process.exit();
});

waitForPorts()
  .then(() => {
    console.log('🚀 Stack is fully live and ready for browser QA!');
  })
  .catch((err) => {
    console.error(err);
  });
