<template>
  <div class="app-shell" :class="{ 'has-member': user }">
    <a href="#main-content" class="skip-link">Đến nội dung chính</a>
    <header v-if="user" class="topbar">
      <div class="header-inner">
        <router-link to="/" class="brand">
          <span class="brand-mark">ĐB</span>
          <span
            ><span class="brand-wordmark">FC Đá Bay Bóng</span
            ><span class="brand-subtitle"
              >Cùng một đội. Cùng một hành trình.</span
            ></span
          >
        </router-link>
        <nav class="desktop-nav" aria-label="Điều hướng chính">
          <router-link
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ 'is-active': isActive(link.to) }"
            ><ClubIcon :name="link.icon" />{{ link.label }}</router-link
          >
        </nav>
        <div class="member-actions">
          <ThemeToggle />
          <router-link
            :to="`/profile/${user.id}`"
            class="member-link"
            title="Hồ sơ cá nhân"
          >
            <ClubAvatar
              :src="user.avatar"
              :name="user.name"
              class="h-10 w-10 rounded-full"
            /><span>{{ user.name }}</span>
          </router-link>
          <button
            @click="logout"
            class="icon-btn desktop-logout"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <ClubIcon name="logout" />
          </button>
          <button
            class="icon-btn menu-toggle"
            @click="mobileNavOpen = true"
            :aria-expanded="mobileNavOpen"
            aria-controls="club-navigation"
            aria-label="Mở điều hướng"
          >
            <ClubIcon name="menu" />
          </button>
        </div>
      </div>
    </header>
    <header v-else class="guest-theme"><ThemeToggle /></header>
    <main id="main-content" class="app-content" tabindex="-1">
      <router-view />
    </main>
    <nav v-if="user" class="bottom-nav" aria-label="Thanh điều hướng nhanh">
      <router-link
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        :class="{ 'is-active': isActive(link.to) }"
        :aria-current="isActive(link.to) ? 'page' : undefined"
      >
        <ClubIcon :name="link.icon" /><span>{{
          link.shortLabel || link.label
        }}</span>
      </router-link>
      <button
        @click="mobileNavOpen = true"
        aria-label="Mở thêm tiện ích"
        aria-controls="club-navigation"
        :aria-expanded="mobileNavOpen"
        :class="{
          'is-active':
            ['/blog', '/admin'].includes(route.path) ||
            route.path.startsWith('/profile'),
        }"
      >
        <ClubIcon name="menu" /><span>Thêm</span>
      </button>
    </nav>
    <dialog
      v-if="user"
      id="club-navigation"
      ref="navigationSheet"
      class="navigation-sheet"
      aria-labelledby="navigation-title"
      @close="mobileNavOpen = false"
      @click="closeBackdrop"
      @keydown="trapNavigationFocus"
    >
      <div class="sheet-handle" aria-hidden="true"></div>
      <div class="sheet-heading">
        <div>
          <h2 id="navigation-title">Không gian đội bóng</h2>
          <p>Đi đến hoạt động bạn cần.</p>
        </div>
        <button
          class="icon-btn"
          @click="mobileNavOpen = false"
          aria-label="Đóng điều hướng"
          autofocus
        >
          <ClubIcon name="close" />
        </button>
      </div>
      <router-link
        :to="`/profile/${user.id}`"
        class="sheet-member"
        @click="mobileNavOpen = false"
        ><ClubAvatar
          :src="user.avatar"
          :name="user.name"
          class="h-12 w-12 rounded-xl" /><span
          ><strong>{{ user.name }}</strong
          ><span
            >{{
              user.role === "admin" ? "Quản trị viên" : "Thành viên đội bóng"
            }}
            · Hồ sơ cá nhân</span
          ></span
        ><ClubIcon name="arrow"
      /></router-link>
      <nav class="mobile-nav" aria-label="Điều hướng di động">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'is-active': isActive(link.to) }"
          @click="mobileNavOpen = false"
          ><ClubIcon :name="link.icon" />{{ link.label }}</router-link
        >
      </nav>
      <button class="sheet-logout" @click="logout">
        <ClubIcon name="logout" />Đăng xuất
      </button>
    </dialog>
    <ToastPopup /><DialogPopup />
  </div>
</template>
<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import ToastPopup from "./components/ToastPopup.vue";
import DialogPopup from "./components/DialogPopup.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import ClubIcon from "./components/ClubIcon.vue";
import ClubAvatar from "./components/ClubAvatar.vue";
const router = useRouter(),
  route = useRoute(),
  user = ref(null),
  mobileNavOpen = ref(false),
  navigationSheet = ref(null);
let previousOverflow = "";
const isActive = (to) =>
  to === "/"
    ? route.path === "/"
    : route.path === to || route.path.startsWith(`${to}/`);
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
watch(mobileNavOpen, async (open) => {
  await nextTick();
  if (open && navigationSheet.value) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navigationSheet.value.showModal();
  } else {
    navigationSheet.value?.close();
    document.body.style.overflow = previousOverflow;
  }
});
const wideScreen = window.matchMedia("(min-width: 981px)");
const closeOnWideScreen = (e) => {
  if (e.matches) mobileNavOpen.value = false;
};
onMounted(() => wideScreen.addEventListener("change", closeOnWideScreen));
onUnmounted(() => {
  wideScreen.removeEventListener("change", closeOnWideScreen);
  if (mobileNavOpen.value) document.body.style.overflow = previousOverflow;
});
const trapNavigationFocus = (event) => {
  if (event.key !== "Tab") return;
  const items = [
    ...navigationSheet.value.querySelectorAll("button:not(:disabled), a[href]"),
  ];
  const first = items[0],
    last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
};
const closeBackdrop = (event) => {
  if (event.target === navigationSheet.value) mobileNavOpen.value = false;
};
const links = computed(() => [
  { to: "/", label: "Tổng quan", icon: "home" },
  {
    to: "/matches",
    label: "Trận đấu & mùa giải",
    shortLabel: "Trận đấu",
    icon: "calendar",
  },
  { to: "/players", label: "Cầu thủ", icon: "users" },
  { to: "/funds", label: "Quỹ đội", icon: "wallet" },
  { to: "/blog", label: "Khoảnh khắc", icon: "book" },
  ...(user.value?.role === "admin"
    ? [{ to: "/admin", label: "Quản trị", icon: "settings" }]
    : []),
]);
const quickLinks = computed(() => links.value.slice(0, 4));
const logout = () => {
  mobileNavOpen.value = false;
  localStorage.removeItem("fcdbb_token");
  localStorage.removeItem("fcdbb_user");
  user.value = null;
  router.push("/login");
};
</script>
