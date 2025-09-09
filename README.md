<!--
AI-PROMPT-METADATA:
{
"project_name": "{{PROJECT_DISPLAY_NAME}}",
"project_id": "{{PROJECT_ID}}",
"version": "1.0.0",
"primary_language": "typescript",
"frameworks": ["nodejs", "express"],
"platform": "gcp",
"hosting": ["google_cloud_run", "firebase_hosting"],
"ci_cd": "github_actions",
"key_technologies": ["docker", "serverless", "workload_identity_federation"]
}
-->

{{PROJECT_DISPLAY_NAME}} 🚀
1. Project Overview
Welcome to {{PROJECT_DISPLAY_NAME}}! This repository contains a fully functional, production-ready application scaffolded by the WIZBI Control Plane.

This project is a standard Node.js/Express application written in TypeScript. It is designed to be deployed as a containerized service on Google Cloud Run, with its frontend assets and routing handled by Firebase Hosting.

The entire infrastructure, including the GCP project, CI/CD pipeline, and necessary permissions, has been automatically provisioned. This document provides all the context needed for developers and AI assistants to understand, maintain, and extend this project.

2. Core Architecture & Principles
This repository follows a modern, secure, and scalable serverless architecture.

Backend: A lightweight Express.js server located in the src/ directory. It serves a simple health check API endpoint. This is the core of your application logic.

Frontend: A minimal index.html is located in the public/ directory. This is served globally by the Firebase Hosting CDN.

Deployment: The application is containerized using the provided Dockerfile. The CI/CD pipeline in .github/workflows/deploy.yml builds and pushes this container to Google Artifact Registry and then deploys it to Cloud Run.

Routing: Firebase Hosting is configured via firebase.json to serve the static content from public/ and rewrite all requests starting with /api/ to the private Cloud Run service. This provides a single, unified domain for both frontend and backend.

Security:

The Cloud Run service is private by default and does not accept unauthenticated traffic from the public internet.

The connection between Firebase Hosting and Cloud Run is secured using IAM permissions.

The CI/CD pipeline uses Workload Identity Federation (WIF) for a secure, keyless authentication to GCP. Secrets are never stored as plain text.

3. How to Work with This Repository
This project is set up for a seamless Git-based workflow. You do not need to manually deploy anything.

Deployment Workflow
The CI/CD pipeline is triggered automatically on every push to the main and dev branches.

Production Environment:

Trigger: Push or merge commits to the main branch.

Action: The GitHub Actions workflow deploys the application to the production Cloud Run service and Firebase Hosting site.

QA Environment:

Trigger: Push or merge commits to the dev branch.

Action: The workflow deploys the application to a separate, isolated QA environment (Cloud Run service and Firebase Hosting site).

Local Development
To run the server on your local machine:

Prerequisites:

Node.js (v20 or later)

npm or yarn

Install Dependencies:

npm install

Run the Development Server:

npm run dev

This command starts the server on http://localhost:8080 using ts-node-dev, which provides hot-reloading on file changes.

Adding New API Endpoints
To add a new API endpoint, for example /api/users:

Open src/index.ts.

Add a new Express route handler:

app.get('/api/users', (req, res) => {
  // Your logic here
  res.json([{ id: 1, name: 'Test User' }]);
});

Commit and push your changes to the dev branch to see them live in the QA environment.

4. Key Files and Directories for AI Assistants
To effectively assist with this project, focus on the following files:

src/index.ts: The main entry point for the backend server. All API routes are defined here. This is the primary file to modify when adding or changing backend functionality.

public/: This directory contains all static frontend assets (HTML, CSS, JavaScript). Modify files here to change the user interface.

package.json: Defines all project dependencies. Use npm install <package-name> to add new dependencies.

Dockerfile: Defines the container build process. It should not need changes unless you have advanced requirements (e.g., installing system-level packages).

.github/workflows/deploy.yml: Defines the CI/CD pipeline. This file is managed by the WIZBI platform and should typically not be modified manually.

firebase.json: Configures Firebase Hosting and the rewrite rules to Cloud Run. Adding new rewrite rules might be necessary for advanced use cases.

5. Project Information
Project Name: {{PROJECT_DISPLAY_NAME}}

WIZBI Project ID: {{PROJECT_ID}}

GCP Region: {{GCP_REGION}}
