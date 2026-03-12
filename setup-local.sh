#!/usr/bin/env bash
set -e

echo "=== WIZBI Local Development Setup ==="
echo ""

# 1. Copy .env.example to .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from .env.example"
  echo "     Edit .env to set your actual values."
else
  echo "[SKIP] .env already exists"
fi

# 2. Copy .mcp.json.example to .mcp.json if not exists
if [ ! -f .mcp.json ]; then
  cp .mcp.json.example .mcp.json
  echo "[OK] Created .mcp.json from .mcp.json.example"
  echo "     Edit .mcp.json to set your API keys."
else
  echo "[SKIP] .mcp.json already exists"
fi

# 3. Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# 4. Check gcloud auth (optional, non-blocking)
echo ""
if command -v gcloud &> /dev/null; then
  if gcloud auth print-access-token &> /dev/null; then
    echo "[OK] gcloud is authenticated"
  else
    echo "[WARN] gcloud is installed but not authenticated."
    echo "       Run: gcloud auth application-default login"
  fi
else
  echo "[INFO] gcloud CLI not found (optional for local dev)."
  echo "       Install from: https://cloud.google.com/sdk/docs/install"
fi

# 5. Print next steps
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your GCP_PROJECT_ID and other values"
echo "  2. Edit .mcp.json with your MCP API keys"
echo "  3. Run: npm run dev"
echo ""
