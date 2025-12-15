/**
 * Gemini API를 사용한 등기부 등본 PDF 파싱 모듈
 * Google Gemini 1.5 Flash를 사용하여 PDF에서 구조화된 데이터를 추출합니다.
 */

const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// 환경변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = GEMINI_API_KEY 
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  : null;

/**
 * PDF 파일을 Gemini API를 통해 파싱합니다.
 * PDF를 직접 base64로 인코딩하여 Gemini에 전달 (더 정확한 추출)
 * @param {string} filePath - PDF 파일 경로
 * @returns {Promise<Object>} 파싱된 등기부 데이터
 */
/**
 * 재시도 로직이 포함된 Gemini API 호출
 */
async function callGeminiAPIWithRetry(base64Pdf, prompt, maxRetries = 3) { // 재시도 횟수 복원
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[INFO] Gemini API 호출 시도 ${attempt}/${maxRetries}...`);
      
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Pdf
                }
              },
              {
                text: prompt
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384, // 원래 설정으로 복원 (JSON 생성 안정성)
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 타임아웃 120초로 복원 (큰 PDF 처리)
        }
      );
      
      return response;
      
    } catch (error) {
      console.error(`[WARN] 시도 ${attempt} 실패:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 재시도 전 대기 (지수 백오프)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[INFO] ${waitTime}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

async function parseRegistryPdfWithGemini(filePath) {
  try {
    // API 키 확인
    if (!GEMINI_API_KEY || !GEMINI_API_URL) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('[INFO] PDF 파일을 Gemini API로 직접 전송...');
    
    // PDF 파일을 base64로 인코딩
    const pdfBuffer = fs.readFileSync(filePath);
    const base64Pdf = pdfBuffer.toString('base64');
    const fileSizeMB = (pdfBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`[INFO] PDF 파일 크기: ${fileSizeMB}MB`);
    
    if (pdfBuffer.length > 20 * 1024 * 1024) {
      throw new Error('PDF 파일이 너무 큽니다 (최대 20MB)');
    }
    
    // Gemini API에 요청할 프롬프트 (종합 개선 버전)
    const prompt = `당신은 한국 등기부 등본(등기사항전부증명서) 전문 분석가입니다. 
다음 PDF 파일을 **완전히 분석**하여 **모든 정보를 빠짐없이 추출**하고 JSON 형식으로 반환해주세요.

**⚠️ 매우 중요 - 절대 금지 사항:**
1. **레이블 텍스트를 데이터로 넣지 마세요**
   - "번, 건물명칭 및 번호" → location 필드에 넣지 마세요 (이것은 레이블입니다)
   - "등기원인 및 기타사항" → landRightRatio 필드에 넣지 마세요 (이것은 다른 섹션의 레이블입니다)
   - "및 번호" → buildingName 필드에 넣지 마세요 (불완전한 값입니다)
   - "]" 또는 "[" → roadAddress 필드에 넣지 마세요 (잘못된 값입니다)

2. **각 필드의 실제 데이터만 추출하세요**
   - 레이블("소재지번:", "도로명주소:", "건물명칭:" 등) 뒤에 나오는 실제 값만 추출하세요
   - 표의 헤더 행이나 설명 텍스트는 데이터가 아닙니다

3. **JSON 문법을 정확히 지켜주세요**
   - 배열/객체 마지막 항목 뒤에 쉼표(,)를 사용하지 마세요
   - 문자열 내 특수문자는 반드시 이스케이프 처리하세요 (\\", \\n, \\\\)
   - 모든 문자열은 큰따옴표(")로 감싸세요
   - JSON만 반환하세요 (마크다운 코드 블록, 설명, 주석 없이)

**📋 최우선 지침 (반드시 순서대로 실행):**
1. PDF의 **모든 페이지**를 처음부터 끝까지 꼼꼼히 읽어주세요
2. **표제부(표지)** 섹션을 가장 먼저 확인하고, 다음 정보를 **반드시 모두** 추출하세요:
   - 고유번호: "고유번호" 또는 "등기번호" 레이블 뒤의 값 (형식: XXXX-XXXX-XXXXXX)
   - 소재지번: "소재지번" 또는 "소재지" 레이블 뒤의 주소 (동호수 제외)
   - 도로명주소: "도로명주소" 레이블 뒤의 주소 (동호수 제외)
   - 건물명칭: "건물명칭" 또는 "명칭" 레이블 뒤의 건물명과 동호수 전체
   - 소유자명: 표제부에 명시된 소유자 이름 (가등기 있는 경우 우선)
3. **갑구** 섹션의 **모든** 등기 항목을 순서대로 읽고 추출하세요 (하나도 빠뜨리지 마세요)
4. **을구** 섹션의 **모든** 등기 항목을 순서대로 읽고 추출하세요 (하나도 빠뜨리지 마세요)
5. 표 형식의 데이터를 **행별로 정확히** 읽어주세요 (가로로 읽지 말고 세로 열별로 읽으세요)
6. **말소 표시**(실선, 취소선, "말소" 텍스트)를 정확히 확인하여 상태를 "말소" 또는 "유효"로 구분하세요

**데이터 추출 규칙:**
1. 날짜 형식: YYYY-MM-DD로 변환 (예: 2024년8월22일 → 2024-08-22, 2024.8.22 → 2024-08-22)
2. 금액 형식: 숫자만 추출 (예: 금231,000,000원 → 231000000, 231,000,000원 → 231000000)
3. 순위번호: 정확히 추출 (예: 1, 2, 3 또는 1-1, 9-1 등 부기등기 포함)
4. 주민등록번호: 마스킹된 형태 그대로 추출 (예: 123456-1*****)
5. 가등기(假登記) 처리: 가등기가 있는 경우, 표제부에 명시된 소유자 정보를 basicInfo.ownerName에 반영하세요
6. 특수문자: JSON에서 특수문자(따옴표, 줄바꿈, 백슬래시 등)는 반드시 이스케이프 처리하세요
7. JSON 문법: 배열/객체 마지막 항목 뒤에 쉼표(,)를 사용하지 마세요

**추출할 정보 (표제부부터 순서대로):**

1. 표제부 (【표제부】 또는 첫 페이지 상단):
   **⚠️ CRITICAL: 다음 정보를 정확히 찾아 추출하세요. 레이블이나 컬럼 헤더가 아닌 실제 데이터 값만 추출하세요!**
   
   **🔍 PDF 문서에서 정확히 이렇게 찾으세요:**
   
   - **고유번호**: 
     문서 상단에 "고유번호 XXXX-XXXX-XXXXXX" 형식으로 표시됨
     예시: PDF에 "고유번호 1342-2017-016558" → JSON에 "1342-2017-016558"
     ❌ "고유번호" 라는 텍스트 자체를 넣지 마세요
   
   - **소재지번**: 
     표제부 표에서 "소재지번,건물명칭 및 번호" 컬럼 아래의 주소 부분만 (시/구/동/번지까지, 건물명 제외)
     예시: PDF에 "경기도 광주시 태전동 695\n이편한세상태전2차 제102동" 
          → JSON에 "경기도 광주시 태전동 695"
     ❌ "번,건물명칭 및 번호" (이것은 컬럼 헤더입니다!)
     ❌ "및 번호" (불완전한 값)
   
   - **도로명주소**: 
     "[도로명주소]" 표시 바로 다음 줄의 주소 (건물명 제외)
     예시: PDF에 "[도로명주소]\n경기도 광주시 태전동로 12\n이편한세상태전2차" 
          → JSON에 "경기도 광주시 태전동로 12"
     ❌ "]" 또는 "[" (이것은 마커입니다!)
   
   - **건물명칭**: 
     소재지번 아래에 표시된 아파트명과 동호수 전체
     예시: PDF에 "이편한세상태전2차 제102동 제2층 제202호" 
          → JSON에 "이편한세상태전2차 제102동 제2층 제202호"
     ❌ "및 번호" (불완전한 값)
   
   - **건물구조**: 
     "건물내역" 컬럼에서 구조 정보 (철근콘크리트 등)
     예시: "철근콘크리트구조\n(철근)콘크리트평슬라브지붕"
   
   - **전용면적**: 
     전유부분 표에서 "건물내역" 컬럼의 면적
     예시: "84.9918㎡"
   
   - **대지권비율**: 
     대지권 표에서 "대지권비율" 컬럼의 값 (XX분의 XX 형식)
     예시: "18191.7분의 55.5162"
     ❌ "등기원인 및 기타사항" (이것은 다른 컬럼입니다!)
   
   - **대지권종류**: "대지권종류" 레이블 뒤의 정보
   
   - **소유자명 (매우 중요!)**: 
     ⚠️ 표제부에 명시된 실제 소유자 이름만 추출하세요
     - 표제부의 "소유자" 또는 "소유지분현황" 란에 기재된 이름 추출
     - ❌ "가등기 권리자"는 소유자가 아니므로 추출하지 마세요
     - ❌ "가압류 권리자"는 소유자가 아니므로 추출하지 마세요
     - ✅ "소유자" 또는 "소유지분현황"에 명시된 이름만 추출
     예: "소유자: 홍길동" → "홍길동"
     예: "1. 소유지분현황: 김철수" → "김철수"
     예: 가등기 권리자: 이영희 (X - 추출하지 마세요)
     - 표제부에 명확한 소유자 정보가 없으면 빈 문자열("")로 두세요
   
   **표제부 추출 시 핵심 원칙:**
   - 레이블("소재지번:", "도로명주소:" 등)은 추출하지 마세요
   - 레이블 뒤에 나오는 실제 데이터 값만 추출하세요
   - 소재지번과 도로명주소에는 동호수(제XX동, 제XX층, 제XX호)를 포함하지 마세요
   - 건물명칭 필드에는 반드시 동호수 정보를 포함하세요 (집합건물의 경우 필수)
   - **소유자명은 반드시 표제부에 명시된 사람의 이름을 추출하세요** (가등기, 가압류, 기타 모든 상황 포함)

2. 갑구 (【갑구】 섹션 - 소유권에 관한 사항):
   **⚠️ CRITICAL: 말소된 항목도 반드시 포함하세요! 실선이 그어진 항목도 모두 추출하세요.**
   
   각 순위번호별로 다음 정보 추출:
   - **순위번호**: 1, 2, 3 또는 1-1, 3-1 등 부기등기 포함
   - **등기목적**: 소유권보존, 소유권이전, 금지사항등기, 가등기 등
   - **접수일자**: YYYY-MM-DD 형식으로 변환 (예: 2018년1월18일 → 2018-01-18)
   - **접수번호**: 제XX호 형식 그대로
   - **등기원인**: 매매, 증여, 상속, 신탁 등
   - **권리자**: "소유자" 또는 "권리자" 뒤의 이름
   - **주민등록번호**: 마스킹된 형태 그대로 (예: 800501-*******)
   - **주소**: 권리자의 주소 전체
   - **상태**: 
     * 실선(─)이 그어져 있거나 "말소"라고 명시되어 있으면 → "말소"
     * 그 외 모든 경우 → "유효"
   
   **예시 (PDF에서):**
   ```
   3    소유권이전    2018년1월18일    2015년6월9일    소유자  권지은  800501-*******
                    제5909호        매매            경기도 광주시 문화로101번길 9...
   ```
   → JSON: {"rankNumber":"3", "purpose":"소유권이전", "receiptDate":"2018-01-18", ...}

3. 을구 (【을구】 섹션 - 소유권 이외의 권리에 관한 사항):
   **⚠️ CRITICAL: 근저당권, 전세권, 근질권 등 모든 항목을 추출하세요. 말소된 항목도 포함!**
   
   각 순위번호별로:
   - **순위번호**: 1, 2, 3 또는 9-1, 10-1 등 부기등기 포함
   - **등기목적**: 근저당권설정, 전세권설정, 근질권설정, 근저당권말소 등
   - **접수일자**: YYYY-MM-DD 형식
   - **접수번호**: 제XX호
   - **등기원인**: 설정계약, 해지 등
   - **채권최고액/전세금**: "금" 다음의 숫자만 (예: 금231,000,000원 → 231000000)
   - **채무자**: "채무자" 뒤의 이름
   - **권리자**: "근저당권자", "전세권자", "채권자" 뒤의 이름/회사명
   - **상태**: 실선이 그어져 있거나 "말소"가 명시되어 있으면 "말소", 아니면 "유효"
   
   **예시 (PDF에서):**
   ```
   8    근저당권설정    2024년8월22일    2024년8월21일    채권최고액  금204,600,000원
                      제52764호        설정계약        채무자  권지은
                                                      근저당권자  주식회사한국스탠다드차타드은행
   ```
   → JSON: {"rankNumber":"8", "purpose":"근저당권설정", "claimAmount":"204600000", ...}

**반환 형식 및 예시 (PDF 내용을 정확히 파싱한 결과):**

⚠️ 아래 예시는 실제 등기부등본 PDF를 올바르게 파싱한 결과입니다. 이와 같은 형식으로 반환하세요.

{
  "basicInfo": {
    "uniqueNumber": "1342-2017-016558",
    "location": "경기도 광주시 태전동 695",
    "roadAddress": "경기도 광주시 태전동로 12",
    "buildingName": "이편한세상태전2차 제102동 제2층 제202호",
    "structure": "철근콘크리트구조",
    "exclusiveArea": "84.9918㎡",
    "landRightRatio": "18191.7분의 55.5162",
    "landRightType": "소유권대지권",
    "ownerName": "권지은"
  },
  "sectionA": [
    {
      "rankNumber": "1",
      "purpose": "소유권보존",
      "receiptDate": "2017-11-27",
      "receiptNumber": "제85281호",
      "registrationCause": "신탁",
      "rightHolder": "케이비부동산신탁주식회사",
      "idNumber": "110111-1348237",
      "address": "서울특별시 강남구 테헤란로 124(역삼동)",
      "status": "유효"
    },
    {
      "rankNumber": "3",
      "purpose": "소유권이전",
      "receiptDate": "2018-01-18",
      "receiptNumber": "제5909호",
      "registrationCause": "매매",
      "rightHolder": "권지은",
      "idNumber": "800501-*******",
      "address": "경기도 광주시 문화로101번길 9,107동102호(경안동,경안대우아파트)",
      "status": "유효"
    }
  ],
  "sectionB": [
    {
      "rankNumber": "5",
      "purpose": "근저당권설정",
      "receiptDate": "2022-08-12",
      "receiptNumber": "제54459호",
      "registrationCause": "설정계약",
      "claimAmount": "144000000",
      "debtor": "주식회사나무꼴",
      "rightHolder": "주식회사하나은행",
      "status": "유효"
    },
    {
      "rankNumber": "8",
      "purpose": "근저당권설정",
      "receiptDate": "2024-08-22",
      "receiptNumber": "제52764호",
      "registrationCause": "설정계약",
      "claimAmount": "204600000",
      "debtor": "권지은",
      "rightHolder": "주식회사한국스탠다드차타드은행",
      "status": "유효"
    }
  ]
}

⚠️ 주의사항:
- 모든 필드는 문자열(string) 타입입니다
- 숫자 금액도 문자열로 반환하되 쉼표 제거 (예: "204600000")
- 정보가 없으면 빈 문자열 "" 또는 빈 배열 []
- JSON 마지막 항목 뒤에 쉼표(,) 금지
- 순수한 JSON만 반환 (설명이나 마크다운 코드 블록 없이)

**✅ 최종 확인 사항 (반환 전 반드시 체크):**
1. **JSON 문법 검증**
   - 배열/객체 마지막 항목 뒤에 쉼표(,)가 없나요?
   - 모든 문자열이 큰따옴표(")로 감싸져 있나요?
   - 특수문자가 올바르게 이스케이프되었나요?
   - JSON이 완전히 닫혀있나요? (중괄호와 대괄호가 모두 닫혀있어야 함)

2. **데이터 검증**
   - location 필드에 "번, 건물명칭 및 번호" 같은 레이블이 들어가지 않았나요?
   - roadAddress 필드에 "]" 같은 잘못된 값이 들어가지 않았나요?
   - buildingName 필드에 "및 번호" 같은 불완전한 값이 들어가지 않았나요?
   - landRightRatio 필드에 "등기원인 및 기타사항" 같은 다른 섹션의 텍스트가 들어가지 않았나요?
   - 각 필드에 실제 데이터 값이 들어갔나요?

3. **완전성 검증**
   - sectionA 배열에 모든 갑구 항목이 포함되었나요?
   - sectionB 배열에 모든 을구 항목이 포함되었나요?
   - basicInfo의 필수 필드(uniqueNumber, location 등)가 모두 채워졌나요?

**📤 응답 형식:**
- 반드시 유효한 JSON 객체만 반환하세요
- 마크다운 코드 블록이나 다른 설명 없이 순수 JSON만 반환하세요
- 모든 필드는 문자열로 반환하세요 (숫자 필드도 문자열)
- 정보가 없으면 빈 문자열 "" 또는 빈 배열 []을 반환하세요
- JSON이 완전히 닫혀있어야 합니다 (중첩된 모든 객체와 배열이 올바르게 닫혀있어야 함)

**예시 (올바른 형식):**
{
  "basicInfo": {
    "uniqueNumber": "1342-2017-016558",
    "location": "경기도 광주시 태전동 695",
    "roadAddress": "경기도 광주시 태전동로 12",
    "buildingName": "이편한세상태전2차 제102동 제2층 제202호",
    "structure": "철근콘크리트구조...",
    "exclusiveArea": "84.9918m²",
    "landRightRatio": "18191.7분의 55.5162",
    "landRightType": "소유권대지권",
    "ownerName": "권지은"
  },
  "sectionA": [
    {
      "rankNumber": "1",
      "purpose": "소유권보존",
      "receiptDate": "2017-11-27",
      "receiptNumber": "제85281호",
      "registrationCause": "신탁",
      "rightHolder": "케이비부동산신탁주식회사",
      "idNumber": "110111-1348237",
      "address": "서울특별시 강남구 테헤란로 124(역삼동)",
      "status": "유효"
    }
  ],
  "sectionB": [
    {
      "rankNumber": "1",
      "purpose": "근저당권설정",
      "receiptDate": "2018-01-18",
      "receiptNumber": "제12345호",
      "registrationCause": "설정계약",
      "claimAmount": "144000000",
      "debtor": "권지은",
      "rightHolder": "신한은행",
      "status": "유효"
    }
  ]
}`;

    // Gemini API 요청 (PDF를 직접 전달, 재시도 로직 포함)
    console.log('[INFO] Gemini API에 PDF 전송 중...');
    const response = await callGeminiAPIWithRetry(base64Pdf, prompt);

    console.log('[INFO] Gemini API 응답 수신');

    // 응답에서 텍스트 추출
    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log('[INFO] Gemini API 응답 수신 완료');
    console.log('[DEBUG] Gemini 응답 전체 길이:', responseText.length, '자');
    console.log('[DEBUG] Gemini 응답 처음 2000자:', responseText.substring(0, 2000));
    console.log('[DEBUG] Gemini 응답 마지막 1000자:', responseText.substring(Math.max(0, responseText.length - 1000)));
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:244',message:'gemini response received',data:{responseLength:responseText.length,first1000Chars:responseText.substring(0,1000),last500Chars:responseText.substring(Math.max(0,responseText.length-500))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // JSON 추출 및 정제 함수 (중첩 구조 올바르게 처리)
    function extractJsonFromResponse(text) {
      let jsonText = text.trim();
      
      // 1. 마크다운 코드 블록 제거
      jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // 2. JSON 객체만 추출 (중첩 구조를 올바르게 처리)
      // 첫 번째 {를 찾고, 중괄호 카운터로 올바른 닫는 }를 찾음
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace === -1) {
        console.error('[ERROR] JSON 객체를 찾을 수 없습니다 (시작 중괄호 없음).');
        console.error('[DEBUG] 전체 응답 텍스트 (처음 1000자):', text.substring(0, 1000));
        throw new Error('Gemini API 응답에서 JSON 객체를 찾을 수 없습니다.');
      }
      
      let braceCount = 0;
      let inString = false;
      let escaped = false;
      let endBrace = -1;
      
      for (let i = firstBrace; i < jsonText.length; i++) {
        const char = jsonText[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endBrace = i;
              break;
            }
          }
        }
      }
      
      if (endBrace === -1) {
        console.error('[ERROR] JSON 객체의 닫는 중괄호를 찾을 수 없습니다.');
        console.error('[DEBUG] 전체 응답 텍스트 (처음 1000자):', text.substring(0, 1000));
        throw new Error('Gemini API 응답에서 JSON 객체의 닫는 중괄호를 찾을 수 없습니다.');
      }
      
      jsonText = jsonText.substring(firstBrace, endBrace + 1);
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:290',message:'json extracted with proper nesting',data:{jsonTextLength:jsonText.length,firstBrace:firstBrace,endBrace:endBrace,originalLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      } catch (e) {}
      // #endregion
      
      return jsonText;
    }
    
    // 강력한 JSON 수정 함수
    function fixJsonSyntax(jsonText) {
      let fixed = jsonText;
      
      // 1. 마지막 쉼표 제거 (여러 번 반복)
      for (let i = 0; i < 10; i++) {
        const before = fixed;
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        if (before === fixed) break;
      }
      
      // 2. 문자열 내부가 아닌 곳의 주석 제거 (// 또는 /* */)
      // 하지만 JSON에는 주석이 없어야 하므로 제거
      fixed = fixed.replace(/\/\/.*$/gm, ''); // 라인 주석
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // 블록 주석
      
      // 3. 문자열 밖의 줄바꿈/탭 정리 (안전하게)
      let inString = false;
      let escaped = false;
      let result = '';
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        const nextChar = fixed[i + 1];
        
        if (escaped) {
          result += char;
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          result += char;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (!inString) {
          // 문자열 밖에서만 처리
          if (char === '\n' || char === '\r') {
            // 줄바꿈을 공백으로 (단, 연속된 공백은 하나로)
            if (result[result.length - 1] !== ' ') {
              result += ' ';
            }
            continue;
          }
          if (char === '\t') {
            result += ' ';
            continue;
          }
        }
        
        result += char;
      }
      
      fixed = result;
      
      // 4. 연속된 공백 정리 (문자열 밖에서만)
      fixed = fixed.replace(/\s+/g, ' ');
      
      // 5. 특수한 경우: 단일 따옴표를 큰따옴표로 변환 (문자열 밖에서만)
      // 하지만 이건 위험할 수 있으므로 주석 처리
      
      return fixed;
    }
    
    // JSON 추출
    let jsonText = extractJsonFromResponse(responseText);
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:423',message:'json extracted before parse',data:{jsonTextLength:jsonText.length,first500Chars:jsonText.substring(0,500),last200Chars:jsonText.substring(Math.max(0,jsonText.length-200)),hasBasicInfoInText:jsonText.includes('"basicInfo"'),hasLocationInText:jsonText.includes('"location"'),hasSectionA:jsonText.includes('"sectionA"'),hasSectionB:jsonText.includes('"sectionB"')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // JSON 파싱 (재시도 로직 포함, 더 강력한 수정)
    let parsedData;
    let parseAttempts = 0;
    const maxParseAttempts = 7; // 재시도 횟수 증가
    let workingJsonText = jsonText;
    const originalJsonText = jsonText; // 원본 보관
    
    while (parseAttempts < maxParseAttempts) {
      try {
        parsedData = JSON.parse(workingJsonText);
        console.log(`[INFO] JSON 파싱 성공 (시도 ${parseAttempts + 1}/${maxParseAttempts})`);
        
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:380',message:'json parse success',data:{attempt:parseAttempts+1,hasBasicInfo:!!parsedData.basicInfo,basicInfoKeys:parsedData.basicInfo?Object.keys(parsedData.basicInfo):[],locationValue:parsedData.basicInfo?.location,roadAddressValue:parsedData.basicInfo?.roadAddress,buildingNameValue:parsedData.basicInfo?.buildingName,ownerNameValue:parsedData.basicInfo?.ownerName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        } catch (e) {}
        // #endregion
        
        break; // 성공하면 루프 종료
      } catch (parseError) {
        parseAttempts++;
        const errorMsg = parseError.message;
        console.error(`[ERROR] JSON 파싱 실패 (시도 ${parseAttempts}/${maxParseAttempts}):`, errorMsg);
        
        // 오류 위치 추출
        const positionMatch = errorMsg.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1]) : null;
        
        if (errorPosition && errorPosition < workingJsonText.length) {
          const start = Math.max(0, errorPosition - 100);
          const end = Math.min(workingJsonText.length, errorPosition + 100);
          console.error(`[DEBUG] 오류 위치 주변 (${start}-${end}):`, workingJsonText.substring(start, end));
          console.error(`[DEBUG] 오류 위치 문자:`, workingJsonText[errorPosition], `(코드: ${workingJsonText.charCodeAt(errorPosition)})`);
        }
        
        if (parseAttempts >= maxParseAttempts) {
          // 최종 시도: 가장 강력한 수정
          try {
            console.log('[INFO] 최종 시도: 강력한 JSON 수정 적용...');
            
            // 원본으로 복원
            workingJsonText = originalJsonText;
            
            // 강력한 수정 적용
            workingJsonText = fixJsonSyntax(workingJsonText);
            
            parsedData = JSON.parse(workingJsonText);
            console.log('[INFO] JSON 파싱 성공 (최종 수정 후)');
            break;
          } catch (finalError) {
            console.error('[ERROR] 최종 JSON 파싱 실패:', finalError.message);
            console.error('[ERROR] 원본 파싱 오류:', parseError.message);
            console.error('[DEBUG] JSON 텍스트 길이:', workingJsonText.length);
            console.error('[DEBUG] JSON 텍스트 (처음 2000자):', workingJsonText.substring(0, 2000));
            console.error('[DEBUG] JSON 텍스트 (마지막 1000자):', workingJsonText.substring(Math.max(0, workingJsonText.length - 1000)));
            
            if (errorPosition) {
              const contextStart = Math.max(0, errorPosition - 300);
              const contextEnd = Math.min(workingJsonText.length, errorPosition + 300);
              console.error('[DEBUG] 오류 위치 주변 (600자):', workingJsonText.substring(contextStart, contextEnd));
            }
            
            // #region agent log
            try {
              fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:370',message:'JSON parse error final',data:{error:finalError.message,originalError:parseError.message,jsonTextLength:workingJsonText.length,first500Chars:workingJsonText.substring(0,500),errorPosition:errorPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            } catch (e) {}
            // #endregion
            
            // 원본 응답도 로그로 출력
            console.error('[ERROR] 원본 Gemini 응답 (처음 3000자):', responseText.substring(0, 3000));
            console.error('[ERROR] 원본 Gemini 응답 (마지막 3000자):', responseText.substring(Math.max(0, responseText.length - 3000)));
            
            throw new Error(`JSON 파싱 실패 (${maxParseAttempts}회 시도): ${finalError.message}`);
          }
        } else {
          // 재시도 전: 점진적으로 수정 적용
          if (parseAttempts === 1) {
            // 1차: 마지막 쉼표만 제거
            workingJsonText = originalJsonText.replace(/,(\s*[}\]])/g, '$1');
          } else if (parseAttempts === 2) {
            // 2차: 여러 번 쉼표 제거
            workingJsonText = originalJsonText;
            for (let i = 0; i < 5; i++) {
              workingJsonText = workingJsonText.replace(/,(\s*[}\]])/g, '$1');
            }
          } else {
            // 3차 이상: 강력한 수정 적용
            workingJsonText = fixJsonSyntax(originalJsonText);
          }
        }
      }
    }
    
    // 파싱된 데이터 검증
    if (!parsedData) {
      throw new Error('JSON 파싱은 성공했지만 데이터가 null입니다.');
    }
    
    // 데이터 구조 검증 및 초기화
    if (!parsedData.basicInfo) {
      console.warn('[WARN] parsedData.basicInfo가 없습니다. 빈 객체로 초기화합니다.');
      parsedData.basicInfo = {};
    }
    
    if (!Array.isArray(parsedData.sectionA)) {
      console.warn('[WARN] parsedData.sectionA가 배열이 아닙니다. 빈 배열로 초기화합니다.');
      parsedData.sectionA = [];
    }
    
    if (!Array.isArray(parsedData.sectionB)) {
      console.warn('[WARN] parsedData.sectionB가 배열이 아닙니다. 빈 배열로 초기화합니다.');
      parsedData.sectionB = [];
    }
    
    // basicInfo 필수 필드 확인 및 데이터 유효성 검증
    const validationErrors = [];
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:490',message:'before validation',data:{basicInfoKeys:Object.keys(parsedData.basicInfo||{}),locationValue:parsedData.basicInfo?.location,roadAddressValue:parsedData.basicInfo?.roadAddress,buildingNameValue:parsedData.basicInfo?.buildingName,ownerNameValue:parsedData.basicInfo?.ownerName,uniqueNumberValue:parsedData.basicInfo?.uniqueNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // location 필드 검증 (잘못된 값 감지)
    if (parsedData.basicInfo.location) {
      const location = parsedData.basicInfo.location.trim();
      if (location === '번, 건물명칭 및 번호' || location === '및 번호' || location.length < 5) {
        validationErrors.push(`location 필드가 잘못된 값입니다: "${location}"`);
        console.error(`[ERROR] location 필드 오류: "${location}"`);
        
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:500',message:'location validation error',data:{locationValue:location,error:'invalid location value'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        } catch (e) {}
        // #endregion
      }
    }
    
    // roadAddress 필드 검증
    if (parsedData.basicInfo.roadAddress) {
      const roadAddress = parsedData.basicInfo.roadAddress.trim();
      if (roadAddress === ']' || roadAddress === '[' || roadAddress.length < 3) {
        validationErrors.push(`roadAddress 필드가 잘못된 값입니다: "${roadAddress}"`);
        console.error(`[ERROR] roadAddress 필드 오류: "${roadAddress}"`);
      }
    }
    
    // buildingName 필드 검증
    if (parsedData.basicInfo.buildingName) {
      const buildingName = parsedData.basicInfo.buildingName.trim();
      if (buildingName === '및 번호' || buildingName.length < 2) {
        validationErrors.push(`buildingName 필드가 잘못된 값입니다: "${buildingName}"`);
        console.error(`[ERROR] buildingName 필드 오류: "${buildingName}"`);
      }
    }
    
    // landRightRatio 필드 검증 (다른 필드의 값이 잘못 들어간 경우)
    if (parsedData.basicInfo.landRightRatio) {
      const ratio = parsedData.basicInfo.landRightRatio.trim();
      if (ratio.includes('등기원인') || ratio.includes('기타사항') || ratio.length > 50) {
        validationErrors.push(`landRightRatio 필드가 잘못된 값입니다: "${ratio}"`);
        console.error(`[ERROR] landRightRatio 필드 오류: "${ratio}"`);
      }
    }
    
    // uniqueNumber 검증
    if (!parsedData.basicInfo.uniqueNumber || parsedData.basicInfo.uniqueNumber.trim() === '') {
      validationErrors.push('uniqueNumber 필드가 없습니다.');
      console.error('[ERROR] uniqueNumber 필드가 없습니다.');
    } else {
      // 고유번호 형식 검증 (XXXX-XXXX-XXXXXX)
      const uniqueNumber = parsedData.basicInfo.uniqueNumber.trim();
      if (!/^\d{4}-\d{4}-\d{6}$/.test(uniqueNumber)) {
        console.warn(`[WARN] uniqueNumber 형식이 올바르지 않을 수 있습니다: "${uniqueNumber}"`);
      }
    }
    
    // 검증 오류가 있으면 경고
    if (validationErrors.length > 0) {
      console.error(`[ERROR] 데이터 검증 실패 (${validationErrors.length}개 오류):`);
      validationErrors.forEach((error, i) => {
        console.error(`[ERROR] ${i + 1}. ${error}`);
      });
      console.error('[ERROR] 파싱된 데이터가 유효하지 않습니다. Gemini API 응답을 확인하세요.');
      console.error('[ERROR] 파싱된 basicInfo:', JSON.stringify(parsedData.basicInfo, null, 2));
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:540',message:'validation failed',data:{errorCount:validationErrors.length,errors:validationErrors,basicInfo:parsedData.basicInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      } catch (e) {}
      // #endregion
    }
    
    if (!parsedData.basicInfo.location && !parsedData.basicInfo.uniqueNumber) {
      console.warn('[WARN] basicInfo에 필수 정보가 없습니다. 파싱 결과를 확인하세요.');
    }
    
    console.log('[INFO] Gemini API 파싱 완료');
    console.log('[DEBUG] 추출된 데이터 구조:', {
      basicInfo: Object.keys(parsedData.basicInfo || {}),
      sectionACount: (parsedData.sectionA || []).length,
      sectionBCount: (parsedData.sectionB || []).length
    });
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:560',message:'parsing complete',data:{basicInfoKeys:Object.keys(parsedData.basicInfo||{}),sectionACount:parsedData.sectionA?.length||0,sectionBCount:parsedData.sectionB?.length||0,hasSummary:!!parsedData.summary,locationValue:parsedData.basicInfo?.location,ownerNameValue:parsedData.basicInfo?.ownerName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // 파싱된 데이터의 실제 내용 확인 (디버깅용)
    console.log('[DEBUG] basicInfo 전체 내용:', JSON.stringify(parsedData.basicInfo || {}, null, 2));
    console.log('[DEBUG] basicInfo.location:', parsedData.basicInfo?.location);
    console.log('[DEBUG] basicInfo.roadAddress:', parsedData.basicInfo?.roadAddress);
    console.log('[DEBUG] basicInfo.buildingName:', parsedData.basicInfo?.buildingName);
    console.log('[DEBUG] basicInfo.ownerName:', parsedData.basicInfo?.ownerName);
    console.log('[DEBUG] basicInfo.uniqueNumber:', parsedData.basicInfo?.uniqueNumber);
    console.log('[DEBUG] basicInfo.landRightRatio:', parsedData.basicInfo?.landRightRatio);
    
    if (parsedData.sectionA && parsedData.sectionA.length > 0) {
      console.log('[DEBUG] sectionA 항목 수:', parsedData.sectionA.length);
      console.log('[DEBUG] sectionA 첫 번째 항목:', JSON.stringify(parsedData.sectionA[0], null, 2));
    } else {
      console.warn('[WARN] sectionA가 비어있습니다!');
    }
    
    if (parsedData.sectionB && parsedData.sectionB.length > 0) {
      console.log('[DEBUG] sectionB 항목 수:', parsedData.sectionB.length);
      console.log('[DEBUG] sectionB 첫 번째 항목:', JSON.stringify(parsedData.sectionB[0], null, 2));
    } else {
      console.warn('[WARN] sectionB가 비어있습니다!');
    }
    
    // 데이터가 비어있는지 확인
    if (!parsedData.basicInfo || Object.keys(parsedData.basicInfo).length === 0) {
      console.error('[ERROR] basicInfo가 완전히 비어있습니다!');
      console.error('[ERROR] 이것은 Gemini API가 데이터를 추출하지 못했음을 의미합니다.');
    } else {
      // 각 필드가 비어있는지 확인
      const emptyFields = [];
      if (!parsedData.basicInfo.location || parsedData.basicInfo.location.trim() === '') {
        emptyFields.push('location');
      }
      if (!parsedData.basicInfo.ownerName || parsedData.basicInfo.ownerName.trim() === '') {
        emptyFields.push('ownerName');
      }
      if (emptyFields.length > 0) {
        console.warn(`[WARN] basicInfo의 다음 필드가 비어있습니다: ${emptyFields.join(', ')}`);
      }
    }
    
    // 데이터 검증 및 정제
    const cleanedData = validateAndCleanData(parsedData);
    
    // #region agent log
    console.log('[DEBUG] after validateAndCleanData:', {
      hasBasicInfo: !!cleanedData.basicInfo,
      hasOwnerName: !!cleanedData.basicInfo?.ownerName,
      sectionACount: cleanedData.sectionA?.length,
      sectionBCount: cleanedData.sectionB?.length
    });
    // #endregion
    
    // 요약 정보 생성
    const summary = generateSummary(cleanedData.basicInfo, cleanedData.sectionA, cleanedData.sectionB);
    
    // #region agent log
    console.log('[DEBUG] after generateSummary:', {
      currentOwner: summary?.currentOwner,
      hasWarnings: summary?.warnings?.length > 0
    });
    // #endregion
    
    return {
      basicInfo: cleanedData.basicInfo || {},
      sectionA: cleanedData.sectionA || [],
      sectionB: cleanedData.sectionB || [],
      summary,
      rawText: responseText
    };
    
  } catch (error) {
    console.error('[ERROR] Gemini API 파싱 실패:', error.message);
    
    if (error.response) {
      console.error('[ERROR] API 응답 상태:', error.response.status);
      console.error('[ERROR] API 응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Gemini API 요청 시간 초과 (60초)');
    }
    
    throw new Error(`Gemini API 파싱 실패: ${error.message}`);
  }
}

