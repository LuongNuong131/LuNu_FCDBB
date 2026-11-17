<template>
  <div>
    <div class="page-top">
      <div>
        <h1 class="page-heading">Những người đồng đội.</h1>
        <p class="page-intro">
          Hồ sơ thành viên và những dấu ấn trong các trận đấu nội bộ A/B.
        </p>
      </div>
      <span class="badge green">{{ players.length }} thành viên</span>
    </div>
    <div v-if="error" class="error-state" role="alert">
      {{ error }} <button class="btn secondary" @click="load">Thử lại</button>
    </div>
    <div class="grid gap-4 sm:grid-cols-[1fr_200px] mb-6">
      <label
        ><span class="field-label">Tìm cầu thủ</span
        ><input
          v-model="search"
          class="field"
          type="search"
          placeholder="Tên, biệt danh hoặc vị trí…" /></label
      ><label
        ><span class="field-label">Vai trò</span
        ><select v-model="role" class="field">
          <option value="">Tất cả thành viên</option>
          <option value="user">Cầu thủ</option>
          <option value="admin">Quản trị viên</option>
        </select></label
      >
    </div>
    <p v-if="loading" class="empty-state" role="status">Đang tải đội hình…</p>
    <section
      v-else-if="filtered.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <router-link
        v-for="p in filtered"
        :key="p.id"
        :to="`/profile/${p.id}`"
        class="match-card"
        ><div class="flex justify-between items-center">
          <span class="badge">{{
            p.role === "admin" ? "Quản trị viên" : "Cầu thủ"
          }}</span
          ><ClubIcon name="arrow" />
        </div>
        <div class="mt-5 mb-4">
          <ClubAvatar
            :src="p.avatar"
            :name="p.name"
            class="h-20 w-20 rounded-xl mb-4"
          />
          <h2 class="text-base font-bold mb-1">{{ p.name }}</h2>
          <p class="text-xs muted mb-0">
            {{ p.nickname || p.position || "Chưa cập nhật vị trí" }}
          </p>
        </div>
        <div class="grid grid-cols-3 border-t border-slate-200 pt-4">
          <div>
            <span class="stat-label">Ra sân</span
            ><strong class="block text-lg">{{
              playerStats(p.id).appearances || 0
            }}</strong>
          </div>
          <div>
            <span class="stat-label">Bàn thắng</span
            ><strong class="block text-lg">{{
              playerStats(p.id).goals || 0
            }}</strong>
          </div>
          <div>
            <span class="stat-label">Kiến tạo</span
            ><strong class="block text-lg">{{
              playerStats(p.id).assists || 0
            }}</strong>
          </div>
        </div></router-link
      >
    </section>
    <section v-else class="empty-state">
      <h2 class="text-lg font-bold">Chưa tìm thấy đồng đội</h2>
      <p class="mb-0">Thử thay đổi tên tìm kiếm hoặc bộ lọc vai trò.</p>
    </section>
    <p class="hint mt-5">
      Thống kê ra sân và bàn thắng tính từ các biên bản đã chốt ở tất cả mùa
      giải.
    </p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import ClubAvatar from "../components/ClubAvatar.vue";
const players = ref([]),
  stats = ref([]),
  search = ref(""),
  role = ref(""),
  error = ref(""),
  loading = ref(true);
const playerStats = (id) => stats.value.find((p) => p.userId === id) || {};
const filtered = computed(() =>
  players.value.filter(
    (p) =>
      (!role.value || p.role === role.value) &&
      `${p.name} ${p.nickname || ""} ${p.position}`
        .toLocaleLowerCase("vi")
        .includes(search.value.toLocaleLowerCase("vi")),
  ),
);
const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const [p, s] = await Promise.all([
      api.get("/users"),
      api.get("/competition/summary"),
    ]);
    players.value = p.data;
    stats.value = s.data.leaderboard;
  } catch (e) {
    error.value =
      e.response?.data?.message || "Không tải được danh sách thành viên.";
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>
