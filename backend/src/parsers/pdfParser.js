/**
 * 등기부 등본 PDF 파싱 모듈
 * 한국 등기부 등본의 특수한 구조를 인식하고 데이터를 추출합니다.
 */

const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * PDF 파일을 파싱하여 구조화된 데이터를 반환합니다.
 * @param {string} filePath - PDF 파일 경로
 * @returns {Promise<Object>} 파싱된 등기부 데이터
 */
async function parseRegistryPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;
  
  console.log('[DEBUG] PDF 텍스트 추출 완료, 길이:', text.length);
  
  // 섹션별 텍스트 분리
  const sections = splitSections(text);
  
  // 각 섹션 파싱
  const basicInfo = parseBasicInfo(sections.header, sections.title);
  const sectionA = parseSectionA(sections.sectionA); // 갑구
  const sectionB = parseSectionB(sections.sectionB); // 을구
  
  // 요약 정보 생성
  const summary = generateSummary(basicInfo, sectionA, sectionB);
  
  return {
    basicInfo,
    sectionA,
    sectionB,
    summary,
    rawText: text
  };
}

/**
 * 텍스트를 섹션별로 분리합니다.
 * @param {string} text - 전체 PDF 텍스트
 * @returns {Object} 분리된 섹션들
 */
function splitSections(text) {
  // 섹션 구분 키워드 (공백 포함)
  const titleMarker = /【\s*표\s*제\s*부\s*】/;
  const sectionAMarker = /【\s*갑\s*구\s*】/;
  const sectionBMarker = /【\s*을\s*구\s*】/;
  
  // 기본 정보 (표제부 앞부분)
  const titleMatch = text.match(titleMarker);
  const header = titleMatch ? text.substring(0, titleMatch.index) : '';
  
  // 표제부
  const titleStart = titleMatch ? titleMatch.index : 0;
  const sectionAMatch = text.match(sectionAMarker);
  const title = sectionAMatch 
    ? text.substring(titleStart, sectionAMatch.index) 
    : text.substring(titleStart);
  
  // 갑구 (소유권에 관한 사항)
  const sectionAStart = sectionAMatch ? sectionAMatch.index : text.length;
  const sectionBMatch = text.match(sectionBMarker);
  const sectionA = sectionBMatch 
    ? text.substring(sectionAStart, sectionBMatch.index) 
    : text.substring(sectionAStart);
  
  // 을구 (소유권 이외의 권리에 관한 사항)
  const sectionB = sectionBMatch ? text.substring(sectionBMatch.index) : '';
  
  return { header, title, sectionA, sectionB };
}

/**
 * 기본정보(표제부) 파싱
 * @param {string} header - 헤더 텍스트
 * @param {string} title - 표제부 텍스트
 * @returns {Object} 기본정보 객체
 */
function parseBasicInfo(header, title) {
  const combined = header + '\n' + title;
  
  // 고유번호 추출
  const uniqueNumber = extractPattern(combined, /고유번호\s*[:：]?\s*([\d\-]+)/) ||
                       extractPattern(combined, /(\d{4}-\d{4}-\d{6})/);
  
  // 소재지번 추출 - 헤더 제외하고 실제 주소만
  let location = '';
  const locationLines = combined.split('\n');
  for (let i = 0; i < locationLines.length; i++) {
    const line = locationLines[i];
    // "경기도", "서울", "부산" 등으로 시작하는 실제 주소 찾기
    if (/^(경기도|서울|부산|인천|대구|광주|대전|울산|제주|강원|충청|전라|경상|세종).+동\s+\d+/.test(line)) {
      location = cleanText(line);
      break;
    }
  }
  if (!location) {
    location = extractPattern(combined, /소재지\s*[:：]?\s*([^\n]+)/) || '';
  }
  
  // 도로명주소 추출
  const roadAddress = extractPattern(combined, /\[도로명주소\]\s*([^\n]+)/) ||
                      extractPattern(combined, /도로명주소\s*[:：]?\s*([^\n]+)/) ||
                      extractPattern(combined, /\(도로명주소\s*[:：]?\s*([^\)]+)\)/);
  
  // 건물명칭 추출 - 첫 페이지 상단의 [집합건물] 다음에서 추출
  let buildingName = '';
  const buildingMatch = combined.match(/\[집합건물\]\s+[^\n]+\s+([^\n]+제\d+동[^\n]+)/);
  if (buildingMatch) {
    buildingName = cleanText(buildingMatch[1]);
  }
  if (!buildingName) {
    buildingName = extractPattern(combined, /건물명칭\s*[:：]?\s*([^\n\[【]+)/) ||
                   extractPattern(combined, /명\s*칭\s*[:：]?\s*([^\n]+)/) || '';
  }
  
  // 건물내역 (구조, 면적)
  const structureMatch = combined.match(/건물내역[^\n]*\n([^\n【]+)/);
  const structure = structureMatch ? cleanText(structureMatch[1]) : '';
  
  // 전용면적 추출
  const areaMatch = combined.match(/([\d,.]+)\s*㎡/) || 
                    combined.match(/면적\s*[:：]?\s*([\d,.]+)/);
  const exclusiveArea = areaMatch ? areaMatch[1] + '㎡' : '';
  
  // 대지권 비율 추출 - "18191.7분의" 다음 줄의 숫자 포함
  let landRightRatio = '';
  const ratioMatch1 = combined.match(/([\d,.]+)\s*분의\s*\n?\s*([\d,.]+)/);
  const ratioMatch2 = combined.match(/대지권비율\s*[:：]?\s*([^\n등기]+)/);
  
  if (ratioMatch1 && ratioMatch1[2]) {
    landRightRatio = `${ratioMatch1[1]}분의 ${ratioMatch1[2]}`;
  } else if (ratioMatch2) {
    landRightRatio = cleanText(ratioMatch2[1]);
  }
  
  // 대지권 종류
  const landRightType = extractPattern(combined, /대지권종류\s*[:：]?\s*([^\n]+)/) ||
                        extractPattern(combined, /소유권대지권|전유부분/);
  
  // 등기원인 및 기타 일자
  const registrationDate = extractPattern(combined, /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/);
  
  return {
    uniqueNumber: uniqueNumber || '',
    location: location || '',
    roadAddress: roadAddress || '',
    buildingName: buildingName || '',
    structure: structure,
    exclusiveArea: exclusiveArea,
    landRightRatio: landRightRatio,
    landRightType: landRightType || '',
    registrationDate: registrationDate || '',
    ownerName: '' // 갑구에서 추출
  };
}

