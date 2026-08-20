<template>
  <div class="mx-auto w-full max-w-7xl space-y-7">
    <!-- Header Tabs -->
    <div class="flex flex-wrap gap-2 border-b border-white/[.08] pb-4">
      <button @click="tab = 'matches'" :class="tab === 'matches' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border-blue-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'" class="rounded-xl border px-4 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] transition-all duration-300 flex items-center gap-2">
        <span class="text-xl">⚽</span> Quản lý Trận Đấu
      </button>
      <button @click="tab = 'users'" :class="tab === 'users' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border-blue-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'" class="rounded-xl border px-4 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] transition-all duration-300 flex items-center gap-2">
        <span class="text-xl">👥</span> Tổng Kho Cầu Thủ
      </button>
    </div>

    <!-- Match Tab -->
    <div v-if="tab === 'matches'" class="grid gap-6 lg:grid-cols-5">
      <div class="lg:col-span-2 space-y-6">
        <div class="glass-panel">
          <h2 class="mb-6 flex items-center gap-3 border-b border-white/[.08] pb-4 font-display text-xl font-extrabold uppercase tracking-[.08em] text-amber-300">
            {{ isEditing ? '✏️ Sửa Trận Bóng' : '✨ Tạo Trận Mới' }}
          </h2>
          
          <div class="mb-5" v-if="!isEditing && uniqueLocations.length > 0">
            <label class="text-xs font-bold uppercase tracking-wide text-blue-300 block mb-2">Sân quen thuộc</label>
            <select @change="applyFamiliarLocation" class="glass-input">
              <option value="">-- Click để chọn form sân cũ --</option>
              <option v-for="(l, i) in uniqueLocations" :key="i" :value="i">{{ l.name }}</option>
            </select>
          </div>
          
          <div class="space-y-4 mb-6">
            <div><label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Tên Trận</label><input v-model="match.title" placeholder="VD: Giao hữu ABC" class="glass-input"></div>
            
            <div>
              <label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Sân & Vị trí</label>
              <div class="flex gap-2 mb-2">
                <input v-model="match.location_name" placeholder="Tên Sân" class="glass-input flex-1">
                <button @click="getGPS" class="bg-indigo-600 border border-indigo-400/50 px-4 rounded-lg text-xs font-bold hover:bg-indigo-500 whitespace-nowrap shadow-lg flex items-center gap-1">📍 Lấy GPS</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input v-model="match.lat" type="number" placeholder="Vĩ độ (Lat)" class="glass-input font-mono text-sm">
                <input v-model="match.lng" type="number" placeholder="Kinh độ (Lng)" class="glass-input font-mono text-sm">
              </div>
            </div>
            
            <div><label class="text-xs font-bold uppercase tracking-wide text-green-400 mb-1 block">Bắt đầu</label><input v-model="match.start_time" type="datetime-local" class="glass-input font-mono text-sm"></div>
            <div><label class="text-xs font-bold uppercase tracking-wide text-yellow-400 mb-1 block">Khóa điểm danh (Đúng giờ)</label><input v-model="match.lock_time" type="datetime-local" class="glass-input font-mono text-sm"></div>
            <div><label class="text-xs font-bold uppercase tracking-wide text-red-400 mb-1 block">Chốt sổ (Kết thúc)</label><input v-model="match.end_time" type="datetime-local" class="glass-input font-mono text-sm"></div>
            <div><label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Bản đồ</label><input v-model="match.map_link" placeholder="Link Google Map" class="glass-input text-sm text-blue-300"></div>
          </div>
          
          <div class="flex gap-3">
            <button @click="saveMatch" class="glass-btn !bg-gradient-to-r !from-green-600 !to-emerald-500 border-green-400/50 flex-1">{{ isEditing ? 'Lưu Thay Đổi' : 'Tạo Trận Này' }}</button>
            <button v-if="isEditing" @click="resetMatchForm" class="bg-gray-700 border border-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">Hủy</button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-3">
        <div class="glass-panel h-full">
          <h2 class="mb-6 flex items-center gap-3 border-b border-white/[.08] pb-4 font-display text-xl font-extrabold uppercase tracking-[.08em] text-sky-200">
            📋 Toàn bộ Trận Đấu
          </h2>
          <div class="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            <div v-for="m in allMatches" :key="m.id" class="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-white/10 transition-colors">
              <div>
                <p class="font-black text-lg text-white mb-1">{{ m.title }}</p>
                <p class="text-sm font-mono text-blue-300 mb-1">{{ new Date(m.start_time).toLocaleString('vi-VN') }}</p>
                <p class="text-xs text-gray-400 flex items-center gap-1">📍 {{ m.location_name }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button v-if="isMatchActive(m.end_time)" @click="editMatch(m)" class="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500/30 transition">Sửa</button>
                <button v-if="isMatchActive(m.end_time)" @click="stopMatch(m.id)" class="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-500/30 transition">Đóng Sổ</button>
                <button @click="deleteMatch(m.id)" class="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/30 transition">Xóa</button>
              </div>
            </div>
            <div v-if="allMatches.length === 0" class="text-center p-8 text-gray-500 italic">Chưa có trận đấu nào.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="tab === 'users'" class="space-y-6">
      <div class="glass-panel">
        <h2 class="mb-6 flex items-center gap-3 border-b border-white/[.08] pb-4 font-display text-xl font-extrabold uppercase tracking-[.08em] text-amber-300">
          ✨ Cấp Tài Khoản Cầu Thủ
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <div><label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Username</label><input v-model="newUser.username" placeholder="vd: luong123" class="glass-input"></div>
          <div><label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Mật khẩu</label><input v-model="newUser.password" placeholder="••••••••" class="glass-input"></div>
          <div><label class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">Họ & Tên</label><input v-model="newUser.name" placeholder="Tên hiển thị" class="glass-input"></div>
          <button @click="createUser" class="glass-btn !bg-gradient-to-r !from-green-600 !to-emerald-500 h-[50px]">Tạo Mới</button>
        </div>
      </div>

      <div class="table-shell overflow-x-auto p-0 rounded-2xl">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-black/40">
            <tr>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Tài khoản</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Tên hiển thị</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Chức vụ</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider text-right">Điều khiển</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-t border-white/5 hover:bg-white/5 transition-colors">
              <td class="p-4 font-mono font-bold text-gray-300">{{ u.username }}</td>
              <td class="p-4 font-semibold text-white">{{ u.name }}</td>
              <td class="p-4">
                <select v-model="u.role" @change="saveUserRole(u)" class="bg-[#0f172a] text-xs p-2 rounded-lg border border-white/20 text-white font-bold outline-none focus:border-blue-400" :disabled="u.username === 'admin'">
                  <option value="user">USER (Cầu thủ)</option>
                  <option value="admin">ADMIN (Quản lý)</option>
                </select>
              </td>
              <td class="p-4 flex gap-2 justify-end">
                <router-link :to="'/profile/'+u.id" class="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-500/30 transition">Hồ Sơ</router-link>
                <button @click="resetPass(u.id)" class="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded text-xs font-bold hover:bg-yellow-500/30 transition">Reset MK</button>
                <button @click="deleteUser(u.id)" v-if="u.username !== 'admin'" class="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-500/30 transition">Xóa</button>
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
