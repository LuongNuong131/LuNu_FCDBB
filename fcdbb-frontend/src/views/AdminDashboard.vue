<template>
  <div class="w-full max-w-4xl" v-if="isAuthenticated">
    <div class="glass-panel mb-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-200">1. Quản lý Danh sách Cầu thủ</h2>
      <div class="flex items-center gap-4">
        <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" class="glass-input flex-1 !p-2" />
        <button @click="uploadExcel" class="glass-btn !w-auto whitespace-nowrap">📤 Import Excel</button>
      </div>
      <p class="text-xs text-gray-300 mt-2">*Lưu ý: Import file DS_Cầu_Thủ.xlsx sẽ xóa danh sách cũ và cập nhật mới.</p>
    </div>

    <div class="glass-panel mb-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-200">2. Quản lý Địa điểm Sân bóng</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input v-model="newLoc.name" type="text" placeholder="Tên sân" class="glass-input">
        <input v-model="newLoc.lat" type="number" placeholder="Vĩ độ (Lat)" class="glass-input">
        <input v-model="newLoc.lng" type="number" placeholder="Kinh độ (Lng)" class="glass-input">
        <input v-model="newLoc.radius" type="number" placeholder="Bán kính (m)" class="glass-input">
      </div>
      <div class="flex gap-3 mb-6">
        <button @click="getAdminGPS" class="glass-btn !bg-indigo-600/80 !w-auto">📍 Lấy tọa độ hiện tại</button>
        <button @click="addLocation" class="glass-btn !bg-green-600/80">➕ Thêm Sân</button>
      </div>
      
      <div class="space-y-2">
        <div v-for="loc in locations" :key="loc.id" class="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
          <div>
            <span class="font-bold text-blue-200">{{ loc.name }}</span>
            <span class="text-sm text-gray-300 ml-2">[{{ loc.lat }}, {{ loc.lng }}] - Bán kính: {{ loc.radius }}m</span>
          </div>
          <button @click="deleteLocation(loc.id)" class="text-red-400 hover:text-red-300 font-bold px-3">Xóa</button>
        </div>
      </div>
    </div>

    <div class="glass-panel">
      <h2 class="text-2xl font-bold mb-4 text-blue-200">3. Lịch sử Điểm danh</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/20 text-gray-300">
              <th class="p-3">Thời gian</th>
              <th class="p-3">Cầu thủ</th>
              <th class="p-3">Sân bóng</th>
              <th class="p-3">Khoảng cách</th>
              <th class="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in history" :key="h.id" class="border-b border-white/10 hover:bg-white/5">
              <td class="p-3">{{ new Date(h.created_at).toLocaleString('vi-VN') }}</td>
              <td class="p-3 font-semibold">{{ h.player?.name }}</td>
              <td class="p-3 text-blue-200">{{ h.location?.name }}</td>
              <td class="p-3">{{ h.distance }}m</td>
              <td class="p-3">
                <span :class="h.status === 'Hợp lệ' ? 'text-green-400' : 'text-red-400'">{{ h.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else class="glass-panel w-full max-w-sm text-center">
    <h2 class="text-xl font-bold mb-4">Nhập mật khẩu Admin</h2>
    <input v-model="passcode" type="password" class="glass-input mb-4" @keyup.enter="login">
    <button @click="login" class="glass-btn">Đăng nhập</button>
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