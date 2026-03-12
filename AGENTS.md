# {{PROJECT_DISPLAY_NAME}} — AI Agent Guide

This file provides everything an AI agent (Claude Code, Cursor, Windsurf, or any MCP client) needs to work on this project.

## Project Overview

**{{PROJECT_DISPLAY_NAME}}** is a cloud-native web application built on the [WIZBI Platform](https://github.com/bimagics/wizbi-cp). It runs as a private Cloud Run service fronted by Firebase Hosting.

| Key | Value |
|-----|-------|
| **Project ID** | `{{PROJECT_ID}}` |
| **GCP Region** | `{{GCP_REGION}}` |
| **Production URL** | `https://{{PROJECT_ID}}.web.app` |
| **QA URL** | `https://{{PROJECT_ID}}-qa.web.app` |
| **GitHub Repo** | `{{GITHUB_REPO_URL}}` |

## Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **Hosting:** Firebase Hosting → Cloud Run (private, IAM-invoked)
- **Database:** Cloud Firestore
- **AI:** Vertex AI (Gemini) via `/api/chat`
- **CI/CD:** GitHub Actions with Workload Identity Federation (keyless)
- **MCP Server:** Built-in at `/api/mcp/sse` for agent access to GCP resources

## Project Layout

```
src/
├── index.ts              # Express app entry point
├── routes/
│   └── ai.ts             # /api/chat endpoint (Vertex AI streaming)
├── services/
│   └── vertex.ts         # Vertex AI integration
└── mcp/
    ├── index.ts           # MCP server mount + SSE transport + auth
    └── tools.ts           # MCP tools (Firestore, Logs, Cloud Run)
public/                    # Static frontend assets
.github/workflows/
    └── deploy.yml         # CI/CD pipeline (DO NOT MODIFY)
firebase.json              # Firebase Hosting config + rewrites
Dockerfile                 # Cloud Run container definition
```

## MCP Connection

This project includes a built-in MCP server accessible at:

```
https://{{PROJECT_ID}}-qa.web.app/api/mcp/sse?key=<MCP_API_KEY>
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_project_env` | Get GCP project ID, region, and Cloud Run service name |
| `query_logs` | Query Cloud Logging entries with severity filter |
| `list_firestore_collections` | List top-level Firestore collections |
| `query_firestore` | Read documents from a Firestore collection |
| `write_firestore_document` | Create or update a document in Firestore |
| `delete_firestore_document` | Delete a document from Firestore |
| `get_cloud_run_env` | Read current Cloud Run service environment variables |
| `get_service_logs` | Query Cloud Run service-specific logs with severity filter |

### MCP Config (`.mcp.json`)

The WIZBI Control Plane injects a ready-to-use `.mcp.json` with real API keys during project provisioning. If you need to recreate it locally, run `./setup-local.sh` — it auto-fetches keys from the deployed Cloud Run service via `gcloud`.

## Auth System

The MCP server uses API key authentication:
- Key is passed via `?key=` query parameter or `x-api-key` header
- Key is set via `MCP_API_KEY` environment variable on Cloud Run
- Key is auto-generated during provisioning and deployed via CI/CD

## Environment Variables

| Variable | Description | Where Set |
|----------|-------------|-----------|
| `GCP_PROJECT_ID` | GCP project ID | GitHub Secret → Cloud Run env |
| `GCP_REGION` | GCP region (e.g., `europe-west1`) | GitHub Secret → Cloud Run env |
| `VERTEX_LOCATION` | GCP region for Vertex AI | GitHub Secret → Cloud Run env |
| `MCP_API_KEY` | API key for MCP server auth | GitHub Secret → Cloud Run env |
| `CP_MCP_API_KEY` | API key for WIZBI CP MCP access | GitHub Secret → Cloud Run env |
| `PORT` | Server port (default: 8080) | Cloud Run auto-sets |
| `GOOGLE_CLOUD_PROJECT` | Auto-set by Cloud Run | Cloud Run runtime |
| `K_SERVICE` | Cloud Run service name | Cloud Run runtime |

## Build & Run Commands

```bash
# One-command local setup (auto-fetches secrets from Cloud Run)
./setup-local.sh

# Install dependencies
npm install

# Local development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

- **Push to `dev`** → auto-deploys to QA (`{{PROJECT_ID}}-qa.web.app`)
- **Push to `main`** → auto-deploys to Production (`{{PROJECT_ID}}.web.app`)
- **DO NOT** deploy manually or modify `.github/workflows/deploy.yml`

## Conventions

- Place HTTP routes under `src/routes/`
- Place shared business logic under `src/services/`
- Keep TypeScript strict mode enabled
- Do not modify `.github/workflows/deploy.yml` — it's managed by WIZBI
- Do not modify `firebase.json` hosting config unless you understand the rewrite rules
- Use small, focused commits with clear messages
- All GCP API calls inside the MCP server use Application Default Credentials (ADC)

## Getting Started (for AI Agents)

1. Run `./setup-local.sh` — creates `.env` and `.mcp.json` with real keys from Cloud Run
2. Connect your MCP client to the QA endpoint (keys are already configured)
3. Run `npm run dev` for local development
4. Push to `dev` branch to deploy to QA

### Secrets Flow (fully automatic)

```
WIZBI CP creates project
  → Generates PROJECT_MCP_API_KEY + CP_MCP_API_KEY
  → Injects real .mcp.json into repo (with actual keys)
  → Stores keys as GitHub Actions Secrets
  → CI/CD passes them to Cloud Run as env vars
  → setup-local.sh can re-fetch from Cloud Run via gcloud
```

No manual key configuration required.
