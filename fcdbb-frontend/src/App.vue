<template>
  <div class="app-shell">
    <header v-if="user" class="topbar">
      <div class="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <router-link to="/" class="flex min-w-0 items-center gap-3" @click="mobileNavOpen = false">
          <span class="brand-mark">⚽</span>
          <span class="min-w-0">
            <span class="brand-wordmark block truncate">FC Đá Bay Bóng</span>
            <span class="brand-subtitle">Football club operating system</span>
          </span>
        </router-link>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          <router-link to="/" class="nav-link">Tổng quan</router-link>
          <router-link to="/players" class="nav-link">Đội hình</router-link>
          <router-link to="/funds" class="nav-link">Quỹ đội</router-link>
          <router-link to="/blog" class="nav-link">Blog</router-link>
          <router-link :to="'/profile/' + user.id" class="nav-link">Hồ sơ</router-link>
          <router-link v-if="user.role === 'admin'" to="/admin" class="nav-link !text-rose-300 hover:!text-rose-200">Quản trị</router-link>
        </nav>

        <div class="flex items-center gap-2 sm:gap-3">
          <router-link :to="'/profile/' + user.id" class="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 sm:flex">
            <img :src="user.avatar" class="h-7 w-7 rounded-lg object-cover" alt="Avatar" />
            <span class="max-w-[120px] truncate text-xs font-bold text-slate-200">{{ user.name }}</span>
          </router-link>
          <button @click="logout" class="hidden rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-300 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-200 sm:block">Thoát</button>
          <button @click="mobileNavOpen = !mobileNavOpen" class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-slate-200 md:hidden" aria-label="Mở menu">
            <svg v-if="!mobileNavOpen" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <nav v-if="mobileNavOpen" class="mobile-nav" aria-label="Điều hướng di động">
          <router-link to="/" class="nav-link" @click="mobileNavOpen = false">Tổng quan</router-link>
          <router-link to="/players" class="nav-link" @click="mobileNavOpen = false">Đội hình</router-link>
          <router-link to="/funds" class="nav-link" @click="mobileNavOpen = false">Quỹ đội</router-link>
          <router-link to="/blog" class="nav-link" @click="mobileNavOpen = false">Blog khoảnh khắc</router-link>
          <router-link :to="'/profile/' + user.id" class="nav-link" @click="mobileNavOpen = false">Hồ sơ cá nhân</router-link>
          <router-link v-if="user.role === 'admin'" to="/admin" class="nav-link !text-rose-300" @click="mobileNavOpen = false">Khu vực quản trị</router-link>
          <button @click="logout" class="mt-1 w-full rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[.14em] text-rose-200">Đăng xuất</button>
        </nav>
      </div>
    </header>

    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <ToastPopup />
    <DialogPopup />
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ToastPopup from './components/ToastPopup.vue';
import DialogPopup from './components/DialogPopup.vue';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const mobileNavOpen = ref(false);

watchEffect(() => {
  const currentPath = route.path;
  void currentPath;
  user.value = JSON.parse(localStorage.getItem('fcdbb_user') || 'null');
  mobileNavOpen.value = false;
});

const logout = () => {
  localStorage.removeItem('fcdbb_token');
  localStorage.removeItem('fcdbb_user');
  user.value = null;
  mobileNavOpen.value = false;
  router.push('/login');
};
</script>
