#!/usr/bin/env node
// md-viewer: a local web server that shows Markdown files with Mermaid diagrams rendered.
//
//   node serve.js                   run the server in the foreground
//   node serve.js --ensure [path]   start the server in the background when it is not running,
//                                   then print the URL that opens path (a .md file or a folder)
//   node serve.js --stop            stop the server
//
// The server listens on 127.0.0.1 only and answers only requests addressed to localhost.
// It reads .md files and images, and lists folders; it never writes to disk.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const NAME = 'md-viewer';
const VERSION = require('../.claude-plugin/plugin.json').version;
const PORT = Number(process.env.MD_VIEWER_PORT) || 4317;
const HOST = '127.0.0.1';
const BASE_URL = `http://localhost:${PORT}`;
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
const SKIPPED_DIRS = new Set(['node_modules', '.git']);
const IMAGE_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const isMarkdown = (file) => path.extname(file).toLowerCase() === '.md';

function send(res, status, type, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, 'application/json; charset=utf-8', JSON.stringify(body));
}

function listFolder(dir) {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') && !SKIPPED_DIRS.has(entry.name))
    .filter((entry) => entry.isDirectory() || (entry.isFile() && isMarkdown(entry.name)))
    .map((entry) => ({ name: entry.name, path: path.join(dir, entry.name), type: entry.isDirectory() ? 'dir' : 'md' }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  const parent = path.dirname(dir);
  return { dir, parent: parent === dir ? null : parent, entries };
}

function handle(req, res, server) {
  // Rejects requests that reach this port under another name (DNS rebinding).
  if (!ALLOWED_HOSTS.has(req.headers.host)) return send(res, 403, 'text/plain', 'Forbidden host');

  const url = new URL(req.url, BASE_URL);
  const param = (name) => (url.searchParams.get(name) ? path.resolve(url.searchParams.get(name)) : null);

  switch (url.pathname) {
    case '/':
      return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(__dirname, 'viewer.html')));

    case '/api/health':
      return sendJson(res, 200, { name: NAME, version: VERSION });

    case '/api/doc':
    case '/api/mtime': {
      const file = param('file');
      if (!file || !isMarkdown(file)) return sendJson(res, 400, { error: 'Only .md files can be opened.' });
      if (!fs.existsSync(file)) return sendJson(res, 404, { error: `File not found: ${file}` });
      const mtimeMs = fs.statSync(file).mtimeMs;
      if (url.pathname === '/api/mtime') return sendJson(res, 200, { mtimeMs });
      return sendJson(res, 200, { path: file, mtimeMs, content: fs.readFileSync(file, 'utf8') });
    }

    case '/api/list': {
      const dir = param('dir');
      if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return sendJson(res, 404, { error: `Folder not found: ${dir}` });
      }
      return sendJson(res, 200, listFolder(dir));
    }

    case '/raw': {
      const file = param('file');
      const type = file && IMAGE_TYPES[path.extname(file).toLowerCase()];
      if (!type || !fs.existsSync(file)) return send(res, 404, 'text/plain', 'Not found');
      // An SVG opened on its own runs in a sandbox, without scripts.
      return send(res, 200, type, fs.readFileSync(file), {
        'Content-Security-Policy': 'sandbox',
        'X-Content-Type-Options': 'nosniff',
      });
    }

    case '/api/stop':
      // The custom header makes a browser on another site ask first (preflight), which this server never allows.
      if (req.method !== 'POST' || req.headers['x-md-viewer'] !== 'stop') return send(res, 405, 'text/plain', 'Not allowed');
      // Exits once the answer is sent: waiting for server.close() would wait for the open page's connection too.
      res.on('finish', () => process.exit(0));
      return sendJson(res, 200, { stopped: true });

    default:
      return send(res, 404, 'text/plain', 'Not found');
  }
}

function runServer() {
  const server = http.createServer((req, res) => {
    try {
      handle(req, res, server);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });
  server.listen(PORT, HOST, () => console.log(`${NAME} ${VERSION} on ${BASE_URL}`));
}

// Returns the server's identity, { name: 'unknown' } for another program on the port, or null for a free port.
async function probe() {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1500) });
  } catch {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return { name: 'unknown' };
  }
}

async function waitFor(condition, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition(await probe())) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

// quiet: called by --ensure, whose only output is the URL.
async function stop(quiet = false) {
  const running = await probe();
  if (!running || running.name !== NAME) return quiet || console.log(`${NAME} is not running on port ${PORT}.`);
  await fetch(`${BASE_URL}/api/stop`, { method: 'POST', headers: { 'X-MD-Viewer': 'stop' } }).catch(() => {});
  if (!(await waitFor((identity) => identity === null))) fail(`${NAME} did not stop.`);
  if (!quiet) console.log(`${NAME} stopped.`);
}

function targetUrl(target) {
  const full = path.resolve(target || process.cwd());
  if (!fs.existsSync(full)) fail(`Not found: ${full}`);
  if (fs.statSync(full).isDirectory()) return `${BASE_URL}/?dir=${encodeURIComponent(full)}`;
  if (!isMarkdown(full)) fail(`Not a .md file: ${full}`);
  return `${BASE_URL}/?file=${encodeURIComponent(full)}`;
}

async function ensure(target) {
  const url = targetUrl(target);
  let running = await probe();

  if (running && running.name !== NAME) {
    fail(`Port ${PORT} is used by another program. Set the MD_VIEWER_PORT environment variable to a free port.`);
  }
  if (running && running.version !== VERSION) {
    await stop(true);
    running = null;
  }
  if (!running) {
    const child = spawn(process.execPath, [__filename], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    if (!(await waitFor((identity) => identity && identity.name === NAME))) fail(`${NAME} did not start on port ${PORT}.`);
  }
  console.log(url);
}

const [command, target] = process.argv.slice(2);
if (command === '--ensure') ensure(target);
else if (command === '--stop') stop();
else runServer();
