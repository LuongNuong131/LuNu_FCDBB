<template>
  <div class="mx-auto w-full max-w-6xl space-y-8">
    <section class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p class="eyebrow mb-3">MATCH CENTER · LIVE OPERATIONS</p><h1 class="page-heading">Tổng quan <strong>đội bóng.</strong></h1><p class="page-intro mt-3">Theo dõi lịch đấu, điểm danh và nhịp vận hành của FC Đá Bay Bóng trong một màn hình.</p></div>
      <div class="hidden rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] px-4 py-3 sm:block"><p class="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-300">Trạng thái hệ thống</p><p class="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-100"><span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#4ade80]"></span>Đang hoạt động</p></div>
    </section>

    <section v-if="activeMatch" class="glass-panel relative overflow-hidden">
      <div class="absolute -right-28 -top-32 h-80 w-80 rounded-full bg-rose-400/10 blur-3xl"></div>
      <div class="relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-2"><span class="live-dot"></span><span class="scoreboard-tag">Đang diễn ra</span></div><span class="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500">Live match / 01</span></div>
        <div class="mt-6 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p class="eyebrow mb-2 text-amber-300">TRẬN ĐẤU HIỆN TẠI</p><h2 class="font-display text-3xl font-extrabold leading-tight tracking-[-.04em] text-white sm:text-5xl">{{ activeMatch.title }}</h2><div class="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2"><p class="flex items-center gap-2"><span class="text-amber-300">⌖</span><a :href="activeMatch.map_link" target="_blank" class="font-bold text-amber-200 hover:underline">{{ activeMatch.location_name }}</a></p><p class="flex items-center gap-2"><span class="text-sky-300">◷</span><span>{{ new Date(activeMatch.start_time).toLocaleString('vi-VN') }}</span></p></div></div>
          <div class="rounded-2xl border border-rose-300/15 bg-rose-400/[.06] p-4 lg:min-w-[230px]"><p class="text-[10px] font-extrabold uppercase tracking-[.16em] text-rose-300">Khóa điểm danh</p><p class="mt-2 font-mono text-sm font-bold text-white">{{ new Date(activeMatch.lock_time).toLocaleString('vi-VN') }}</p><p class="mt-1 text-xs text-slate-400">Hãy có mặt đúng giờ.</p></div>
        </div>
        <button @click="checkin" class="glass-btn btn-gold mt-7 sm:w-auto sm:px-10" :disabled="loading || hasCheckedIn">{{ loading ? 'Đang quét GPS...' : (hasCheckedIn ? '✓ Đã điểm danh' : '⌖ Điểm danh GPS') }}</button>
        <div class="mt-8 border-t border-white/[.08] pt-6" v-if="activeDetails.attendances?.length"><div class="mb-4 flex items-center justify-between"><h3 class="text-[11px] font-extrabold uppercase tracking-[.18em] text-sky-300">Đội hình đã có mặt</h3><span class="rounded-full bg-white/[.06] px-3 py-1 text-xs font-bold text-white">{{ activeDetails.attendances.length }} người</span></div><div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><div v-for="a in activeDetails.attendances" :key="a.id" class="flex items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.04] p-3 transition hover:bg-white/[.08]"><img :src="a.user.avatar" class="h-11 w-11 rounded-xl border border-sky-300/30 object-cover"><div class="min-w-0"><p class="truncate text-sm font-bold text-white">{{ a.user.name }}</p><p class="mt-1 font-mono text-[10px]" :class="a.status === 'Đúng giờ' ? 'text-emerald-300' : 'text-amber-300'">{{ a.status }} <span v-if="a.delay_seconds > 0" class="text-rose-300">{{ formatDelay(a.delay_seconds) }}</span></p></div></div></div></div>
      </div>
    </section>
    <section v-else class="glass-panel flex min-h-[260px] flex-col items-center justify-center text-center"><div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/[.08] text-2xl">◷</div><h2 class="font-display text-2xl font-extrabold text-white">Chưa có trận đang mở.</h2><p class="mt-2 max-w-md text-sm leading-6 text-slate-400">Khi admin tạo trận tiếp theo, thông tin điểm danh sẽ xuất hiện tại đây.</p></section>

    <section v-if="historyMatches.length" class="pt-1"><div class="mb-5 flex items-end justify-between"><div><p class="eyebrow mb-2">ARCHIVE</p><h2 class="font-display text-2xl font-extrabold tracking-[-.03em] text-white">Lịch sử gần đây</h2></div><span class="text-xs text-slate-500">03 trận gần nhất</span></div><div class="grid grid-cols-1 gap-4 md:grid-cols-3"><div v-for="m in historyMatches" :key="m.id" @click="openModal(m)" class="ticket-stub cursor-pointer"><div class="relative z-10"><div class="mb-5 flex items-center justify-between"><span class="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Đã kết thúc</span><span class="text-lg text-amber-300">↗</span></div><h3 class="truncate font-display text-xl font-extrabold text-white">{{ m.title }}</h3><p class="mt-2 font-mono text-xs text-sky-200">{{ new Date(m.start_time).toLocaleDateString('vi-VN') }}</p><div class="mt-6 border-t border-white/10 pt-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-amber-300">Xem báo cáo trận <span class="ml-1">→</span></div></div></div></div></section>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[#030a13]/85 p-4 backdrop-blur-md">
      <div class="glass-panel relative max-h-[88vh] w-full max-w-4xl overflow-y-auto animate-slide-in"><button @click="showModal = false" class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.06] text-xl text-slate-300 transition hover:bg-rose-400/20 hover:text-rose-200">&times;</button><div class="border-b border-white/10 pb-5 pr-12"><p class="eyebrow mb-2">MATCH REPORT</p><h2 class="font-display text-2xl font-extrabold text-white sm:text-3xl">{{ selectedMatch?.title }}</h2></div><div class="mt-7 grid grid-cols-1 gap-8 md:grid-cols-2"><div><h3 class="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-300"><span class="h-2 w-2 rounded-full bg-emerald-400"></span>Đã tham gia ({{ modalData.attendances?.length || 0 }})</h3><div class="space-y-2"><div v-for="a in modalData.attendances" :key="a.id" class="flex items-center justify-between gap-3 rounded-xl border border-emerald-300/10 bg-emerald-400/[.05] p-3"><div class="flex min-w-0 items-center gap-3"><img :src="a.user.avatar" class="h-9 w-9 rounded-lg object-cover"><span class="truncate text-sm font-bold text-white">{{ a.user.name }}</span></div><span class="shrink-0 text-[10px] font-bold" :class="a.status === 'Đúng giờ' ? 'text-emerald-300' : 'text-amber-300'">{{ a.status }}</span></div></div></div><div><h3 class="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-rose-300"><span class="h-2 w-2 rounded-full bg-rose-400"></span>Vắng mặt ({{ modalData.absentUsers?.length || 0 }})</h3><div class="space-y-2"><div v-for="u in modalData.absentUsers" :key="u.id" class="flex items-center gap-3 rounded-xl border border-rose-300/10 bg-rose-400/[.04] p-3"><img :src="u.avatar" class="h-9 w-9 rounded-lg object-cover grayscale opacity-60"><span class="truncate text-sm font-bold text-slate-400">{{ u.name }}</span></div></div></div></div></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useToast } from '../composables/useToast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const { addToast } = useToast();
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
  if (!navigator.geolocation) return addToast('Trình duyệt không hỗ trợ GPS.', 'warning');
  loading.value = true;
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        await axios.post(`${API}/attendance/checkin`, {
          userId: user.id, matchId: activeMatch.value.id, lat: pos.coords.latitude, lng: pos.coords.longitude
        });
        addToast('Điểm danh thành công!', 'success');
        loadData();
      } catch (err) { addToast(err.response?.data?.message || 'Lỗi kết nối!', 'error'); } 
      finally { loading.value = false; }
    }, 
    (err) => { 
      let msg = "Lỗi không xác định.";
      if(err.code === 1) msg = "Bạn đã từ chối quyền truy cập vị trí!";
      if(err.code === 2) msg = "Không có tín hiệu GPS/Mạng!";
      if(err.code === 3) msg = "Quá thời gian chờ lấy GPS!";
      addToast(msg, 'error'); loading.value = false; 
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
