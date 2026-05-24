#!/bin/bash
set -e

echo "🚀 Deploying Blog..."

npm install
npm run build

PORT=3001 npm start &
echo $! > blog.pid

echo "✅ Blog deployed on port 3001"
echo "PID: $(cat blog.pid)"
