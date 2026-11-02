// Serves the page locally: npm start, then open http://localhost:4173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(import.meta.dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  if (path.startsWith('..') || !(path === '' || path === 'index.html' || path.startsWith('src'))) { res.writeHead(404).end(); return; }
  try {
    const file = join(root, path || 'index.html');
    res.writeHead(200, { 'content-type': types[extname(file)] || 'text/plain' }).end(await readFile(file));
  } catch { res.writeHead(404).end(); }
}).listen(4173, '127.0.0.1', () => console.log('http://localhost:4173'));
