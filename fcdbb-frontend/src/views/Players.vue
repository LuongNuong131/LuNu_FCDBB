<template>
  <div class="w-full max-w-6xl mx-auto">
    <div class="text-center mb-10">
      <h2 class="text-4xl font-black text-white uppercase tracking-widest drop-shadow-md">Đội Hình FCDBB</h2>
      <div class="w-24 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <router-link :to="'/profile/'+p.id" v-for="p in players" :key="p.id" class="glass-panel text-center hover:-translate-y-2 transition-transform duration-300 cursor-pointer !p-6 flex flex-col items-center group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative w-28 h-28 mx-auto mb-4 z-10">
          <img :src="p.avatar" class="w-full h-full rounded-full object-cover border-4 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:border-gold transition-colors">
          <span v-if="p.role === 'admin'" class="absolute -bottom-2 right-1/2 translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20 whitespace-nowrap">SẾP</span>
        </div>
        <h3 class="font-black text-lg text-white mb-1 z-10">{{ p.name }}</h3>
        <p class="text-sm font-semibold text-gold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 mb-3 z-10">{{ p.position }}</p>
        <p class="text-xs font-mono text-blue-200 z-10">{{ p.height || '?' }}cm <span class="mx-1 text-gray-500">|</span> {{ p.weight || '?' }}kg</p>
      </router-link>
    </div>
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