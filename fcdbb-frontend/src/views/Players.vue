<template>
  <div class="mx-auto w-full max-w-6xl space-y-8">
    <section class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="eyebrow mb-3">THE SQUAD · 2026</p><h1 class="page-heading">Đội hình <strong>FCDBB.</strong></h1><p class="page-intro mt-3">Những cá nhân tạo nên một tập thể có bản sắc, kỷ luật và khát vọng.</p></div><div class="stat-card w-fit"><p class="stat-label">Quân số</p><p class="stat-value">{{ players.length }} <span class="text-sm font-semibold text-slate-400">cầu thủ</span></p></div></section>
    <section v-if="players.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <router-link :to="'/profile/'+p.id" v-for="p in players" :key="p.id" class="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style="background:linear-gradient(145deg,rgba(25,50,79,.74),rgba(10,25,43,.78));border-color:rgba(159,185,212,.15)">
        <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-300/[.08] blur-2xl transition group-hover:bg-amber-300/[.12]"></div>
        <div class="relative z-10 flex items-start justify-between"><span class="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">{{ p.role === 'admin' ? 'Staff' : 'Player' }}</span><span class="text-xl text-slate-500 transition group-hover:text-amber-300">↗</span></div>
        <div class="relative z-10 mt-5 flex items-center gap-4"><div class="relative shrink-0"><img :src="p.avatar" class="h-20 w-20 rounded-2xl border-2 border-sky-300/25 object-cover shadow-xl transition group-hover:border-amber-300/60"><span v-if="p.role === 'admin'" class="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-rose-200/20 bg-rose-400/90 px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-white">Sếp</span></div><div class="min-w-0"><h3 class="truncate font-display text-lg font-extrabold text-white">{{ p.name }}</h3><p class="mt-1 text-xs font-bold text-amber-300">{{ p.position || 'Chưa rõ vị trí' }}</p></div></div>
        <div class="relative z-10 mt-5 grid grid-cols-2 gap-2 border-t border-white/[.08] pt-4"><div><p class="stat-label">Chiều cao</p><p class="mt-1 font-mono text-sm font-bold text-sky-100">{{ p.height || '?' }} <span class="text-[10px] text-slate-500">CM</span></p></div><div><p class="stat-label">Cân nặng</p><p class="mt-1 font-mono text-sm font-bold text-sky-100">{{ p.weight || '?' }} <span class="text-[10px] text-slate-500">KG</span></p></div></div>
      </router-link>
    </section>
    <section v-else class="glass-panel flex min-h-[260px] items-center justify-center text-center text-sm text-slate-400">Chưa có dữ liệu đội hình.</section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const players = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/users`);
    players.value = res.data || [];
  } catch (e) { console.error("Lỗi load player:", e); }
});
</script>
