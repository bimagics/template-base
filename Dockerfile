# ---- Build Stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# --- SECURITY: Run as a non-root user ---
USER node

# Copy build output from build stage
# The /app/public copy is removed as it's not guaranteed to exist and standalone output handles assets.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

EXPOSE 8080
ENV PORT 8080

CMD ["node", "server.js"]
