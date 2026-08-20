<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar Header -->
    <header class="bg-[#0f172a]/80 backdrop-blur-md text-white shadow-[0_4px_30px_rgba(0,0,0,0.5)] sticky top-0 z-40 border-b border-white/10">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-2xl font-black tracking-widest uppercase text-gold flex items-center gap-2 drop-shadow-md">
          ⚽ FC Đá Bay Bóng
        </h1>
        
        <!-- Chỉ hiển thị Menu khi đã có user đăng nhập -->
        <nav v-if="user" class="hidden md:flex items-center gap-6 font-semibold text-sm uppercase tracking-wider">
          <router-link to="/" class="hover:text-gold transition-colors duration-300 hover:scale-105">Trang chủ</router-link>
          <router-link to="/players" class="hover:text-gold transition-colors duration-300 hover:scale-105">Đội Hình</router-link>
          <router-link to="/funds" class="hover:text-gold transition-colors duration-300 hover:scale-105">Quỹ Đội</router-link>
          <router-link :to="'/profile/' + user.id" class="hover:text-gold transition-colors duration-300 hover:scale-105">Hồ Sơ</router-link>
          
          <!-- Chỉ hiển thị nút Admin nếu role là admin -->
          <router-link v-if="user.role === 'admin'" to="/admin" class="text-red-400 hover:text-red-300 transition-colors duration-300 hover:scale-105 border border-red-500/30 bg-red-500/10 px-3 py-1 rounded">
            Admin
          </router-link>

          <!-- Nút Đăng Xuất -->
          <button @click="logout" class="ml-2 bg-white/10 hover:bg-red-500 text-white border border-white/20 hover:border-red-400 px-4 py-1.5 rounded-full font-bold transition-all duration-300">
            Đăng xuất
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content with Transitions -->
    <main class="flex-grow container mx-auto px-4 py-8">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Popup -->
    <ToastPopup />
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ToastPopup from './components/ToastPopup.vue';

const router = useRouter();
const route = useRoute();
const user = ref(null);

// Lắng nghe sự thay đổi của route để cập nhật lại trạng thái user
watchEffect(() => {
  // Gắn route.path vào để trigger watchEffect mỗi khi chuyển trang
  const currentPath = route.path; 
  user.value = JSON.parse(localStorage.getItem('fcdbb_user') || 'null');
});

const logout = () => {
  localStorage.removeItem('fcdbb_token');
  localStorage.removeItem('fcdbb_user');
  user.value = null;
  router.push('/login');
};
</script>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }
</style>