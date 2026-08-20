<template>
  <div class="w-full max-w-5xl mx-auto space-y-8" v-if="isAuthenticated">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-black text-white uppercase tracking-widest drop-shadow-md">Hệ Thống Trung Tâm</h1>
      <p class="text-blue-300 mt-2 font-mono">Dành riêng cho Ban Quản Trị</p>
    </div>

    <!-- Section 1 -->
    <div class="glass-panel relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <h2 class="text-xl font-black mb-6 text-gold uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">1. Nhập liệu hàng loạt (Cầu Thủ)</h2>
      <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-5 rounded-xl border border-white/10">
        <div class="w-full sm:flex-1 relative">
          <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" id="excel-file" class="hidden" />
          <label for="excel-file" class="cursor-pointer flex items-center justify-center gap-2 bg-[#0f172a] border border-white/20 text-blue-200 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors w-full font-mono text-sm">
            <span>{{ selectedFile ? `📁 ${selectedFile.name}` : 'Chọn file Excel (.xlsx)' }}</span>
          </label>
        </div>
        <button @click="uploadExcel" class="glass-btn !w-full sm:!w-auto whitespace-nowrap !bg-gradient-to-r !from-green-600 !to-emerald-500 border-green-400/50">📤 Bắt đầu Import</button>
      </div>
      <p class="text-xs text-red-300 mt-3 font-semibold bg-red-500/10 p-2 rounded border border-red-500/20 inline-block">⚠️ Lưu ý: Import file DS_Cầu_Thủ.xlsx sẽ xóa danh sách cũ và cập nhật mới.</p>
    </div>

    <!-- Section 2 -->
    <div class="glass-panel relative overflow-hidden">
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <h2 class="text-xl font-black mb-6 text-gold uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">2. Quản lý Tọa độ Sân bóng</h2>
      
      <div class="bg-white/5 p-5 rounded-xl border border-white/10 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div><label class="text-xs font-bold uppercase text-gray-400 mb-1 block">Tên Sân</label><input v-model="newLoc.name" type="text" placeholder="VD: Sân Chảo Lửa" class="glass-input"></div>
          <div><label class="text-xs font-bold uppercase text-gray-400 mb-1 block">Vĩ độ</label><input v-model="newLoc.lat" type="number" placeholder="Lat" class="glass-input font-mono"></div>
          <div><label class="text-xs font-bold uppercase text-gray-400 mb-1 block">Kinh độ</label><input v-model="newLoc.lng" type="number" placeholder="Lng" class="glass-input font-mono"></div>
          <div><label class="text-xs font-bold uppercase text-gray-400 mb-1 block">Bán kính (m)</label><input v-model="newLoc.radius" type="number" placeholder="Mặc định: 100" class="glass-input font-mono"></div>
        </div>
        <div class="flex flex-wrap gap-4">
          <button @click="getAdminGPS" class="glass-btn !bg-indigo-600/80 !w-auto flex-1 md:flex-none border-indigo-400/50">📍 Tự động lấy tọa độ hiện tại</button>
          <button @click="addLocation" class="glass-btn !bg-gradient-to-r !from-blue-600 !to-blue-500 !w-auto flex-1 md:flex-none">➕ Lưu Sân Bóng</button>
        </div>
      </div>
      
      <div class="space-y-3">
        <div v-for="loc in locations" :key="loc.id" class="flex flex-col sm:flex-row justify-between sm:items-center bg-black/30 p-4 rounded-xl border border-white/10 gap-4">
          <div>
            <span class="font-black text-lg text-white block mb-1">{{ loc.name }}</span>
            <span class="text-xs font-mono text-blue-300 bg-blue-900/40 px-2 py-1 rounded border border-blue-500/30">📍 [{{ loc.lat }}, {{ loc.lng }}] - Bán kính: <b class="text-gold">{{ loc.radius }}m</b></span>
          </div>
          <button @click="deleteLocation(loc.id)" class="text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 hover:text-white transition w-full sm:w-auto">Xóa</button>
        </div>
        <div v-if="locations.length === 0" class="text-center p-6 text-gray-500 italic">Chưa có dữ liệu sân bóng.</div>
      </div>
    </div>

    <!-- Section 3 -->
    <div class="glass-panel p-0 overflow-hidden border border-white/20">
      <div class="p-6 border-b border-white/10">
        <h2 class="text-xl font-black text-gold uppercase tracking-wider flex items-center gap-2">3. Lịch sử Audit Điểm danh</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead class="bg-black/40">
            <tr>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Thời gian ghi nhận</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Tên cầu thủ</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Mục tiêu (Sân)</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Sai số GPS</th>
              <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Kết quả thuật toán</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in history" :key="h.id" class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-4 font-mono text-gray-300">{{ new Date(h.created_at).toLocaleString('vi-VN') }}</td>
              <td class="p-4 font-bold text-white">{{ h.player?.name }}</td>
              <td class="p-4 text-blue-200">{{ h.location?.name }}</td>
              <td class="p-4 font-mono">{{ h.distance }}m</td>
              <td class="p-4">
                <span class="px-2 py-1 rounded text-xs font-black tracking-widest" :class="h.status === 'Hợp lệ' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'">{{ h.status }}</span>
              </td>
            </tr>
            <tr v-if="history.length === 0">
              <td colspan="5" class="p-8 text-center text-gray-400 italic">Không có lịch sử điểm danh.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center min-h-[60vh] w-full">
    <div class="glass-panel w-full max-w-sm text-center">
      <div class="text-5xl mb-4">🔐</div>
      <h2 class="text-2xl font-black mb-6 text-white uppercase tracking-wider">Xác Thực Quản Trị</h2>
      <input v-model="passcode" type="password" placeholder="Nhập mã PIN truy cập..." class="glass-input mb-6 text-center text-lg tracking-widest font-mono" @keyup.enter="login">
      <button @click="login" class="glass-btn btn-gold text-lg tracking-widest">Mở Khóa</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const isAuthenticated = ref(false);
const passcode = ref('');

const selectedFile = ref(null);
const locations = ref([]);
const history = ref([]);
const newLoc = ref({ name: '', lat: '', lng: '', radius: 100 });

const login = () => {
  if (passcode.value === '1121') {
    isAuthenticated.value = true;
    fetchAdminData();
  } else {
    alert('Sai mật khẩu!');
  }
};

const fetchAdminData = async () => {
  try {
    const [resLoc, resHist] = await Promise.all([
      axios.get(`${API_URL}/locations`),
      axios.get(`${API_URL}/attendance`)
    ]);
    locations.value = resLoc.data;
    history.value = resHist.data;
  } catch (err) {
    console.error(err);
  }
};

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadExcel = async () => {
  if (!selectedFile.value) return alert('Vui lòng chọn file Excel!');
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  try {
    await axios.post(`${API_URL}/players/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    alert('Import thành công!');
    selectedFile.value = null;
    fetchAdminData();
  } catch (err) {
    alert('Lỗi import!');
  }
};

const getAdminGPS = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    newLoc.value.lat = pos.coords.latitude;
    newLoc.value.lng = pos.coords.longitude;
  }, () => alert('Không lấy được GPS'));
};

const addLocation = async () => {
  try {
    await axios.post(`${API_URL}/locations`, newLoc.value);
    newLoc.value = { name: '', lat: '', lng: '', radius: 100 };
    fetchAdminData();
  } catch (err) {
    alert('Lỗi thêm địa điểm');
  }
};

const deleteLocation = async (id) => {
  if (confirm('Xóa sân bóng này?')) {
    await axios.delete(`${API_URL}/locations/${id}`);
    fetchAdminData();
  }
};
</script>