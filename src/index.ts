import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Welcome to your new WIZBI Project!' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
