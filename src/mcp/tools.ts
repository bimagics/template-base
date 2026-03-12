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

    server.tool(
        'get_service_logs',
        'Query Cloud Run service-specific logs for THIS project. Filters to only Cloud Run revision logs.',
        {
            severity: z.string().optional().describe('Minimum severity level: DEFAULT, DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY (default: INFO)'),
            limit: z.string().optional().describe('Max entries to return (default: 30, max: 100)'),
        },
        async ({ severity, limit }) => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };

            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const logging = google.logging({ version: 'v2', auth });
                const pageSize = Math.min(parseInt(limit || '30', 10) || 30, 100);
                const sev = severity || 'INFO';
                const serviceName = process.env.K_SERVICE || `${GCP_PROJECT_ID}-service`;

                const res = await logging.entries.list({
                    requestBody: {
                        resourceNames: [`projects/${GCP_PROJECT_ID}`],
                        filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${serviceName}" AND severity>=${sev}`,
                        orderBy: 'timestamp desc',
                        pageSize,
                    },
                });

                const entries = (res.data.entries || []).map((e: any) => ({
                    timestamp: e.timestamp,
                    severity: e.severity,
                    message: e.textPayload || e.jsonPayload?.message || JSON.stringify(e.jsonPayload || {}).substring(0, 500),
                    labels: e.labels,
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

    server.tool(
        'write_firestore_document',
        'Create or update a document in a Firestore collection in THIS project. Fields should be a JSON object with Firestore-typed values.',
        {
            collection: z.string().describe('Collection name to write to'),
            documentId: z.string().optional().describe('Document ID. If omitted, Firestore auto-generates one.'),
            fields: z.string().describe('JSON object of fields to set. Use Firestore value format, e.g. {"name": {"stringValue": "hello"}, "count": {"integerValue": "42"}}'),
        },
        async ({ collection, documentId, fields }) => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };
            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const firestore = google.firestore({ version: 'v1', auth });
                const parent = `projects/${GCP_PROJECT_ID}/databases/(default)/documents`;
                let parsedFields: any;
                try {
                    parsedFields = JSON.parse(fields);
                } catch {
                    return { content: [{ type: 'text' as const, text: 'Error: "fields" must be valid JSON in Firestore value format.' }], isError: true };
                }

                const res = await firestore.projects.databases.documents.createDocument({
                    parent,
                    collectionId: collection,
                    documentId: documentId || undefined,
                    requestBody: { fields: parsedFields },
                });

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: true,
                            documentId: res.data.name?.split('/').pop(),
                            createTime: res.data.createTime,
                            updateTime: res.data.updateTime,
                        }, null, 2)
                    }]
                };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    server.tool(
        'delete_firestore_document',
        'Delete a document from a Firestore collection in THIS project.',
        {
            collection: z.string().describe('Collection name'),
            documentId: z.string().describe('Document ID to delete'),
        },
        async ({ collection, documentId }) => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };
            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const firestore = google.firestore({ version: 'v1', auth });
                const docPath = `projects/${GCP_PROJECT_ID}/databases/(default)/documents/${collection}/${documentId}`;

                await firestore.projects.databases.documents.delete({ name: docPath });

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ success: true, deleted: `${collection}/${documentId}` }, null, 2)
                    }]
                };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // ─── Cloud Run ──────────────────────────────────────────────

    server.tool(
        'get_cloud_run_env',
        'Read the current environment variables configured on THIS Cloud Run service.',
        {},
        async () => {
            if (!GCP_PROJECT_ID) return { content: [{ type: 'text' as const, text: 'GCP Project ID not found.' }], isError: true };
            try {
                const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
                const run = google.run({ version: 'v2', auth });
                const region = process.env.GCP_REGION || 'europe-west1';
                const serviceName = process.env.K_SERVICE || `${GCP_PROJECT_ID}-service`;

                const res = await run.projects.locations.services.get({
                    name: `projects/${GCP_PROJECT_ID}/locations/${region}/services/${serviceName}`,
                });

                const containers = res.data.template?.containers || [];
                const envVars = containers.flatMap((c: any) =>
                    (c.env || []).map((e: any) => ({
                        name: e.name,
                        // Mask sensitive values
                        value: (e.name || '').match(/KEY|SECRET|TOKEN|PASSWORD/i)
                            ? '***REDACTED***'
                            : e.value || '(from secret ref)',
                    }))
                );

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            service: serviceName,
                            region,
                            envVars,
                        }, null, 2)
                    }]
                };
            } catch (e: any) {
                return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
            }
        }
    );
}
