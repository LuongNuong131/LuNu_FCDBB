<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar Header -->
    <header class="bg-[#0f172a]/80 backdrop-blur-md text-white shadow-[0_4px_30px_rgba(0,0,0,0.5)] sticky top-0 z-40 border-b border-white/10">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-2xl font-black tracking-widest uppercase text-gold flex items-center gap-2 drop-shadow-md">
          ⚽ FC Đá Bay Bóng
        </h1>
        <nav class="hidden md:flex gap-6 font-semibold">
          <router-link to="/" class="hover:text-gold transition-colors duration-300 hover:scale-105">Trang chủ</router-link>
          <router-link to="/players" class="hover:text-gold transition-colors duration-300 hover:scale-105">Đội Hình</router-link>
          <router-link to="/funds" class="hover:text-gold transition-colors duration-300 hover:scale-105">Quỹ Đội</router-link>
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
import ToastPopup from './components/ToastPopup.vue';
</script>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }
</style>