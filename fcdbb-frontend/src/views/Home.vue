<template>
  <div class="w-full max-w-5xl space-y-6">
    <div class="glass-panel overflow-hidden" v-if="activeMatch">
      <div class="flex items-center gap-2 mb-3">
        <span class="live-dot"></span>
        <span class="scoreboard-tag">Đang diễn ra</span>
      </div>
      <h2 class="text-2xl md:text-3xl font-bold text-gold mb-3">{{ activeMatch.title }}</h2>
      <div class="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-chalk-200 mb-4">
        <p>📍 Sân: <a :href="activeMatch.map_link" target="_blank" class="text-gold underline decoration-dotted underline-offset-4">{{ activeMatch.location_name }}</a></p>
        <p>⏰ Bắt đầu: <span class="font-mono">{{ new Date(activeMatch.start_time).toLocaleString('vi-VN') }}</span></p>
        <p class="sm:col-span-2 text-amber-300">⏳ Khóa đúng giờ: <span class="font-mono">{{ new Date(activeMatch.lock_time).toLocaleString('vi-VN') }}</span></p>
      </div>
      <button @click="checkin" class="glass-btn btn-gold mt-1 sm:w-auto sm:px-8" :disabled="loading || hasCheckedIn">{{ loading ? 'Đang quét GPS...' : (hasCheckedIn ? '✅ Đã điểm danh' : '📍 ĐIỂM DANH GPS') }}</button>

      <div class="mt-6 pt-5" style="border-top: 1px solid rgba(232,185,77,0.16);" v-if="activeDetails.attendances?.length">
        <h3 class="font-display uppercase tracking-wide text-sm text-chalk-muted mb-3">Anh em đã có mặt ({{ activeDetails.attendances.length }})</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="a in activeDetails.attendances" :key="a.id" class="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center gap-2">
            <img :src="a.user.avatar" class="w-10 h-10 rounded-full object-cover border border-white/10">
            <div class="text-sm">
              <p class="font-semibold">{{ a.user.name }}</p>
              <p class="font-mono text-xs" :class="a.status === 'Đúng giờ' ? 'text-emerald-400' : 'text-amber-400'">{{ a.status }} <span v-if="a.delay_seconds > 0">{{ formatDelay(a.delay_seconds) }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="historyMatches.length">
      <h2 class="text-xl font-bold text-gold mb-4 flex items-center gap-2"><span class="text-base">🎟️</span> Lịch sử 3 trận gần nhất</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div v-for="m in historyMatches" :key="m.id" @click="openModal(m)" class="ticket-stub cursor-pointer hover:border-amber-300/50 transition">
          <h3 class="font-bold text-lg text-chalk-050">{{ m.title }}</h3>
          <p class="text-sm text-chalk-muted font-mono">{{ new Date(m.start_time).toLocaleDateString('vi-VN') }}</p>
          <p class="text-xs mt-3 text-gold">Xem chi tiết →</p>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-panel max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
        <button @click="showModal = false" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition">✕</button>
        <h2 class="text-2xl font-bold mb-6 text-center text-gold">{{ selectedMatch?.title }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-display uppercase tracking-wide text-emerald-400 mb-4 pb-2" style="border-bottom: 1px solid rgba(62,169,104,0.3);">Đã tham gia ({{ modalData.attendances?.length || 0 }})</h3>
            <div v-for="a in modalData.attendances" :key="a.id" class="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/10 p-2 rounded-lg mb-2">
              <div class="flex items-center gap-2">
                <img :src="a.user.avatar" class="w-8 h-8 rounded-full object-cover">
                <span class="font-semibold text-sm">{{ a.user.name }}</span>
              </div>
              <span class="text-xs font-mono text-emerald-300">{{ a.status }} <span v-if="a.delay_seconds > 0">{{ formatDelay(a.delay_seconds) }}</span></span>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-display uppercase tracking-wide text-red-400 mb-4 pb-2" style="border-bottom: 1px solid rgba(224,80,63,0.3);">Vắng mặt ({{ modalData.absentUsers?.length || 0 }})</h3>
            <div v-for="u in modalData.absentUsers" :key="u.id" class="flex items-center gap-2 bg-red-500/10 border border-red-500/10 p-2 rounded-lg mb-2">
              <img :src="u.avatar" class="w-8 h-8 rounded-full object-cover grayscale">
              <span class="font-semibold text-sm text-chalk-muted">{{ u.name }}</span>
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

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const user = JSON.parse(localStorage.getItem('fcdbb_user') || '{}');
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
  try {
    const res = await axios.get(`${API}/home`);
    activeMatch.value = res.data.activeMatch;
    historyMatches.value = res.data.historyMatches || [];
    if (activeMatch.value) {
      const det = await axios.get(`${API}/matches/${activeMatch.value.id}/details`);
      activeDetails.value = det.data || {};
    }
  } catch (e) { console.error(e); }
};

onMounted(loadData);

const checkin = () => {
  if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ GPS');
  loading.value = true;
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        await axios.post(`${API}/attendance/checkin`, {
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
      if(err.code === 2) msg = "Không có tín hiệu GPS/Mạng!";
      if(err.code === 3) msg = "Quá thời gian chờ lấy GPS!";
      alert(msg); loading.value = false; 
    }, 
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};

const openModal = async (m) => {
  selectedMatch.value = m;
  try {
    const res = await axios.get(`${API}/matches/${m.id}/details`);
    modalData.value = res.data || {};
    showModal.value = true;
  } catch (e) { console.error(e); }
};
</script>