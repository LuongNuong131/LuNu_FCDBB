<template>
  <div class="w-full max-w-6xl space-y-6">
    <div class="flex gap-2 mb-4 border-b border-white/20 pb-2">
      <button @click="tab = 'matches'" :class="tab === 'matches' ? 'text-blue-400 font-bold border-b-2 border-blue-400' : 'text-gray-400'" class="px-4 py-2">⚽ Quản lý Trận</button>
      <button @click="tab = 'users'" :class="tab === 'users' ? 'text-blue-400 font-bold border-b-2 border-blue-400' : 'text-gray-400'" class="px-4 py-2">👥 Tổng kho Cầu Thủ</button>
    </div>

    <div v-if="tab === 'matches'" class="space-y-6">
      <div class="glass-panel">
        <h2 class="text-xl font-bold text-blue-200 mb-4">{{ isEditing ? 'Sửa Trận Bóng' : 'Tạo Trận Bóng Mới' }}</h2>
        <div class="mb-4" v-if="!isEditing && uniqueLocations.length > 0">
          <label class="text-xs text-gray-400 block mb-1">Chọn sân quen thuộc:</label>
          <select @change="applyFamiliarLocation" class="glass-input !w-full md:!w-1/2">
            <option value="">-- Click để chọn sân cũ --</option>
            <option v-for="(l, i) in uniqueLocations" :key="i" :value="i">{{ l.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <input v-model="match.title" placeholder="Tên trận (VD: Giao hữu ABC)" class="glass-input col-span-2 md:col-span-1">
          <div class="flex gap-2">
            <input v-model="match.location_name" placeholder="Tên Sân" class="glass-input flex-1">
            <button @click="getGPS" class="bg-indigo-600 px-3 rounded-lg text-xs font-bold hover:bg-indigo-500 whitespace-nowrap">📍 Lấy GPS</button>
          </div>
          <input v-model="match.lat" type="number" placeholder="Vĩ độ (Lat)" class="glass-input">
          <input v-model="match.lng" type="number" placeholder="Kinh độ (Lng)" class="glass-input">
          <div><label class="text-xs text-gray-400">Bắt đầu</label><input v-model="match.start_time" type="datetime-local" class="glass-input"></div>
          <div><label class="text-xs text-yellow-400">Khóa ĐD đúng giờ</label><input v-model="match.lock_time" type="datetime-local" class="glass-input"></div>
          <div><label class="text-xs text-red-400">Chốt sổ vắng mặt</label><input v-model="match.end_time" type="datetime-local" class="glass-input"></div>
          <input v-model="match.map_link" placeholder="Link Google Map" class="glass-input">
        </div>
        <div class="flex gap-4">
          <button @click="saveMatch" class="glass-btn !bg-green-600">{{ isEditing ? 'Lưu Thay Đổi' : 'Tạo Trận' }}</button>
          <button v-if="isEditing" @click="resetMatchForm" class="glass-btn !bg-gray-600">Hủy</button>
        </div>
      </div>

      <div class="glass-panel">
        <h2 class="text-xl font-bold mb-4">Danh sách Trận đấu (Toàn bộ)</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
          <div v-for="m in allMatches" :key="m.id" class="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
            <div>
              <p class="font-bold text-blue-200">{{ m.title }} <span class="text-xs text-gray-400">({{ new Date(m.start_time).toLocaleDateString('vi-VN') }})</span></p>
              <p class="text-xs">Sân: {{ m.location_name }}</p>
            </div>
            <div class="flex gap-2">
              <button v-if="isMatchActive(m.end_time)" @click="editMatch(m)" class="bg-yellow-600/80 px-3 py-1 rounded text-xs hover:bg-yellow-500">Sửa</button>
              <button v-if="isMatchActive(m.end_time)" @click="stopMatch(m.id)" class="bg-orange-600/80 px-3 py-1 rounded text-xs hover:bg-orange-500">Dừng</button>
              <button @click="deleteMatch(m.id)" class="bg-red-600/80 px-3 py-1 rounded text-xs hover:bg-red-500">Xóa</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tab === 'users'" class="space-y-6">
      <div class="glass-panel mb-6">
        <h2 class="text-xl font-bold mb-4">Tạo Tài Khoản Mới</h2>
        <div class="flex gap-4">
          <input v-model="newUser.username" placeholder="Tài khoản (vd: luong)" class="glass-input">
          <input v-model="newUser.password" placeholder="Mật khẩu" class="glass-input">
          <input v-model="newUser.name" placeholder="Họ và tên" class="glass-input">
          <button @click="createUser" class="glass-btn !w-32">Tạo</button>
        </div>
      </div>

      <div class="glass-panel overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead><tr class="border-b border-white/20"><th class="p-2">TK</th><th class="p-2">Tên</th><th class="p-2">Quyền (Role)</th><th class="p-2 text-right">Hành động</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-white/5 hover:bg-white/5">
              <td class="p-2 font-mono text-blue-300">{{ u.username }}</td>
              <td class="p-2">{{ u.name }}</td>
              <td class="p-2">
                <select v-model="u.role" @change="saveUserRole(u)" class="bg-gray-800 text-xs p-1 rounded border border-gray-600" :disabled="u.username === 'admin'">
                  <option value="user">User (Cầu thủ)</option><option value="admin">Admin (Quản lý)</option>
                </select>
              </td>
              <td class="p-2 flex gap-2 justify-end">
                <router-link :to="'/profile/'+u.id" class="bg-blue-500/80 px-2 py-1 rounded text-xs">HS</router-link>
                <button @click="resetPass(u.id)" class="bg-yellow-600/80 px-2 py-1 rounded text-xs">MK</button>
                <button @click="deleteUser(u.id)" v-if="u.username !== 'admin'" class="bg-red-500/80 px-2 py-1 rounded text-xs">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const tab = ref('matches');
const allMatches = ref([]);
const users = ref([]);
const isEditing = ref(false);

const match = ref({ id: null, title: '', location_name: '', lat: '', lng: '', map_link: '', start_time: '', lock_time: '', end_time: '' });
const newUser = ref({ username: '', password: '', name: '' });

const loadAdminData = async () => {
  try {
    const [resM, resU] = await Promise.all([axios.get(`${API}/matches`), axios.get(`${API}/users`)]);
    allMatches.value = resM.data || [];
    users.value = resU.data || [];
  } catch(e) { console.error("Lỗi load admin data:", e); }
};
onMounted(loadAdminData);

const uniqueLocations = computed(() => {
  const locs = []; const map = new Map();
  if (!allMatches.value || !Array.isArray(allMatches.value)) return locs;
  allMatches.value.forEach(m => {
    if(!map.has(m.location_name)) { map.set(m.location_name, true); locs.push({ name: m.location_name, lat: m.lat, lng: m.lng, map_link: m.map_link }); }
  });
  return locs;
});
const applyFamiliarLocation = (e) => {
  if(e.target.value === '') return;
  const l = uniqueLocations.value[e.target.value];
  match.value.location_name = l.name; match.value.lat = l.lat; match.value.lng = l.lng; match.value.map_link = l.map_link;
};

const getGPS = () => navigator.geolocation.getCurrentPosition(pos => { match.value.lat = pos.coords.latitude; match.value.lng = pos.coords.longitude; }, () => alert('Lỗi lấy GPS! Hãy kiểm tra cài đặt vị trí.'));
const isMatchActive = (endTime) => new Date(endTime) > new Date();

const saveMatch = async () => {
  try {
    if (isEditing.value) await axios.put(`${API}/matches/${match.value.id}`, match.value);
    else await axios.post(`${API}/matches`, match.value);
    alert('Lưu trận thành công!'); resetMatchForm(); loadAdminData();
  } catch(e) { alert("Lỗi lưu trận!"); }
};
const editMatch = (m) => { match.value = { ...m, start_time: m.start_time.slice(0,16), lock_time: m.lock_time.slice(0,16), end_time: m.end_time.slice(0,16) }; isEditing.value = true; };
const stopMatch = async (id) => {
  if (confirm('Đóng sổ điểm danh trận này ngay lập tức?')) {
    const now = new Date(); now.setHours(now.getHours() + 7); await axios.put(`${API}/matches/${id}`, { end_time: now.toISOString() }); loadAdminData();
  }
};
const deleteMatch = async (id) => { if(confirm('Xóa VĨNH VIỄN trận này và mọi dữ liệu điểm danh?')) { await axios.delete(`${API}/matches/${id}`); loadAdminData(); }};
const resetMatchForm = () => { match.value = { id: null, title: '', location_name: '', lat: '', lng: '', map_link: '', start_time: '', lock_time: '', end_time: '' }; isEditing.value = false; };

const createUser = async () => { await axios.post(`${API}/users`, newUser.value); newUser.value = { username: '', password: '', name: '' }; loadAdminData(); alert('Tạo thành công!'); };
const saveUserRole = async (u) => { await axios.put(`${API}/users/${u.id}`, { role: u.role }); alert('Cập nhật quyền thành công!'); };
const resetPass = async (id) => { const np = prompt('Nhập mật khẩu mới:'); if(np) { await axios.put(`${API}/users/${id}/reset-password`, { password: np }); alert('Đã reset MK!'); } };
const deleteUser = async (id) => { if(confirm('Xóa VĨNH VIỄN cầu thủ này?')) { await axios.delete(`${API}/users/${id}`); loadAdminData(); }};
</script>