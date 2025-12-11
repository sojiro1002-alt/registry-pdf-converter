# 등기부 등본 PDF → Excel 변환기 프로젝트 요약

## 📋 프로젝트 개요

한국 등기부 등본(등기사항전부증명서) PDF를 구조화된 Excel 파일로 변환하는 웹 애플리케이션입니다. Google Gemini AI를 활용하여 복잡한 PDF 문서에서 정확한 데이터를 추출합니다.

**개발 기간**: 2025년 12월  
**기술 스택**: React, TypeScript, Node.js, Express, Google Gemini API

## 🎯 주요 기능

### 1. PDF 업로드
- 드래그 앤 드롭 지원
- 클릭하여 파일 선택
- 파일 형식 검증 (PDF만 허용)
- 파일 크기 제한 (최대 10MB)
- 업로드 진행률 표시

### 2. AI 기반 PDF 파싱
- **Google Gemini 2.5 Flash API** 사용
- PDF를 base64로 인코딩하여 직접 전달
- 표 형식 데이터 정확히 인식
- OCR 기능 내장 (스캔된 PDF도 처리 가능)
- 자동 재시도 로직 (최대 3회)
- 폴백 시스템 (AI 실패 시 기존 파서 사용)

### 3. Excel 생성
- **단일 시트**에 모든 정보 통합
- "현재 유효한 권리 요약" 형식
- 섹션별 구분:
  - 발급기준일, 부동산 소재지, 도로명주소
  - 현재 소유자 정보
  - 현재 유효한 근저당권
  - 현재 유효한 근질권
  - 현재 유효한 전세권
  - 권리 부담 총괄
- 스타일링 적용 (헤더 강조, 금액 포맷, 말소 표시)
- 페이지 설정 (한 페이지에 맞추기)

### 4. 실시간 미리보기
- 웹에서 변환 결과 확인
- 탭 기반 데이터 탐색 (요약, 갑구, 을구)
- 반응형 디자인

### 5. 보안
- 업로드된 PDF 즉시 삭제
- 생성된 Excel 파일 5분 후 자동 삭제
- API 키 환경변수 관리
- 개인정보 마스킹 유지

## 🛠 기술 스택

### 프론트엔드
- **React 18** + **TypeScript**: 타입 안정성과 컴포넌트 기반 개발
- **Vite**: 빠른 개발 서버와 빌드
- **TailwindCSS**: 유틸리티 기반 스타일링
- **Framer Motion**: 부드러운 애니메이션
- **React Dropzone**: 파일 업로드 UI
- **Axios**: HTTP 클라이언트

### 백엔드
- **Node.js** + **Express**: REST API 서버
- **Google Gemini 2.5 Flash API**: AI 기반 PDF 파싱
- **pdf-parse**: 폴백 PDF 파서
- **ExcelJS**: Excel 파일 생성 및 스타일링
- **Multer**: 파일 업로드 처리
- **dotenv**: 환경변수 관리

## 📁 프로젝트 구조

```
registry-pdf-converter/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express 서버
│   │   ├── parsers/
│   │   │   ├── pdfParser.js       # 기존 PDF 파서 (정규표현식 기반)
│   │   │   └── geminiParser.js    # Gemini AI 파서
│   │   └── generators/
│   │       └── excelGenerator.js  # Excel 생성 로직
│   ├── uploads/                    # 임시 업로드 폴더
│   ├── outputs/                    # 생성된 Excel 파일
│   ├── .env                        # 환경변수 (Git에 커밋 안됨)
│   ├── .env.example                # 환경변수 예시
│   ├── ENV_SETUP.md                # 환경변수 설정 가이드
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # 메인 컴포넌트
│   │   ├── main.tsx                # 엔트리 포인트
│   │   └── index.css               # TailwindCSS 스타일
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── README.md                       # 프로젝트 설명서
├── BLOG_POST.md                    # 블로그 포스팅용 문서
├── POSTING_GUIDE.md                # 포스팅 가이드
├── PROJECT_SUMMARY.md              # 이 문서
└── .gitignore
```

## 🔧 설치 및 실행

### 1. 의존성 설치

**백엔드:**
```bash
cd backend
npm install
```

**프론트엔드:**
```bash
cd frontend
npm install
```

### 2. 환경변수 설정