/**
 * 갑구 (소유권에 관한 사항) 파싱
 * @param {string} text - 갑구 섹션 텍스트
 * @returns {Array} 갑구 항목 배열
 */
function parseSectionA(text) {
  const entries = [];
  
  if (!text || text.trim().length === 0) {
    return entries;
  }
  
  // 헤더 제거 및 실제 데이터만 추출
  const cleanedText = text.replace(/【\s*갑\s*구\s*】/g, '')
                          .replace(/\(\s*소유권에\s*관한\s*사항\s*\)/g, '')
                          .replace(/순위번호\s+등\s*기\s*목\s*적\s+접\s*수\s+등\s*기\s*원\s*인\s+권리자\s+및\s+기타사항/g, '');
  
  // 순위번호 기반으로 항목 분리
  const lines = cleanedText.split('\n').filter(line => line.trim() && line.trim().length > 1);
  
  let currentEntry = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 순위번호 패턴: 줄 전체가 숫자 또는 숫자-숫자 형태
    const isRankNumber = /^(\d+(?:-\d+)?)$/.test(line);
    
    if (isRankNumber) {
      // 이전 항목 저장
      if (currentEntry) {
        entries.push(finalizeEntry(currentEntry));
      }
      
      currentEntry = {
        rankNumber: line,
        purpose: '',
        receiptDate: '',
        receiptNumber: '',
        registrationCause: '',
        rightHolder: '',
        idNumber: '',
        address: '',
        status: '유효',
        rawText: line
      };
    } else if (currentEntry) {
      // 기존 항목에 정보 추가
      currentEntry.rawText += '\n' + line;
      parseEntryLine(line, currentEntry, 'A');
    }
  }
  
  // 마지막 항목 저장
  if (currentEntry) {
    entries.push(finalizeEntry(currentEntry));
  }
  
  return entries;
}

/**
 * 을구 (소유권 이외의 권리에 관한 사항) 파싱
 * @param {string} text - 을구 섹션 텍스트
 * @returns {Array} 을구 항목 배열
 */
function parseSectionB(text) {
  const entries = [];
  
  if (!text || text.trim().length === 0) {
    return entries;
  }
  
  // 헤더 제거
  const cleanedText = text.replace(/【\s*을\s*구\s*】/g, '')
                          .replace(/\(\s*소유권\s*이외의\s*권리에\s*관한\s*사항\s*\)/g, '')
                          .replace(/순위번호\s+등\s*기\s*목\s*적\s+접\s*수\s+등\s*기\s*원\s*인\s+권리자\s+및\s+기타사항/g, '');
  
  const lines = cleanedText.split('\n').filter(line => line.trim() && line.trim().length > 1);
  
  let currentEntry = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 순위번호 패턴: 줄 전체가 숫자 또는 숫자-숫자 형태
    const isRankNumber = /^(\d+(?:-\d+)?)$/.test(line);
    
    if (isRankNumber) {
      if (currentEntry) {
        entries.push(finalizeEntryB(currentEntry));
      }
      
      currentEntry = {
        rankNumber: line,
        purpose: '',
        receiptDate: '',
        receiptNumber: '',
        registrationCause: '',
        claimAmount: '',
        debtor: '',
        rightHolder: '',
        status: '유효',
        rawText: line
      };
    } else if (currentEntry) {
      currentEntry.rawText += '\n' + line;
      parseEntryLine(line, currentEntry, 'B');
    }
  }
  
  if (currentEntry) {
    entries.push(finalizeEntryB(currentEntry));
  }
  
  return entries;
}

