# Cloudflare Pages 배포 가이드

## 프론트엔드 배포 (Cloudflare Pages)

### 1. 사전 준비
- Cloudflare 계정 생성: https://dash.cloudflare.com/
- GitHub 저장소에 코드 푸시 완료

### 2. Cloudflare Pages 프로젝트 생성

1. Cloudflare Dashboard → Pages → Create a project
2. "Connect to Git" 선택
3. GitHub 저장소 선택: `sojiro1002-alt/registry-pdf-converter`
4. 프로젝트 설정:
   - **Project name**: `registry-pdf-converter` (또는 원하는 이름)
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `frontend`

### 3. 환경 변수 설정

Cloudflare Pages Dashboard → Settings → Environment variables에서 추가:

```
VITE_API_BASE=https://your-backend-url.com/api
```

**중요**: 백엔드 URL을 실제 배포된 백엔드 주소로 변경하세요.

### 4. 배포 확인

- 배포 완료 후 제공되는 URL로 접속 (예: `https://registry-pdf-converter.pages.dev`)
- PDF 업로드 및 변환 기능 테스트

## 백엔드 배포 옵션

### 옵션 1: Railway/Render (권장)
- 기존 Express 서버 그대로 사용 가능
- 환경 변수: `GEMINI_API_KEY` 설정 필요
- CORS 설정에 Cloudflare Pages 도메인 추가

### 옵션 2: Cloudflare Workers
- Express 서버를 Workers API로 변환 필요
- 제약사항: Node.js 런타임 없음, 파일 시스템 접근 제한
- 복잡도가 높아 권장하지 않음

## CORS 설정

백엔드 `server.js`의 CORS 설정에 Cloudflare Pages 도메인 추가:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://sojiro1002-alt.github.io',
  'https://registry-pdf-converter.pages.dev', // Cloudflare Pages 도메인
  'https://*.pages.dev' // 모든 Pages 서브도메인 허용
];
```

## 커스텀 도메인 설정 (선택사항)

1. Cloudflare Pages Dashboard → Custom domains
2. 도메인 추가 및 DNS 설정
3. SSL/TLS 자동 설정됨

## 자동 배포

GitHub에 푸시하면 자동으로 재배포됩니다.

