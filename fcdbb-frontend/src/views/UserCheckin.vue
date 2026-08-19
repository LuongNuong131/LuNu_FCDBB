<template>
  <div class="glass-panel w-full max-w-md">
    <h2 class="text-2xl font-bold text-center mb-6 text-blue-200">Điểm Danh FCDBB</h2>
    
    <div class="mb-4">
      <label class="block text-sm mb-2 font-medium">Chọn Tên Cầu Thủ:</label>
      <select v-model="selectedPlayer" class="glass-input">
        <option value="" disabled>-- Chọn tên --</option>
        <option v-for="p in players" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <div class="mb-6">
      <label class="block text-sm mb-2 font-medium">Chọn Sân Bóng:</label>
      <select v-model="selectedLocation" class="glass-input">
        <option value="" disabled>-- Chọn sân --</option>
        <option v-for="loc in locations" :key="loc.id" :value="loc">
          {{ loc.name }} (Bán kính: {{ loc.radius }}m)
        </option>
      </select>
    </div>

    <button @click="handleCheckin" class="glass-btn mb-4" :disabled="isLoading">
      <span v-if="isLoading">Đang xử lý GPS...</span>
      <span v-else>📍 Điểm Danh Ngay</span>
    </button>

    <div v-if="resultMessage" :class="`p-4 rounded-lg border backdrop-blur-md ${isSuccess ? 'bg-green-500/20 border-green-400 text-green-100' : 'bg-red-500/20 border-red-400 text-red-100'}`">
      <p class="font-bold mb-1">{{ isSuccess ? 'Thành công!' : 'Thất bại!' }}</p>
      <p class="text-sm" v-html="resultMessage"></p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const players = ref([]);
const locations = ref([]);
const selectedPlayer = ref('');
const selectedLocation = ref('');
const isLoading = ref(false);
const resultMessage = ref('');
const isSuccess = ref(false);

const fetchData = async () => {
  try {
    const [resPlayers, resLocs] = await Promise.all([
      axios.get(`${API_URL}/players`),
      axios.get(`${API_URL}/locations`)
    ]);
    players.value = resPlayers.data;
    locations.value = resLocs.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu", error);
  }
};

onMounted(fetchData);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const handleCheckin = () => {
  if (!selectedPlayer.value || !selectedLocation.value) {
    alert('Vui lòng chọn cầu thủ và sân bóng!');
    return;
  }

  if (!navigator.geolocation) {
    alert('Trình duyệt không hỗ trợ GPS.');
    return;
  }

  isLoading.value = true;
  resultMessage.value = '';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const target = selectedLocation.value;
      const distance = Math.round(calculateDistance(userLat, userLng, target.lat, target.lng));

      try {
        const res = await axios.post(`${API_URL}/attendance/checkin`, {
          playerId: selectedPlayer.value,
          locationId: target.id,
          distance: distance
        });

        isSuccess.value = res.data.status === 'Hợp lệ';
        resultMessage.value = `Khoảng cách: ${distance}m / ${target.radius}m<br>Trạng thái: ${res.data.status}`;
      } catch (err) {
        isSuccess.value = false;
        resultMessage.value = 'Lỗi kết nối Server.';
      } finally {
        isLoading.value = false;
      }
    },
    (error) => {
      isLoading.value = false;
      isSuccess.value = false;
      resultMessage.value = 'Không thể lấy GPS. Vui lòng bật định vị!';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};
</script>