# Render 배포 가이드

## 백엔드 배포 (Render)

### 1단계: Render 계정 생성
1. https://render.com 접속
2. GitHub 계정으로 로그인

### 2단계: 새 Web Service 생성
1. Dashboard에서 "New +" 클릭 → "Web Service" 선택
2. GitHub 저장소 연결: `registry-pdf-converter` 선택
3. 다음 설정 입력:

**기본 설정:**
- Name: `registry-pdf-converter-api`
- Region: Oregon (US West) - 무료
- Branch: `main`
- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: `Free`

**환경 변수 설정:**
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render 기본값)
- `GEMINI_API_KEY` = `당신의_Gemini_API_키`

### 3단계: 배포
1. "Create Web Service" 클릭
2. 자동으로 빌드 및 배포 시작
3. 배포 완료 후 URL 확인 (예: `https://registry-pdf-converter-api.onrender.com`)

### 4단계: 프론트엔드 환경변수 설정
배포된 백엔드 URL을 프론트엔드에 연결:

1. `wrangler.toml` 파일에 환경변수 추가:
```toml
[vars]
VITE_API_BASE = "https://your-backend-url.onrender.com/api"
```

2. Cloudflare Pages 재배포:
```bash
npm run build
npx wrangler pages deploy frontend/dist --project-name=registry-pdf-converter --branch=main
```

## 주의사항

### Render 무료 티어 제약사항:
- ⚠️ 15분간 요청이 없으면 **자동으로 슬립 모드**로 전환됨
- 💤 슬립 모드에서 첫 요청 시 **30초~1분** 정도 깨어나는 시간 필요
- 🔄 월 750시간 무료 사용 가능 (1개 서비스 기준 충분)
- 💾 임시 파일 시스템만 제공 (재시작 시 파일 삭제됨)

### Gemini API 키 발급:
1. https://ai.google.dev/ 접속
2. "Get API Key" 클릭
3. Google Cloud Console에서 API 키 생성
4. Render 환경변수에 추가

## 배포 후 테스트

### 헬스체크 확인:
```bash
curl https://your-backend-url.onrender.com/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "message": "서버가 정상 작동 중입니다."
}
```

## 자동 배포

main 브랜치에 커밋할 때마다 Render가 자동으로 재배포합니다.

배포 로그는 Render Dashboard에서 확인 가능합니다.
