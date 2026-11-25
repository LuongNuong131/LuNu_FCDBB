<template>
  <div class="players-page">
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
    <div class="player-filters grid gap-4 sm:grid-cols-[1fr_180px_180px] mb-6">
      <label
        ><span class="field-label">Tìm cầu thủ</span
        ><input
          v-model="search"
          class="field"
          type="search"
          placeholder="Tên, biệt danh, vị trí hoặc số áo…" /></label
      ><label
        ><span class="field-label">Vai trò</span
        ><select v-model="role" class="field">
          <option value="">Tất cả thành viên</option>
          <option value="user">Cầu thủ</option>
          <option value="admin">Quản trị viên</option>
        </select></label
      >
      <label
        ><span class="field-label">Đội cố định</span
        ><select v-model="team" class="field" aria-label="Lọc đội cố định">
          <option value="">Tất cả đội</option>
          <option value="A">Đội A</option>
          <option value="B">Đội B</option>
          <option value="unassigned">Chưa phân đội</option>
        </select></label
      >
    </div>
    <div class="team-counter-row">
      <span class="team-counter"
        ><span class="team-chip">A</span
        ><strong>{{
          players.filter((p) => p.home_team === "A").length
        }}</strong>
        cầu thủ</span
      ><span class="team-counter"
        ><span class="team-chip b">B</span
        ><strong>{{
          players.filter((p) => p.home_team === "B").length
        }}</strong>
        cầu thủ</span
      >
    </div>
    <p v-if="loading" class="empty-state" role="status">Đang tải đội hình…</p>
    <section
      v-else-if="filtered.length"
      class="player-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <article v-for="p in filtered" :key="p.id" class="match-card player-card">
        <div class="flex justify-between items-center">
          <span class="badge">{{
            p.role === "admin" ? "Quản trị viên" : "Cầu thủ"
          }}</span
          ><span
            class="badge"
            :class="
              p.home_team === 'A' ? 'green' : p.home_team === 'B' ? 'blue' : ''
            "
            >{{ p.home_team ? `Đội ${p.home_team}` : "Chưa phân đội" }}</span
          >
        </div>
        <div
          class="player-identity"
          :class="{ 'has-jersey': p.jersey_number != null }"
        >
          <ClubAvatar
            :src="p.avatar"
            :name="p.name"
            preview
            class="h-20 w-20 rounded-xl mb-4"
          />
          <h2 class="text-base font-bold mb-1">
            <router-link :to="`/profile/${p.id}`">{{ p.name }}</router-link>
          </h2>
          <p class="text-xs muted mb-0">
            {{ p.nickname || p.position || "Chưa cập nhật vị trí" }}
          </p>
          <span v-if="p.jersey_number != null" class="jersey-number">
            <span class="jersey-label">Số áo</span>
            <strong>{{ p.jersey_number }}</strong>
          </span>
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
        </div>
        <router-link
          :to="`/profile/${p.id}`"
          class="btn secondary mt-4 w-full"
          :aria-label="`Xem hồ sơ của ${p.name}`"
          >Xem hồ sơ</router-link
        >
      </article>
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
import ClubAvatar from "../components/ClubAvatar.vue";
const players = ref([]),
  stats = ref([]),
  search = ref(""),
  role = ref(""),
  team = ref(""),
  error = ref(""),
  loading = ref(true);
const playerStats = (id) => stats.value.find((p) => p.userId === id) || {};
const filtered = computed(() =>
  players.value.filter(
    (p) =>
      (!role.value || p.role === role.value) &&
      (!team.value ||
        (team.value === "unassigned"
          ? !p.home_team
          : p.home_team === team.value)) &&
      `${p.name} ${p.nickname || ""} ${p.position} ${p.jersey_number ?? ""}`
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
