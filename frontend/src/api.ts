import axios from 'axios';

// 프록시가 없는 GitHub Pages 등에서 동작하도록 baseURL을 환경변수로 설정
// VITE_API_BASE가 없으면 상대경로(/api)로 동작 (로컬 dev 환경)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
});

export default api;