/**
 * 항목 라인에서 정보 추출
 * @param {string} line - 텍스트 라인
 * @param {Object} entry - 현재 항목 객체
 * @param {string} section - 섹션 타입 ('A' 또는 'B')
 */
function parseEntryLine(line, entry, section) {
  // 등기목적
  const purposes = [
    '소유권이전', '소유권보존', '소유권일부이전',
    '근저당권설정', '근저당권이전', '근저당권말소', '근저당권변경',
    '근질권설정', '근질권이전', '근질권말소', '근질권변경', '근질권',
    '전세권설정', '전세권이전', '전세권말소', '전세권변경',
    '가압류', '압류', '경매개시결정', '임차권',
    '지상권설정', '지역권설정', '가등기', '신탁',
    '소유권말소', '처분금지가처분'
  ];
  
  for (const purpose of purposes) {
    if (line.includes(purpose) && !entry.purpose) {
      entry.purpose = purpose;
      break;
    }
  }
  
  // 접수일자 (YYYY년 MM월 DD일 또는 YYYY.MM.DD)
  const dateMatch = line.match(/(\d{4})[년.]\s*(\d{1,2})[월.]\s*(\d{1,2})일?/);
  if (dateMatch && !entry.receiptDate) {
    entry.receiptDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
  }
  
  // 접수번호
  const receiptNumMatch = line.match(/제?\s*(\d+)\s*호/) || line.match(/접수\s*(\d+)/);
  if (receiptNumMatch && !entry.receiptNumber) {
    entry.receiptNumber = receiptNumMatch[1];
  }
  
  // 등기원인
  const causes = ['매매', '증여', '상속', '협의분할에의한상속', '신탁', '해지', '변제', '설정계약', '전세계약'];
  for (const cause of causes) {
    if (line.includes(cause) && !entry.registrationCause) {
      entry.registrationCause = cause;
      break;
    }
  }
  
  // 등기원인 날짜 추출
  const causeMatch = line.match(/(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)\s*(매매|증여|상속|설정계약|전세계약|신탁)/);
  if (causeMatch) {
    entry.registrationCause = causeMatch[1] + ' ' + causeMatch[2];
  }
  
  // 말소 여부 확인 (실선, 말소, 해지 등)
  if (line.includes('말소') || line.includes('해지') || line.includes('──') || line.includes('—')) {
    entry.status = '말소';
  }
  
  if (section === 'A') {
    // 소유자 이름 (한글 2-4자)
    const nameMatch = line.match(/소유자\s*([가-힣]{2,4})/) || 
                      line.match(/([가-힣]{2,4})\s+\d{6}-?\*+/);
    if (nameMatch && !entry.rightHolder) {
      entry.rightHolder = nameMatch[1];
    }
    
    // 주민등록번호 (마스킹된 형태)
    const idMatch = line.match(/(\d{6}-?\*+)/) || line.match(/(\d{6}-\d)/);
    if (idMatch && !entry.idNumber) {
      entry.idNumber = idMatch[1];
    }
    
    // 주소
    const addrPatterns = [
      /주소\s*[:：]?\s*([가-힣0-9\s\-,()]+(?:동|호|층|번지))/,
      /([가-힣]+시\s+[가-힣]+구\s+[^\n]+(?:동|호|층|번지))/
    ];
    for (const pattern of addrPatterns) {
      const addrMatch = line.match(pattern);
      if (addrMatch && !entry.address) {
        entry.address = cleanText(addrMatch[1]);
        break;
      }
    }
  } else if (section === 'B') {
    // 채권최고액 / 전세금
    const amountMatch = line.match(/금?\s*([\d,]+)\s*원/) || 
                        line.match(/채권최고액\s*금?\s*([\d,]+)/) ||
                        line.match(/전세금\s*금?\s*([\d,]+)/);
    if (amountMatch && !entry.claimAmount) {
      entry.claimAmount = formatCurrency(amountMatch[1]);
    }
    
    // 채무자 / 전세권자
    const debtorMatch = line.match(/채무자\s*([가-힣]{2,4})/) ||
                        line.match(/전세권자\s*([가-힣]{2,4})/);
    if (debtorMatch && !entry.debtor) {
      entry.debtor = debtorMatch[1];
    }
    
    // 근저당권자 / 권리자
    const holderPatterns = [
      /근저당권자\s*([가-힣]+(?:은행|조합|공사|금고))/,
      /근저당권자\s*([가-힣]{2,20})/,
      /권리자\s*([가-힣]+)/
    ];
    for (const pattern of holderPatterns) {
      const match = line.match(pattern);
      if (match && !entry.rightHolder) {
        entry.rightHolder = match[1];
        break;
      }
    }
  }
}

