#!/bin/bash
# Cloudflare Workers 배포 전 빌드 스크립트

set -e

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete! Output directory: frontend/dist"

