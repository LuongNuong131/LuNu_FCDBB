<template>
  <div>
    <div class="page-top">
      <div>
        <h1 class="page-heading">Mỗi trận đấu, một dấu ấn.</h1>
        <p class="page-intro">
          Theo dõi cuộc đua A/B, phong độ cầu thủ và hành trình của từng mùa
          giải.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn secondary"
          @click="exportStats"
          :disabled="!summary.leaderboard?.length"
        >
          <ClubIcon name="download" />Xuất thống kê</button
        ><button v-if="isAdmin" class="btn" @click="showSeasons = !showSeasons">
          <ClubIcon name="settings" />Quản lý mùa giải
        </button>
      </div>
    </div>
    <div v-if="error" class="error-state" role="alert">{{ error }}</div>
    <section v-if="showSeasons && isAdmin" class="panel mb-6">
      <div class="section-head">
        <h2>{{ form.id ? "Chỉnh sửa mùa giải" : "Tạo mùa giải" }}</h2>
        <button
          class="icon-btn"
          @click="showSeasons = false"
          aria-label="Đóng quản lý mùa giải"
        >
          <ClubIcon name="close" />
        </button>
      </div>
      <form
        @submit.prevent="saveSeason"
        class="grid gap-4 md:grid-cols-4 items-end"
      >
        <label
          ><span class="field-label">Tên mùa giải</span
          ><input
            v-model="form.name"
            required
            maxlength="100"
            class="field"
            placeholder="Ví dụ: Mùa thu 2026" /></label
        ><label
          ><span class="field-label">Ngày bắt đầu</span
          ><input
            v-model="form.starts_on"
            required
            type="date"
            class="field" /></label
        ><label
          ><span class="field-label">Ngày kết thúc</span
          ><input v-model="form.ends_on" required type="date" class="field"
        /></label>
        <div class="flex gap-2">
          <button class="btn" :disabled="saving">
            {{
              saving ? "Đang lưu…" : form.id ? "Lưu mùa giải" : "Tạo mùa giải"
            }}</button
          ><button
            v-if="form.id"
            type="button"
            class="btn secondary"
            @click="resetSeason"
          >
            Hủy sửa
          </button>
        </div>
      </form>
      <div class="mt-5">
        <div v-for="s in seasons" :key="s.id" class="person-row">
          <span
            ><strong>{{ s.name }}</strong
            ><span class="block muted text-xs"
              >{{ s.starts_on }} đến {{ s.ends_on
              }}{{ s.archived ? " · Đã lưu trữ" : "" }}</span
            ></span
          >
          <div class="flex gap-2">
            <button class="btn secondary" @click="form = { ...s }">Sửa</button
            ><button
              class="btn secondary"
              @click="toggleArchive(s)"
              :disabled="saving"
            >
              {{ s.archived ? "Mở lại" : "Lưu trữ" }}
            </button>
          </div>
        </div>
        <p v-if="!seasons.length" class="hint">
          Tạo mùa giải đầu tiên, sau đó gắn trận đấu vào mùa giải trong biên
          bản.
        </p>
      </div>
    </section>
    <section class="panel mb-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold mb-1">
            {{ selectedSeason?.name || "Toàn bộ hành trình" }}
          </h2>
          <p class="hint">
            Bảng xếp hạng chỉ tính các trận có biên bản đã chốt. Thắng 3 điểm,
            hòa 1 điểm.
          </p>
        </div>
        <label class="w-full sm:w-64"
          ><span class="field-label">Xem thống kê theo mùa giải</span
          ><select v-model="season" class="field">
            <option value="">Tất cả mùa giải</option>
            <option v-for="s in seasons" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.archived ? " (đã lưu trữ)" : "" }}
            </option>
          </select></label
        >
      </div>
    </section>
    <div class="metric-grid">
      <div class="metric">
        <span class="stat-label">Trận đã chốt</span
        ><strong class="metric-value">{{ summary.completed }}</strong>
      </div>
      <div class="metric">
        <span class="stat-label">Bàn thắng</span
        ><strong class="metric-value">{{ summary.totalGoals }}</strong>
      </div>
      <div class="metric">
        <span class="stat-label">Cầu thủ ra sân</span
        ><strong class="metric-value">{{ summary.players }}</strong>
      </div>
      <div class="metric">
        <span class="stat-label">Bàn / trận</span
        ><strong class="metric-value">{{
          summary.completed
            ? (summary.totalGoals / summary.completed).toFixed(1)
            : "—"
        }}</strong>
      </div>
    </div>
    <div class="season-layout">
      <section>
        <div class="section-head">
          <h2>Cuộc đua hai đội</h2>
          <span v-if="statsLoading" class="text-xs muted">Đang tải…</span>
        </div>
        <Standings :teams="summary.standings" />
        <div class="mt-4 flex flex-wrap gap-5">
          <div v-for="t in summary.standings" :key="t.team" class="text-xs">
            <span class="muted mr-2">Đội {{ t.team }}</span
            ><span
              v-for="(f, i) in t.form"
              :key="i"
              class="form-pill"
              :class="{ loss: f === 'L', draw: f === 'D' }"
              :title="f === 'W' ? 'Thắng' : f === 'D' ? 'Hòa' : 'Thua'"
              >{{ f === "W" ? "T" : f === "D" ? "H" : "B" }}</span
            ><span v-if="!t.form.length" class="muted">Chưa có kết quả</span>
          </div>
        </div>
        <p class="hint">
          Phong độ: mới nhất bên trái. T = thắng, H = hòa, B = bại.
        </p>
      </section>
      <section>
        <div class="section-head">
          <h2>Dấu giày cầu thủ</h2>
          <span class="badge">Bàn thắng & kiến tạo</span>
        </div>
        <div class="table-shell">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cầu thủ</th>
                <th class="numeric">Trận</th>
                <th class="numeric">Bàn</th>
                <th class="numeric">Kiến tạo</th>
                <th class="numeric">MVP</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, i) in summary.leaderboard.slice(0, 10)"
                :key="p.userId"
              >
                <td>
                  <span class="text-xs muted mr-3">{{ i + 1 }}</span
                  >{{ p.name }}
                </td>
                <td class="numeric">{{ p.appearances }}</td>
                <td class="numeric font-bold">{{ p.goals }}</td>
                <td class="numeric">{{ p.assists }}</td>
                <td class="numeric">{{ p.mvps }}</td>
              </tr>
              <tr v-if="!summary.leaderboard.length">
                <td colspan="5" class="muted text-center py-8">
                  Chốt biên bản đầu tiên để bắt đầu thống kê.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <div class="section-head">
      <h2>Sổ trận đấu</h2>
      <router-link v-if="isAdmin" to="/admin" class="btn secondary"
        ><ClubIcon name="plus" />Thêm lịch trận</router-link
      >
    </div>
    <MatchList
      ref="matchList"
      :season-id="season"
      @season-change="season = $event"
    />
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import MatchList from "../components/football/MatchList.vue";
import Standings from "../components/football/Standings.vue";
import { downloadCsv } from "../utils/football";
import { useToast } from "../composables/useToast";
const isAdmin =
    JSON.parse(localStorage.getItem("fcdbb_user") || "{}").role === "admin",
  { addToast } = useToast();
