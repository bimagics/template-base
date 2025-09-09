# {{PROJECT_DISPLAY_NAME}} 🚀

## 1. Project Overview & Operating Principles

Welcome to **{{PROJECT_DISPLAY_NAME}}**. This repository is a self-contained, production-ready application scaffolded and managed by the **WIZBI Platform**.

**Critical Operating Principle:** This project adheres to a **100% Cloud-Native and AI-Driven development workflow**. There is no local development environment. All code modifications are intended to be executed directly in the GitHub repository, with deployments handled automatically by the integrated CI/CD pipeline. This entire process is designed to be orchestrated by human developers in collaboration with AI assistants.

This document serves as the primary operational guide for any developer or AI model interacting with this repository.

---

## 2. Core Architecture

This repository is built on a modern, secure, and scalable serverless architecture.

-   **Backend:** A lightweight Express.js server in the `src/` directory. This is the heart of your application's logic.
-   **Frontend:** Static assets are served from the `public/` directory via the Firebase Hosting CDN.
-   **Deployment:** The application is containerized via the `Dockerfile`. The CI/CD pipeline in `.github/workflows/deploy.yml` builds, pushes, and deploys this container to a private Google Cloud Run service.
-   **Routing & Security:** Firebase Hosting (`firebase.json`) rewrites all `/api/**` requests to the **private** Cloud Run service. The Cloud Run service is not exposed to the public internet; access is securely managed via IAM, making Firebase Hosting the sole entry point.

---

## 3. The AI-Driven Development & Deployment Workflow

All work on this repository follows a simple, Git-based, fully automated flow. **Do not attempt to deploy manually.**

#### The Workflow Cycle:
1.  **Task Definition:** A new feature or bug fix is defined (e.g., "Create a new API endpoint at `/api/inventory` that returns a list of products").
2.  **Code Modification:** A developer or an AI assistant modifies the relevant files (e.g., `src/index.ts`) and commits the changes directly to a branch in this GitHub repository.
3.  **Deployment Trigger:** The `git push` command is the sole trigger for deployment.
    -   **Push to `dev` branch:** Automatically deploys the changes to the **QA Environment**.
    -   **Merge to `main` branch:** Automatically deploys the changes to the **Production Environment**.
4.  **Verification:** The success or failure of the deployment can be monitored in the "Actions" tab of this GitHub repository. The live application should be tested on its dedicated QA or Production URL.

### Example Task: Adding a New API Endpoint

**Objective:** Create an endpoint at `/api/status`.

**Action:** An AI assistant would be instructed to perform the following changes:

1.  **Navigate to `src/index.ts`.**
2.  **Add the following code block:**
    ```typescript
    app.get('/api/status', (req, res) => {
      res.json({ deployed_at: new Date().toISOString() });
    });
    ```
3.  **Commit the change with a descriptive message:** "feat: add /api/status endpoint".
4.  **Push the commit to the `dev` branch.**

The CI/CD pipeline will then automatically deploy this change to the QA environment for verification.

---

## 4. Key Files and Directories for AI Assistants

To effectively assist with this project, focus your modifications on these key areas:

-   **`src/index.ts`:** **Primary file for backend logic.** All API routes are defined here. Modify this file to add or change application behavior.
-   **`public/`:** Contains all static frontend assets (HTML, CSS, JS). Modify files here to change the user-facing interface.
-   **`package.json`:** Project dependencies. To add a new dependency, instruct to add it here and the CI/CD pipeline will handle the installation.
-   **`Dockerfile`:** Defines the container build process. Do not modify unless there's a need for system-level packages or advanced build steps.
-   **`.github/workflows/deploy.yml`:** Defines the CI/CD pipeline. This is managed by the WIZBI platform and **should not be modified**.
-   **`firebase.json`:** Configures Firebase Hosting. Can be modified to add new rewrite rules for more complex routing.

---

## 5. Project Vitals

-   **Project Name:** `{{PROJECT_DISPLAY_NAME}}`
-   **WIZBI Project ID:** `{{PROJECT_ID}}`
-   **GCP Region:** `{{GCP_REGION}}`
