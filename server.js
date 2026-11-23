import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMemoryMiddleware } from './server/memory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// past.dev memory proxy. The API key stays on the server; the browser calls
// these same-origin routes. See server/memory.js for the request contract.
app.use(createMemoryMiddleware());

app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      }
    },
  })
);

// Express 5 no longer accepts the bare '*' wildcard path.
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Citylit production server listening on http://${HOST}:${PORT}`);
});
