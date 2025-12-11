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
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = '등기부 등본 변환기';
  workbook.created = new Date();
  
  // 단일 시트: 현재 유효한 권리 요약 (모든 정보 포함)
  createSummarySheet(workbook, data.summary, data.basicInfo, data.sectionA, data.sectionB);
  
  // 파일 저장
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`[INFO] Excel 파일 생성 완료: ${outputPath}`);
}

/**
 * 공통 스타일 정의
 */
const styles = {
  header: {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  },
  cell: {
    font: { size: 10 },
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
    }
  },
  cancelled: {
    font: { size: 10, strike: true, color: { argb: 'FF999999' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
  },
  title: {
    font: { bold: true, size: 14, color: { argb: 'FF2E5090' } },
    alignment: { horizontal: 'left', vertical: 'middle' }
  },
  label: {
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
    }
  },
  warning: {
    font: { bold: true, size: 10, color: { argb: 'FFCC0000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F0' } }
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
  const sheet = workbook.addWorksheet('현재 유효한 권리 요약', {
    properties: { tabColor: { argb: 'FF9C27B0' } }
  });
  
  // 열 너비 설정
  sheet.columns = [
    { width: 15 },  // A: 항목/순위번호
    { width: 15 },  // B: 내용/등기일자
    { width: 25 }, // C: 근저당권자/채권자/전세권자
    { width: 20 }, // D: 채무자/근저당권자
    { width: 20 }, // E: 채권최고액/전세금
    { width: 15 }, // F: 비고/존속기간
  ];
  
  let rowIndex = 1;
  
  // ===== 헤더: 현재 유효한 권리 요약 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const titleCell = sheet.getCell(`A${rowIndex}`);
  titleCell.value = '현재 유효한 권리 요약';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF2E5090' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
  sheet.getRow(rowIndex).height = 35;
  rowIndex++;
  
  // ===== 발급기준일 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const issueDateCell = sheet.getCell(`A${rowIndex}`);
  const today = new Date();
  const issueDate = `${today.getFullYear()}년${String(today.getMonth() + 1).padStart(2, '0')}월${String(today.getDate()).padStart(2, '0')}일`;
  issueDateCell.value = `발급기준일: ${issueDate}`;
  issueDateCell.font = { size: 11 };
  issueDateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(rowIndex).height = 25;
  rowIndex++;
  
  // ===== 부동산 소재지 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const locationCell = sheet.getCell(`A${rowIndex}`);
  locationCell.value = `부동산 소재지: ${basicInfo.location || '-'}`;
  locationCell.font = { size: 10 };
  locationCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.getRow(rowIndex).height = 22;
  rowIndex++;
  
  // ===== 도로명주소 =====
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const roadAddressCell = sheet.getCell(`A${rowIndex}`);
  roadAddressCell.value = `도로명주소: ${basicInfo.roadAddress || basicInfo.location || '-'}`;
  roadAddressCell.font = { size: 10 };
  roadAddressCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.getRow(rowIndex).height = 22;
  rowIndex += 2; // 빈 행
  
  // ===== 현재 소유자 정보 =====
  // 섹션 제목
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  const ownerTitleCell = sheet.getCell(`A${rowIndex}`);
  ownerTitleCell.value = '현재 소유자 정보';
  ownerTitleCell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
  ownerTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
  ownerTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ownerTitleCell.border = {
    bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
  };
  sheet.getRow(rowIndex).height = 28;
  rowIndex++;
  
  // 헤더 행
  const ownerHeaderRow = sheet.getRow(rowIndex);
  ownerHeaderRow.getCell(1).value = '항목';
  ownerHeaderRow.getCell(2).value = '내용';
  ownerHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  ownerHeaderRow.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  ownerHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  ownerHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  ownerHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ownerHeaderRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  ownerHeaderRow.getCell(1).border = styles.header.border;
  ownerHeaderRow.getCell(2).border = styles.header.border;
  ownerHeaderRow.height = 30;
  rowIndex++;
  
  // 소유자 정보 데이터
  const currentOwner = sectionA.find(e => e.status === '유효' && (e.purpose.includes('소유권이전') || e.purpose.includes('소유권보존'))) || 
                      sectionA.filter(e => e.status === '유효').pop();
  
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
    row.getCell(1).font = { size: 10 };
    row.getCell(2).font = { size: 10 };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    row.getCell(1).border = styles.cell.border;
    row.getCell(2).border = styles.cell.border;
    row.height = 24;
    rowIndex++;
  });
  
  rowIndex += 2; // 빈 행
  
  // ===== 현재 유효한 근저당권 =====
  const validMortgages = sectionB.filter(e => 
    e.status === '유효' && e.purpose.includes('근저당권설정')
  );
  
  if (validMortgages.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const mortgageTitleCell = sheet.getCell(`A${rowIndex}`);
    mortgageTitleCell.value = '현재 유효한 근저당권';
    mortgageTitleCell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
    mortgageTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    mortgageTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    mortgageTitleCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
    };
    sheet.getRow(rowIndex).height = 28;
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
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = styles.header.border;
    });
    mortgageHeaderRow.height = 30;
    rowIndex++;
    
    // 근저당권 데이터
    validMortgages.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.rightHolder || '-';
      row.getCell(4).value = entry.debtor || '-';
      row.getCell(5).value = entry.claimAmount ? parseFloat(entry.claimAmount.replace(/[^\d]/g, '')) : 0;
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).value = '';
      
      row.eachCell((cell) => {
        Object.assign(cell, styles.cell);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.height = 25;
      rowIndex++;
    });
    
    // 합계 행
    const totalMortgage = validMortgages.reduce((sum, e) => {
      const amount = parseFloat((e.claimAmount || '0').replace(/[^\d]/g, ''));
      return sum + amount;
    }, 0);
    
    const totalRow = sheet.getRow(rowIndex);
    totalRow.getCell(1).value = '합계';
    totalRow.getCell(5).value = totalMortgage;
    totalRow.getCell(5).numFmt = '#,##0.00';
    totalRow.getCell(1).font = { bold: true, size: 11 };
    totalRow.getCell(5).font = { bold: true, size: 11 };
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(1).border = styles.cell.border;
    totalRow.getCell(5).border = styles.cell.border;
    totalRow.height = 28;
    rowIndex += 2;
  }
  
  // ===== 현재 유효한 근질권 =====
  const validPledges = sectionB.filter(e => 
    e.status === '유효' && e.purpose.includes('근질권')
  );
  
  if (validPledges.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const pledgeTitleCell = sheet.getCell(`A${rowIndex}`);
    pledgeTitleCell.value = '현재 유효한 근질권';
    pledgeTitleCell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
    pledgeTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    pledgeTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    pledgeTitleCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
    };
    sheet.getRow(rowIndex).height = 28;
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
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = styles.header.border;
      }
    });
    pledgeHeaderRow.height = 30;
    rowIndex++;
    
    // 근질권 데이터
    validPledges.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.debtor || entry.rightHolder || '-';
      row.getCell(4).value = entry.rightHolder || '-';
      row.getCell(5).value = entry.claimAmount ? parseFloat(entry.claimAmount.replace(/[^\d]/g, '')) : 0;
      row.getCell(5).numFmt = '#,##0.00';
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, styles.cell);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.height = 25;
      rowIndex++;
    });
    
    rowIndex += 2;
  }
  
  // ===== 현재 유효한 전세권 =====
  const validLeases = sectionB.filter(e => 
    e.status === '유효' && e.purpose.includes('전세권설정')
  );
  
  if (validLeases.length > 0) {
    // 섹션 제목
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    const leaseTitleCell = sheet.getCell(`A${rowIndex}`);
    leaseTitleCell.value = '현재 유효한 전세권';
    leaseTitleCell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
    leaseTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    leaseTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    leaseTitleCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
    };
    sheet.getRow(rowIndex).height = 28;
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
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = styles.header.border;
      }
    });
    leaseHeaderRow.height = 30;
    rowIndex++;
    
    // 전세권 데이터
    validLeases.forEach((entry) => {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = entry.rankNumber;
      row.getCell(2).value = entry.receiptDate ? formatDateKorean(entry.receiptDate) : '-';
      row.getCell(3).value = entry.debtor || entry.rightHolder || '-';
      row.getCell(4).value = entry.claimAmount ? parseFloat(entry.claimAmount.replace(/[^\d]/g, '')) : 0;
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).value = entry.receiptDate ? calculateLeasePeriod(entry.receiptDate) : '-';
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, styles.cell);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      row.height = 25;
      rowIndex++;
    });
    
    rowIndex += 2;
  }
  
  // ===== 권리 부담 총괄 =====
  const totalMortgageAmount = validMortgages.reduce((sum, e) => {
    return sum + parseFloat((e.claimAmount || '0').replace(/[^\d]/g, ''));
  }, 0);
  
  const totalPledgeAmount = validPledges.reduce((sum, e) => {
    return sum + parseFloat((e.claimAmount || '0').replace(/[^\d]/g, ''));
  }, 0);
  
  const totalLeaseAmount = validLeases.reduce((sum, e) => {
    return sum + parseFloat((e.claimAmount || '0').replace(/[^\d]/g, ''));
  }, 0);
  
  const totalBurden = totalMortgageAmount + totalPledgeAmount + totalLeaseAmount;
  
  // 섹션 제목
  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const burdenTitleCell = sheet.getCell(`A${rowIndex}`);
  burdenTitleCell.value = '권리 부담 총괄';
  burdenTitleCell.font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
  burdenTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
  burdenTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  burdenTitleCell.border = {
    bottom: { style: 'medium', color: { argb: 'FF2E5090' } }
  };
  sheet.getRow(rowIndex).height = 28;
  rowIndex++;
  
  // 헤더 행
  const burdenHeaderRow = sheet.getRow(rowIndex);
  burdenHeaderRow.getCell(1).value = '구분';
  burdenHeaderRow.getCell(2).value = '총액';
  
  burdenHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  burdenHeaderRow.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  burdenHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  burdenHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  burdenHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  burdenHeaderRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  burdenHeaderRow.getCell(1).border = styles.header.border;
  burdenHeaderRow.getCell(2).border = styles.header.border;
  burdenHeaderRow.height = 30;
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
    
    row.getCell(1).font = { size: 10 };
    row.getCell(2).font = { size: 10 };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(1).border = styles.cell.border;
    row.getCell(2).border = styles.cell.border;
    
    if (label === '총 권리부담액') {
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(2).font = { bold: true, size: 11 };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    }
    
    row.height = 25;
    rowIndex++;
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
  if (!dateStr) return '-';
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    return `${year}년${month}월${day}일`;
  }
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

