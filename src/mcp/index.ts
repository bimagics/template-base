// src/mcp/index.ts
// Built-in MCP Server for the individual project.
// Exposes Cloud Run logs, Firestore, and BigQuery tools directly from the project's own GCP environment.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Express, Request, Response } from 'express';
import { registerTools } from './tools';

// Simple API Key authentication for the MCP endpoints
const SECURE_API_KEY = process.env.MCP_API_KEY;

function requireMcpAuth(req: Request, res: Response, next: Function) {
    if (!SECURE_API_KEY) {
        return res.status(503).json({ error: 'MCP server is disabled. MCP_API_KEY is not set in the environment.' });
    }
    const providedKey = req.headers['x-api-key'] || req.query.key;
    if (providedKey !== SECURE_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    next();
}

/**
 * Creates and configures the MCP server, then mounts it on the Express app.
 */
export function mountMcpServer(app: Express): void {
    const server = new McpServer({
        name: 'project-local-mcp',
        version: '1.0.0',
    });

    // Register all tools
    registerTools(server);

    // Track active transports by session
    const transports: Record<string, SSEServerTransport> = {};
    const authenticatedSessions = new Set<string>();

    app.get('/api/mcp/sse', requireMcpAuth, async (req: Request, res: Response) => {
        console.log(`[MCP] New connection from ${req.ip}`);

        const transport = new SSEServerTransport('/api/mcp/messages', res);
        transports[transport.sessionId] = transport;
        authenticatedSessions.add(transport.sessionId);

        res.on('close', () => {
            console.log(`[MCP] Connection closed for session ${transport.sessionId}`);
            delete transports[transport.sessionId];
            authenticatedSessions.delete(transport.sessionId);
        });

        await server.connect(transport);
    });

    app.post('/api/mcp/messages', async (req: Request, res: Response) => {
        const sessionId = req.query.sessionId as string;

        if (!authenticatedSessions.has(sessionId)) {
            return res.status(401).json({ error: 'Unauthorized. Connect to /api/mcp/sse with a valid key first.' });
        }

        const transport = transports[sessionId];
        if (!transport) {
            return res.status(400).json({ error: 'Unknown session. Connect to /api/mcp/sse first.' });
        }

        await transport.handlePostMessage(req, res);
    });

    console.log('[MCP] Local MCP Server mounted on /api/mcp/sse');
}
