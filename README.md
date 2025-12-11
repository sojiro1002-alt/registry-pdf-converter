# 등기부 등본 PDF → Excel 변환기

한국 등기부 등본(등기사항전부증명서) PDF를 구조화된 Excel 파일로 변환하는 웹 애플리케이션입니다.

![Preview](https://via.placeholder.com/800x400?text=Registry+PDF+Converter)

## 🌟 주요 기능

- **PDF 업로드**: 드래그 앤 드롭 또는 클릭으로 PDF 파일 업로드
- **AI 기반 파싱**: Google Gemini 2.5 Flash를 활용한 정확한 데이터 추출
- **Excel 생성**: 단일 시트에 모든 정보를 구조화하여 표시
  - 현재 유효한 권리 요약 형식
  - 표제부, 갑구, 을구 정보 통합
  - 권리 부담 총괄 자동 계산
- **실시간 미리보기**: 변환 결과를 웹에서 바로 확인
- **자동 재시도**: 네트워크 오류 시 최대 3회 자동 재시도
- **보안**: 업로드된 파일은 처리 후 즉시 삭제

## 🛠 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Vite (빌드 도구)
- TailwindCSS (스타일링)
- Framer Motion (애니메이션)
- React Dropzone (파일 업로드)
- Axios (API 통신)

### 백엔드
- Node.js + Express
- Google Gemini 2.5 Flash API (AI 파싱)
- pdf-parse (폴백 파서)
- ExcelJS (Excel 생성)
- Multer (파일 업로드 처리)

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd registry-pdf-converter
```

### 2. 백엔드 설정

```bash
cd backend
npm install
```

#### 환경변수 설정

1. `.env.example` 파일을 `.env`로 복사:
```bash
cp .env.example .env
```

2. `.env` 파일을 열어서 Gemini API 키를 입력:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

**Gemini API 키 발급 방법:**
1. https://ai.google.dev/ 접속
2. Google 계정으로 로그인
3. "Get API Key" 클릭
4. API 키 생성 후 `.env` 파일에 입력

**참고:** API 키가 없어도 기존 파서로 작동하지만, AI 파싱 기능은 사용할 수 없습니다.

3. 서버 실행:
```bash
npm start
```

백엔드 서버가 http://localhost:5000 에서 실행됩니다.

### 3. 프론트엔드 설정 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

### 4. Gemini API 키 설정 (선택사항)

`backend/src/parsers/geminiParser.js` 파일에서 API 키를 설정하세요.
API 키가 없어도 기존 파서로 작동합니다.

## 📝 사용 방법

1. 웹 페이지에서 등기부 등본 PDF 파일을 드래그 앤 드롭하거나 클릭하여 선택
2. "Excel로 변환하기" 버튼 클릭
3. 변환 완료 후 결과 미리보기 확인
4. "Excel 다운로드" 버튼으로 파일 다운로드

## 🔍 파싱되는 정보

### 표제부 (기본정보)
- 고유번호
- 소재지번
- 도로명주소
- 건물명칭
- 건물구조/면적
- 전용면적
- 대지권 비율

### 갑구 (소유권)
- 순위번호
- 등기목적 (소유권이전, 소유권보존 등)
- 접수일자/접수번호
- 등기원인
- 소유자 정보 (이름, 주민등록번호, 주소)
- 말소 여부

### 을구 (권리관계)
- 순위번호
- 등기목적 (근저당권설정, 전세권설정, 근질권 등)
- 접수일자/접수번호
- 채권최고액/전세금
- 채무자/권리자 정보
- 말소 여부

## 🎯 AI 파싱 특징

- **PDF 직접 분석**: PDF를 base64로 인코딩하여 Gemini에 직접 전달
- **표 형식 인식**: 복잡한 표 형식도 정확히 읽어냄
- **OCR 지원**: 스캔된 이미지 PDF도 처리 가능
- **자동 재시도**: 네트워크 오류 시 자동으로 재시도
- **폴백 시스템**: AI 실패 시 기존 파서로 자동 전환

## 📁 프로젝트 구조

```
registry-pdf-converter/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express 서버
│   │   ├── parsers/
│   │   │   ├── pdfParser.js       # 기존 PDF 파서
│   │   │   └── geminiParser.js    # Gemini AI 파서
│   │   └── generators/
│   │       └── excelGenerator.js # Excel 생성 로직
│   ├── uploads/                    # 임시 업로드 폴더
│   ├── outputs/                    # 생성된 Excel 파일
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # 메인 컴포넌트
│   │   ├── main.tsx               # 엔트리 포인트
│   │   └── index.css              # 스타일
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

## ⚠️ 주의사항

- PDF 파일 크기는 최대 10MB까지 지원
- Gemini API를 사용하려면 유효한 API 키가 필요합니다
- 등기부 등본 형식에 따라 파싱 정확도가 달라질 수 있음
- 중요한 법률 문서이므로 변환 결과를 반드시 확인하세요

## 🔒 보안

- 업로드된 PDF 파일은 처리 완료 후 즉시 삭제됩니다
- 생성된 Excel 파일은 다운로드 후 5분 뒤 자동 삭제됩니다
- 개인정보(주민등록번호 등)는 마스킹 처리된 상태 그대로 유지됩니다
- API 키는 환경변수로 관리하는 것을 권장합니다

## 🎨 스크린샷

(실제 스크린샷을 추가하세요)

## 📜 라이선스

MIT License

## 🤝 기여

이슈나 풀 리퀘스트를 환영합니다!

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.
