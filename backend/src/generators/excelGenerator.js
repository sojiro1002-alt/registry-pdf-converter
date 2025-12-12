/**
 * Excel 생성 모듈
 * 파싱된 등기부 데이터를 Excel 파일로 변환합니다.
 */

const ExcelJS = require('exceljs');

/**
 * Excel 파일 생성
 * @param {Object} data - 파싱된 등기부 데이터
 * @param {string} outputPath - 출력 파일 경로
 */
async function generateExcel(data, outputPath) {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:13',message:'generateExcel entry',data:{hasData:!!data,hasSummary:!!data?.summary,hasBasicInfo:!!data?.basicInfo,hasSectionA:!!data?.sectionA,hasSectionB:!!data?.sectionB,sectionALength:data?.sectionA?.length,sectionBLength:data?.sectionB?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  } catch (e) {}
  console.log('[DEBUG] generateExcel entry:', { hasData: !!data, hasSummary: !!data?.summary, hasBasicInfo: !!data?.basicInfo, hasSectionA: !!data?.sectionA, hasSectionB: !!data?.sectionB });
  // #endregion
  
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = '등기부 등본 변환기';
  workbook.created = new Date();
  
  // 단일 시트: 현재 유효한 권리 요약 (모든 정보 포함)
  try {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:20',message:'before createSummarySheet',data:{summaryType:typeof data?.summary,basicInfoType:typeof data?.basicInfo,sectionAType:Array.isArray(data?.sectionA)?'array':typeof data?.sectionA,sectionBType:Array.isArray(data?.sectionB)?'array':typeof data?.sectionB},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch (e) {}
    console.log('[DEBUG] before createSummarySheet:', { summaryType: typeof data?.summary, basicInfoType: typeof data?.basicInfo, sectionAType: Array.isArray(data?.sectionA) ? 'array' : typeof data?.sectionA, sectionBType: Array.isArray(data?.sectionB) ? 'array' : typeof data?.sectionB });
    // #endregion
    
    createSummarySheet(workbook, data.summary, data.basicInfo, data.sectionA, data.sectionB);
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:22',message:'after createSummarySheet',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch (e) {}
    console.log('[DEBUG] after createSummarySheet: success');
    // #endregion
  } catch (error) {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:25',message:'createSummarySheet error',data:{error:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch (e) {}
    console.error('[DEBUG] createSummarySheet error:', error.message, error.stack?.substring(0, 200));
    // #endregion
    throw error;
  }
  
  // 파일 저장
  await workbook.xlsx.writeFile(outputPath);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:30',message:'generateExcel exit',data:{success:true,outputPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  console.log(`[INFO] Excel 파일 생성 완료: ${outputPath}`);
}

/**
 * 공통 스타일 정의 (개선된 디자인)
 */
const styles = {
  title: {
    font: { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } }, // 진한 파란색 (제목용)
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: 'FF0D47A1' } },
      bottom: { style: 'medium', color: { argb: 'FF0D47A1' } },
      left: { style: 'thin', color: { argb: 'FF0D47A1' } },
      right: { style: 'thin', color: { argb: 'FF0D47A1' } }
    }
  },
  sectionTitle: {
    font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' }, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }, // 중간 파란색 (섹션 제목용)
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      bottom: { style: 'medium', color: { argb: 'FF1565C0' } },
      top: { style: 'thin', color: { argb: 'FF1565C0' } },
      left: { style: 'thin', color: { argb: 'FF1565C0' } },
      right: { style: 'thin', color: { argb: 'FF1565C0' } }
    }
  },
  header: {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }, // 고급스러운 다크 슬레이트 그레이 (헤더용)
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'medium', color: { argb: 'FF34495E' } },
      bottom: { style: 'medium', color: { argb: 'FF34495E' } },
      left: { style: 'thin', color: { argb: 'FF34495E' } },
      right: { style: 'thin', color: { argb: 'FF34495E' } }
    }
  },
  cell: {
    font: { size: 10, name: '맑은 고딕' },
    alignment: { vertical: 'middle', wrapText: true, horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    }
  },
  cancelled: {
    font: { size: 10, strike: true, color: { argb: 'FF999999' }, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
  },
  label: {
    font: { bold: true, size: 10, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    }
  },
  warning: {
    font: { bold: true, size: 10, color: { argb: 'FFD32F2F' }, name: '맑은 고딕' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }
  },
  currency: {
    numFmt: '#,##0"원"'
  }
};

