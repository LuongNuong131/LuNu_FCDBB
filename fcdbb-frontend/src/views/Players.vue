<template>
  <div class="w-full max-w-5xl">
    <h2 class="text-3xl font-bold text-center mb-8 text-blue-200">Đội Hình FCDBB</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <router-link :to="'/profile/'+p.id" v-for="p in players" :key="p.id" class="glass-panel text-center hover:scale-105 transition-transform cursor-pointer !p-4">
        <div class="relative w-24 h-24 mx-auto mb-3">
          <img :src="'http://localhost:3000' + p.avatar" class="w-full h-full rounded-full object-cover border-2 border-white/10">
          <span v-if="p.role === 'admin'" class="absolute -bottom-2 right-0 bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">Sếp</span>
        </div>
        <h3 class="font-bold">{{ p.name }}</h3>
        <p class="text-xs text-gray-300">{{ p.position }}</p>
        <p class="text-xs mt-1 text-blue-200">{{ p.height || '?' }}cm - {{ p.weight || '?' }}kg</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const players = ref([]);

onMounted(async () => {
  const res = await axios.get('${API}/users');
  // Không còn filter giấu admin nữa, tất cả đều được hiển thị
  players.value = res.data;
});
</script>