1. `backend/.env.example`을 `backend/.env`로 복사
2. `.env` 파일에 Gemini API 키 입력:
```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

**Gemini API 키 발급:**
- https://ai.google.dev/ 접속
- "Get API Key" 클릭
- API 키 생성 후 `.env` 파일에 입력

### 3. 서버 실행

**백엔드 (터미널 1):**
```bash
cd backend
npm start
# 또는 개발 모드: npm run dev
```

**프론트엔드 (터미널 2):**
```bash
cd frontend
npm run dev
```

### 4. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

## 🔍 주요 구현 내용

### 1. Gemini API 통합

**파일**: `backend/src/parsers/geminiParser.js`

**핵심 기능:**
- PDF를 base64로 인코딩하여 Gemini에 직접 전달
- 상세한 프롬프트로 정확한 데이터 추출
- 재시도 로직 (최대 3회, 지수 백오프)
- 데이터 검증 및 정제

**프롬프트 특징:**
- 구체적인 추출 지침
- 날짜/금액 형식 변환 규칙
- JSON 형식 예시 제공
- 말소 여부 판단 기준 명확화

### 2. Excel 생성 로직

**파일**: `backend/src/generators/excelGenerator.js`

**주요 기능:**
- 단일 시트에 모든 정보 통합
- 섹션별 헤더와 테이블 구성
- 스타일링 (색상, 폰트, 정렬)
- 페이지 설정 (한 페이지에 맞추기)
- 자동 합계 계산

### 3. 프론트엔드 UI

**파일**: `frontend/src/App.tsx`

**주요 기능:**
- 드래그 앤 드롭 파일 업로드
- 실시간 진행률 표시
- 탭 기반 결과 탐색
- 반응형 레이아웃
- 다크 모드 디자인

## 📊 데이터 추출 항목

### 표제부 (기본정보)
- 고유번호
- 소재지번
- 도로명주소
- 건물명칭
- 건물구조/면적
- 전용면적
- 대지권비율
- 대지권종류

### 갑구 (소유권)
- 순위번호
- 등기목적
- 접수일자/접수번호
- 등기원인
- 권리자 (소유자)
- 주민등록번호
- 주소
- 상태 (유효/말소)

### 을구 (권리관계)
- 순위번호
- 등기목적 (근저당권, 전세권, 근질권 등)
- 접수일자/접수번호
- 등기원인
- 채권최고액/전세금
- 채무자/전세권자
- 권리자
- 상태 (유효/말소)

## 🔐 보안 고려사항

### 구현된 보안 기능
1. **환경변수 관리**: API 키를 `.env` 파일로 관리
2. **파일 자동 삭제**: 업로드/생성 파일 즉시 삭제
3. **파일 크기 제한**: 최대 10MB
4. **파일 형식 검증**: PDF만 허용
5. **CORS 설정**: 허용된 도메인만 접근

### .gitignore 설정
- `.env` 파일 제외
- `node_modules/` 제외
- `uploads/`, `outputs/` 제외
- 로그 파일 제외

## 🚀 배포 고려사항

### 환경변수 설정
- Vercel/Netlify: 대시보드에서 환경변수 설정
- Docker: `ENV` 명령어 사용
- 서버: `export` 명령어 사용

### 파일 크기 제한
- 프론트엔드: Vite 기본 설정
- 백엔드: Multer 10MB 제한
- Gemini API: 20MB 제한

## 🐛 트러블슈팅

### 자주 발생하는 문제

1. **포트 충돌**
   - 해결: 기존 프로세스 종료 후 재시작

2. **환경변수 로드 실패**
   - 확인: `.env` 파일이 `backend` 폴더에 있는지
   - 확인: `dotenv` 패키지 설치 여부
   - 확인: `server.js`에서 `require('dotenv').config()` 위치

3. **Gemini API 오류**
   - 확인: API 키 유효성
   - 확인: 모델 이름 (`gemini-2.5-flash`)
   - 확인: 네트워크 연결

4. **변경사항 반영 안됨**
   - 브라우저 강력 새로고침: `Ctrl + Shift + R`
   - 서버 재시작
   - 브라우저 캐시 삭제

## 📈 성능 최적화

### 구현된 최적화
1. **재시도 로직**: 네트워크 오류 시 자동 복구
2. **폴백 시스템**: AI 실패 시 기존 파서 사용
3. **파일 크기 제한**: 메모리 사용량 제어
4. **타임아웃 설정**: 120초 (PDF 처리 시간 고려)
5. **Vite HMR**: 빠른 개발 경험

## 🎨 UI/UX 특징

### 디자인
- 다크 모드 테마
- 글래스모피즘 효과
- 부드러운 애니메이션
- 반응형 레이아웃

### 사용자 경험
- 직관적인 드래그 앤 드롭
- 실시간 피드백
- 명확한 에러 메시지
- 결과 미리보기

## 📝 개발 노트

### 주요 결정 사항

1. **단일 시트 vs 다중 시트**
   - 결정: 단일 시트로 통합 (사용자 요청)
   - 이유: 한눈에 모든 정보 확인 가능

2. **AI 파싱 vs 정규표현식**
   - 결정: AI 우선, 폴백으로 정규표현식
   - 이유: 정확도 향상, 복잡한 형식 처리 가능

3. **PDF 직접 전달 vs 텍스트 추출**
   - 결정: PDF를 base64로 직접 전달
   - 이유: 레이아웃 정보 유지, OCR 지원

### 개선 가능한 부분

1. **OCR 정확도 향상**: 스캔된 PDF 처리 개선
2. **배치 처리**: 여러 PDF 동시 처리
3. **히스토리 관리**: 변환 이력 저장
4. **사용자 인증**: 개인별 데이터 관리
5. **클라우드 배포**: 확장성 향상

## 📚 참고 자료

- [Google Gemini API 문서](https://ai.google.dev/docs)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [React 공식 문서](https://react.dev)
- [Vite 공식 문서](https://vitejs.dev)
- [TailwindCSS 문서](https://tailwindcss.com)

## 🎓 학습한 내용

1. **AI API 활용**: Gemini API를 활용한 문서 분석
2. **프롬프트 엔지니어링**: 효과적인 프롬프트 작성법
3. **에러 핸들링**: 재시도 로직과 폴백 시스템
4. **Excel 생성**: ExcelJS를 활용한 복잡한 Excel 파일 생성
5. **환경변수 관리**: 보안을 위한 API 키 관리

## 📄 라이선스

MIT License

## 👥 기여

이슈나 풀 리퀘스트를 환영합니다!

---

**작성일**: 2025년 12월 11일  
**프로젝트 버전**: 1.0.0

