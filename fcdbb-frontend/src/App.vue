<template>
  <div class="min-h-screen flex flex-col items-center py-6 px-4">
    <nav v-if="user" class="flex flex-wrap justify-center gap-4 mb-8 glass-panel py-3 px-6 rounded-full text-sm">
      <router-link to="/" class="font-semibold hover:text-blue-300" active-class="text-blue-400">🏠 Trang Chủ</router-link>
      <span class="text-white/30">|</span>
      <router-link :to="'/profile/'+user.id" class="font-semibold hover:text-blue-300" active-class="text-blue-400">👤 Hồ Sơ</router-link>
      <span class="text-white/30">|</span>
      <router-link to="/players" class="font-semibold hover:text-blue-300" active-class="text-blue-400">⚽ Đội Hình</router-link>
      <span class="text-white/30">|</span>
      <router-link to="/funds" class="font-semibold hover:text-blue-300" active-class="text-blue-400">💰 Quỹ Đội</router-link>
      <span v-if="user.role === 'admin'" class="text-white/30">|</span>
      <router-link v-if="user.role === 'admin'" to="/admin" class="font-semibold hover:text-blue-300" active-class="text-blue-400">⚙️ Admin</router-link>
      <span class="text-white/30">|</span>
      <button @click="logout" class="font-semibold text-red-400 hover:text-red-300">Đăng Xuất</button>
    </nav>
    <router-view></router-view>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const user = computed(() => JSON.parse(localStorage.getItem('fcdbb_user')));
const logout = () => { localStorage.removeItem('fcdbb_token'); localStorage.removeItem('fcdbb_user'); router.push('/login'); window.location.reload(); };
</script>