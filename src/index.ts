// --- REPLACE THE ENTIRE FILE CONTENT ---
// File: template-base/src/index.ts

import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

// --- Security Best Practices ---
// Trust proxy headers (e.g., from Cloud Run's frontend)
app.set("trust proxy", true);
// Hide that the app is running on Express
app.disable("x-powered-by");

// Add basic security headers to all responses
app.use((_, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "1mb" }));

// Original health endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Welcome to your new WIZBI Project!' });
});

// Lightweight health check for Docker/Cloud Run
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

app.listen(port, () => {
  console.log(`[WIZBI Project Template]: Server is running at http://localhost:${port}`);
});
