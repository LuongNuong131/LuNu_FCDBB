<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="glass-panel w-full max-w-md p-8">
      <h2 class="text-3xl font-bold text-center mb-8 text-blue-200">Đăng Nhập FCDBB</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tài khoản</label>
          <input v-model="username" type="text" class="glass-input !w-full" placeholder="Nhập username" @keyup.enter="login">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Mật khẩu</label>
          <input v-model="password" type="password" class="glass-input !w-full" placeholder="Nhập mật khẩu" @keyup.enter="login">
        </div>
        <button @click="login" class="glass-btn w-full mt-6 !bg-blue-600 hover:!bg-blue-500">ĐĂNG NHẬP</button>
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