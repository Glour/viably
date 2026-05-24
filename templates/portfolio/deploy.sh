#!/bin/bash
set -e

echo "🚀 Deploying Portfolio..."

npm install
npm run build

PORT=3002 npm start &
echo $! > portfolio.pid

echo "✅ Portfolio deployed on port 3002"
echo "PID: $(cat portfolio.pid)"
