import axios from 'axios';

// Tự động lấy URL tùy thuộc vào môi trường (Local hoặc Vercel)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;