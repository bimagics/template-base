# {{PROJECT_DISPLAY_NAME}} 🚀

**A production-ready, cloud-native web app powered by the [WIZBI Platform](https://github.com/bimagics/wizbi-cp).**

This repository contains a lightweight **Node.js/Express** backend running on a private **Google Cloud Run** service, fronted by **Firebase Hosting** as a secure gateway and CDN. It includes a pre-configured, streaming **`/api/chat`** endpoint connected to **Google Vertex AI (Gemini)**.

> **Philosophy:** 100% Cloud-Native · AI-Driven · Git-Only

---

## Quick Access

| Resource              | Production URL                                                                                     | QA URL                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Live Application** | [https://{{PROJECT_ID}}.web.app](https://{{PROJECT_ID}}.web.app)                                     | [https://{{PROJECT_ID}}-qa.web.app](https://{{PROJECT_ID}}-qa.web.app)                                     |
| **Cloud Run Service** | [View Service](https://console.cloud.google.com/run/detail/{{GCP_REGION}}/{{PROJECT_ID}}-service/revisions?project={{PROJECT_ID}}) | [View Service](https://console.cloud.google.com/run/detail/{{GCP_REGION}}/{{PROJECT_ID}}-service-qa/revisions?project={{PROJECT_ID}}) |
| **GitHub Repo** | [{{GITHUB_REPO_URL}}]({{GITHUB_REPO_URL}})                                                         |                                                                                                       |

---

## Table of Contents

* [1. Overview](#1-overview)
* [2. Template Placeholders](#2-template-placeholders)
* [3. Core Architecture & Features](#3-core-architecture--features)
* [4. Dev & Deployment Workflow (CI/CD)](#4-dev--deployment-workflow-cicd)
* [5. Working with AI Models (Agent-Oriented Development)](#5-working-with-ai-models-agent-oriented-development)
* [6. Built-in AI: `/api/chat` Endpoint](#6-built-in-ai-apichat-endpoint)
* [7. Key Files & Directories](#7-key-files--directories)
* [8. Project Vitals](#8-project-vitals)
* [9. Local Development](#9-local-development)
* [10. Important Notes](#10-important-notes)

---

## 1. Overview

**{{PROJECT_DISPLAY_NAME}}** is a generic, production-grade application foundation for cloud-native **web applications** (sites, backends, internal tools, and more). It ships with a pre-configured secure backend and a ready-to-use integration with **Google Vertex AI (Gemini)** so you can add generative AI features from day one — without wrestling with infrastructure.

This template is designed to be used with the **[WIZBI Control Plane](https://github.com/bimagics/wizbi-cp)** and embraces an **AI-first workflow**: development tasks are defined in Git, an operator prompts an AI assistant to read the repo and produce code changes, and a simple **git push** triggers automated deployments.

---

## 2. Template Placeholders

This repository is a **GitHub template**. When a new project is created from this template, the following placeholders are automatically replaced with project-specific values:

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `{{PROJECT_ID}}` | GCP Project ID | `my-awesome-app` |
| `{{PROJECT_DISPLAY_NAME}}` | Human-readable project name | `My Awesome App` |
| `{{GCP_REGION}}` | GCP Region for deployment | `europe-west1` |
| `{{GITHUB_REPO_URL}}` | Full GitHub repository URL | `https://github.com/org/repo` |

These placeholders appear in: `firebase.json`, `.env.example`, `README.md`, `package.json`, and `public/index.html`.

---

## 3. Core Architecture & Features

**Serverless & Scalable**

* Lightweight **Node.js/Express** backend running on a **private Google Cloud Run** service that auto-scales with demand.

**Secure by Design**

* **Firebase Hosting** acts as the secure gateway and global CDN.
* The backend service is **not publicly exposed**; Firebase invokes it privately using **IAM**.

**AI-Ready Backend**

* Fully functional, streaming **`/api/chat`** endpoint wired to **Vertex AI (Gemini)** for easy, reliable AI integration.

**Automated CI/CD**

* **GitHub Actions** pipeline handles build and deploy to **QA** and **Production** automatically.

**High-Level Flow**

```
User
  ↓
Firebase Hosting (CDN)
  ↓  [Rewrite Rule]
[SECURE IAM INVOCATION]
  ↓
Private Cloud Run Service
  ↓
Vertex AI (Gemini)
```

---

## 4. Dev & Deployment Workflow (CI/CD)

> ⚠️ **Do not deploy manually.** The **git push** is the only deployment trigger.

1.  **Develop:** Make your code changes locally or in your preferred editor.
2.  **Commit:** Commit your changes to a feature branch.
3.  **Deploy to QA:** Push your branch and open a Pull Request, or push directly to the `dev` branch. The CI/CD pipeline will automatically build and deploy the changes to the QA environment.
4.  **Deploy to Production:** Once testing is complete, merge your changes into the `main` branch. This will trigger a deployment to the production environment.
5.  **Verification:** Track progress in the GitHub **Actions** tab and test the app at its environment URL.

---

## 5. Working with AI Models (Agent-Oriented Development)

This repository is intentionally structured so AI agents can understand it quickly and make safe edits.

**Agent-Friendly Conventions**

* **Clear file roles:** Routes in `src/routes/*`, services in `src/services/*`, entrypoint in `src/index.ts`.
* **Stable contracts:** Public API endpoints and service boundaries are explicit and documented in code comments.
* **Guardrails:** Some files are **off-limits** (see Notes) to keep CI/CD and infra stable.
* **Small, composable modules:** Encourages minimal, reviewable diffs that are easy to test.

**Suggested Prompt Template (for Operators)**

```
You are an expert TypeScript/Express engineer working in {{PROJECT_DISPLAY_NAME}}.
Goal: <clear description of the feature/bugfix>

Constraints:
  - Do not change .github/workflows/deploy.yml (managed by WIZBI).
  - Keep TypeScript strictness and existing lint rules.
  - Place HTTP routes under src/routes/, shared logic under src/services/.
  - Update/extend tests if present; ensure build passes.

Acceptance:
  - New/changed endpoints documented in code comments (JSDoc).
  - No breaking changes to existing public APIs unless specified.

Deliverables:
  - The complete, ready-to-commit content of all modified/new files.
  - A short test plan and any required environment variable notes.
```

### Direct MCP Connection
This project includes a **built-in, authenticated MCP Server** that runs inside the Cloud Run environment. This means your local Agent (like Claude Code or Cursor) can securely connect to this specific project to query its logs, BigQuery, and Firestore *natively*, without needed extra service accounts locally.

1. Find the `MCP_API_KEY` for this project (it was generated by WIZBI CP and injected into the Actions Secrets, or you can find it in the WIZBI Admin Panel).
2. Configure your Agent's config (e.g., `claude.json` or `.mcp.json`) to point to the Cloud Run URL:
   ```json
   "{{PROJECT_ID}}-mcp": {
     "type": "sse",
     "url": "https://{{PROJECT_ID}}-qa.web.app/api/mcp/sse?key=YOUR_MCP_API_KEY"
   }
   ```
3. Your agent can now use tools like `query_logs`, `list_firestore_collections`, and `query_firestore` directly against this project!

---

## 6. Built-in AI: `/api/chat` Endpoint

A streaming chat endpoint connected to **Vertex AI (Gemini)**. Use it from any frontend or service.

### Request (POST `/api/chat`)

```json
{
  "message": "What are the top 5 benefits of using a serverless architecture?",
  "history": [
    { "role": "user",  "parts": [{ "text": "Hi, can you explain cloud computing?" }] },
    { "role": "model", "parts": [{ "text": "Of course! Cloud computing is..." }] }
  ]
}
```

### Example `curl`

```bash
curl -X POST https://{{PROJECT_ID}}-qa.web.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of Israel?",
    "history": []
  }'
```

> **Streaming:** The response is streamed token-by-token. Your frontend should read the stream and render incrementally.

---

## 7. Key Files & Directories

  * `src/index.ts` — The main backend entrypoint. Register new routes and common middleware here.
  * `src/services/vertex.ts` — Core integration with **Vertex AI**.
  * `src/routes/ai.ts` — Defines the **`/api/chat`** endpoint.
  * `public/` — Static frontend assets (HTML, CSS, JS).
  * `.github/workflows/deploy.yml` — The automated CI/CD pipeline. **Do not modify.**
  * `firebase.json` — Defines the rewrite rules from Firebase Hosting to the private Cloud Run services.
  * `Dockerfile` — Defines the container for the Node.js application.

---

## 8. Project Vitals

| Key                  | Value                               |
| -------------------- | ----------------------------------- |
| **Project Name** | `{{PROJECT_DISPLAY_NAME}}`          |
| **Project ID** | `{{PROJECT_ID}}`                    |
| **GCP Region** | `{{GCP_REGION}}`                    |

---

## 9. Local Development

Local development is fully supported for testing changes before pushing to QA or Production.

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and replace the placeholders with your actual values:
   - `{{PROJECT_ID}}` → Your GCP project ID
   - `{{GCP_REGION}}` → Your GCP region (e.g., `europe-west1`)

3. **Authenticate with Google Cloud:**
   
   To use Vertex AI locally, you need to authenticate with GCP:
   ```bash
   gcloud auth application-default login
   ```
   
   This command will open a browser window for you to sign in with your Google account and grant access to your local environment.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The server will start at `http://localhost:8080` (or the port specified in your `.env` file).

### Notes

- The `.env` file is ignored by Git (via `.gitignore`) to prevent sensitive credentials from being committed.
- If you see a warning about `GCP_PROJECT_ID` not being set, make sure you've created your `.env` file and authenticated with `gcloud`.
- Changes to TypeScript files will automatically reload the server thanks to `ts-node-dev`.

---

## 10. Important Notes

  * 🚫 **Do not modify** `.github/workflows/deploy.yml` — it is managed by the CI/CD system.
  * 🚀 **Deployments are Git-driven only**:
      * Push to `dev` ⇒ deploys to **QA**
      * Merge to `main` ⇒ deploys to **Production**
  * 🔐 The Cloud Run service is **private** and invoked only via Firebase + IAM.
  * 🤖 When adding features, prefer small, well-scoped routes under `src/routes/` and reusable logic under `src/services/`.

---

## License

This project is generated and managed by the [WIZBI Platform](https://github.com/bimagics/wizbi-cp).
