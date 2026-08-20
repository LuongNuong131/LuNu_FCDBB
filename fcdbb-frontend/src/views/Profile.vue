<template>
  <div v-if="profile" class="mx-auto w-full max-w-4xl space-y-6">
    <section class="glass-panel relative overflow-hidden !p-0"><div class="h-36 bg-gradient-to-r from-sky-900 via-blue-800 to-slate-900 sm:h-44"><div class="h-full opacity-30" style="background-image:linear-gradient(135deg,rgba(255,255,255,.12) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.12) 75%,transparent 75%);background-size:26px 26px"></div></div><div class="relative px-5 pb-6 sm:px-8 sm:pb-8"><div class="-mt-16 flex flex-col items-center gap-4 sm:-mt-20 sm:flex-row sm:items-end"><div class="group relative shrink-0"><img :src="profile.avatar" class="h-32 w-32 rounded-[1.75rem] border-4 border-[#0b1c31] object-cover shadow-2xl sm:h-40 sm:w-40"><div v-if="isOwner || isAdmin" class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[1.5rem] bg-black/65 opacity-0 transition group-hover:opacity-100"><label class="flex h-full w-full cursor-pointer items-center justify-center text-xs font-extrabold uppercase tracking-[.14em] text-white">Đổi ảnh<input type="file" @change="uploadAvatar" accept="image/*" class="hidden"></label></div></div><div class="min-w-0 flex-1 text-center sm:pb-2 sm:text-left"><p class="eyebrow mb-2">PLAYER PROFILE</p><h1 class="truncate font-display text-3xl font-extrabold tracking-[-.04em] text-white sm:text-4xl">{{ profile.name }}</h1><div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"><span class="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">{{ profile.position || 'Chưa rõ vị trí' }}</span><span v-if="isOwner" class="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-200">Hồ sơ của bạn</span></div></div></div></div></section>
    <section class="glass-panel"><div class="mb-6 flex flex-col justify-between gap-2 border-b border-white/[.08] pb-4 sm:flex-row sm:items-center"><div><p class="eyebrow mb-2">PERSONAL DATA</p><h2 class="font-display text-xl font-extrabold text-white">Thông tin cầu thủ</h2></div><p class="text-xs text-slate-500">{{ isOwner || isAdmin ? 'Bạn có thể chỉnh sửa thông tin.' : 'Chế độ chỉ xem.' }}</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Họ và tên</label><input v-model="profile.name" class="glass-input" disabled></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Ngày sinh</label><input v-model="profile.dob" type="date" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Số điện thoại</label><input v-model="profile.phone" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Email</label><input v-model="profile.email" type="email" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Chiều cao (cm)</label><input v-model="profile.height" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Cân nặng (kg)</label><input v-model="profile.weight" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Chân trái (/5)</label><input v-model="profile.left_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Chân phải (/5)</label><input v-model="profile.right_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-amber-300">Vị trí · Admin phân công</label><select v-model="profile.position" class="glass-input" :disabled="!isAdmin"><option value="Chưa rõ">Chưa rõ</option><option value="Tiền đạo">Tiền đạo</option><option value="Tiền vệ">Tiền vệ</option><option value="Hậu vệ">Hậu vệ</option><option value="Thủ môn">Thủ môn</option></select></div><div><label class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-300">Chỉ số BMI</label><input v-model="profile.bmi" class="glass-input font-black text-emerald-300" disabled></div></div><button v-if="isOwner || isAdmin" @click="save" class="glass-btn btn-gold mt-7 sm:mx-auto sm:w-1/2">Lưu hồ sơ</button></section>
  </div>
  <div v-else class="glass-panel mx-auto flex min-h-[280px] max-w-4xl items-center justify-center text-sm text-slate-400">Đang tải hồ sơ...</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useToast } from '../composables/useToast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const route = useRoute();
const profile = ref(null);
const currentUser = JSON.parse(localStorage.getItem('fcdbb_user') || '{}');
const { addToast } = useToast();
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
    addToast('Đổi ảnh đại diện thành công!', 'success');
  } catch (e) { addToast('Lỗi tải ảnh đại diện!', 'error'); }
};

const save = async () => {
  try {
    const res = await axios.put(`${API}/users/${route.params.id}`, profile.value);
    profile.value = res.data;
    addToast('Lưu hồ sơ thành công!', 'success');
  } catch (e) { addToast('Lỗi lưu hồ sơ!', 'error'); }
};
</script>
