// SPA server for build/ with history fallback. Usage: node serve-app.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, 'build'), PORT = process.argv[2] || 8138;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.json': 'application/json', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream', '.onnx': 'application/octet-stream', '.task': 'application/octet-stream' };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) file = path.join(ROOT, 'index.html');
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    fs.readFile(file, (e, data) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes' });
      res.end(data);
    });
  });
}).listen(PORT, '127.0.0.1', () => console.log('app on', PORT));
