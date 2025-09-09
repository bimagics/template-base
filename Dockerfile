# --- REPLACE THE ENTIRE FILE CONTENT ---
# File: template-base/Dockerfile

# ---- Build Stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# Use npm install as no package-lock is present
RUN npm install
COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# --- SECURITY: Run as a non-root user ---
USER node

EXPOSE 8080

# --- RELIABILITY: Add a health check ---
# This requires a /healthz endpoint in the template's index.ts
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