/**
 * 데이터 검증 및 정제
 */
function validateAndCleanData(parsedData) {
  // 기본정보 검증
  if (!parsedData.basicInfo) {
    parsedData.basicInfo = {};
  }
  
  // 갑구 검증
  if (!Array.isArray(parsedData.sectionA)) {
    parsedData.sectionA = [];
  }
  
  // 을구 검증
  if (!Array.isArray(parsedData.sectionB)) {
    parsedData.sectionB = [];
  }
  
  // 각 항목 정제
  parsedData.sectionA = parsedData.sectionA.map(item => ({
    rankNumber: String(item.rankNumber || ''),
    purpose: String(item.purpose || ''),
    receiptDate: formatDate(item.receiptDate),
    receiptNumber: String(item.receiptNumber || ''),
    registrationCause: String(item.registrationCause || ''),
    rightHolder: String(item.rightHolder || ''),
    idNumber: String(item.idNumber || ''),
    address: String(item.address || ''),
    status: item.status === '말소' ? '말소' : '유효'
  }));
  
  parsedData.sectionB = parsedData.sectionB.map(item => ({
    rankNumber: String(item.rankNumber || ''),
    purpose: String(item.purpose || ''),
    receiptDate: formatDate(item.receiptDate),
    receiptNumber: String(item.receiptNumber || ''),
    registrationCause: String(item.registrationCause || ''),
    claimAmount: String(item.claimAmount || '0'),
    debtor: String(item.debtor || ''),
    rightHolder: String(item.rightHolder || ''),
    status: item.status === '말소' ? '말소' : '유효'
  }));
  
  return parsedData;
}

