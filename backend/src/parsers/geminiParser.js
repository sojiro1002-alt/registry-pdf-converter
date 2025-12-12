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
    
    // Gemini API에 요청할 프롬프트 (가등기 처리 포함, 상세 버전)
    const prompt = `당신은 한국 등기부 등본(등기사항전부증명서) 전문 분석가입니다. 
다음 PDF 파일을 **완전히 분석**하여 **모든 정보를 빠짐없이 추출**하고 JSON 형식으로 반환해주세요.

**최우선 지침 (반드시 준수):**
1. PDF의 **모든 페이지**를 처음부터 끝까지 꼼꼼히 읽어주세요
2. **표제부(표지)** 섹션을 가장 먼저 확인하고, 고유번호, 소재지번, 도로명주소, 건물명칭, 소유자명을 반드시 추출하세요
3. **갑구** 섹션의 모든 등기 항목을 순서대로 읽고, 각 항목의 순위번호, 등기목적, 접수일자, 권리자(소유자), 주소, 상태를 추출하세요
4. **을구** 섹션의 모든 등기 항목을 순서대로 읽고, 각 항목의 순위번호, 등기목적, 채권최고액, 채무자, 권리자, 상태를 추출하세요
5. 표 형식의 데이터를 **행별로 정확히** 읽어주세요 (가로로 읽지 말고 세로 열별로 읽으세요)
6. **말소 표시**(실선, 취소선, "말소" 텍스트)를 정확히 확인하여 상태를 "말소" 또는 "유효"로 구분하세요
7. 정보가 없어도 빈 문자열("")로 반환하되, **가능한 모든 정보를 최대한 추출**하세요

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
   **반드시 다음 정보를 모두 찾아서 추출하세요:**
   - 고유번호: "고유번호" 또는 "등기번호" 뒤에 나오는 형식 (XXXX-XXXX-XXXXXX)
   - 소재지번: "소재지번" 또는 "소재지" 뒤에 나오는 주소 (동호수 제외, 예: "경기도 의정부시 신곡동 167-20")
   - 도로명주소: "도로명주소" 뒤에 나오는 주소 (동호수 제외, 예: "경기도 의정부시 시민로317번길 15")
   - 건물명칭: "건물명칭" 또는 "명칭" 뒤에 나오는 건물명과 동호수 전체 (예: "극동스타클래스아파트 제103동 제12층 제1201호")
   - 건물구조: "구조" 또는 "건물구조" 정보
   - 전용면적: "전용면적" 또는 "면적" 정보 (㎡ 단위 포함)
   - 대지권비율: "대지권비율" 또는 "비율" 정보 (분의 형식)
   - 대지권종류: "대지권종류" 정보
   - 소유자명: 표제부에 명시된 소유자 이름 (가등기가 있는 경우 우선적으로 추출)
   
   **표제부 추출 시 주의사항:**
   - 소재지번과 도로명주소에는 동호수(제XX동, 제XX층, 제XX호)를 포함하지 마세요
   - 건물명칭 필드에는 반드시 동호수 정보를 포함하세요 (집합건물의 경우 필수)
   - 소재지번과 건물명칭을 명확히 구분하여 추출하세요
   - 표제부에 소유자명이 명시되어 있으면 반드시 추출하세요

2. 갑구 (【갑구】 섹션) - 각 등기 항목별로:
   - 순위번호 (1, 2, 3 등)
   - 등기목적 (소유권이전, 소유권보존, 소유권일부이전, 가등기, 소유권이전가등기 등)
   - 접수일자 (YYYY-MM-DD 형식으로 변환)
   - 접수번호 (제XX호 형식)
   - 등기원인 (매매, 증여, 상속 등)
   - 권리자 (소유자 이름, 한글 2-4자)
   - 주민등록번호 (마스킹된 형태 그대로, 예: 123456-1*****)
   - 주소 (권리자 주소)
   - 상태 (말소 표시가 있으면 "말소", 없으면 "유효")

3. 을구 (【을구】 섹션) - 각 등기 항목별로:
   - 순위번호
   - 등기목적 (근저당권설정, 전세권설정, 근질권설정 등)
   - 접수일자 (YYYY-MM-DD 형식)
   - 접수번호
   - 등기원인
   - 채권최고액 또는 전세금 (숫자만, 예: 231000000)
   - 채무자 또는 전세권자 (이름)
   - 권리자 (근저당권자, 채권자 이름)
   - 상태 (유효/말소)

**반환 형식 (정확히 이 형식으로):**
{
  "basicInfo": {
    "uniqueNumber": "고유번호",
    "location": "소재지번",
    "roadAddress": "도로명주소",
    "buildingName": "건물명칭",
    "structure": "건물구조",
    "exclusiveArea": "전용면적",
    "landRightRatio": "대지권비율",
    "landRightType": "대지권종류",
    "ownerName": "표제부에 기재된 소유자명 (가등기 있는 경우)"
  },
  "sectionA": [
    {
      "rankNumber": "순위번호",
      "purpose": "등기목적",
      "receiptDate": "YYYY-MM-DD",
      "receiptNumber": "접수번호",
      "registrationCause": "등기원인",
      "rightHolder": "권리자",
      "idNumber": "주민등록번호",
      "address": "주소",
      "status": "유효 또는 말소"
    }
  ],
  "sectionB": [
    {
      "rankNumber": "순위번호",
      "purpose": "등기목적",
      "receiptDate": "YYYY-MM-DD",
      "receiptNumber": "접수번호",
      "registrationCause": "등기원인",
      "claimAmount": "금액(숫자만)",
      "debtor": "채무자/전세권자",
      "rightHolder": "권리자",
      "status": "유효 또는 말소"
    }
  ]
}

**중요:**
- 반드시 유효한 JSON만 반환하세요 (JSON 문법을 정확히 지켜주세요)
- 다른 설명이나 주석은 포함하지 마세요
- 모든 필드는 문자열로 반환하세요 (숫자 필드도 문자열)
- 정보가 없으면 빈 문자열 "" 또는 빈 배열 []을 반환하세요
- PDF의 모든 페이지를 확인하세요
- 표 형식의 데이터를 행별로 정확히 읽어주세요
- 말소 표시(실선, 취소선)를 정확히 확인하세요
- 가등기가 있는 경우 표제부 소유자 정보를 basicInfo.ownerName에 반영하세요
- JSON 문법 주의사항:
  * 배열/객체 마지막 항목 뒤에 쉼표(,)를 사용하지 마세요
  * 문자열 내 특수문자(따옴표, 줄바꿈, 백슬래시)는 반드시 이스케이프(\\", \\n, \\\\) 처리하세요
  * 모든 문자열은 큰따옴표(")로 감싸세요
  * 숫자는 따옴표 없이 사용하되, JSON에서는 문자열로 반환하세요

**응답 형식:**
응답은 반드시 유효한 JSON 객체만 반환하세요. 마크다운 코드 블록이나 다른 설명 없이 순수 JSON만 반환하세요.
예시:
{
  "basicInfo": { ... },
  "sectionA": [ ... ],
  "sectionB": [ ... ]
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
    
    // JSON 부분만 추출해서 로그 출력 (디버깅용)
    const debugJsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (debugJsonMatch) {
      const extractedJson = debugJsonMatch[0];
      console.log('[DEBUG] 추출된 JSON 길이:', extractedJson.length, '자');
      console.log('[DEBUG] 추출된 JSON 처음 1500자:', extractedJson.substring(0, 1500));
      
      // JSON에서 basicInfo 부분만 추출해서 확인
      const basicInfoMatch = extractedJson.match(/"basicInfo"\s*:\s*\{[^}]*\}/);
      if (basicInfoMatch) {
        console.log('[DEBUG] basicInfo 부분:', basicInfoMatch[0]);
      } else {
        console.warn('[WARN] JSON에서 basicInfo를 찾을 수 없습니다!');
      }
    } else {
      console.error('[ERROR] Gemini 응답에서 JSON 객체를 찾을 수 없습니다!');
      console.error('[ERROR] 응답 전체 내용:', responseText);
    }
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:172',message:'gemini response received',data:{responseLength:responseText.length,first500Chars:responseText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = responseText.trim();
    
    // ```json 또는 ``` 코드 블록 제거
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // JSON 객체만 추출 (중괄호로 시작하고 끝나는 부분)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    } else {
      console.error('[ERROR] JSON 객체를 찾을 수 없습니다.');
      console.error('[DEBUG] 전체 응답 텍스트:', responseText);
      throw new Error('Gemini API 응답에서 JSON 객체를 찾을 수 없습니다.');
    }
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:232',message:'before JSON parse',data:{jsonTextLength:jsonText.length,first200Chars:jsonText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // JSON 파싱 (재시도 로직 포함, 더 안전한 방식)
    let parsedData;
    let parseAttempts = 0;
    const maxParseAttempts = 5;
    let workingJsonText = jsonText;
    
    while (parseAttempts < maxParseAttempts) {
      try {
        // 1차: 마지막 쉼표 제거만 시도
        workingJsonText = workingJsonText.replace(/,(\s*[}\]])/g, '$1');
        parsedData = JSON.parse(workingJsonText);
        console.log(`[INFO] JSON 파싱 성공 (시도 ${parseAttempts + 1}/${maxParseAttempts})`);
        break; // 성공하면 루프 종료
      } catch (parseError) {
        parseAttempts++;
        const errorMsg = parseError.message;
        console.error(`[ERROR] JSON 파싱 실패 (시도 ${parseAttempts}/${maxParseAttempts}):`, errorMsg);
        
        // 오류 위치 추출
        const positionMatch = errorMsg.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1]) : null;
        
        if (errorPosition) {
          const start = Math.max(0, errorPosition - 50);
          const end = Math.min(workingJsonText.length, errorPosition + 50);
          console.error(`[DEBUG] 오류 위치 주변 (${start}-${end}):`, workingJsonText.substring(start, end));
        }
        
        if (parseAttempts >= maxParseAttempts) {
          // 최종 시도: 더 신중한 수정
          try {
            console.log('[INFO] 최종 시도: 신중한 JSON 수정 적용...');
            
            // 원본으로 복원
            workingJsonText = jsonText;
            
            // 1. 마지막 쉼표 제거
            workingJsonText = workingJsonText.replace(/,(\s*[}\]])/g, '$1');
            
            // 2. 여러 번의 쉼표 제거 시도 (중첩된 경우)
            for (let i = 0; i < 5; i++) {
              const before = workingJsonText;
              workingJsonText = workingJsonText.replace(/,(\s*[}\]])/g, '$1');
              if (before === workingJsonText) break;
            }
            
            // 3. 이스케이프되지 않은 제어 문자 제거 (문자열 밖에서만)
            // 하지만 이건 복잡하므로 일단 시도하지 않음
            
            parsedData = JSON.parse(workingJsonText);
            console.log('[INFO] JSON 파싱 성공 (최종 수정 후)');
            break;
          } catch (finalError) {
            console.error('[ERROR] 최종 JSON 파싱 실패:', finalError.message);
            console.error('[ERROR] 원본 파싱 오류:', parseError.message);
            console.error('[DEBUG] JSON 텍스트 길이:', workingJsonText.length);
            console.error('[DEBUG] JSON 텍스트 (처음 1500자):', workingJsonText.substring(0, 1500));
            console.error('[DEBUG] JSON 텍스트 (마지막 500자):', workingJsonText.substring(Math.max(0, workingJsonText.length - 500)));
            
            if (errorPosition) {
              const contextStart = Math.max(0, errorPosition - 200);
              const contextEnd = Math.min(workingJsonText.length, errorPosition + 200);
              console.error('[DEBUG] 오류 위치 주변 (400자):', workingJsonText.substring(contextStart, contextEnd));
            }
            
            // #region agent log
            try {
              fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiParser.js:320',message:'JSON parse error final',data:{error:finalError.message,originalError:parseError.message,jsonTextLength:workingJsonText.length,first500Chars:workingJsonText.substring(0,500),errorPosition:errorPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            } catch (e) {}
            // #endregion
            
            // 원본 응답도 로그로 출력
            console.error('[ERROR] 원본 Gemini 응답 (처음 2000자):', responseText.substring(0, 2000));
            console.error('[ERROR] 원본 Gemini 응답 (마지막 2000자):', responseText.substring(Math.max(0, responseText.length - 2000)));
            
            throw new Error(`JSON 파싱 실패 (${maxParseAttempts}회 시도): ${finalError.message}`);
          }
        } else {
          // 재시도 전: 원본으로 복원 후 다시 시도
          workingJsonText = jsonText;
          // 마지막 쉼표만 제거
          workingJsonText = workingJsonText.replace(/,(\s*[}\]])/g, '$1');
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
    
    // basicInfo 필수 필드 확인
    if (!parsedData.basicInfo.location && !parsedData.basicInfo.uniqueNumber) {
      console.warn('[WARN] basicInfo에 필수 정보가 없습니다. 파싱 결과를 확인하세요.');
    }
    
    console.log('[INFO] Gemini API 파싱 완료');
    console.log('[DEBUG] 추출된 데이터 구조:', {
      basicInfo: Object.keys(parsedData.basicInfo || {}),
      sectionACount: (parsedData.sectionA || []).length,
      sectionBCount: (parsedData.sectionB || []).length
    });
    
    // 파싱된 데이터의 실제 내용 확인 (디버깅용)
    console.log('[DEBUG] basicInfo 전체 내용:', JSON.stringify(parsedData.basicInfo || {}, null, 2));
    console.log('[DEBUG] basicInfo.location:', parsedData.basicInfo?.location);
    console.log('[DEBUG] basicInfo.ownerName:', parsedData.basicInfo?.ownerName);
    console.log('[DEBUG] basicInfo.buildingName:', parsedData.basicInfo?.buildingName);
    
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
  // 현재 소유자 찾기 (가등기 처리 포함)
  // 1. 표제부에 ownerName이 있으면 우선 사용 (가등기 있는 경우)
  // 2. 갑구에서 유효한 소유권이전/보존 찾기
  // 3. 가등기 관련 항목 확인
  let currentOwner = null;
  
  // 표제부에 소유자 정보가 있는 경우 (가등기)
  if (basicInfo?.ownerName) {
    // 갑구에서 해당 소유자와 일치하는 항목 찾기
    const matchingEntry = sectionA?.find(e => 
      e.status === '유효' && 
      e.rightHolder === basicInfo.ownerName &&
      (e.purpose?.includes('소유권') || e.purpose?.includes('가등기'))
    );
    if (matchingEntry) {
      currentOwner = {
        rightHolder: basicInfo.ownerName,
        idNumber: matchingEntry.idNumber || '',
        address: matchingEntry.address || '',
        receiptDate: matchingEntry.receiptDate || ''
      };
    } else {
      // 가등기만 있고 본등기가 없는 경우
      currentOwner = {
        rightHolder: basicInfo.ownerName,
        idNumber: '',
        address: '',
        receiptDate: ''
      };
    }
  }
  
  // 표제부에 정보가 없으면 갑구에서 찾기
  if (!currentOwner) {
    currentOwner = sectionA
      ?.filter(e => e.status === '유효' && (e.purpose?.includes('소유권이전') || e.purpose?.includes('소유권보존')))
      .pop() || sectionA?.filter(e => e.status === '유효').pop();
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

