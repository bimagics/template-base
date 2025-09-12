// Path: template-base/src/routes/ai.ts
import { Router } from 'express';
import { streamChat } from '../services/vertex';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    await streamChat(message, history || [], (chunk) => {
      if (chunk) res.write(chunk);
    });

    res.end();
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.end();
  }
});

export default router;