/**
 * 날짜 형식 변환 (YYYY-MM-DD)
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // YYYY년MM월DD일 형식 변환
  const match = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (match) {
    const year = match[1];
    const month = String(match[2]).padStart(2, '0');
    const day = String(match[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

/**
 * 요약 정보 생성
 */
function generateSummary(basicInfo, sectionA, sectionB) {
  // 현재 소유자 찾기
  // 우선순위:
  // 1. 갑구의 유효한 소유권이전/소유권보존 (가등기 제외)
  // 2. 표제부의 ownerName (가압류 등의 경우)
  // 3. 갑구의 기타 유효한 항목
  let currentOwner = null;
  
  // 1차: 갑구에서 유효한 소유권 등기 찾기 (가등기 제외)
  const validOwnershipEntries = sectionA?.filter(e => 
    e.status === '유효' && 
    (e.purpose?.includes('소유권이전') || e.purpose?.includes('소유권보존')) &&
    !e.purpose?.includes('가등기')
  );
  
  if (validOwnershipEntries && validOwnershipEntries.length > 0) {
    // 가장 최근(마지막) 소유권 등기 사용
    const latestEntry = validOwnershipEntries[validOwnershipEntries.length - 1];
    console.log('[INFO] 갑구의 유효한 소유권 정보 사용:', latestEntry.rightHolder);
    currentOwner = {
      rightHolder: latestEntry.rightHolder,
      idNumber: latestEntry.idNumber || '',
      address: latestEntry.address || '',
      receiptDate: latestEntry.receiptDate || ''
    };
  }
  
  // 2차: 갑구에 소유권 정보가 없으면 표제부 확인 (가압류 등의 경우)
  if (!currentOwner && basicInfo?.ownerName && basicInfo.ownerName.trim() !== '') {
    console.log('[INFO] 표제부 소유자 정보 사용 (갑구에 소유권 없음):', basicInfo.ownerName);
    
    // 갑구에서 일치하는 항목 찾기 (상세 정보 보완용)
    const matchingEntry = sectionA?.find(e => 
      e.status === '유효' && 
      e.rightHolder === basicInfo.ownerName
    );
    
    if (matchingEntry) {
      currentOwner = {
        rightHolder: basicInfo.ownerName,
        idNumber: matchingEntry.idNumber || '',
        address: matchingEntry.address || '',
        receiptDate: matchingEntry.receiptDate || ''
      };
    } else {
      currentOwner = {
        rightHolder: basicInfo.ownerName,
        idNumber: '',
        address: '',
        receiptDate: ''
      };
    }
  }
  
  // 3차: 그래도 없으면 갑구의 기타 유효한 항목
  if (!currentOwner) {
    console.log('[INFO] 갑구의 기타 유효한 항목에서 검색');
    const anyValidEntry = sectionA?.filter(e => e.status === '유효').pop();
    if (anyValidEntry) {
      currentOwner = {
        rightHolder: anyValidEntry.rightHolder,
        idNumber: anyValidEntry.idNumber || '',
        address: anyValidEntry.address || '',
        receiptDate: anyValidEntry.receiptDate || ''
      };
    }
  }
  
  // 유효한 근저당권 총액
  const validMortgages = sectionB?.filter(e => 
    e.status === '유효' && e.purpose?.includes('근저당권설정')
  ) || [];
  
  const totalMortgage = validMortgages.reduce((sum, e) => {
    const amount = parseFloat((e.claimAmount || '0').toString().replace(/[^\d]/g, ''));
    return sum + amount;
  }, 0);
  
  // 유효한 전세권 총액
  const validLeases = sectionB?.filter(e => 
    e.status === '유효' && e.purpose?.includes('전세권설정')
  ) || [];
  
  const totalLease = validLeases.reduce((sum, e) => {
    const amount = parseFloat((e.claimAmount || '0').toString().replace(/[^\d]/g, ''));
    return sum + amount;
  }, 0);
  
  // 경고사항
  const warnings = [];
  
  if (sectionA?.some(e => e.status === '유효' && (e.purpose?.includes('가압류') || e.purpose?.includes('압류')))) {
    warnings.push('⚠️ 유효한 압류/가압류 등기가 있습니다.');
  }
  
  if (sectionA?.some(e => e.status === '유효' && e.purpose?.includes('경매'))) {
    warnings.push('⚠️ 경매 진행 중인 것으로 보입니다.');
  }
  
  if (sectionB?.some(e => e.status === '유효' && e.purpose?.includes('가처분'))) {
    warnings.push('⚠️ 처분금지가처분이 설정되어 있습니다.');
  }
  
  return {
    currentOwner: currentOwner?.rightHolder || '확인필요',
    ownerIdNumber: currentOwner?.idNumber || '',
    ownerAddress: currentOwner?.address || '',
    totalMortgage: formatCurrency(totalMortgage.toString()),
    mortgageCount: validMortgages.length,
    totalLease: formatCurrency(totalLease.toString()),
    leaseCount: validLeases.length,
    warnings: warnings,
    totalValidRightsInSectionA: sectionA?.filter(e => e.status === '유효').length || 0,
    totalCancelledInSectionA: sectionA?.filter(e => e.status === '말소').length || 0,
    totalValidRightsInSectionB: sectionB?.filter(e => e.status === '유효').length || 0,
    totalCancelledInSectionB: sectionB?.filter(e => e.status === '말소').length || 0
  };
}

function formatCurrency(value) {
  if (!value) return '';
  const num = value.toString().replace(/[^\d]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('ko-KR') + '원';
}

module.exports = { parseRegistryPdfWithGemini };

