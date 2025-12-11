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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
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
    
    // 1. PDF 파싱 (Gemini API 사용, 실패 시 기존 파서로 폴백)
    let parsedData;
    try {
      console.log(`[INFO] Gemini API로 파싱 시도...`);
      parsedData = await parseRegistryPdfWithGemini(filePath);
      console.log(`[INFO] Gemini API 파싱 성공`);
    } catch (geminiError) {
      console.warn(`[WARN] Gemini API 파싱 실패, 기존 파서로 폴백:`, geminiError.message);
      parsedData = await parseRegistryPdf(filePath);
      console.log(`[INFO] 기존 파서로 파싱 완료`);
    }
    
    console.log(`[INFO] PDF 파싱 완료, Excel 생성 시작`);
    
    // 2. Excel 생성
    const outputFileName = `등기부등본_${parsedData.basicInfo.ownerName || '변환'}_${Date.now()}.xlsx`;
    const outputPath = path.join(outputDir, outputFileName);
    
    await generateExcel(parsedData, outputPath);
    
    const processingTime = Date.now() - startTime;
    console.log(`[INFO] 변환 완료: ${processingTime}ms`);
    
    // 3. 응답 반환
    res.json({
      success: true,
      message: '변환이 완료되었습니다.',
      data: {
        fileName: outputFileName,
        downloadUrl: `/api/download/${outputFileName}`,
        parsedData: parsedData,
        processingTime: `${processingTime}ms`
      }
    });

  } catch (error) {
    console.error('[ERROR] 변환 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'PDF 변환 중 오류가 발생했습니다.'
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
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: '파일을 찾을 수 없습니다.'
    });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  
  const fileStream = fs.createReadStream(filePath);
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

