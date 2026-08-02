import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from dist/public
app.use(express.static(join(__dirname, '../dist/public')));

// Fallback to index-navi.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/public/index-navi.html'));
});

export default app;
