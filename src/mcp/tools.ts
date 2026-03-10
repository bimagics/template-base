// src/mcp/tools.ts
// MCP Tools for the local project environment.
// Since this runs INSIDE the Cloud Run container of the project, 
// Application Default Credentials (ADC) automatically authenticate all GCP requests.

import { google } from 'googleapis';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// We get the project ID automatically from the environment or GCP metadata
const GCP_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID;

export function registerTools(server: McpServer): void {

    if (!GCP_PROJECT_ID) {
        console.warn('[MCP] GCP Project ID not found in environment variables. GCP tools may fail.');
    }

    server.tool(
        'get_project_env',
        'Get the GCP project ID and region this service is currently running in',
        {},
        async () => {
            return {
                content: [{
                    type: 'text' as const, text: JSON.stringify({
                        projectId: GCP_PROJECT_ID,
                        region: process.env.GCP_REGION || 'unknown',
                        service: process.env.K_SERVICE || 'unknown'
                    }, null, 2)
                }]
            };
        }
    );

    // ─── Cloud Logging ──────────────────────────────────────────

    server.tool(
        'query_logs',
        'Query Cloud Logging entries for THIS project. Filter by severity or custom filter.',
        {
            filter: z.string().optional().describe('Cloud Logging filter expression (e.g. severity>=ERROR)'),
            limit: z.string().optional().describe('Max entries to return (default: 20, max: 100)'),
        },
        async ({ filter, limit }) => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };

            try {
                // Uses Application Default Credentials (the Cloud Run Service Account)
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const logging = google.logging({ version: 'v2', auth });
                const pageSize = Math.min(parseInt(limit || '20', 10) || 20, 100);

                const res = await logging.entries.list({
                    requestBody: {
                        resourceNames: [`projects/${GCP_PROJECT_ID}`],
                        filter: filter || 'severity>=WARNING',
                        orderBy: 'timestamp desc',
                        pageSize,
                    },
                });

                const entries = (res.data.entries || []).map((e: any) => ({
                    timestamp: e.timestamp,
                    severity: e.severity,
                    logName: e.logName?.split('/').pop(),
                    message: e.textPayload || e.jsonPayload?.message || JSON.stringify(e.jsonPayload || {}).substring(0, 500),
                    resource: e.resource?.type,
                }));
                return { content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // ─── Firestore ──────────────────────────────────────────────

    server.tool(
        'list_firestore_collections',
        'List top-level Firestore collections in THIS project',
        {},
        async () => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };
            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const firestore = google.firestore({ version: 'v1', auth });
                const res = await firestore.projects.databases.documents.listCollectionIds({
                    parent: `projects/${GCP_PROJECT_ID}/databases/(default)/documents`,
                    requestBody: {},
                });
                return { content: [{ type: 'text' as const, text: JSON.stringify({ collections: res.data.collectionIds || [] }, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    server.tool(
        'query_firestore',
        'Read documents from a Firestore collection in THIS project. Defaults to 20 documents.',
        {
            collection: z.string().describe('Collection name to read from'),
            limit: z.string().optional().describe('Max documents to return (default: 20)'),
        },
        async ({ collection, limit }) => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };
            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const firestore = google.firestore({ version: 'v1', auth });
                const pageSize = Math.min(parseInt(limit || '20', 10) || 20, 50);
                const res = await firestore.projects.databases.documents.list({
                    parent: `projects/${GCP_PROJECT_ID}/databases/(default)/documents`,
                    collectionId: collection,
                    pageSize,
                });
                const docs = (res.data.documents || []).map((doc: any) => ({
                    id: doc.name?.split('/').pop(),
                    fields: doc.fields,
                    createTime: doc.createTime,
                    updateTime: doc.updateTime,
                }));
                return { content: [{ type: 'text' as const, text: JSON.stringify(docs, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );
}
