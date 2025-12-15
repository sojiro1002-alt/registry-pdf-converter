/**
 * 등기부 등본 PDF → Excel 변환 서버
 * Express.js 기반 REST API 서버
 */

// 환경변수 로드 (가장 먼저 실행)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { parseRegistryPdf } = require('./parsers/pdfParser');
const { parseRegistryPdfWithGemini } = require('./parsers/geminiParser');
const { generateExcel } = require('./generators/excelGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://sojiro1002-alt.github.io',
  'https://*.pages.dev' // Cloudflare Pages 도메인
];

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 (같은 도메인 요청 등) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin이거나 pages.dev 서브도메인이면 허용
    if (allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../outputs');

// 디렉토리 생성
[uploadDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
    }
  }
});

/**
 * 헬스체크 엔드포인트
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '서버가 정상 작동 중입니다.' });
});

/**
 * PDF 업로드 및 변환 엔드포인트
 */
app.post('/api/convert', upload.single('pdf'), async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'PDF 파일이 업로드되지 않았습니다.' 
    });
  }

  const filePath = req.file.path;
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  
  try {
    console.log(`[INFO] PDF 파싱 시작: ${originalName}`);
    
    // 1. PDF 파싱 (Gemini API 사용, 실패 시 기존 파서로 빠른 폴백)
    let parsedData;
    const geminiStartTime = Date.now();
    try {
      console.log(`[INFO] Gemini API로 파싱 시도...`);
      parsedData = await parseRegistryPdfWithGemini(filePath);
      const geminiTime = Date.now() - geminiStartTime;
      console.log(`[INFO] Gemini API 파싱 성공 (${geminiTime}ms)`);
      
      // 파싱된 데이터 검증
      if (!parsedData || !parsedData.basicInfo) {
        throw new Error('Gemini API 파싱 결과가 비어있습니다.');
      }
      
      // basicInfo가 비어있는지 확인
      const hasBasicInfo = parsedData.basicInfo && Object.keys(parsedData.basicInfo).length > 0;
      if (!hasBasicInfo) {
        console.warn('[WARN] Gemini API 파싱 결과: basicInfo가 비어있습니다. 폴백 파서로 재시도...');
        throw new Error('Gemini API 파싱 결과가 유효하지 않습니다.');
      }
      
    } catch (geminiError) {
      const geminiTime = Date.now() - geminiStartTime;
      console.warn(`[WARN] Gemini API 파싱 실패 (${geminiTime}ms):`, geminiError.message);
      console.warn(`[WARN] 스택 트레이스:`, geminiError.stack);
      console.log(`[INFO] 기존 파서로 폴백 시도...`);
      
      try {
        parsedData = await parseRegistryPdf(filePath);
        console.log(`[INFO] 기존 파서로 파싱 완료`);
      } catch (fallbackError) {
        console.error(`[ERROR] 폴백 파서도 실패:`, fallbackError.message);
        throw new Error(`PDF 파싱 실패: ${geminiError.message}. 폴백 파서도 실패: ${fallbackError.message}`);
      }
    }
    
    console.log(`[INFO] PDF 파싱 완료, Excel 생성 시작`);
    console.log(`[DEBUG] 파싱된 데이터 요약:`, {
      hasBasicInfo: !!parsedData.basicInfo,
      basicInfoKeys: parsedData.basicInfo ? Object.keys(parsedData.basicInfo) : [],
      sectionACount: parsedData.sectionA ? parsedData.sectionA.length : 0,
      sectionBCount: parsedData.sectionB ? parsedData.sectionB.length : 0,
      hasSummary: !!parsedData.summary
    });
    
    // 2. Excel 생성
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:111',message:'before generateExcel',data:{hasParsedData:!!parsedData,hasBasicInfo:!!parsedData?.basicInfo,ownerName:parsedData?.basicInfo?.ownerName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 파일명 생성 (한글 인코딩 문제 방지)
    const ownerName = parsedData.basicInfo?.ownerName || parsedData.summary?.currentOwner || '변환';
    // 파일명에서 특수문자 제거 및 안전한 문자만 사용
    const safeOwnerName = ownerName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    const outputFileName = `registry_${safeOwnerName}_${Date.now()}.xlsx`;
    const outputPath = path.join(outputDir, outputFileName);
    
    try {
      await generateExcel(parsedData, outputPath);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:116',message:'after generateExcel success',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (excelError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:120',message:'generateExcel error',data:{error:excelError.message,stack:excelError.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw excelError;
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[INFO] 변환 완료: ${processingTime}ms`);
    
    // 3. 응답 반환
    // 배포 환경에서는 전체 URL 반환
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://registry-pdf-converter-api.onrender.com'
      : `http://localhost:${PORT}`;
    
    res.json({
      success: true,
      message: '변환이 완료되었습니다.',
      data: {
        fileName: outputFileName,
        downloadUrl: `${baseUrl}/api/download/${outputFileName}`,
        parsedData: parsedData,
        processingTime: `${processingTime}ms`
      }
    });

  } catch (error) {
    console.error('[ERROR] 변환 실패:', error);
    console.error('[ERROR] 오류 메시지:', error.message);
    console.error('[ERROR] 오류 이름:', error.name);
    console.error('[ERROR] 스택 트레이스:', error.stack);
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/aea20415-20d7-43b7-94bf-cc94e6541506',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:132',message:'conversion error caught',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,500),errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // 사용자 친화적인 오류 메시지 생성
    let userFriendlyMessage = 'PDF 변환 중 오류가 발생했습니다.';
    
    if (error.message.includes('JSON 파싱')) {
      userFriendlyMessage = 'PDF 데이터 추출 중 오류가 발생했습니다. PDF 파일이 손상되었거나 형식이 올바르지 않을 수 있습니다.';
    } else if (error.message.includes('Gemini API')) {
      userFriendlyMessage = 'AI 데이터 추출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('파싱')) {
      userFriendlyMessage = 'PDF 파일을 읽는 중 오류가 발생했습니다. 파일이 올바른 등기부 등본인지 확인해주세요.';
    }
    
    res.status(500).json({
      success: false,
      error: userFriendlyMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // 업로드된 PDF 파일 삭제 (보안)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('[WARN] 임시 파일 삭제 실패:', e);
    }
  }
});

