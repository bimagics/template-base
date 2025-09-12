// Path: template-base/src/services/vertex.ts
import { VertexAI, Part } from '@google-cloud/vertexai';

const project = process.env.GCP_PROJECT_ID || '';
const location = process.env.VERTEX_LOCATION || 'us-central1';
const model = process.env.VERTEX_MODEL || 'gemini-1.5-flash-001';

if (!project) {
  console.warn('[vertex] GCP_PROJECT_ID is not set; Vertex client may fail if running outside GCP.');
}

const vertex_ai = new VertexAI({ project, location });
const generativeModel = vertex_ai.getGenerativeModel({ model });

export async function streamChat(
  message: string,
  history: { role: string; parts: Part[] }[],
  onChunk: (chunk: string) => void
) {
  const chat = generativeModel.startChat({ history });
  const result = await chat.sendMessageStream(message);

  for await (const item of result.stream) {
    const text = item?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (text) onChunk(text);
  }
}
