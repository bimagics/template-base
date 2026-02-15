import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import aiRouter from './routes/ai';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 8080;

// --- Security Best Practices ---
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use((_, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: "1mb" }));

// Serve static files for the chat frontend
app.use(express.static(path.join(process.cwd(), 'public')));

// API routes
app.use('/api', aiRouter);

// Original health endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is healthy.' });
});

// Lightweight health check for Docker/Cloud Run
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

app.listen(port, () => {
  console.log(`[Server]: Running at http://localhost:${port}`);
});
