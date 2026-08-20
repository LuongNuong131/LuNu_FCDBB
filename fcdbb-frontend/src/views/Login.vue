<template>
  <div class="flex items-center justify-center min-h-[80vh] w-full">
    <div class="glass-panel w-full max-w-md p-8 text-center relative overflow-hidden">
      <div class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-700/30 rounded-full blur-3xl"></div>
      
      <div class="relative z-10">
        <div class="badge-crest mx-auto mb-4">⚽</div>
        <p class="section-eyebrow mb-1">FC ĐÁ BAY BÓNG</p>
        <h2 class="text-3xl font-black mb-8 text-white tracking-tight uppercase">Đăng Nhập</h2>
        <div class="space-y-5 text-left">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">Tài khoản</label>
            <input v-model="username" type="text" class="glass-input" placeholder="Nhập username" @keyup.enter="login">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">Mật khẩu</label>
            <input v-model="password" type="password" class="glass-input" placeholder="Nhập mật khẩu" @keyup.enter="login">
          </div>
          <button @click="login" class="glass-btn btn-gold mt-6 uppercase tracking-widest text-sm">Vào Sân ➔</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
// Lấy biến môi trường Vercel (Nếu rỗng nó sẽ tự fallback về localhost để tránh lỗi)
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const login = async () => {
  if (!username.value || !password.value) {
    return alert('Vui lòng nhập đủ tài khoản và mật khẩu!');
  }
  
  console.log("🔗 Đang kết nối tới Backend tại:", API); // Dòng này để bạn check F12 xem link đúng chưa

  try {
    const res = await axios.post(`${API}/auth/login`, {
      username: username.value,
      password: password.value
    });
    
    localStorage.setItem('fcdbb_token', res.data.token);
    localStorage.setItem('fcdbb_user', JSON.stringify(res.data.user));
    
    // Ép reload lại trang để hệ thống nhận diện quyền Admin/User ngay lập tức
    window.location.href = '/'; 
    
  } catch (err) {
    console.error("🚨 Lỗi đăng nhập toàn tập:", err);
    alert(err.response?.data?.message || 'Không thể kết nối tới Server. Hãy kiểm tra F12 (Console)!');
  }
};
</script>