/**
 * 갑구 항목 최종 정리
 */
function finalizeEntry(entry) {
  return {
    rankNumber: entry.rankNumber || '',
    purpose: entry.purpose || '',
    receiptDate: entry.receiptDate || '',
    receiptNumber: entry.receiptNumber || '',
    registrationCause: entry.registrationCause || '',
    rightHolder: entry.rightHolder || '',
    idNumber: entry.idNumber || '',
    address: entry.address || '',
    status: entry.status || '유효'
  };
}

/**
 * 을구 항목 최종 정리
 */
function finalizeEntryB(entry) {
  return {
    rankNumber: entry.rankNumber || '',
    purpose: entry.purpose || '',
    receiptDate: entry.receiptDate || '',
    receiptNumber: entry.receiptNumber || '',
    registrationCause: entry.registrationCause || '',
    claimAmount: entry.claimAmount || '',
    debtor: entry.debtor || '',
    rightHolder: entry.rightHolder || '',
    status: entry.status || '유효'
  };
}

/**
 * 요약 정보 생성
 */
function generateSummary(basicInfo, sectionA, sectionB) {
  // 현재 소유자 찾기 (가장 최근 유효한 소유권이전/보존)
  const currentOwner = sectionA
    .filter(e => e.status === '유효' && (e.purpose.includes('소유권이전') || e.purpose.includes('소유권보존')))
    .pop();
  
  if (currentOwner) {
    basicInfo.ownerName = currentOwner.rightHolder;
  }
  
  // 유효한 근저당권 총액
  const validMortgages = sectionB.filter(e => 
    e.status === '유효' && e.purpose.includes('근저당권설정')
  );
  const totalMortgage = validMortgages.reduce((sum, e) => {
    const amount = parseCurrency(e.claimAmount);
    return sum + amount;
  }, 0);
  
  // 유효한 전세권 총액
  const validLeases = sectionB.filter(e => 
    e.status === '유효' && e.purpose.includes('전세권설정')
  );
  const totalLease = validLeases.reduce((sum, e) => {
    const amount = parseCurrency(e.claimAmount);
    return sum + amount;
  }, 0);
  
  // 경고사항
  const warnings = [];
  
  if (sectionA.some(e => e.status === '유효' && (e.purpose.includes('가압류') || e.purpose.includes('압류')))) {
    warnings.push('⚠️ 유효한 압류/가압류 등기가 있습니다.');
  }
  
  if (sectionA.some(e => e.status === '유효' && e.purpose.includes('경매'))) {
    warnings.push('⚠️ 경매 진행 중인 것으로 보입니다.');
  }
  
  if (sectionB.some(e => e.status === '유효' && e.purpose.includes('가처분'))) {
    warnings.push('⚠️ 처분금지가처분이 설정되어 있습니다.');
  }
  
  return {
    currentOwner: currentOwner ? currentOwner.rightHolder : '확인필요',
    ownerIdNumber: currentOwner ? currentOwner.idNumber : '',
    ownerAddress: currentOwner ? currentOwner.address : '',
    totalMortgage: formatCurrency(totalMortgage.toString()),
    mortgageCount: validMortgages.length,
    totalLease: formatCurrency(totalLease.toString()),
    leaseCount: validLeases.length,
    warnings: warnings,
    totalValidRightsInSectionA: sectionA.filter(e => e.status === '유효').length,
    totalCancelledInSectionA: sectionA.filter(e => e.status === '말소').length,
    totalValidRightsInSectionB: sectionB.filter(e => e.status === '유효').length,
    totalCancelledInSectionB: sectionB.filter(e => e.status === '말소').length
  };
}

// 유틸리티 함수들

function extractPattern(text, pattern) {
  const match = text.match(pattern);
  return match ? cleanText(match[1]) : null;
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function formatCurrency(value) {
  if (!value) return '';
  const num = value.toString().replace(/[^\d]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('ko-KR') + '원';
}

function parseCurrency(value) {
  if (!value) return 0;
  const num = value.toString().replace(/[^\d]/g, '');
  return parseInt(num, 10) || 0;
}

module.exports = { parseRegistryPdf };

