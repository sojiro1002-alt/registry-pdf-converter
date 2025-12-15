# Cloudflare Workers 배포 전 빌드 스크립트 (PowerShell)

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install

Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
npm run build

Write-Host "✅ Build complete! Output directory: frontend/dist" -ForegroundColor Green

