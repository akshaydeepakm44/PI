import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('\n=============================================================================');
console.log('🚀 Starting HI IN Property Intelligence Platform (LOCAL & NETWORK MODE)');
console.log('=============================================================================\n');

const childProcesses = [];
let backendSpawned = false;
let frontendSpawned = false;
let isShuttingDown = false;

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, 'SIGKILL');
    }
  } catch (e) {
    // Process already exited
  }
}

function cleanup() {
  isShuttingDown = true;
  console.log('\n🛑 Shutting down HI IN services...');
  try {
    const liveFile = path.join(ROOT_DIR, 'current-live-url.txt');
    if (fs.existsSync(liveFile)) fs.unlinkSync(liveFile);
    const hiddenLiveFile = path.join(ROOT_DIR, '.live-url');
    if (fs.existsSync(hiddenLiveFile)) fs.unlinkSync(hiddenLiveFile);
  } catch (e) {
    // Ignore cleanup error
  }
  for (const proc of childProcesses) {
    killProcess(proc);
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  for (const proc of childProcesses) {
    killProcess(proc);
  }
});

function isPortActive(port, testPath = '/') {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: testPath,
      method: 'GET',
      timeout: 1200,
    }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForPort(port, testPath = '/', maxTries = 40, interval = 700) {
  for (let i = 0; i < maxTries; i++) {
    if (await isPortActive(port, testPath)) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}

function getLanIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {}
  return '127.0.0.1';
}

function displayBanner() {
  const lanIp = getLanIp();
  const localUrl = 'http://localhost:5173';
  const networkUrl = `http://${lanIp}:5173`;

  try {
    fs.writeFileSync(path.join(ROOT_DIR, 'current-live-url.txt'), localUrl + '\n', 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, '.live-url'), localUrl + '\n', 'utf8');
  } catch (e) {}

  console.log('\n=============================================================================');
  console.log('🎉  HI IN PROPERTY INTELLIGENCE PLATFORM IS RUNNING!');
  console.log('=============================================================================\n');
  console.log('💻  LOCAL ACCESS (ON THIS COMPUTER):');
  console.log(`    👉  \x1b[1m\x1b[32m${localUrl}\x1b[0m\n`);
  console.log('🏢  NETWORK / SAME WI-FI ACCESS (PHONE, TABLET, COLLEAGUES):');
  console.log(`    👉  \x1b[1m\x1b[36m${networkUrl}\x1b[0m\n`);
  console.log('⚙️   SERVICES:');
  console.log('    • Frontend (Vite):   http://localhost:5173');
  console.log('    • Backend (FastAPI): http://localhost:8000');
  console.log('    • API Documentation: http://localhost:8000/docs');
  console.log('    • Health Check:      http://localhost:8000/api/health\n');
  console.log('👥  PRE-CONFIGURED DEMO ACCOUNTS (PASSWORD FOR ALL: demopass123):');
  console.log('    1. Buyer:             buyer@hi-in.demo');
  console.log('    2. Seller / Builder:  seller@hi-in.demo');
  console.log('    3. Admin:             admin@hi-in.demo\n');
  console.log('✨  FEATURES READY TO TEST:');
  console.log('    • Interactive Floating AI Assistant (bottom-right on every page)');
  console.log('    • Property Due-Diligence Assistant on property detail pages');
  console.log('    • Map-First Interactive Property Directory');
  console.log('    • Real-Time Location Intelligence (OSM, Air Quality, Drive Times)\n');
  console.log('💡  Press Ctrl + C anytime in this terminal to stop the servers.');
  console.log('=============================================================================\n');
}

async function main() {
  // Step 1: Check if Backend API (port 8000) is running
  const backendAlreadyRunning = await isPortActive(8000, '/api/health');
  if (backendAlreadyRunning) {
    console.log('⚡ Backend API already active on http://127.0.0.1:8000');
  } else {
    console.log('⏳ Starting FastAPI Backend on http://127.0.0.1:8000...');
    const backendProc = spawn(
      'python',
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--app-dir', 'backend'],
      {
        cwd: ROOT_DIR,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
    childProcesses.push(backendProc);
    backendSpawned = true;

    backendProc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line && process.env.DEBUG) console.log(`   [backend] ${line}`);
    });
    backendProc.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line && process.env.DEBUG) console.log(`   [backend] ${line}`);
    });
  }

  // Step 2: Check if Vite Frontend (port 5173) is running
  const frontendAlreadyRunning = await isPortActive(5173, '/');
  if (frontendAlreadyRunning) {
    console.log('⚡ Frontend already active on http://127.0.0.1:5173');
  } else {
    console.log('⏳ Starting Vite React Frontend on http://127.0.0.1:5173...');
    const frontendProc = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['--prefix', 'frontend', 'run', 'dev'],
      {
        cwd: ROOT_DIR,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
    childProcesses.push(frontendProc);
    frontendSpawned = true;

    frontendProc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line && process.env.DEBUG) console.log(`   [frontend] ${line}`);
    });
    frontendProc.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line && process.env.DEBUG) console.log(`   [frontend] ${line}`);
    });
  }

  // Wait for both to be fully responsive
  console.log('⏳ Verifying application servers...');
  const backendReady = await waitForPort(8000, '/api/health', 40, 800);
  const frontendReady = await waitForPort(5173, '/', 40, 800);

  if (!backendReady) {
    console.error('❌ Failed to connect to FastAPI backend on port 8000.');
  }
  if (!frontendReady) {
    console.error('❌ Failed to connect to Vite frontend on port 5173.');
  }

  if (!backendReady || !frontendReady) {
    cleanup();
    return;
  }

  displayBanner();
}

main().catch((err) => {
  console.error('Fatal launcher error:', err);
  cleanup();
});
