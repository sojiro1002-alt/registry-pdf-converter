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
async function callGeminiAPIWithRetry(base64Pdf, prompt, maxRetries = 3) {
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
            maxOutputTokens: 16384,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000
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
    
    // Gemini API에 요청할 프롬프트 (더 구체적이고 상세하게)
    const prompt = `다음은 한국 등기부 등본(등기사항전부증명서) PDF입니다. 
이 PDF를 정확히 분석하여 모든 정보를 추출하고 JSON 형식으로 반환해주세요.

**중요 지침:**
1. PDF의 모든 텍스트와 표를 정확히 읽어주세요
2. 날짜는 YYYY-MM-DD 형식으로 변환하세요 (예: 2024년8월22일 → 2024-08-22, 2024.8.22 → 2024-08-22)
3. 금액은 숫자만 추출하세요 (예: 금231,000,000원 → 231000000, 231,000,000원 → 231000000)
4. 말소된 항목은 "말소", 유효한 항목은 "유효"로 표시하세요 (실선, 취소선, 말소 표시 확인)
5. 섹션 구분: 【표제부】, 【갑구】, 【을구】를 기준으로 구분하세요
6. 순위번호는 정확히 추출하세요 (예: 1, 2, 3 또는 1-1, 9-1 등 부기등기 포함)
7. 표 형식의 데이터를 정확히 읽어주세요
8. 주민등록번호는 마스킹된 형태 그대로 추출하세요 (예: 123456-1*****)

**추출할 정보:**

1. 표제부 (【표제부】 섹션):
   - 고유번호 (형식: XXXX-XXXX-XXXXXX)
   - 소재지번 (소재지번 또는 소재지로 시작하는 주소)
   - 도로명주소 (도로명주소로 시작하는 주소)
   - 건물명칭 (건물명칭 또는 명칭으로 시작)
   - 건물구조 (구조, 면적 정보)
   - 전용면적 (㎡ 단위 포함)
   - 대지권비율 (분의 형식)
   - 대지권종류

2. 갑구 (【갑구】 섹션) - 각 등기 항목별로:
   - 순위번호 (1, 2, 3 등)
   - 등기목적 (소유권이전, 소유권보존, 소유권일부이전 등)
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
    "landRightType": "대지권종류"
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

**추출 예시:**
- 고유번호: "1234-5678-901234" 형식
- 날짜: "2024-08-22" 형식 (년월일을 하이픈으로 구분)
- 금액: "231000000" (숫자만, 쉼표 없음)
- 상태: "유효" 또는 "말소"
- 순위번호: "1", "2", "9-1" (부기등기는 하이픈 포함)

**JSON 형식 예시:**
{
  "basicInfo": {
    "uniqueNumber": "1234-5678-901234",
    "location": "경기도 광주시 태전동 695",
    "roadAddress": "경기도 광주시 태전동로 12",
    "buildingName": "이편한세상태전2차 제102동",
    "structure": "철근콘크리트조 지하2층 지상15층",
    "exclusiveArea": "84.9918㎡",
    "landRightRatio": "18191.7분의 55.5162",
    "landRightType": "소유권대지권"
  },
  "sectionA": [
    {
      "rankNumber": "1",
      "purpose": "소유권보존",
      "receiptDate": "2018-01-18",
      "receiptNumber": "123",
      "registrationCause": "2018년1월18일 매매",
      "rightHolder": "권지은",
      "idNumber": "123456-1*****",
      "address": "경기도 광주시 태전동로 12",
      "status": "유효"
    }
  ],
  "sectionB": [
    {
      "rankNumber": "5",
      "purpose": "근저당권설정",
      "receiptDate": "2022-08-12",
      "receiptNumber": "456",
      "registrationCause": "2022년8월12일 설정계약",
      "claimAmount": "144000000",
      "debtor": "주식회사나무꼴",
      "rightHolder": "하나은행",
      "status": "유효"
    }
  ]
}

**중요:**
- 반드시 유효한 JSON만 반환하세요
- 다른 설명이나 주석은 포함하지 마세요
- 모든 필드는 문자열로 반환하세요 (숫자 필드도 문자열)
- 정보가 없으면 빈 문자열 "" 또는 빈 배열 []을 반환하세요
- PDF의 모든 페이지를 확인하세요
- 표 형식의 데이터를 행별로 정확히 읽어주세요
- 말소 표시(실선, 취소선)를 정확히 확인하세요

위 PDF를 분석하여 JSON 형식으로 반환해주세요.`;

    // Gemini API 요청 (PDF를 직접 전달, 재시도 로직 포함)
    console.log('[INFO] Gemini API에 PDF 전송 중...');
    const response = await callGeminiAPIWithRetry(base64Pdf, prompt);

    console.log('[INFO] Gemini API 응답 수신');

    // 응답에서 텍스트 추출
    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log('[DEBUG] Gemini 응답 길이:', responseText.length);
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = responseText.trim();
    
    // ```json 또는 ``` 코드 블록 제거
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // JSON 객체만 추출 (중괄호로 시작하고 끝나는 부분)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // JSON 파싱
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[ERROR] JSON 파싱 실패:', parseError.message);
      console.error('[DEBUG] 추출된 텍스트 (처음 500자):', jsonText.substring(0, 500));
      throw new Error(`JSON 파싱 실패: ${parseError.message}`);
    }
    
    console.log('[INFO] Gemini API 파싱 완료');
    console.log('[DEBUG] 추출된 데이터:', {
      basicInfo: Object.keys(parsedData.basicInfo || {}),
      sectionACount: (parsedData.sectionA || []).length,
      sectionBCount: (parsedData.sectionB || []).length
    });
    
    // 데이터 검증 및 정제
    const cleanedData = validateAndCleanData(parsedData);
    
    // 요약 정보 생성
    const summary = generateSummary(cleanedData.basicInfo, cleanedData.sectionA, cleanedData.sectionB);
    
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
  const currentOwner = sectionA
    ?.filter(e => e.status === '유효' && (e.purpose?.includes('소유권이전') || e.purpose?.includes('소유권보존')))
    .pop() || sectionA?.filter(e => e.status === '유효').pop();
  
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

