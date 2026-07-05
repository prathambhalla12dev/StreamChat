#!/bin/bash

# Pulse Chat Engine — Quick Start Script
# Usage: ./start.sh [dev|prod]

set -e

MODE=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════╗"
echo "║  Pulse — Real-Time Chat Engine        ║"
echo "║  Starting in $MODE mode...            ║"
echo "╚════════════════════════════════════════╝"
echo ""

cd "$SCRIPT_DIR"

if [ "$MODE" = "dev" ]; then
  echo "🚀 Starting development environment..."
  echo "   Backend:  http://localhost:8080"
  echo "   Frontend: http://localhost:3000"
  echo "   Mongo UI: http://localhost:8081 (admin/admin)"
  echo "   Redis UI: http://localhost:8082"
  echo ""
  docker-compose up --build

elif [ "$MODE" = "prod" ]; then
  echo "🚀 Starting production environment..."
  echo "   App: http://localhost:5173"
  echo ""
  docker-compose -f docker-compose.prod.yml up --build

else
  echo "❌ Unknown mode: $MODE"
  echo "   Usage: ./start.sh [dev|prod]"
  exit 1
fi
