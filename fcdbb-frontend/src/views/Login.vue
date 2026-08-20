<template>
  <div class="glass-panel w-full max-w-sm mt-20">
    <h2 class="text-2xl font-bold text-center mb-6 text-blue-200">Đăng Nhập FCDBB</h2>
    <input v-model="username" type="text" placeholder="Tài khoản" class="glass-input mb-4">
    <input v-model="password" type="password" placeholder="Mật khẩu" class="glass-input mb-6" @keyup.enter="login">
    <button @click="login" class="glass-btn">Vào Sân ⚽</button>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
const router = useRouter();
const username = ref('');
const password = ref('');
const login = async () => {
  try {
    const res = await axios.post(`${API}/auth/login`, { username: username.value, password: password.value });
    localStorage.setItem('fcdbb_token', res.data.token);
    localStorage.setItem('fcdbb_user', JSON.stringify(res.data.user));
    window.location.href = '/';
  } catch (err) { alert(err.response?.data?.message || 'Đăng nhập thất bại!'); }
};
</script>