const season = ref(""),
  seasons = ref([]),
  summary = ref({
    completed: 0,
    totalGoals: 0,
    players: 0,
    standings: [],
    leaderboard: [],
  }),
  error = ref(""),
  statsLoading = ref(false),
  showSeasons = ref(false),
  saving = ref(false),
  matchList = ref(null);
const emptySeason = () => ({ name: "", starts_on: "", ends_on: "" }),
  form = ref(emptySeason());
const selectedSeason = computed(() =>
  seasons.value.find((s) => s.id === Number(season.value)),
);
let statsController;
const loadStats = async () => {
  statsController?.abort();
  const current = new AbortController();
  statsController = current;
  statsLoading.value = true;
  error.value = "";
  try {
    summary.value = (
      await api.get("/competition/summary", {
        params: { season: season.value },
        signal: current.signal,
      })
    ).data;
  } catch (e) {
    if (e.code !== "ERR_CANCELED")
      error.value = "Không tải được thống kê mùa giải.";
  } finally {
    if (current === statsController) statsLoading.value = false;
  }
};
const loadSeasons = async () => {
  seasons.value = (await api.get("/seasons")).data;
};
const resetSeason = () => {
  form.value = emptySeason();
};
const saveSeason = async () => {
  saving.value = true;
  try {
    if (form.value.id) await api.put(`/seasons/${form.value.id}`, form.value);
    else await api.post("/seasons", form.value);
    addToast("Đã lưu mùa giải.", "success");
    resetSeason();
    await loadSeasons();
    matchList.value?.reload();
  } catch (e) {
    addToast(e.response?.data?.message || "Không lưu được mùa giải.", "error");
  } finally {
    saving.value = false;
  }
};
const toggleArchive = async (s) => {
  saving.value = true;
  try {
    await api.put(`/seasons/${s.id}`, { ...s, archived: !s.archived });
    await loadSeasons();
    addToast(
      s.archived ? "Đã mở lại mùa giải." : "Đã lưu trữ mùa giải.",
      "success",
    );
  } catch (e) {
    addToast(
      e.response?.data?.message || "Không cập nhật được mùa giải.",
      "error",
    );
  } finally {
    saving.value = false;
  }
};
const exportStats = () =>
  downloadCsv(`fcdbb-thong-ke-${selectedSeason.value?.id || "tat-ca"}.csv`, [
    ["Mùa giải", selectedSeason.value?.name || "Tất cả"],
    ["Cầu thủ", "Số trận", "Bàn thắng", "Kiến tạo", "MVP", "Trận thắng"],
    ...summary.value.leaderboard.map((p) => [
      p.name,
      p.appearances,
      p.goals,
      p.assists,
      p.mvps,
      p.wins,
    ]),
  ]);
watch(season, loadStats);
onMounted(async () => {
  loadStats();
  try {
    await loadSeasons();
  } catch {
    error.value = "Không tải được danh sách mùa giải.";
  }
});
onUnmounted(() => statsController?.abort());
</script>
