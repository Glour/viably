#!/bin/bash
set -e

echo "🚀 Deploying Landing Page..."

# Install dependencies
npm install

# Build
npm run build

# Start (or use PM2)
echo "Starting server..."
PORT=3000 npm start &
echo $! > landing.pid

echo "✅ Landing Page deployed on port 3000"
echo "PID: $(cat landing.pid)"
