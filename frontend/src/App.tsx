import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import axios from 'axios';
import api from './api';
import { 
  FiUploadCloud, 
  FiFile, 
  FiDownload, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle,
  FiLoader,
  FiX
} from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineTableCells } from 'react-icons/hi2';

// Types
interface ParsedData {
  basicInfo: {
    uniqueNumber: string;
    location: string;
    roadAddress: string;
    buildingName: string;
    structure: string;
    exclusiveArea: string;
    landRightRatio: string;
    ownerName: string;
  };
  summary: {
    currentOwner: string;
    totalMortgage: string;
    mortgageCount: number;
    totalLease: string;
    leaseCount: number;
    warnings: string[];
  };
  sectionA: Array<{
    rankNumber: string;
    purpose: string;
    receiptDate: string;
    rightHolder: string;
    status: string;
  }>;
  sectionB: Array<{
    rankNumber: string;
    purpose: string;
    receiptDate: string;
    claimAmount: string;
    rightHolder: string;
    status: string;
  }>;
}

interface ConversionResult {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    downloadUrl: string;
    parsedData: ParsedData;
    processingTime: string;
  };
  error?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'sectionA' | 'sectionB' | 'debug'>('summary');
  const [showDebug, setShowDebug] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setUploadState('idle');
      setResult(null);
      setErrorMessage('');
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    console.log('Files rejected:', fileRejections);
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const errorCode = rejection.errors[0]?.code;
      
      if (errorCode === 'file-too-large') {
        setErrorMessage('파일 크기가 10MB를 초과합니다.');
      } else if (errorCode === 'file-invalid-type') {
        setErrorMessage('PDF 파일만 업로드 가능합니다.');
      } else {
        setErrorMessage('파일 업로드에 실패했습니다.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    noClick: false,
    noDrag: false,
    noKeyboard: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploadState('uploading');
    setProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await api.post<ConversionResult>('/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          // 업로드는 빠르게 완료되므로 20%까지만 표시, 나머지는 처리 중 표시
          setProgress(Math.min(percent, 20));
        },
        timeout: 90000, // 90초 타임아웃 (백엔드 60초 + 여유)
      });

      setProgress(100);
      setResult(response.data);
      setUploadState('success');
    } catch (error) {
      setUploadState('error');
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        let errorMsg = error.response.data.error;
        // 상세 에러 메시지가 있으면 추가
        if (error.response.data.details) {
          errorMsg += ` (상세: ${error.response.data.details})`;
        }
        setErrorMessage(errorMsg);
      } else if (axios.isAxiosError(error) && error.message) {
        setErrorMessage(`변환 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setErrorMessage('변환 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleDownload = () => {
    if (result?.data?.downloadUrl) {
      window.open(result.data.downloadUrl, '_blank');
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setResult(null);
    setErrorMessage('');
    setActiveTab('summary');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle w-64 h-64 -top-32 -left-32 opacity-30" style={{ animationDelay: '0s' }} />
        <div className="particle w-96 h-96 top-1/4 -right-48 opacity-20" style={{ animationDelay: '2s' }} />
        <div className="particle w-48 h-48 bottom-1/4 left-1/4 opacity-25" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg shadow-accent-500/30">
              <HiOutlineDocumentText className="w-8 h-8 text-white" />
            </div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/60"
            >
              →
            </motion.div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <HiOutlineTableCells className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            등기부 등본 <span className="text-accent-400">PDF</span> → <span className="text-emerald-400">Excel</span> 변환기
          </h1>
          <p className="text-white/60 text-lg">
            등기사항전부증명서를 업로드하면 구조화된 Excel 파일로 변환해드립니다
          </p>
        </motion.header>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {uploadState === 'success' && result?.data ? (
                // Success view with results
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Success header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-emerald-500/20">
                        <FiCheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">변환 완료!</h2>
                        <p className="text-white/50 text-sm">처리 시간: {result.data.processingTime}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className="btn-glow flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30"
                      >
                        <FiDownload className="w-5 h-5" />
                        Excel 다운로드
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                      >
                        <FiRefreshCw className="w-5 h-5" />
                        새 파일
                      </motion.button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                    {[
                      { id: 'summary', label: '📊 요약' },
                      { id: 'sectionA', label: '📋 갑구' },
                      { id: 'sectionB', label: '📋 을구' },
                      { id: 'debug', label: '🔍 파싱 결과' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                          activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'summary' && (
                      <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Basic info cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoCard
                            icon="📍"
                            label="소재지"
                            value={
                              result.data.parsedData.basicInfo.location && result.data.parsedData.basicInfo.buildingName
                                ? `${result.data.parsedData.basicInfo.location} ${result.data.parsedData.basicInfo.buildingName}`
                                : result.data.parsedData.basicInfo.location || result.data.parsedData.basicInfo.buildingName || '-'
                            }
                          />
                          <InfoCard
                            icon="👤"
                            label="현재 소유자"
                            value={result.data.parsedData.summary.currentOwner || '-'}
                          />
                          <InfoCard
                            icon="🏦"
                            label="유효 근저당권"
                            value={`${result.data.parsedData.summary.totalMortgage || '0원'} (${result.data.parsedData.summary.mortgageCount}건)`}
                          />
                          <InfoCard
                            icon="🏠"
                            label="유효 전세권"
                            value={`${result.data.parsedData.summary.totalLease || '0원'} (${result.data.parsedData.summary.leaseCount}건)`}
                          />
                        </div>

                        {/* Warnings */}
                        {result.data.parsedData.summary.warnings.length > 0 && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                              <FiAlertCircle className="w-5 h-5" />
                              주의사항
                            </h3>
                            <ul className="space-y-1">
                              {result.data.parsedData.summary.warnings.map((warning, i) => (
                                <li key={i} className="text-red-300 text-sm">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'sectionA' && (
                      <motion.div
                        key="sectionA"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="overflow-x-auto"
                      >
                        <h3 className="text-white font-semibold mb-3">갑구 (소유권에 관한 사항)</h3>
                        {result.data.parsedData.sectionA.length > 0 ? (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th className="min-w-[120px]">순위번호</th>
                                <th>등기목적</th>
                                <th>접수일자</th>
                                <th>권리자</th>
                                <th className="min-w-[100px]">상태</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.parsedData.sectionA.map((item, i) => (
                                <tr key={i} className={item.status === '말소' ? 'opacity-50' : ''}>
                                  <td className="min-w-[120px]">{item.rankNumber}</td>
                                  <td>{item.purpose || '-'}</td>
                                  <td>{item.receiptDate || '-'}</td>
                                  <td>{item.rightHolder || '-'}</td>
                                  <td className="min-w-[100px]">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      item.status === '유효' ? 'badge-valid' : 'badge-cancelled'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-white/50 text-center py-8">등록된 정보가 없습니다.</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'sectionB' && (
                      <motion.div
                        key="sectionB"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="overflow-x-auto"
                      >
                        <h3 className="text-white font-semibold mb-3">을구 (소유권 이외의 권리에 관한 사항)</h3>
                        {result.data.parsedData.sectionB.length > 0 ? (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th className="min-w-[120px]">순위번호</th>
                                <th>등기목적</th>
                                <th>접수일자</th>
                                <th>채권최고액/전세금</th>
                                <th>권리자</th>
                                <th className="min-w-[100px]">상태</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.parsedData.sectionB.map((item, i) => (
                                <tr key={i} className={item.status === '말소' ? 'opacity-50' : ''}>
                                  <td className="min-w-[120px]">{item.rankNumber}</td>
                                  <td>{item.purpose || '-'}</td>
                                  <td>{item.receiptDate || '-'}</td>
                                  <td className="text-right">{item.claimAmount || '-'}</td>
                                  <td>{item.rightHolder || '-'}</td>
                                  <td className="min-w-[100px]">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      item.status === '유효' ? 'badge-valid' : 'badge-cancelled'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-white/50 text-center py-8">등록된 정보가 없습니다.</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'debug' && (
                      <motion.div
                        key="debug"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                          <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                            <FiAlertCircle className="w-5 h-5" />
                            파싱 결과 확인
                          </h3>
                          <p className="text-yellow-300 text-sm">
                            아래 정보를 확인하여 데이터가 제대로 추출되었는지 확인하세요.
                          </p>
                        </div>

                        {/* BasicInfo 상세 정보 */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            📋 표제부 정보 (basicInfo)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-white/60 text-sm">고유번호:</span>
                              <p className="text-white font-mono text-sm">{result.data.parsedData.basicInfo.uniqueNumber || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">소재지번:</span>
                              <p className="text-white font-mono text-sm break-words">{result.data.parsedData.basicInfo.location || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">도로명주소:</span>
                              <p className="text-white font-mono text-sm break-words">{result.data.parsedData.basicInfo.roadAddress || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">건물명칭:</span>
                              <p className="text-white font-mono text-sm break-words">{result.data.parsedData.basicInfo.buildingName || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">소유자명:</span>
                              <p className="text-white font-mono text-sm">{result.data.parsedData.basicInfo.ownerName || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">건물구조:</span>
                              <p className="text-white font-mono text-sm">{result.data.parsedData.basicInfo.structure || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">전용면적:</span>
                              <p className="text-white font-mono text-sm">{result.data.parsedData.basicInfo.exclusiveArea || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                            <div>
                              <span className="text-white/60 text-sm">대지권비율:</span>
                              <p className="text-white font-mono text-sm">{result.data.parsedData.basicInfo.landRightRatio || <span className="text-red-400">(없음)</span>}</p>
                            </div>
                          </div>
                        </div>

                        {/* 데이터 통계 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-white/60 text-sm mb-1">갑구 항목 수</div>
                            <div className="text-2xl font-bold text-white">{result.data.parsedData.sectionA.length}</div>
                            <div className="text-xs text-white/40 mt-1">
                              유효: {result.data.parsedData.sectionA.filter((item: any) => item.status === '유효').length}건
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-white/60 text-sm mb-1">을구 항목 수</div>
                            <div className="text-2xl font-bold text-white">{result.data.parsedData.sectionB.length}</div>
                            <div className="text-xs text-white/40 mt-1">
                              유효: {result.data.parsedData.sectionB.filter((item: any) => item.status === '유효').length}건
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-white/60 text-sm mb-1">처리 시간</div>
                            <div className="text-2xl font-bold text-white">{result.data.processingTime}</div>
                          </div>
                        </div>

                        {/* 원본 JSON 데이터 (접기/펼치기) */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <h3 className="text-white font-semibold flex items-center gap-2">
                              🔍 원본 파싱 데이터 (JSON)
                            </h3>
                            <span className="text-white/60 text-sm">{showDebug ? '접기' : '펼치기'}</span>
                          </button>
                          {showDebug && (
                            <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/10 overflow-auto max-h-96">
                              <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap break-words">
                                {JSON.stringify(result.data.parsedData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                // Upload view
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Dropzone */}
                  <div
                    {...getRootProps({
                      onClick: (e) => {
                        // 파일이 이미 선택된 경우 클릭으로 새 파일 선택 방지
                        if (file) {
                          e.stopPropagation();
                        }
                      }
                    })}
                    className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
                        : file
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }`}
                    style={{ minHeight: '200px' }}
                  >
                    <input {...getInputProps()} />
                    
                    <AnimatePresence mode="wait">
                      {file ? (
                        <motion.div
                          key="file-selected"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/20">
                            <FiFile className="w-12 h-12 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-lg">{file.name}</p>
                            <p className="text-white/50 text-sm">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="inline-flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
                            >
                              <FiX className="w-4 h-4" />
                              파일 제거
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                open();
                              }}
                              className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm transition-colors"
                            >
                              <FiUploadCloud className="w-4 h-4" />
                              다른 파일 선택
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="no-file"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <motion.div
                            animate={{ y: isDragActive ? -10 : 0, scale: isDragActive ? 1.1 : 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="inline-flex p-4 rounded-2xl bg-white/10"
                          >
                            <FiUploadCloud className={`w-12 h-12 transition-colors ${isDragActive ? 'text-primary-400' : 'text-white/60'}`} />
                          </motion.div>
                          <div>
                            <p className="text-white font-medium text-lg">
                              {isDragActive ? '🎯 여기에 파일을 놓으세요!' : 'PDF 파일을 드래그하거나 클릭하여 선택'}
                            </p>
                            <p className="text-white/50 text-sm mt-1">
                              등기사항전부증명서 PDF 파일 (최대 10MB)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                          >
                            <FiUploadCloud className="w-4 h-4" />
                            파일 선택하기
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                      >
                        <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress bar */}
                  <AnimatePresence>
                    {uploadState === 'uploading' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-6"
                      >
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/60">
                            {progress < 20 ? '파일 업로드 중...' : 'PDF 분석 및 Excel 생성 중...'}
                          </span>
                          <span className="text-white">
                            {progress < 20 ? `${progress}%` : '처리 중...'}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Convert button */}
                  <motion.button
                    whileHover={{ scale: file && uploadState !== 'uploading' ? 1.02 : 1 }}
                    whileTap={{ scale: file && uploadState !== 'uploading' ? 0.98 : 1 }}
                    onClick={handleUpload}
                    disabled={!file || uploadState === 'uploading'}
                    className={`btn-glow w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                      file && uploadState !== 'uploading'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 cursor-pointer'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {uploadState === 'uploading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiLoader className="w-5 h-5 animate-spin" />
                        변환 중...
                      </span>
                    ) : (
                      'Excel로 변환하기'
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: '🔒', title: '안전한 처리', desc: '업로드된 파일은 즉시 삭제됩니다' },
            { icon: '⚡', title: '빠른 변환', desc: '몇 초 내에 변환이 완료됩니다' },
            { icon: '📊', title: '구조화된 데이터', desc: '시트별로 정리된 Excel 출력' },
          ].map((feature, i) => (
            <div key={i} className="glass rounded-xl p-4 text-center">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="text-white font-medium mt-2">{feature.title}</h3>
              <p className="text-white/50 text-sm mt-1">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="text-center mt-12 text-white/40 text-sm">
          <p>등기부 등본 PDF → Excel 변환기 v1.0</p>
        </footer>
      </div>
    </div>
  );
}

// Info card component
function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-white/50 text-sm">{label}</span>
      </div>
      <p className="text-white font-medium truncate" title={value}>{value}</p>
    </div>
  );
}

export default App;

