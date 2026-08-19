<template>
  <div class="glass-panel w-full max-w-2xl" v-if="profile">
    <div class="flex flex-col items-center mb-6">
      <img :src="'http://localhost:3000' + profile.avatar" class="w-32 h-32 rounded-full border-4 border-white/20 object-cover mb-4">
      <input v-if="isOwner || isAdmin" type="file" @change="uploadAvatar" accept="image/*" class="text-sm text-gray-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <!-- Tên bị khóa cứng với tất cả -->
      <div><label class="text-xs text-gray-400">Họ và Tên</label><input v-model="profile.name" class="glass-input" disabled></div>
      
      <div><label class="text-xs text-gray-400">Ngày sinh</label><input v-model="profile.dob" type="date" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Số điện thoại</label><input v-model="profile.phone" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Email</label><input v-model="profile.email" type="email" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Chiều cao (cm)</label><input v-model="profile.height" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Cân nặng (kg)</label><input v-model="profile.weight" type="number" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Chân trái (/5)</label><input v-model="profile.left_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      <div><label class="text-xs text-gray-400">Chân phải (/5)</label><input v-model="profile.right_foot" type="number" min="1" max="5" class="glass-input" :disabled="!isOwner && !isAdmin"></div>
      
      <!-- Vị trí: Cầu thủ bị khóa, chỉ Admin mới được mở -->
      <div>
        <label class="text-xs text-gray-400">Vị trí (Chỉ Admin được sửa)</label>
        <select v-model="profile.position" class="glass-input !p-[0.6rem]" :disabled="!isAdmin">
          <option value="Chưa rõ">Chưa rõ</option>
          <option value="Tiền đạo">Tiền đạo</option>
          <option value="Tiền vệ">Tiền vệ</option>
          <option value="Hậu vệ">Hậu vệ</option>
          <option value="Thủ môn">Thủ môn</option>
        </select>
      </div>

      <!-- BMI bị khóa cứng với tất cả vì Server tự tính -->
      <div><label class="text-xs text-gray-400">BMI</label><input v-model="profile.bmi" class="glass-input text-green-300 font-bold" disabled></div>
    </div>
    
    <button v-if="isOwner || isAdmin" @click="save" class="glass-btn mt-6">💾 Lưu Hồ Sơ</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
const route = useRoute();
const profile = ref(null);
const currentUser = JSON.parse(localStorage.getItem('fcdbb_user'));
const isOwner = computed(() => currentUser.id == route.params.id);
const isAdmin = computed(() => currentUser.role === 'admin');

onMounted(async () => {
  const res = await axios.get(`http://localhost:3000/api/users/${route.params.id}`);
  profile.value = res.data;
});

const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData(); formData.append('file', file);
  try {
    const res = await axios.post(`http://localhost:3000/api/users/${route.params.id}/avatar`, formData);
    profile.value.avatar = res.data.avatar;
    if (isOwner.value) { currentUser.avatar = res.data.avatar; localStorage.setItem('fcdbb_user', JSON.stringify(currentUser)); }
    alert('Đổi Avatar thành công!');
  } catch (e) { alert('Lỗi tải ảnh!'); }
};

const save = async () => {
  try {
    const res = await axios.put(`http://localhost:3000/api/users/${route.params.id}`, profile.value);
    profile.value = res.data;
    alert('Lưu hồ sơ thành công!');
  } catch (e) { alert('Lỗi lưu hồ sơ!'); }
};
</script>