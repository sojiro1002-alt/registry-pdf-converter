# 등기부 등본 PDF를 Excel로 변환하는 AI 웹앱 만들기

## 📌 프로젝트 소개

부동산 등기부 등본(등기사항전부증명서)은 복잡한 형식의 PDF 문서입니다. 이를 Excel로 변환하여 데이터를 분석하고 관리하기 쉽게 만들고 싶었습니다. Google Gemini AI를 활용하여 정확한 데이터 추출이 가능한 웹 애플리케이션을 개발했습니다.

## 🎯 해결하고자 한 문제

- 등기부 등본 PDF는 복잡한 표 형식으로 되어 있어 수동 입력이 어려움
- 표제부, 갑구, 을구 등 여러 섹션을 정확히 구분해야 함
- 말소된 항목과 유효한 항목을 구분해야 함
- 금액, 날짜 등 다양한 형식의 데이터를 정규화해야 함

## 🛠 기술 스택 선택 이유

### 프론트엔드: React + TypeScript + TailwindCSS
- **React**: 컴포넌트 기반 개발로 유지보수 용이
- **TypeScript**: 타입 안정성으로 런타임 에러 방지
- **TailwindCSS**: 빠른 스타일링과 반응형 디자인
- **Framer Motion**: 부드러운 애니메이션으로 UX 향상

### 백엔드: Node.js + Express
- **Express**: 간단하고 빠른 API 서버 구축
- **Multer**: 파일 업로드 처리
- **ExcelJS**: Excel 파일 생성 및 스타일링

### AI: Google Gemini 2.5 Flash
- **선택 이유**: PDF를 직접 분석할 수 있고, 표 형식 데이터 추출에 뛰어남
- **장점**: OCR 기능 내장, 복잡한 레이아웃 인식 가능

## 🏗 아키텍처 설계

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│   Express   │
│   Server    │
└──────┬──────┘
       │
       ├──► Gemini API (PDF 분석)
       │
       └──► ExcelJS (Excel 생성)
```

## 💡 핵심 구현 내용

### 1. PDF 파싱 전략

처음에는 `pdf-parse`로 텍스트를 추출한 후 Gemini에 전달했지만, 정확도가 떨어졌습니다. 
**개선**: PDF를 base64로 인코딩하여 Gemini에 직접 전달하는 방식으로 변경했습니다.

```javascript
// PDF를 base64로 인코딩
const pdfBuffer = fs.readFileSync(filePath);
const base64Pdf = pdfBuffer.toString('base64');

// Gemini API에 PDF 직접 전달
const response = await axios.post(GEMINI_API_URL, {
  contents: [{
    parts: [
      {
        inline_data: {
          mime_type: 'application/pdf',
          data: base64Pdf
        }
      },
      { text: prompt }
    ]
  }]
});
```

### 2. 재시도 로직 구현

네트워크 오류나 일시적인 API 실패에 대비하여 자동 재시도 로직을 구현했습니다.

```javascript
async function callGeminiAPIWithRetry(base64Pdf, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(/* ... */);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      // 지수 백오프: 1초, 2초, 4초 대기
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### 3. 프롬프트 엔지니어링

Gemini API의 정확도를 높이기 위해 구체적이고 상세한 프롬프트를 작성했습니다.

**핵심 포인트:**
- 날짜 형식 변환 규칙 명시 (YYYY년MM월DD일 → YYYY-MM-DD)
- 금액 추출 규칙 (숫자만, 쉼표 제거)
- JSON 형식 예시 제공
- 말소 여부 판단 기준 명확화

### 4. Excel 생성 최적화

단일 시트에 모든 정보를 포함하되, 섹션별로 명확히 구분되도록 구성했습니다.

- **헤더**: 발급기준일, 부동산 소재지
- **현재 소유자 정보**: 테이블 형식
- **현재 유효한 근저당권**: 순위번호, 등기일자, 근저당권자, 채무자, 채권최고액
- **현재 유효한 근질권**: 별도 테이블
- **현재 유효한 전세권**: 존속기간 자동 계산
- **권리 부담 총괄**: 자동 합계 계산

## 🎨 UI/UX 설계

### 디자인 컨셉
- **다크 모드**: 눈의 피로 감소
- **글래스모피즘**: 모던한 느낌
- **애니메이션**: Framer Motion으로 부드러운 전환 효과

### 주요 기능
- 드래그 앤 드롭 파일 업로드
- 실시간 진행률 표시
- 변환 결과 미리보기
- 탭 기반 데이터 탐색

## 🚀 배포 고려사항

### 보안
- 업로드 파일 즉시 삭제
- API 키 환경변수 관리
- 파일 크기 제한 (10MB)
- CORS 설정

### 성능
- 파일 크기 제한으로 메모리 관리
- 타임아웃 설정 (120초)
- 에러 핸들링 및 로깅

## 📊 결과 및 성과

- **정확도**: Gemini AI를 사용하여 복잡한 표 형식도 정확히 추출
- **사용성**: 드래그 앤 드롭으로 간편한 사용
- **안정성**: 재시도 로직과 폴백 시스템으로 높은 안정성

## 🔮 향후 개선 계획

1. **OCR 개선**: 스캔된 이미지 PDF 처리 정확도 향상
2. **배치 처리**: 여러 PDF 파일 동시 처리
3. **클라우드 배포**: AWS/GCP 배포로 확장성 향상
4. **사용자 인증**: 개인별 변환 히스토리 관리

## 📚 학습한 내용

- **AI API 활용**: Gemini API를 활용한 문서 분석
- **프롬프트 엔지니어링**: 효과적인 프롬프트 작성법
- **에러 핸들링**: 재시도 로직과 폴백 시스템 구현
- **Excel 생성**: ExcelJS를 활용한 복잡한 Excel 파일 생성

## 💻 코드 하이라이트

### Gemini API 통합

```javascript
// PDF를 직접 전달하여 더 정확한 추출
const response = await axios.post(GEMINI_API_URL, {
  contents: [{
    parts: [
      { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
      { text: detailedPrompt }
    ]
  }],
  generationConfig: {
    temperature: 0.1,  // 일관성 있는 응답
    maxOutputTokens: 16384
  }
});
```

### Excel 스타일링

```javascript
// 헤더 스타일
headerRow.eachCell((cell) => {
  cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
});
```

## 🎓 결론

이 프로젝트를 통해 AI를 활용한 문서 처리의 가능성을 확인했습니다. 특히 Gemini API의 PDF 직접 분석 기능이 매우 강력하다는 것을 경험했습니다. 프롬프트를 잘 작성하면 복잡한 문서도 정확하게 구조화할 수 있습니다.

## 📎 참고 자료

- [Google Gemini API 문서](https://ai.google.dev/docs)
- [ExcelJS 문서](https://github.com/exceljs/exceljs)
- [React Dropzone](https://react-dropzone.js.org/)

---

**작성일**: 2025년 12월  
**기술 스택**: React, TypeScript, Node.js, Express, Google Gemini API  
**프로젝트 기간**: 약 1일

