<template>
  <div class="flex justify-center w-full">
    <div class="glass-panel w-full max-w-md relative overflow-hidden">
      <!-- Glow Decorator -->
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10">
        <div class="text-center mb-8">
          <div class="badge-crest mx-auto mb-4">📍</div>
          <h2 class="text-3xl font-black text-white tracking-tight uppercase">Báo Cáo Tọa Độ</h2>
          <p class="text-blue-200 text-sm mt-1 font-semibold">Chuyên trang check-in FCDBB</p>
        </div>
        
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">Chọn Tên Cầu Thủ</label>
            <select v-model="selectedPlayer" class="glass-input shadow-inner">
              <option value="" disabled>-- Bấm để chọn tên --</option>
              <option v-for="p in players" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">Chọn Sân Bóng</label>
            <select v-model="selectedLocation" class="glass-input shadow-inner">
              <option value="" disabled>-- Bấm để chọn sân --</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc">
                {{ loc.name }} (Bán kính: {{ loc.radius }}m)
              </option>
            </select>
          </div>

          <button @click="handleCheckin" class="glass-btn btn-gold mt-6 py-4 uppercase tracking-widest text-lg" :disabled="isLoading">
            <span v-if="isLoading" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Đang dò GPS...
            </span>
            <span v-else>📍 Điểm Danh Ngay</span>
          </button>
        </div>

        <transition name="page">
          <div v-if="resultMessage" class="mt-6 p-4 rounded-xl border backdrop-blur-md" :class="isSuccess ? 'bg-green-500/20 border-green-400 text-green-100' : 'bg-red-500/20 border-red-400 text-red-100'">
            <p class="font-black text-lg mb-2 uppercase">{{ isSuccess ? '✅ Hợp Lệ!' : '❌ Thất Bại!' }}</p>
            <p class="text-sm font-mono leading-relaxed" v-html="resultMessage"></p>
          </div>
        </transition>
      </div>
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
        resultMessage.value = `Khoảng cách: <strong class="text-white">${distance}m</strong> / ${target.radius}m<br>Trạng thái: <strong class="text-white">${res.data.status}</strong>`;
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
