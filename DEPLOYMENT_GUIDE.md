# 배포 가이드 - Cloudflare Pages vs Workers

## ⚠️ 중요: Cloudflare Pages를 사용하세요!

이 프로젝트는 **정적 사이트**이므로 **Cloudflare Pages**로 배포하는 것이 권장됩니다.
**Cloudflare Workers**는 API 서버용이며, 정적 사이트에는 적합하지 않습니다.

## 방법 1: Cloudflare Pages (권장) ✅

### 설정 방법

1. **Cloudflare Dashboard** → **Pages** → **Create a project**
2. **Connect to Git** 선택
3. GitHub 저장소 선택: `sojiro1002-alt/registry-pdf-converter`
4. **프로젝트 설정**:
   - **Project name**: `registry-pdf-converter`
   - **Production branch**: `main`
   - **Framework preset**: `Vite` (자동 감지)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `frontend` (또는 빈 값)

5. **환경 변수 설정** (Settings → Environment variables):
   ```
   VITE_API_BASE=https://your-backend-url.com/api
   ```

6. **Deploy command는 비워두세요!** (Pages는 자동으로 배포합니다)

### 자동 배포

GitHub에 푸시하면 자동으로 재배포됩니다.

---

## 방법 2: Cloudflare Workers (고급 사용자용)

Workers는 정적 사이트보다는 API 서버에 적합합니다. 
정적 사이트를 Workers로 배포하려면:

### 사전 준비

1. **로컬에서 빌드**:
```bash
cd frontend
npm install
npm run build
```

2. **배포**:
```bash
# 프로젝트 루트에서
wrangler deploy
```

### Cloudflare Pages에서 Workers 배포 (비권장)

만약 Cloudflare Pages에서 Workers 배포 명령어를 사용하려면:

1. **Build command**: `cd frontend && npm install && npm run build`
2. **Deploy command**: `npx wrangler deploy` (빌드 후 실행)

하지만 이 방법은 권장하지 않습니다. **Pages를 사용하세요!**

---

## 문제 해결

### 에러: "The entry-point file at 'workers-site/index.js' was not found"

**원인**: 구식 `[site]` 설정이 남아있거나, 빌드가 실행되지 않았습니다.

**해결**:
1. `wrangler.toml` 파일에서 `[site]` 섹션이 완전히 제거되었는지 확인
2. `[assets]` 섹션만 있는지 확인
3. **빌드를 먼저 실행**: `cd frontend && npm install && npm run build`

### 에러: "directory not found" 또는 "Cannot find module"

**원인**: `frontend/dist` 디렉토리가 없습니다.

**해결**:
```bash
cd frontend
npm install
npm run build
# dist 디렉토리가 생성되었는지 확인
ls dist  # 또는 dir dist (Windows)
```

---

## 권장 사항

✅ **Cloudflare Pages 사용** - 자동 빌드, 자동 배포, 간편함
❌ **Cloudflare Workers 사용** - 수동 빌드 필요, 복잡함

Pages는 GitHub 연동으로 자동 배포되므로 훨씬 편리합니다!

