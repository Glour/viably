#!/bin/bash

# Viably - Stop Script

echo "🛑 Stopping Viably services..."

docker compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "💡 To remove data volumes as well, run:"
echo "   docker compose down -v"
echo ""
