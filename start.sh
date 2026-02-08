#!/bin/bash

# Viably - Quick Start Script

set -e

echo "🚀 Starting Viably Local Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "Copying from backend/.env.example..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found"
    echo "Copying from frontend/.env.example..."
    cp frontend/.env.example frontend/.env.local
fi

echo "📦 Building and starting services..."
echo ""

# Build and start services
docker compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Viably is running!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop services:    docker compose down"
echo "   Restart:          docker compose restart"
echo ""
echo "📚 For more info, see DOCKER_SETUP.md"
echo ""