/**
 * 시트 1: 기본정보
 */
function createBasicInfoSheet(workbook, basicInfo, summary) {
  const sheet = workbook.addWorksheet('기본정보', {
    properties: { tabColor: { argb: 'FF2E5090' } }
  });
  
  // 열 너비 설정
  sheet.columns = [
    { width: 20 },
    { width: 60 }
  ];
  
  // 타이틀
  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📋 등기부 등본 기본정보';
  Object.assign(titleCell, styles.title);
  sheet.getRow(1).height = 30;
  
  // 빈 행
  sheet.getRow(2).height = 10;
  
  // 기본정보 데이터
  const infoData = [
    ['고유번호', basicInfo.uniqueNumber],
    ['소재지번', basicInfo.location],
    ['도로명주소', basicInfo.roadAddress],
    ['건물명칭', basicInfo.buildingName],
    ['건물구조', basicInfo.structure],
    ['전용면적', basicInfo.exclusiveArea],
    ['대지권비율', basicInfo.landRightRatio],
    ['대지권종류', basicInfo.landRightType],
    ['현재 소유자', summary.currentOwner],
    ['소유자 주민등록번호', summary.ownerIdNumber],
    ['소유자 주소', summary.ownerAddress]
  ];
  
  let rowIndex = 3;
  infoData.forEach(([label, value]) => {
    const row = sheet.getRow(rowIndex);
    
    const labelCell = row.getCell(1);
    labelCell.value = label;
    Object.assign(labelCell, styles.label);
    
    const valueCell = row.getCell(2);
    valueCell.value = value || '-';
    Object.assign(valueCell, styles.cell);
    
    row.height = 25;
    rowIndex++;
  });
}

/**
 * 시트 2: 갑구 (소유권)
 */
