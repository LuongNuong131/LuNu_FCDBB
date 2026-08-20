<template>
  <div class="glass-panel w-full max-w-3xl mx-auto !p-0 overflow-hidden relative" v-if="profile">
    <!-- Header Banner -->
    <div class="h-48 bg-gradient-to-r from-blue-700 to-blue-900 relative">
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
    </div>
    
    <div class="px-8 pb-10 relative">
      <!-- Avatar Section -->
      <div class="flex flex-col items-center -mt-20 mb-8 relative z-10">
        <div class="relative group">
          <img :src="profile.avatar" class="w-40 h-40 rounded-full border-4 border-[#1e3a8a] object-cover shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[#0f172a]">
          <div v-if="isOwner || isAdmin" class="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
            <label class="text-white font-bold text-sm cursor-pointer w-full h-full flex items-center justify-center">
              Đổi Ảnh
              <input type="file" @change="uploadAvatar" accept="image/*" class="hidden" />
            </label>
          </div>
        </div>
        <h2 class="text-3xl font-black text-white mt-4 tracking-tight uppercase">{{ profile.name }}</h2>
        <span class="bg-blue-600/30 text-blue-200 border border-blue-400/30 px-4 py-1 rounded-full text-sm font-bold mt-2">{{ profile.position || 'Chưa rõ vị trí' }}</span>
      </div>
      
      <!-- Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/10">
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Họ và Tên</label><input v-model="profile.name" class="glass-input" disabled></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Ngày sinh</label><input v-model="profile.dob" type="date" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Số điện thoại</label><input v-model="profile.phone" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Email</label><input v-model="profile.email" type="email" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Chiều cao (cm)</label><input v-model="profile.height" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Cân nặng (kg)</label><input v-model="profile.weight" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Chân trái (/5)</label><input v-model="profile.left_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Chân phải (/5)</label><input v-model="profile.right_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
        
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-gold mb-1.5 block">Vị trí (Admin phân công)</label>
          <select v-model="profile.position" class="glass-input" :disabled="!isAdmin">
            <option value="Chưa rõ">Chưa rõ</option>
            <option value="Tiền đạo">Tiền đạo</option>
            <option value="Tiền vệ">Tiền vệ</option>
            <option value="Hậu vệ">Hậu vệ</option>
            <option value="Thủ môn">Thủ môn</option>
          </select>
        </div>

        <div><label class="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1.5 block">Chỉ số BMI</label><input v-model="profile.bmi" class="glass-input text-green-400 font-black bg-green-500/10 border-green-500/30" disabled></div>
      </div>
      
      <button v-if="isOwner || isAdmin" @click="save" class="glass-btn mt-8 md:w-1/2 md:mx-auto text-lg tracking-widest uppercase">💾 Lưu Hồ Sơ</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const route = useRoute();
const profile = ref(null);
const currentUser = JSON.parse(localStorage.getItem('fcdbb_user') || '{}');
const isOwner = computed(() => currentUser.id == route.params.id);
const isAdmin = computed(() => currentUser.role === 'admin');

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/users/${route.params.id}`);
    profile.value = res.data;
  } catch (e) { console.error("Lỗi lấy thông tin:", e); }
});

const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData(); formData.append('file', file);
  try {
    const res = await axios.post(`${API}/users/${route.params.id}/avatar`, formData);
    profile.value.avatar = res.data.avatar;
    if (isOwner.value) { currentUser.avatar = res.data.avatar; localStorage.setItem('fcdbb_user', JSON.stringify(currentUser)); }
    alert('Đổi Avatar thành công!');
  } catch (e) { alert('Lỗi tải ảnh!'); }
};

const save = async () => {
  try {
    const res = await axios.put(`${API}/users/${route.params.id}`, profile.value);
    profile.value = res.data;
    alert('Lưu hồ sơ thành công!');
  } catch (e) { alert('Lỗi lưu hồ sơ!'); }
};
</script>