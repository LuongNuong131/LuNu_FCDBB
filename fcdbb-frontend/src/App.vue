<template>
  <div class="min-h-screen flex flex-col items-center py-6 px-4">
    <nav v-if="user" class="w-full max-w-4xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 sideline-nav py-3 px-6 rounded-full text-sm">
      <router-link to="/" class="sideline-link" active-class="sideline-link-active">🏠 Trang Chủ</router-link>
      <span class="text-white/15">/</span>
      <router-link :to="'/profile/'+user.id" class="sideline-link" active-class="sideline-link-active">👤 Hồ Sơ</router-link>
      <span class="text-white/15">/</span>
      <router-link to="/players" class="sideline-link" active-class="sideline-link-active">⚽ Đội Hình</router-link>
      <span class="text-white/15">/</span>
      <router-link to="/funds" class="sideline-link" active-class="sideline-link-active">💰 Quỹ Đội</router-link>
      <span v-if="user.role === 'admin'" class="text-white/15">/</span>
      <router-link v-if="user.role === 'admin'" to="/admin" class="sideline-link" active-class="sideline-link-active">⚙️ Admin</router-link>
      <span class="text-white/15">/</span>
      <button @click="logout" class="sideline-link !text-red-400 hover:!text-red-300">Đăng Xuất</button>
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