function createSectionASheet(workbook, sectionA) {
  const sheet = workbook.addWorksheet('갑구(소유권)', {
    properties: { tabColor: { argb: 'FF4CAF50' } }
  });
  
  // 열 설정
  sheet.columns = [
    { header: '순위번호', key: 'rankNumber', width: 12 },
    { header: '등기목적', key: 'purpose', width: 18 },
    { header: '접수일자', key: 'receiptDate', width: 14 },
    { header: '접수번호', key: 'receiptNumber', width: 12 },
    { header: '등기원인', key: 'registrationCause', width: 25 },
    { header: '권리자', key: 'rightHolder', width: 15 },
    { header: '주민등록번호', key: 'idNumber', width: 18 },
    { header: '주소', key: 'address', width: 40 },
    { header: '상태', key: 'status', width: 10 }
  ];
  
  // 헤더 스타일
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    Object.assign(cell, styles.header);
  });
  
  // 데이터 추가
  sectionA.forEach((entry, index) => {
    const row = sheet.addRow(entry);
    row.height = 25;
    
    row.eachCell((cell) => {
      Object.assign(cell, styles.cell);
      
      // 말소된 항목 스타일
      if (entry.status === '말소') {
        Object.assign(cell, styles.cancelled);
      }
    });
    
    // 상태 셀 색상
    const statusCell = row.getCell(9);
    if (entry.status === '유효') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      statusCell.font = { size: 10, color: { argb: 'FF2E7D32' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    }
  });
  
  // 빈 데이터 처리
  if (sectionA.length === 0) {
    const emptyRow = sheet.addRow({ rankNumber: '등록된 정보가 없습니다.' });
    sheet.mergeCells(`A2:I2`);
    emptyRow.getCell(1).alignment = { horizontal: 'center' };
  }
  
  // 필터 설정
  sheet.autoFilter = {
    from: 'A1',
    to: `I${Math.max(sectionA.length + 1, 2)}`
  };
  
  // 첫 행 고정
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * 시트 3: 을구 (권리관계)
 */
function createSectionBSheet(workbook, sectionB) {
  const sheet = workbook.addWorksheet('을구(권리관계)', {
    properties: { tabColor: { argb: 'FFFF9800' } }
  });
  
  // 열 설정
  sheet.columns = [
    { header: '순위번호', key: 'rankNumber', width: 12 },
    { header: '등기목적', key: 'purpose', width: 18 },
    { header: '접수일자', key: 'receiptDate', width: 14 },
    { header: '접수번호', key: 'receiptNumber', width: 12 },
    { header: '등기원인', key: 'registrationCause', width: 25 },
    { header: '채권최고액/전세금', key: 'claimAmount', width: 20 },
    { header: '채무자/전세권자', key: 'debtor', width: 15 },
    { header: '권리자', key: 'rightHolder', width: 25 },
    { header: '상태', key: 'status', width: 10 }
  ];
  
  // 헤더 스타일
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    Object.assign(cell, styles.header);
  });
  
  // 데이터 추가
  sectionB.forEach((entry) => {
    const row = sheet.addRow(entry);
    row.height = 25;
    
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, styles.cell);
      
      // 말소된 항목 스타일
      if (entry.status === '말소') {
        Object.assign(cell, styles.cancelled);
      }
      
      // 금액 열 우측 정렬
      if (colNumber === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
    
    // 상태 셀 색상
    const statusCell = row.getCell(9);
    if (entry.status === '유효') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      statusCell.font = { size: 10, color: { argb: 'FF2E7D32' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    }
  });
  
  // 빈 데이터 처리
  if (sectionB.length === 0) {
    const emptyRow = sheet.addRow({ rankNumber: '등록된 정보가 없습니다.' });
    sheet.mergeCells(`A2:I2`);
    emptyRow.getCell(1).alignment = { horizontal: 'center' };
  }
  
  // 필터 설정
  sheet.autoFilter = {
    from: 'A1',
    to: `I${Math.max(sectionB.length + 1, 2)}`
  };
  
  // 첫 행 고정
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * 시트 4: 요약 및 분석 (현재 유효한 권리 요약 형식)
 */
function createSummarySheet(workbook, summary, basicInfo, sectionA, sectionB) {
  // #region agent log
  console.log('[DEBUG] createSummarySheet entry:', {
    hasWorkbook: !!workbook,
    hasSummary: !!summary,
    hasBasicInfo: !!basicInfo,
    hasSectionA: !!sectionA,
    hasSectionB: !!sectionB,
    sectionAIsArray: Array.isArray(sectionA),
    sectionBIsArray: Array.isArray(sectionB),
    sectionALength: sectionA?.length,
    sectionBLength: sectionB?.length
  });
  // #endregion
  
  // 안전한 기본값 설정
  if (!summary) summary = {};
  if (!basicInfo) basicInfo = {};
  if (!Array.isArray(sectionA)) sectionA = [];
  if (!Array.isArray(sectionB)) sectionB = [];
  
  const sheet = workbook.addWorksheet('현재 유효한 권리 요약', {
    properties: { tabColor: { argb: 'FF9C27B0' } }
  });
  
  // 열 너비 설정 (더 넓게 조정)
  sheet.columns = [
    { width: 18 },  // A: 항목/순위번호
    { width: 20 },  // B: 내용/등기일자
    { width: 30 }, // C: 근저당권자/채권자/전세권자
    { width: 25 }, // D: 채무자/근저당권자
    { width: 22 }, // E: 채권최고액/전세금
    { width: 18 }, // F: 비고/존속기간
  ];
  
  let rowIndex = 1;
  
  // ===== 헤더: 현재 유효한 권리 요약 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const titleCell = sheet.getCell(`A${rowIndex}`);
  titleCell.value = '현재 유효한 권리 요약';
  Object.assign(titleCell, styles.title);
  sheet.getRow(rowIndex).height = 40;
  rowIndex++;
  
  // ===== 발급기준일 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const issueDateCell = sheet.getCell(`A${rowIndex}`);
  const today = new Date();
  const issueDate = `${today.getFullYear()}년${String(today.getMonth() + 1).padStart(2, '0')}월${String(today.getDate()).padStart(2, '0')}일`;
  issueDateCell.value = `발급기준일: ${issueDate}`;
  issueDateCell.font = { size: 11, name: '맑은 고딕' };
  issueDateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(rowIndex).height = 28;
  rowIndex++;
  
  // ===== 부동산 소재지 (전체 주소 정보 포함) =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const locationCell = sheet.getCell(`A${rowIndex}`);
  
  // 전체 주소 구성: 소재지번(기본 주소) + 건물명칭(동호수 포함) + (도로명주소)
  let fullAddress = '';
  
  // 1. 소재지번에서 기본 주소만 추출 (동호수 제외)
  if (basicInfo.location) {
    let location = basicInfo.location;
    
    // 건물명칭이 있으면 소재지번에서 건물명칭 부분 제거
    if (basicInfo.buildingName) {
      const buildingNameParts = basicInfo.buildingName.split(/\s+/);
      buildingNameParts.forEach(part => {
        if (part && location.includes(part)) {
          location = location.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
        }
      });
    }
    
    // 동호수 패턴 제거 (제XX동, 제XX층, 제XX호 등)
    location = location.replace(/\s*제\d+동\s*/g, '');
    location = location.replace(/\s*제\d+층\s*/g, '');
    location = location.replace(/\s*제\d+호\s*/g, '');
    location = location.replace(/\s*\d+동\s*/g, '');
    location = location.replace(/\s*\d+층\s*/g, '');
    location = location.replace(/\s*\d+호\s*/g, '');
    location = location.replace(/\s+/g, ' ').trim();
    
    fullAddress = location;
  }
  
  // 2. 건물명칭 추가 (동호수 포함, 중복 제거)
  if (basicInfo.buildingName) {
    let buildingName = basicInfo.buildingName.trim();
    // 소재지번에 이미 포함된 부분 제거
    if (fullAddress) {
      const locationWords = fullAddress.split(/\s+/);
      locationWords.forEach(word => {
        if (word && buildingName.includes(word) && word.length > 2) {
          buildingName = buildingName.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
        }
      });
    }
    if (buildingName) {
      fullAddress += (fullAddress ? ' ' : '') + buildingName;
    }
  }
  
  // 3. 도로명주소 추가 (다를 경우만)
  if (basicInfo.roadAddress && basicInfo.roadAddress !== basicInfo.location) {
    let roadAddr = basicInfo.roadAddress.trim();
    // 도로명주소에서 동호수 제거 (중복 방지)
    roadAddr = roadAddr.replace(/\s*제\d+동\s*/g, '');
    roadAddr = roadAddr.replace(/\s*제\d+층\s*/g, '');
    roadAddr = roadAddr.replace(/\s*제\d+호\s*/g, '');
    roadAddr = roadAddr.trim();
    
    // 이미 포함된 주소와 다를 경우만 추가
    if (roadAddr && !fullAddress.includes(roadAddr) && roadAddr !== fullAddress.split(' ')[0]) {
      fullAddress += (fullAddress ? ' (도로명: ' : '') + roadAddr + ')';
    }
  }
  
  // 최종 정리: 연속된 공백 제거
  fullAddress = fullAddress.replace(/\s+/g, ' ').trim();
  
  locationCell.value = `부동산 소재지: ${fullAddress || '-'}`;
  locationCell.font = { size: 11, name: '맑은 고딕' };
  locationCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  // 주소가 길 경우 자동 높이 조정
  const addressLines = Math.ceil((fullAddress || '-').length / 80);
  sheet.getRow(rowIndex).height = Math.max(25, addressLines * 20);
  rowIndex += 2; // 빈 행 (도로명주소 행 제거)
  
  // ===== 현재 소유자 정보 =====
  // 섹션 제목
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  const ownerTitleCell = sheet.getCell(`A${rowIndex}`);
  ownerTitleCell.value = '현재 소유자 정보';
  Object.assign(ownerTitleCell, styles.sectionTitle);
  sheet.getRow(rowIndex).height = 32;
  rowIndex++;
  
  // 헤더 행
  const ownerHeaderRow = sheet.getRow(rowIndex);
  ownerHeaderRow.getCell(1).value = '항목';
  ownerHeaderRow.getCell(2).value = '내용';
  ownerHeaderRow.getCell(1).font = styles.header.font;
  ownerHeaderRow.getCell(2).font = styles.header.font;
  ownerHeaderRow.getCell(1).fill = styles.header.fill;
  ownerHeaderRow.getCell(2).fill = styles.header.fill;
  ownerHeaderRow.getCell(1).alignment = styles.header.alignment;
  ownerHeaderRow.getCell(2).alignment = styles.header.alignment;
  ownerHeaderRow.getCell(1).border = styles.header.border;
  ownerHeaderRow.getCell(2).border = styles.header.border;
  ownerHeaderRow.height = 32;
  rowIndex++;
  
  // 소유자 정보 데이터 (가등기 처리 포함)
  // #region agent log
  console.log('[DEBUG] before currentOwner find:', {
    sectionAIsArray: Array.isArray(sectionA),
    sectionALength: sectionA?.length,
    firstEntryPurpose: sectionA?.[0]?.purpose,
    firstEntryStatus: sectionA?.[0]?.status,
    basicInfoOwnerName: basicInfo?.ownerName
  });
  // #endregion
  
  // 1. 표제부에 ownerName이 있으면 우선 사용 (가등기)
  let currentOwner = null;
  if (basicInfo?.ownerName) {
    const matchingEntry = sectionA?.find(e => 
      e?.status === '유효' && 
      e?.rightHolder === basicInfo.ownerName &&
      (e?.purpose?.includes('소유권') || e?.purpose?.includes('가등기'))
    );
    if (matchingEntry) {
      currentOwner = matchingEntry;
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
  
  // 2. 표제부에 정보가 없으면 갑구에서 찾기
  if (!currentOwner) {
    currentOwner = sectionA?.find(e => e?.status === '유효' && e?.purpose && (e.purpose.includes('소유권이전') || e.purpose.includes('소유권보존'))) || 
                   sectionA?.filter(e => e?.status === '유효').pop();
  }
  
  // #region agent log
  console.log('[DEBUG] after currentOwner find:', {
    currentOwnerFound: !!currentOwner,
    currentOwnerPurpose: currentOwner?.purpose,
    currentOwnerName: currentOwner?.rightHolder,
    fromBasicInfo: !!basicInfo?.ownerName
  });
  // #endregion
  
  const ownerData = [
    ['소유자', summary.currentOwner || currentOwner?.rightHolder || '-'],
    ['주소', summary.ownerAddress || currentOwner?.address || basicInfo.roadAddress || basicInfo.location || '-'],
    ['소유권 등기일', currentOwner?.receiptDate ? formatDateKorean(currentOwner.receiptDate) : '-'],
    ['전유면적', basicInfo.exclusiveArea || '-'],
    ['대지권비율', basicInfo.landRightRatio || '-'],
  ];
  
  ownerData.forEach(([label, value]) => {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { size: 10, name: '맑은 고딕' };
    row.getCell(2).font = { size: 10, name: '맑은 고딕' };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
    row.getCell(1).border = styles.cell.border;
    row.getCell(2).border = styles.cell.border;
    // 내용 길이에 따라 행 높이 자동 조정
    const valueLines = Math.ceil((String(value || '').length / 40));
    row.height = Math.max(24, valueLines * 18);
    rowIndex++;
  });
  
  rowIndex += 2; // 빈 행
  
  // ===== 현재 유효한 근저당권 =====
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:398',message:'before validMortgages filter',data:{sectionBIsArray:Array.isArray(sectionB),sectionBLength:sectionB?.length,firstEntryPurpose:sectionB?.[0]?.purpose,firstEntryStatus:sectionB?.[0]?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const validMortgages = (sectionB || []).filter(e => 
    e?.status === '유효' && e?.purpose && e.purpose.includes('근저당권설정')
  );
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:401',message:'after validMortgages filter',data:{validMortgagesCount:validMortgages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  if (validMortgages.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const mortgageTitleCell = sheet.getCell(`A${rowIndex}`);
    mortgageTitleCell.value = '현재 유효한 근저당권';
    Object.assign(mortgageTitleCell, styles.sectionTitle);
    sheet.getRow(rowIndex).height = 32;
    rowIndex++;
    
    // 헤더 행
    const mortgageHeaderRow = sheet.getRow(rowIndex);
    mortgageHeaderRow.getCell(1).value = '순위번호';
    mortgageHeaderRow.getCell(2).value = '등기일자';
    mortgageHeaderRow.getCell(3).value = '근저당권자';
    mortgageHeaderRow.getCell(4).value = '채무자';
    mortgageHeaderRow.getCell(5).value = '채권최고액';
    mortgageHeaderRow.getCell(6).value = '비고';
    
    mortgageHeaderRow.eachCell((cell) => {
      cell.font = styles.header.font;
      cell.fill = styles.header.fill;
      cell.alignment = styles.header.alignment;
      cell.border = styles.header.border;
    });
    mortgageHeaderRow.height = 32;
    rowIndex++;
    
    // 근저당권 데이터
    validMortgages.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:477',message:'before formatDateKorean mortgage',data:{hasReceiptDate:!!entry.receiptDate,receiptDateValue:entry.receiptDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.rightHolder || '-';
      row.getCell(4).value = entry.debtor || '-';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:480',message:'before claimAmount parse mortgage',data:{hasClaimAmount:!!entry.claimAmount,claimAmountValue:entry.claimAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      row.getCell(5).value = entry.claimAmount ? parseFloat(String(entry.claimAmount).replace(/[^\d]/g, '')) : 0;
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).value = '';
      
      row.eachCell((cell, colNumber) => {
        Object.assign(cell, styles.cell);
        if (colNumber !== 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
        }
      });
      // 내용 길이에 따라 행 높이 자동 조정
      const maxCellLength = Math.max(
        String(entry.rankNumber || '').length,
        String(entry.receiptDate || '').length,
        String(entry.rightHolder || '').length,
        String(entry.debtor || '').length
      );
      const estimatedLines = Math.ceil(maxCellLength / 15);
      row.height = Math.max(26, estimatedLines * 18);
      rowIndex++;
    });
    
    // 합계 행
    const totalMortgage = validMortgages.reduce((sum, e) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:455',message:'reduce claimAmount',data:{hasClaimAmount:!!e.claimAmount,claimAmountType:typeof e.claimAmount,claimAmountValue:e.claimAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      const amount = parseFloat(String(e.claimAmount || '0').replace(/[^\d]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const totalRow = sheet.getRow(rowIndex);
    totalRow.getCell(1).value = '합계';
    totalRow.getCell(5).value = totalMortgage;
    totalRow.getCell(5).numFmt = '#,##0.00';
    totalRow.getCell(1).font = { bold: true, size: 11, name: '맑은 고딕' };
    totalRow.getCell(5).font = { bold: true, size: 11, name: '맑은 고딕' };
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE082' } };
    totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE082' } };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'FF1E3A5F' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
    totalRow.getCell(5).border = {
      top: { style: 'medium', color: { argb: 'FF1E3A5F' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
    totalRow.height = 30;
    rowIndex += 2;
  }
  
  // ===== 현재 유효한 근질권 =====
  const validPledges = (sectionB || []).filter(e => 
    e?.status === '유효' && e?.purpose && e.purpose.includes('근질권')
  );
  
  if (validPledges.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const pledgeTitleCell = sheet.getCell(`A${rowIndex}`);
    pledgeTitleCell.value = '현재 유효한 근질권';
    Object.assign(pledgeTitleCell, styles.sectionTitle);
    sheet.getRow(rowIndex).height = 32;
    rowIndex++;
    
    // 헤더 행
    const pledgeHeaderRow = sheet.getRow(rowIndex);
    pledgeHeaderRow.getCell(1).value = '순위번호';
    pledgeHeaderRow.getCell(2).value = '등기일자';
    pledgeHeaderRow.getCell(3).value = '채권자';
    pledgeHeaderRow.getCell(4).value = '근저당권자';
    pledgeHeaderRow.getCell(5).value = '채권최고액';
    
    pledgeHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        cell.font = styles.header.font;
        cell.fill = styles.header.fill;
        cell.alignment = styles.header.alignment;
        cell.border = styles.header.border;
      }
    });
    pledgeHeaderRow.height = 32;
    rowIndex++;
    
    // 근질권 데이터
    validPledges.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:561',message:'before formatDateKorean pledge',data:{hasReceiptDate:!!entry.receiptDate,receiptDateValue:entry.receiptDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.debtor || entry.rightHolder || '-';
      row.getCell(4).value = entry.rightHolder || '-';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:564',message:'before claimAmount parse pledge',data:{hasClaimAmount:!!entry.claimAmount,claimAmountValue:entry.claimAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      row.getCell(5).value = entry.claimAmount ? parseFloat(String(entry.claimAmount).replace(/[^\d]/g, '')) : 0;
      row.getCell(5).numFmt = '#,##0.00';
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, styles.cell);
          if (colNumber !== 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          }
        }
      });
      // 내용 길이에 따라 행 높이 자동 조정
      const maxCellLength = Math.max(
        String(entry.rankNumber || '').length,
        String(entry.receiptDate || '').length,
        String(entry.debtor || entry.rightHolder || '').length,
        String(entry.rightHolder || '').length
      );
      const estimatedLines = Math.ceil(maxCellLength / 15);
      row.height = Math.max(26, estimatedLines * 18);
      rowIndex++;
    });
    
    rowIndex += 2;
  }
  
  // ===== 현재 유효한 전세권 =====
  const validLeases = (sectionB || []).filter(e => 
    e?.status === '유효' && e?.purpose && e.purpose.includes('전세권설정')
  );
  
  if (validLeases.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const leaseTitleCell = sheet.getCell(`A${rowIndex}`);
    leaseTitleCell.value = '현재 유효한 전세권';
    Object.assign(leaseTitleCell, styles.sectionTitle);
    sheet.getRow(rowIndex).height = 32;
    rowIndex++;
    
    // 헤더 행
    const leaseHeaderRow = sheet.getRow(rowIndex);
    leaseHeaderRow.getCell(1).value = '순위번호';
    leaseHeaderRow.getCell(2).value = '등기일자';
    leaseHeaderRow.getCell(3).value = '전세권자';
    leaseHeaderRow.getCell(4).value = '전세금';
    leaseHeaderRow.getCell(5).value = '존속기간';
    
    leaseHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        cell.font = styles.header.font;
        cell.fill = styles.header.fill;
        cell.alignment = styles.header.alignment;
        cell.border = styles.header.border;
      }
    });
    leaseHeaderRow.height = 32;
    rowIndex++;
    
    // 전세권 데이터
    validLeases.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:623',message:'before formatDateKorean lease',data:{hasReceiptDate:!!entry.receiptDate,receiptDateValue:entry.receiptDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.debtor || entry.rightHolder || '-';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:625',message:'before claimAmount parse lease',data:{hasClaimAmount:!!entry.claimAmount,claimAmountValue:entry.claimAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      row.getCell(4).value = entry.claimAmount ? parseFloat(String(entry.claimAmount).replace(/[^\d]/g, '')) : 0;
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).value = entry.receiptDate ? calculateLeasePeriod(entry.receiptDate) : '-';
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, styles.cell);
          if (colNumber !== 4) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          }
        }
      });
      // 내용 길이에 따라 행 높이 자동 조정
      const maxCellLength = Math.max(
        String(entry.rankNumber || '').length,
        String(entry.receiptDate || '').length,
        String(entry.debtor || entry.rightHolder || '').length
      );
      const estimatedLines = Math.ceil(maxCellLength / 15);
      row.height = Math.max(26, estimatedLines * 18);
      rowIndex++;
    });
    
    rowIndex += 2;
  }
  
  // ===== 권리 부담 총괄 =====
  const totalMortgageAmount = validMortgages.reduce((sum, e) => {
    const amount = parseFloat(String(e.claimAmount || '0').replace(/[^\d]/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalPledgeAmount = validPledges.reduce((sum, e) => {
    const amount = parseFloat(String(e.claimAmount || '0').replace(/[^\d]/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalLeaseAmount = validLeases.reduce((sum, e) => {
    const amount = parseFloat(String(e.claimAmount || '0').replace(/[^\d]/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalBurden = totalMortgageAmount + totalPledgeAmount + totalLeaseAmount;
  
  // 섹션 제목
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const burdenTitleCell = sheet.getCell(`A${rowIndex}`);
  burdenTitleCell.value = '권리 부담 총괄';
  Object.assign(burdenTitleCell, styles.sectionTitle);
  sheet.getRow(rowIndex).height = 32;
  rowIndex++;
  
  // 헤더 행
  const burdenHeaderRow = sheet.getRow(rowIndex);
  burdenHeaderRow.getCell(1).value = '구분';
  burdenHeaderRow.getCell(2).value = '총액';
  
  burdenHeaderRow.getCell(1).font = styles.header.font;
  burdenHeaderRow.getCell(2).font = styles.header.font;
  burdenHeaderRow.getCell(1).fill = styles.header.fill;
  burdenHeaderRow.getCell(2).fill = styles.header.fill;
  burdenHeaderRow.getCell(1).alignment = styles.header.alignment;
  burdenHeaderRow.getCell(2).alignment = styles.header.alignment;
  burdenHeaderRow.getCell(1).border = styles.header.border;
  burdenHeaderRow.getCell(2).border = styles.header.border;
  burdenHeaderRow.height = 32;
  rowIndex++;
  
  // 권리 부담 데이터
  const burdenData = [
    ['근저당권 채권최고액 합계', totalMortgageAmount],
    ['근질권 채권최고액', totalPledgeAmount],
    ['전세금', totalLeaseAmount],
    ['총 권리부담액', totalBurden],
  ];
  
  burdenData.forEach(([label, value]) => {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(2).numFmt = '#,##0.00';
    
    row.getCell(1).font = { size: 10, name: '맑은 고딕' };
    row.getCell(2).font = { size: 10, name: '맑은 고딕' };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    row.getCell(1).border = styles.cell.border;
    row.getCell(2).border = styles.cell.border;
    
    if (label === '총 권리부담액') {
      row.getCell(1).font = { bold: true, size: 11, name: '맑은 고딕' };
      row.getCell(2).font = { bold: true, size: 11, name: '맑은 고딕' };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE082' } };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE082' } };
    }
    
    row.height = 26;
    rowIndex++;
  });
  
  // 열 너비 자동 조정 (내용에 맞게)
  sheet.columns.forEach((col, index) => {
    let maxLength = 10;
    // 각 열의 최대 내용 길이 계산
    for (let row = 1; row <= rowIndex; row++) {
      const cell = sheet.getRow(row).getCell(index + 1);
      if (cell.value) {
        const cellLength = String(cell.value).length;
        maxLength = Math.max(maxLength, cellLength);
      }
    }
    // 열 너비 설정 (최소값과 최대값 제한)
    col.width = Math.min(Math.max(maxLength + 2, col.width || 15), 50);
  });
  
  // 페이지 설정: 한 페이지에 맞추기
  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 1,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3
    }
  };
  
  // 인쇄 영역 설정
  sheet.pageSetup.printArea = `A1:F${rowIndex - 1}`;
  
  // 첫 행 고정 (스크롤 시 헤더 고정)
  sheet.views = [{ state: 'normal', ySplit: 1 }];
}

/**
 * 날짜를 한국어 형식으로 변환 (YYYY년MM월DD일)
 */
function formatDateKorean(dateStr) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:705',message:'formatDateKorean entry',data:{dateStr,dateStrType:typeof dateStr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  if (!dateStr) return '-';
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    const result = `${year}년${month}월${day}일`;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:714',message:'formatDateKorean success',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return result;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelGenerator.js:720',message:'formatDateKorean no match',data:{dateStr,returningOriginal:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  return dateStr;
}

/**
 * 전세권 존속기간 계산 (등기일자 기준 2년)
 */
function calculateLeasePeriod(receiptDate) {
  if (!receiptDate) return '-';
  const match = receiptDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const startDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 2);
    
    const formatDate = (d) => {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };
    
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  }
  return '-';
}

/**
 * 섹션 헤더 추가
 */
function addSectionHeader(sheet, rowIndex, title) {
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  const row = sheet.getRow(rowIndex);
  const cell = row.getCell(1);
  cell.value = title;
  cell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
  cell.border = {
    bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
  };
  row.height = 28;
}

/**
 * 정보 행 추가
 */
function addInfoRow(sheet, rowIndex, label, value) {
  const row = sheet.getRow(rowIndex);
  
  const labelCell = row.getCell(1);
  labelCell.value = label;
  Object.assign(labelCell, styles.label);
  
  const valueCell = row.getCell(2);
  valueCell.value = value;
  Object.assign(valueCell, styles.cell);
  
  row.height = 24;
}

module.exports = { generateExcel };

