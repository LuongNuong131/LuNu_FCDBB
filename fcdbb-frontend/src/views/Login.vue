<template>
  <div class="grid min-h-[calc(100vh-8rem)] items-center gap-8 py-4 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-10">
    <section class="hidden lg:block">
      <p class="eyebrow mb-5">FC ĐÁ BAY BÓNG · SEASON 2026</p>
      <h1 class="max-w-xl font-display text-6xl font-extrabold leading-[1.04] tracking-[-.065em] text-white xl:text-7xl">Bản lĩnh trên sân.<br><span class="text-amber-300">Kỷ luật ngoài sân.</span></h1>
      <p class="mt-7 max-w-lg text-base leading-7 text-slate-400">Nơi mọi trận đấu, mọi thành viên và mọi khoảnh khắc của đội bóng được kết nối trong một không gian vận hành rõ ràng.</p>
      <div class="mt-10 flex gap-3">
        <div class="stat-card min-w-32"><p class="stat-label">Mục tiêu</p><p class="stat-value">01</p><p class="mt-1 text-xs text-slate-400">Một tập thể</p></div>
        <div class="stat-card min-w-32"><p class="stat-label">Tinh thần</p><p class="stat-value">100%</p><p class="mt-1 text-xs text-slate-400">Không bỏ cuộc</p></div>
      </div>
    </section>

    <section class="glass-panel relative mx-auto w-full max-w-md overflow-hidden p-6 sm:p-9">
      <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl"></div>
      <div class="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl"></div>
      <div class="relative z-10">
        <div class="mb-7 flex items-center gap-4 sm:hidden"><span class="brand-mark">⚽</span><div><p class="brand-wordmark">FC Đá Bay Bóng</p><p class="brand-subtitle">Football club OS</p></div></div>
        <p class="section-eyebrow mb-2">KHU VỰC THÀNH VIÊN</p>
        <h2 class="font-display text-3xl font-extrabold tracking-[-.04em] text-white">Chào mừng trở lại.</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">Đăng nhập để cập nhật đội hình, điểm danh và theo dõi hoạt động của FC.</p>
        <div class="mt-8 space-y-5">
          <div>
            <label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.18em] text-sky-300">Tài khoản</label>
            <input v-model="username" type="text" class="glass-input" placeholder="Nhập username" @keyup.enter="login">
          </div>
          <div>
            <label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.18em] text-sky-300">Mật khẩu</label>
            <input v-model="password" type="password" class="glass-input" placeholder="Nhập mật khẩu" @keyup.enter="login">
          </div>
          <button @click="login" class="glass-btn btn-gold mt-7">Vào sân <span class="text-lg">→</span></button>
        </div>
        <div class="mt-7 flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-slate-500"><span class="h-px flex-1 bg-white/10"></span><span>FCDBB access</span><span class="h-px flex-1 bg-white/10"></span></div>
      </div>
    </section>
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
