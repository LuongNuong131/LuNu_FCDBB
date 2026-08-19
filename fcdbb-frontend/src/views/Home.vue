<template>
  <div class="w-full max-w-5xl space-y-6">
    <!-- TRẬN ĐANG DIỄN RA -->
    <div class="glass-panel" v-if="activeMatch">
      <h2 class="text-2xl font-bold text-blue-200 mb-2">Đang diễn ra: {{ activeMatch.title }}</h2>
      <p>📍 Sân: <a :href="activeMatch.map_link" target="_blank" class="text-blue-300 underline">{{ activeMatch.location_name }}</a></p>
      <p>⏰ Bắt đầu: {{ new Date(activeMatch.start_time).toLocaleString('vi-VN') }}</p>
      <p class="text-yellow-300">⏳ Khóa đúng giờ: {{ new Date(activeMatch.lock_time).toLocaleString('vi-VN') }}</p>
      
      <button @click="checkin" class="glass-btn !bg-green-600 hover:!bg-green-500 mt-4" :disabled="loading || hasCheckedIn">
        {{ loading ? 'Đang quét GPS...' : (hasCheckedIn ? 'Đã điểm danh' : '📍 ĐIỂM DANH GPS') }}
      </button>

      <div class="mt-6 border-t border-white/20 pt-4" v-if="activeDetails.attendances?.length">
        <h3 class="font-bold mb-3">Anh em đã có mặt ({{ activeDetails.attendances.length }}):</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="a in activeDetails.attendances" :key="a.id" class="bg-white/5 p-2 rounded-lg flex items-center gap-2">
            <img :src="'http://localhost:3000' + a.user.avatar" class="w-10 h-10 rounded-full object-cover">
            <div class="text-sm">
              <p class="font-bold">{{ a.user.name }}</p>
              <p :class="a.status === 'Đúng giờ' ? 'text-green-400' : 'text-yellow-400'">
                {{ a.status }} <span class="text-xs" v-if="a.delay_seconds > 0">{{ formatDelay(a.delay_seconds) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LỊCH SỬ 3 TRẬN -->
    <div class="glass-panel" v-if="historyMatches.length">
      <h2 class="text-xl font-bold text-blue-200 mb-4">Lịch sử 3 trận gần nhất</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="m in historyMatches" :key="m.id" @click="openModal(m)" class="bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition border border-white/10">
          <h3 class="font-bold text-lg text-blue-300">{{ m.title }}</h3>
          <p class="text-sm text-gray-300">{{ new Date(m.start_time).toLocaleDateString('vi-VN') }}</p>
          <p class="text-xs mt-2 text-blue-400 hover:underline">Xem chi tiết >></p>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT LỊCH SỬ -->
    <div v-if="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-panel max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
        <button @click="showModal = false" class="absolute top-4 right-4 font-bold text-xl text-red-400 hover:scale-110">X</button>
        <h2 class="text-2xl font-bold mb-6 text-center">{{ selectedMatch?.title }}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-xl font-bold text-green-400 mb-4 border-b border-green-400/30 pb-2">Đã tham gia ({{ modalData.attendances?.length || 0 }})</h3>
            <div v-for="a in modalData.attendances" :key="a.id" class="flex justify-between items-center bg-green-500/10 p-2 rounded mb-2">
              <div class="flex items-center gap-2">
                <img :src="'http://localhost:3000' + a.user.avatar" class="w-8 h-8 rounded-full object-cover">
                <span class="font-semibold">{{ a.user.name }}</span>
              </div>
              <span class="text-xs text-green-300">{{ a.status }} <span v-if="a.delay_seconds > 0">{{ formatDelay(a.delay_seconds) }}</span></span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold text-red-400 mb-4 border-b border-red-400/30 pb-2">Vắng mặt ({{ modalData.absentUsers?.length || 0 }})</h3>
            <div v-for="u in modalData.absentUsers" :key="u.id" class="flex items-center gap-2 bg-red-500/10 p-2 rounded mb-2">
              <img :src="'http://localhost:3000' + u.avatar" class="w-8 h-8 rounded-full object-cover grayscale">
              <span class="font-semibold text-gray-300">{{ u.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('fcdbb_user'));
const activeMatch = ref(null);
const historyMatches = ref([]);
const activeDetails = ref({});
const loading = ref(false);
const showModal = ref(false);
const selectedMatch = ref(null);
const modalData = ref({});

const hasCheckedIn = computed(() => activeDetails.value.attendances?.some(a => a.user.id === user.id));

const formatDelay = (seconds) => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let res = [];
  if (h > 0) res.push(`${h} giờ`);
  if (m > 0) res.push(`${m} phút`);
  if (s > 0 || (h === 0 && m === 0)) res.push(`${s} giây`);
  return `(+ ${res.join(' ')})`;
};

const loadData = async () => {
  const res = await axios.get('http://localhost:3000/api/home');
  activeMatch.value = res.data.activeMatch;
  historyMatches.value = res.data.historyMatches;
  if (activeMatch.value) {
    const det = await axios.get(`http://localhost:3000/api/matches/${activeMatch.value.id}/details`);
    activeDetails.value = det.data;
  }
};

onMounted(loadData);

const checkin = () => {
  if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ GPS');
  loading.value = true;
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        await axios.post('http://localhost:3000/api/attendance/checkin', {
          userId: user.id, matchId: activeMatch.value.id, lat: pos.coords.latitude, lng: pos.coords.longitude
        });
        alert('Điểm danh thành công!');
        loadData();
      } catch (err) { alert(err.response?.data?.message || 'Lỗi kết nối!'); } 
      finally { loading.value = false; }
    }, 
    (err) => { 
      let msg = "Lỗi không xác định.";
      if(err.code === 1) msg = "Bạn đã từ chối quyền truy cập vị trí!";
      if(err.code === 2) msg = "Không có tín hiệu GPS/Mạng (Vị trí không khả dụng)!";
      if(err.code === 3) msg = "Quá thời gian chờ lấy GPS. Hãy di chuyển ra chỗ thoáng và thử lại!";
      alert(msg); loading.value = false; 
    }, 
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};

const openModal = async (m) => {
  selectedMatch.value = m;
  const res = await axios.get(`http://localhost:3000/api/matches/${m.id}/details`);
  modalData.value = res.data;
  showModal.value = true;
};
</script>