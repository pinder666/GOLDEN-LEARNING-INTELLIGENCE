// Minimal static server with Range support (needed for <video>). Usage: node serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = process.argv[2] || 8137;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
  '.json': 'application/json', '.woff2': 'font/woff2',
  '.mjs': 'text/javascript', '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream', '.task': 'application/octet-stream', '.onnx': 'application/octet-stream' };
http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url, 'range:', req.headers.range || '-', 'ua:', (req.headers['user-agent'] || '-').slice(0, 40));
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/lab-key') { // localhost-only lab helper: key read at runtime, never written into any page
    try {
      const m = /REACT_APP_ANTHROPIC_API_KEY=(.+)/.exec(fs.readFileSync(path.join(ROOT, '.env'), 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ key: m ? m[1].trim() : null }));
    } catch (e) { res.writeHead(500); return res.end('{}'); }
  }
  let file = path.normalize(path.join(ROOT, urlPath === '/' ? 'landing-page.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? parseInt(range[1]) : 0;
      const end = range[2] ? parseInt(range[2]) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
