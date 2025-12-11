# 환경변수 설정 가이드

## 🔐 API 키 보안 설정

이 프로젝트는 환경변수를 사용하여 API 키를 안전하게 관리합니다.

## 📝 설정 방법

### 1. .env 파일 생성

`backend` 폴더에 `.env` 파일을 생성하세요.

```bash
cd backend
cp .env.example .env
```

### 2. API 키 입력

`.env` 파일을 열고 Gemini API 키를 입력하세요:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
```

### 3. Gemini API 키 발급 방법

1. https://ai.google.dev/ 접속
2. Google 계정으로 로그인
3. "Get API Key" 버튼 클릭
4. 프로젝트 선택 또는 새 프로젝트 생성
5. API 키 생성
6. 생성된 키를 `.env` 파일에 복사

## ⚠️ 보안 주의사항

### ✅ 해야 할 것
- `.env` 파일을 `.gitignore`에 포함 (이미 설정됨)
- `.env.example` 파일만 Git에 커밋
- API 키를 코드에 직접 작성하지 않기
- 프로덕션 환경에서는 환경변수로 관리

### ❌ 하지 말아야 할 것
- `.env` 파일을 Git에 커밋하지 않기
- API 키를 공개 저장소에 업로드하지 않기
- API 키를 코드에 하드코딩하지 않기

## 🔍 확인 방법

서버를 시작하면 환경변수가 로드되었는지 확인할 수 있습니다:

```bash
npm start
```

환경변수가 제대로 로드되지 않으면 다음과 같은 에러가 발생합니다:
```
GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.
```

## 📁 파일 구조

```
backend/
├── .env              # 실제 API 키 (Git에 커밋하지 않음)
├── .env.example      # 예시 파일 (Git에 커밋됨)
└── src/
    └── parsers/
        └── geminiParser.js  # 환경변수 사용
```

## 🚀 배포 시 주의사항

### Vercel / Netlify
환경변수를 대시보드에서 설정:
- Settings → Environment Variables
- `GEMINI_API_KEY` 추가

### Docker
```dockerfile
ENV GEMINI_API_KEY=your_key_here
```

### 서버 배포
```bash
export GEMINI_API_KEY=your_key_here
```

## 🆘 문제 해결

### API 키가 작동하지 않는 경우
1. `.env` 파일이 `backend` 폴더에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님)
3. API 키 앞뒤에 공백이 없는지 확인
4. 서버를 재시작했는지 확인

### 환경변수가 로드되지 않는 경우
1. `dotenv` 패키지가 설치되어 있는지 확인: `npm list dotenv`
2. `server.js`에서 `require('dotenv').config()`가 가장 먼저 실행되는지 확인

