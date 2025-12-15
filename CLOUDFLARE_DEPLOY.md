# Cloudflare 배포 가이드

이 프로젝트는 두 가지 방법으로 Cloudflare에 배포할 수 있습니다:
1. **Cloudflare Pages** (권장) - GitHub 연동 자동 배포
2. **Cloudflare Workers** - Wrangler CLI를 통한 수동 배포

## 방법 1: Cloudflare Pages 배포 (권장)

### 프론트엔드 배포 (Cloudflare Pages)

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

---

## 방법 2: Cloudflare Workers 배포 (Wrangler CLI)

### 사전 준비

1. **Wrangler CLI 설치**:
```bash
npm install -g wrangler
# 또는
npm install --save-dev wrangler
```

2. **Cloudflare 인증**:
```bash
wrangler login
```

3. **프론트엔드 빌드**:
```bash
cd frontend
npm install
npm run build
```

### 배포 방법

#### 옵션 A: 프로젝트 루트에서 배포

```bash
# 프로젝트 루트에서
wrangler deploy
```

이 방법은 프로젝트 루트의 `wrangler.toml` 파일을 사용합니다.

#### 옵션 B: frontend 디렉토리에서 배포

```bash
cd frontend
wrangler deploy
```

이 방법은 `frontend/wrangler.toml` 파일을 사용합니다.

#### 옵션 C: 명령어에 직접 지정

```bash
# 프로젝트 루트에서
wrangler deploy --assets=./frontend/dist

# 또는 frontend 디렉토리에서
cd frontend
wrangler deploy --assets=./dist
```

### 환경 변수 설정

Workers 배포 시 환경 변수를 설정하려면:

1. **wrangler.toml 파일 수정**:
```toml
[vars]
VITE_API_BASE = "https://your-backend-url.com/api"
```

2. **또는 명령어로 설정**:
```bash
wrangler deploy --var VITE_API_BASE:https://your-backend-url.com/api
```

### 배포 확인

배포 완료 후 제공되는 URL로 접속하여 확인하세요.

### 문제 해결

#### 에러: "No entry-point specified"

이 에러는 `wrangler.toml` 파일이 없거나 잘못 설정된 경우 발생합니다.

**해결 방법:**
1. 프로젝트 루트 또는 frontend 디렉토리에 `wrangler.toml` 파일이 있는지 확인
2. `[site]` 섹션의 `bucket` 경로가 올바른지 확인
3. 빌드가 완료되어 `dist` 디렉토리가 존재하는지 확인

#### 에러: "Cannot find module"

빌드가 완료되지 않은 경우 발생합니다.

**해결 방법:**
```bash
cd frontend
npm run build
```

#### 배포 전 체크리스트

- [ ] `wrangler.toml` 파일이 올바른 위치에 있는가?
- [ ] `npm run build`가 성공적으로 완료되었는가?
- [ ] `dist` 디렉토리에 빌드된 파일들이 있는가?
- [ ] `wrangler login`으로 인증이 완료되었는가?
- [ ] 환경 변수(`VITE_API_BASE`)가 올바르게 설정되었는가?

### Workers vs Pages 비교

| 항목 | Cloudflare Pages | Cloudflare Workers |
|------|-----------------|-------------------|
| 배포 방법 | GitHub 연동 자동 배포 | Wrangler CLI 수동 배포 |
| 설정 파일 | `cloudflare-pages.json` | `wrangler.toml` |
| 빌드 | 자동 (GitHub 푸시 시) | 수동 (`npm run build`) |
| 환경 변수 | Dashboard에서 설정 | `wrangler.toml` 또는 CLI |
| 권장 사용 | 프로덕션 배포 | 테스트/개발 배포 |