/**
 * Excel 파일 다운로드 엔드포인트
 */
app.get('/api/download/:filename', (req, res) => {
  // URL 디코딩 처리 (한글 파일명 지원)
  let filename;
  try {
    filename = decodeURIComponent(req.params.filename);
  } catch (e) {
    filename = req.params.filename;
  }
  
  const filePath = path.join(outputDir, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] 파일을 찾을 수 없음: ${filePath}`);
    return res.status(404).json({
      success: false,
      error: '파일을 찾을 수 없습니다.'
    });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  // 한글 파일명 인코딩 처리 (RFC 5987 형식)
  const encodedFilename = encodeURIComponent(filename);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => {
    console.error('[ERROR] 파일 스트림 오류:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: '파일 읽기 오류가 발생했습니다.' });
    }
  });
  fileStream.pipe(res);
  
  // 다운로드 후 파일 삭제 (5분 후)
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[INFO] 출력 파일 삭제: ${filename}`);
      }
    } catch (e) {
      console.error('[WARN] 출력 파일 삭제 실패:', e);
    }
  }, 5 * 60 * 1000);
});

/**
 * 에러 핸들링 미들웨어
 */
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '파일 크기가 10MB를 초과합니다.'
      });
    }
  }
  
  console.error('[ERROR]', error);
  res.status(500).json({
    success: false,
    error: error.message || '서버 오류가 발생했습니다.'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  등기부 등본 PDF → Excel 변환 서버                        ║
║  Server running on http://localhost:${PORT}               ║
╚════════════════════════════════════════════════════════╝
  `);
});

