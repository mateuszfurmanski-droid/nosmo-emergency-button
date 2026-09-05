import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || process.env.EMERGENCY_BUTTON_PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.css':'text/css; charset=utf-8', '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json; charset=utf-8',
};

function resolvePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolved = normalize(join(root, relative));
  return resolved.startsWith(root) ? resolved : null;
}

createServer((request, response) => {
  let filePath = resolvePath(request.url || '/');
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    if ((request.headers.accept || '').includes('text/html')) filePath = join(root, 'index.html');
    else {
      response.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); response.end('Not found'); return;
    }
  }
  response.writeHead(200, {
    'Content-Type':types[extname(filePath)] || 'application/octet-stream',
    'Cache-Control':filePath.endsWith('service-worker.js') ? 'no-cache' : 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Permissions-Policy':'geolocation=(self), microphone=(self)',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => process.stdout.write(`NOSMO Emergency Button: http://${host}:${port}\n`));
