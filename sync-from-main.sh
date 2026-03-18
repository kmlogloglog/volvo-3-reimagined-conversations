#!/usr/bin/env bash
# sync-from-main.sh
# Pulls the latest ui/ and app/ from origin/main into the current branch,
# rebuilds Nuxt, and restarts the FastAPI server.
# Safe: only reads from main, writes to karim-edits. No merge conflicts
# since karim-edits never touches ui/ or app/.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "==> Fetching latest origin/main..."
git fetch origin main

echo "==> Checking out ui/ and app/ from origin/main..."
git checkout origin/main -- ui/ app/

echo "==> Rebuilding Nuxt..."
cd ui
npm install
npx nuxi build
cd "$REPO_DIR"

echo "==> Restarting FastAPI server..."
# Kill any running uvicorn/fastapi process on port 8080
PID=$(lsof -ti :8080 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "    Stopping existing server (PID $PID)..."
  kill "$PID" 2>/dev/null || true
  sleep 1
fi

echo "    Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8080 &
SERVER_PID=$!
echo "    Server started (PID $SERVER_PID)"

echo ""
echo "Done! Visit http://127.0.0.1:8080/ for the split-screen preview."
