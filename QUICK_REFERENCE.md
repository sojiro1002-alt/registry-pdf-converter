# 빠른 참조 가이드

## 🚀 빠른 시작

### 서버 실행
```bash
# 백엔드
cd backend
npm install
npm start

# 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev
```

### 환경변수 설정
```bash
cd backend
cp .env.example .env
# .env 파일 편집하여 API 키 입력
```

## 📁 주요 파일 위치

### 백엔드
- **서버**: `backend/src/server.js`
- **Gemini 파서**: `backend/src/parsers/geminiParser.js`
- **기존 파서**: `backend/src/parsers/pdfParser.js`
- **Excel 생성**: `backend/src/generators/excelGenerator.js`
- **환경변수**: `backend/.env`

### 프론트엔드
- **메인 컴포넌트**: `frontend/src/App.tsx`
- **스타일**: `frontend/src/index.css`
- **설정**: `frontend/vite.config.ts`

## 🔑 환경변수

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

## 🌐 API 엔드포인트

### POST /api/convert
PDF 파일을 업로드하고 Excel로 변환

**요청:**
- Content-Type: multipart/form-data
- 파일 필드명: `pdf`

**응답:**
```json
{
  "success": true,
  "data": {
    "fileName": "등기부등본_권지은_1234567890.xlsx",
    "downloadUrl": "/api/download/등기부등본_권지은_1234567890.xlsx",
    "parsedData": { ... },
    "processingTime": "1234ms"
  }
}
```

### GET /api/download/:filename
Excel 파일 다운로드

### GET /api/health
서버 상태 확인

## 🎨 스타일 커스터마이징

### 메인 컨테이너 너비
`App.tsx`에서 `max-w-6xl` 변경

### 테이블 컬럼 너비
`App.tsx`에서 `min-w-[120px]` 등으로 조정

### 색상 테마
`tailwind.config.js`에서 색상 정의 수정

## 🔧 자주 사용하는 명령어

### 개발 모드
```bash
# 백엔드 (nodemon 사용)
cd backend
npm run dev

# 프론트엔드
cd frontend
npm run dev
```

### 프로세스 확인
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### 포트 사용 확인
```powershell
netstat -ano | findstr :5000
```

### 서버 재시작
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

## 🐛 문제 해결

### 서버가 시작되지 않음
1. 포트 충돌 확인: `netstat -ano | findstr :5000`
2. 프로세스 종료 후 재시작

### 변경사항이 반영되지 않음
1. 브라우저 강력 새로고침: `Ctrl + Shift + R`
2. 서버 재시작
3. 브라우저 캐시 삭제

### API 키 오류
1. `.env` 파일 확인
2. `backend` 폴더에 있는지 확인
3. 파일 이름이 정확히 `.env`인지 확인

### Gemini API 오류
1. API 키 유효성 확인
2. 모델 이름 확인 (`gemini-2.5-flash`)
3. 네트워크 연결 확인

## 📝 코드 스니펫

### 환경변수 사용
```javascript
require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;
```

### Gemini API 호출
```javascript
const response = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
  { contents: [{ parts: [...] }] }
);
```

### Excel 셀 스타일링
```javascript
cell.font = { bold: true, size: 11 };
cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
cell.alignment = { horizontal: 'center', vertical: 'middle' };
```

## 🔗 유용한 링크

- Gemini API: https://ai.google.dev/
- ExcelJS: https://github.com/exceljs/exceljs
- React: https://react.dev
- Vite: https://vitejs.dev
- TailwindCSS: https://tailwindcss.com

## 📞 지원

문제가 발생하면:
1. GitHub 이슈 등록
2. 로그 파일 확인 (`backend/logs/`)
3. 브라우저 콘솔 확인 (F12)

---

**마지막 업데이트**: 2025년 12월 11일

