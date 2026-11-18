<template>
  <div
    class="login-layout mx-auto grid min-h-[calc(100vh-140px)] max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20"
  >
    <section class="login-story">
      <router-link to="/login" class="brand mb-10">
        <img
          class="brand-mark"
          src="/fcdbb-logo.svg"
          alt=""
          width="42"
          height="42"
        />
        <span>
          <span class="brand-wordmark">FC Đá Bay Bóng</span>
          <span class="brand-subtitle">Không gian dành riêng cho đội bóng</span>
        </span>
      </router-link>
      <div class="pitch">
        <div class="pitch-lines"></div>
        <div class="pitch-content">
          <div class="scoreboard">
            <div class="scoreboard-team">
              <span class="team-chip">A</span>Đội A
            </div>
            <span class="score-large">vs</span>
            <div class="scoreboard-team">
              <span class="team-chip b">B</span>Đội B
            </div>
          </div>
          <h1 class="text-3xl font-bold tracking-tight leading-snug mb-4">
            Cùng một đội.<br />Cùng một hành trình.
          </h1>
          <p class="muted text-sm leading-7 mb-0">
            Từ buổi đá đầu tuần đến cuộc đua cả mùa giải. Lịch đấu, đội hình và
            những dấu ấn trên sân, được giữ lại ở một nơi.
          </p>
        </div>
      </div>
    </section>
    <section class="panel login-form !p-7 sm:!p-9">
      <h2 class="text-2xl font-bold mb-2 tracking-tight">Chào mừng trở lại.</h2>
      <p class="muted text-sm mb-7">
        Đăng nhập để cập nhật hoạt động đội bóng.
      </p>
      <form @submit.prevent="login" class="stack">
        <label
          ><span class="field-label">Tài khoản</span
          ><input
            v-model="username"
            required
            class="field"
            autocomplete="username"
            placeholder="Tài khoản thành viên"
        /></label>
        <div>
          <label for="login-password"
            ><span class="field-label">Mật khẩu</span></label
          >
          <div class="password-field">
            <input
              id="login-password"
              v-model="password"
              required
              :type="showPassword ? 'text' : 'password'"
              class="field"
              autocomplete="current-password"
              placeholder="Mật khẩu của bạn"
            /><button
              type="button"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <ClubIcon name="eye" />
            </button>
          </div>
        </div>
        <p v-if="error" class="error-state mb-0" role="alert">{{ error }}</p>
        <button class="btn w-full" :disabled="loading">
          {{ loading ? "Đang đăng nhập…" : "Đăng nhập"
          }}<ClubIcon name="arrow" />
        </button>
      </form>
      <p class="hint mt-6">
        Chưa có tài khoản? Liên hệ quản trị viên đội bóng để được cấp quyền truy
        cập.
      </p>
    </section>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
const router = useRouter(),
  username = ref(""),
  password = ref(""),
  showPassword = ref(false),
  error = ref(""),
  loading = ref(false);
const login = async () => {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.post("/auth/login", {
      username: username.value,
      password: password.value,
    });
    localStorage.setItem("fcdbb_token", data.token);
    localStorage.setItem("fcdbb_user", JSON.stringify(data.user));
    await router.push("/");
  } catch (e) {
    error.value =
      e.response?.data?.message ||
      "Không kết nối được máy chủ. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
};
</script>
