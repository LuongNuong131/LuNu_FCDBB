<template>
  <div class="w-full max-w-5xl space-y-8 mx-auto">
    <div class="glass-panel relative overflow-hidden" v-if="activeMatch">
      <!-- Decorator glow -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-4">
          <span class="live-dot"></span>
          <span class="scoreboard-tag">Đang diễn ra</span>
        </div>
        <h2 class="text-3xl md:text-4xl font-black text-gold mb-4 tracking-tight uppercase">{{ activeMatch.title }}</h2>
        
        <div class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-200 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <p class="flex items-center gap-2">📍 Sân: <a :href="activeMatch.map_link" target="_blank" class="text-gold font-bold hover:underline decoration-dotted underline-offset-4">{{ activeMatch.location_name }}</a></p>
          <p class="flex items-center gap-2">⏰ Bắt đầu: <span class="font-mono bg-blue-900/50 px-2 py-0.5 rounded">{{ new Date(activeMatch.start_time).toLocaleString('vi-VN') }}</span></p>
          <p class="sm:col-span-2 text-red-300 font-semibold flex items-center gap-2">⏳ Khóa đúng giờ: <span class="font-mono bg-red-900/50 px-2 py-0.5 rounded">{{ new Date(activeMatch.lock_time).toLocaleString('vi-VN') }}</span></p>
        </div>
        
        <button @click="checkin" class="glass-btn btn-gold mt-2 sm:w-auto sm:px-10 text-lg uppercase tracking-wider" :disabled="loading || hasCheckedIn">{{ loading ? 'Đang quét GPS...' : (hasCheckedIn ? '✅ Đã điểm danh' : '📍 ĐIỂM DANH GPS') }}</button>

        <div class="mt-8 pt-6 border-t border-white/10" v-if="activeDetails.attendances?.length">
          <h3 class="font-bold uppercase tracking-widest text-sm text-blue-300 mb-4">Anh em đã có mặt ({{ activeDetails.attendances.length }})</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="a in activeDetails.attendances" :key="a.id" class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition">
              <img :src="a.user.avatar" class="w-12 h-12 rounded-full object-cover border-2 border-blue-400/50 shadow-md">
              <div class="text-sm">
                <p class="font-bold text-white truncate">{{ a.user.name }}</p>
                <p class="font-mono text-xs mt-0.5" :class="a.status === 'Đúng giờ' ? 'text-green-400' : 'text-yellow-400'">{{ a.status }} <span v-if="a.delay_seconds > 0" class="text-red-300">{{ formatDelay(a.delay_seconds) }}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="historyMatches.length" class="mt-10">
      <h2 class="text-2xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-3">
        <span class="text-gold text-3xl">🎟️</span> Lịch sử 3 trận gần nhất
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="m in historyMatches" :key="m.id" @click="openModal(m)" class="ticket-stub cursor-pointer">
          <h3 class="font-bold text-xl text-white mb-1 truncate">{{ m.title }}</h3>
          <p class="text-sm text-blue-200 font-mono mb-4">{{ new Date(m.start_time).toLocaleDateString('vi-VN') }}</p>
          <div class="flex items-center text-xs font-bold text-gold uppercase tracking-widest mt-2 border-t border-white/10 pt-3">
            Xem chi tiết <span class="ml-2">→</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="glass-panel max-w-4xl w-full max-h-[85vh] overflow-y-auto relative animate-slide-in">
        <button @click="showModal = false" class="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/20 font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all text-xl z-10">&times;</button>
        <h2 class="text-3xl font-black mb-8 text-center text-gold border-b border-white/10 pb-4">{{ selectedMatch?.title }}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 class="text-xl font-black uppercase tracking-wider text-green-400 mb-5 flex items-center gap-2">
              <span class="w-2 h-6 bg-green-500 rounded"></span> Đã tham gia ({{ modalData.attendances?.length || 0 }})
            </h3>
            <div class="space-y-3">
              <div v-for="a in modalData.attendances" :key="a.id" class="flex justify-between items-center bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                <div class="flex items-center gap-3">
                  <img :src="a.user.avatar" class="w-10 h-10 rounded-full object-cover border border-green-400/50">
                  <span class="font-bold text-white">{{ a.user.name }}</span>
                </div>
                <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-black/30" :class="a.status === 'Đúng giờ' ? 'text-green-400' : 'text-yellow-400'">{{ a.status }} <span v-if="a.delay_seconds > 0" class="text-red-300 ml-1">{{ formatDelay(a.delay_seconds) }}</span></span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-black uppercase tracking-wider text-red-400 mb-5 flex items-center gap-2">
              <span class="w-2 h-6 bg-red-500 rounded"></span> Vắng mặt ({{ modalData.absentUsers?.length || 0 }})
            </h3>
            <div class="space-y-3">
              <div v-for="u in modalData.absentUsers" :key="u.id" class="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <img :src="u.avatar" class="w-10 h-10 rounded-full object-cover grayscale opacity-60 border border-red-400/30">
                <span class="font-bold text-gray-400 line-through decoration-red-500/50">{{ u.name }}</span>
              </div>
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