<template>
  <div class="app-shell">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
      >Đến nội dung chính</a
    >
    <header v-if="user" class="topbar">
      <div class="header-inner">
        <router-link to="/" class="brand"
          ><span class="brand-mark">ĐB</span
          ><span
            ><span class="brand-wordmark">FC Đá Bay Bóng</span
            ><span class="brand-subtitle"
              >Cùng một đội. Cùng một hành trình.</span
            ></span
          ></router-link
        >
        <nav class="desktop-nav" aria-label="Điều hướng chính">
          <router-link
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            ><ClubIcon :name="link.icon" />{{ link.label }}</router-link
          >
        </nav>
        <div class="member-actions">
          <router-link :to="`/profile/${user.id}`" class="member-link"
            ><span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"
              >{{ user.name?.slice(0, 1) }}</span
            ><span>{{ user.name }}</span></router-link
          ><button
            @click="logout"
            class="icon-btn"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <ClubIcon name="logout" /></button
          ><button
            class="icon-btn menu-toggle"
            @click="mobileNavOpen = !mobileNavOpen"
            :aria-expanded="mobileNavOpen"
            aria-label="Mở điều hướng"
          >
            <ClubIcon :name="mobileNavOpen ? 'close' : 'menu'" />
          </button>
        </div>
      </div>
      <nav
        v-if="mobileNavOpen"
        class="mobile-nav"
        aria-label="Điều hướng di động"
      >
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          @click="mobileNavOpen = false"
          ><ClubIcon :name="link.icon" />{{ link.label }}</router-link
        ><router-link
          :to="`/profile/${user.id}`"
          class="nav-link"
          @click="mobileNavOpen = false"
          >Hồ sơ cá nhân</router-link
        >
      </nav>
    </header>
    <main id="main-content" class="app-content"><router-view /></main>
    <ToastPopup /><DialogPopup />
  </div>
</template>
<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import ToastPopup from "./components/ToastPopup.vue";
import DialogPopup from "./components/DialogPopup.vue";
import ClubIcon from "./components/ClubIcon.vue";
const router = useRouter(),
  route = useRoute(),
  user = ref(null),
  mobileNavOpen = ref(false);
watch(
  () => route.path,
  () => {
    try {
      user.value = JSON.parse(localStorage.getItem("fcdbb_user") || "null");
    } catch {
      user.value = null;
    }
    mobileNavOpen.value = false;
  },
  { immediate: true },
);
const links = computed(() => [
  { to: "/", label: "Tổng quan", icon: "home" },
  { to: "/matches", label: "Trận đấu & mùa giải", icon: "calendar" },
  { to: "/players", label: "Cầu thủ", icon: "users" },
  { to: "/funds", label: "Quỹ đội", icon: "wallet" },
  { to: "/blog", label: "Khoảnh khắc", icon: "book" },
  ...(user.value?.role === "admin"
    ? [{ to: "/admin", label: "Quản trị", icon: "settings" }]
    : []),
]);
const logout = () => {
  localStorage.removeItem("fcdbb_token");
  localStorage.removeItem("fcdbb_user");
  user.value = null;
  router.push("/login");
};
</script>
