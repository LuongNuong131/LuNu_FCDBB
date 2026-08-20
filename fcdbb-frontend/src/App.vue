<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-fc-900/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-xl md:text-2xl font-display font-extrabold tracking-wide text-white flex items-center gap-2">
          <span class="text-fc-live">⚽</span>
          <span>FC <span class="text-fc-accent">Đá Bay Bóng</span></span>
        </h1>
        <nav class="hidden md:flex gap-1 font-semibold text-sm">
          <router-link to="/" class="nav-link">Trang chủ</router-link>
          <router-link to="/players" class="nav-link">Đội Hình</router-link>
          <router-link to="/funds" class="nav-link">Quỹ Đội</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" class="w-full flex flex-col items-center" />
        </transition>
      </router-view>
    </main>

    <ToastPopup />
  </div>
</template>

<script setup>
import ToastPopup from './components/ToastPopup.vue';
</script>

<style scoped>
.nav-link {
  @apply relative px-4 py-2 text-chalk-200 rounded-lg transition-colors duration-200;
}
.nav-link:hover {
  @apply text-white bg-white/5;
}
.nav-link.router-link-active {
  @apply text-fc-accent;
}
.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 2px;
  background: linear-gradient(90deg, transparent, theme('colors.fc.accent'), transparent);
  border-radius: 2px;
}
</style>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1);
}
.page-enter-from { opacity: 0; transform: translateY(14px); }
.page-leave-to { opacity: 0; transform: translateY(-14px); }
</style>