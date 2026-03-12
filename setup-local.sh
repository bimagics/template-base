#!/usr/bin/env bash
set -e

echo "=== WIZBI Local Development Setup ==="
echo ""

# ─── Detect project info from .env.example or existing .env ─────────
detect_project_id() {
  if [ -f .env ]; then
    grep -oP '^GCP_PROJECT_ID=\K.+' .env 2>/dev/null | head -1
  elif [ -f .env.example ]; then
    local val
    val=$(grep -oP '^GCP_PROJECT_ID=\K.+' .env.example 2>/dev/null | head -1)
    # Skip if it's still a placeholder
    if [[ "$val" != *"{{"* ]]; then echo "$val"; fi
  fi
}

PROJECT_ID=$(detect_project_id)

# ─── 1. Copy .env.example → .env ───────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from .env.example"
else
  echo "[SKIP] .env already exists"
fi

# ─── 2. Copy .mcp.json.example → .mcp.json ─────────────────────────
if [ ! -f .mcp.json ]; then
  cp .mcp.json.example .mcp.json
  echo "[OK] Created .mcp.json from .mcp.json.example"
else
  echo "[SKIP] .mcp.json already exists"
fi

# ─── 3. Install dependencies ────────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install

# ─── 4. Auto-fetch secrets from deployed Cloud Run service ──────────
echo ""
if command -v gcloud &> /dev/null; then
  if gcloud auth print-access-token &> /dev/null; then
    echo "[OK] gcloud is authenticated"

    if [ -n "$PROJECT_ID" ]; then
      echo ""
      echo "Fetching environment variables from deployed Cloud Run service..."

      # Determine region from .env or default
      REGION=$(grep -oP '^GCP_REGION=\K.+' .env 2>/dev/null || grep -oP '^VERTEX_LOCATION=\K.+' .env 2>/dev/null || echo "europe-west1")
      # Strip placeholder values
      [[ "$REGION" == *"{{"* ]] && REGION="europe-west1"

      SERVICE_NAME="${PROJECT_ID}-service-qa"

      # Try to fetch env vars from the deployed QA service
      ENV_JSON=$(gcloud run services describe "$SERVICE_NAME" \
        --project "$PROJECT_ID" \
        --region "$REGION" \
        --format="json(spec.template.spec.containers[0].env)" 2>/dev/null || echo "")

      if [ -n "$ENV_JSON" ] && [ "$ENV_JSON" != "" ]; then
        echo "[OK] Found deployed service: $SERVICE_NAME"

        # Extract values from Cloud Run env vars
        extract_env() {
          echo "$ENV_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
envs = data.get('spec', {}).get('template', {}).get('spec', {}).get('containers', [{}])[0].get('env', [])
for e in envs:
    if e.get('name') == '$1':
        print(e.get('value', ''))
        break
" 2>/dev/null || echo ""
        }

        CR_MCP_KEY=$(extract_env "MCP_API_KEY")
        CR_CP_KEY=$(extract_env "CP_MCP_API_KEY")
        CR_REGION=$(extract_env "GCP_REGION")
        CR_VERTEX=$(extract_env "VERTEX_LOCATION")

        # ── Update .env with real values ──
        UPDATED_ENV=false

        update_env_var() {
          local var_name="$1" var_value="$2"
          if [ -n "$var_value" ]; then
            if grep -q "^${var_name}=" .env 2>/dev/null; then
              local current
              current=$(grep -oP "^${var_name}=\K.*" .env)
              if [ "$current" != "$var_value" ] && [[ "$current" == *"YOUR_"* || "$current" == *"{{"* || -z "$current" ]]; then
                sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env
                echo "  [OK] .env: ${var_name} updated"
                UPDATED_ENV=true
              fi
            fi
          fi
        }

        update_env_var "MCP_API_KEY" "$CR_MCP_KEY"
        update_env_var "GCP_REGION" "$CR_REGION"
        update_env_var "VERTEX_LOCATION" "$CR_VERTEX"
        update_env_var "GCP_PROJECT_ID" "$PROJECT_ID"

        if [ "$UPDATED_ENV" = false ]; then
          echo "  [SKIP] .env already has real values"
        fi

        # ── Update .mcp.json with real MCP key ──
        if [ -n "$CR_MCP_KEY" ] && grep -q "YOUR_MCP_API_KEY" .mcp.json 2>/dev/null; then
          sed -i "s|YOUR_MCP_API_KEY|${CR_MCP_KEY}|g" .mcp.json
          echo "  [OK] .mcp.json: MCP_API_KEY injected"
        fi

        if [ -n "$CR_CP_KEY" ] && grep -q "YOUR_CP_API_KEY" .mcp.json 2>/dev/null; then
          sed -i "s|YOUR_CP_API_KEY|${CR_CP_KEY}|g" .mcp.json
          echo "  [OK] .mcp.json: CP_API_KEY injected"
        fi

      else
        echo "[INFO] Could not reach Cloud Run service ($SERVICE_NAME)."
        echo "       The project may not be deployed yet. Keys will need to be set manually."
      fi
    else
      echo "[INFO] Project ID not detected. Skipping auto-fetch."
    fi
  else
    echo "[WARN] gcloud is installed but not authenticated."
    echo "       Run: gcloud auth application-default login"
    echo "       Then re-run ./setup-local.sh to auto-fetch secrets."
  fi
else
  echo "[INFO] gcloud CLI not found. Secrets will need to be set manually."
  echo "       Install from: https://cloud.google.com/sdk/docs/install"
fi

# ─── 5. Summary ─────────────────────────────────────────────────────
echo ""
echo "=== Setup Complete ==="
echo ""

# Check if there are still placeholder values
if grep -q "YOUR_" .mcp.json 2>/dev/null || grep -q "{{" .env 2>/dev/null; then
  echo "Some values still need manual configuration:"
  grep -n "YOUR_" .mcp.json 2>/dev/null && echo "  ^ in .mcp.json"
  grep -n "{{" .env 2>/dev/null && echo "  ^ in .env"
  echo ""
  echo "To auto-fetch: authenticate gcloud and re-run ./setup-local.sh"
else
  echo "All configuration is ready!"
fi

echo ""
echo "Run: npm run dev"
echo ""
