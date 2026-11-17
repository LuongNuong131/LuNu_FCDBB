<template>
  <section aria-label="Danh sách trận đấu">
    <div class="filters">
      <label
        ><span class="field-label">Tìm trận hoặc sân</span
        ><input
          v-model="search"
          class="field"
          placeholder="Nhập tên trận, sân bóng…"
          type="search"
      /></label>
      <label
        ><span class="field-label">Mùa giải</span
        ><select v-model="season" class="field">
          <option value="">Tất cả mùa giải</option>
          <option v-for="s in seasons" :key="s.id" :value="s.id">
            {{ s.name }}{{ s.archived ? " (đã lưu trữ)" : "" }}
          </option>
        </select></label
      >
      <label
        ><span class="field-label">Trạng thái</span
        ><select v-model="status" class="field">
          <option value="">Tất cả trận</option>
          <option value="upcoming">Đang mở / sắp tới</option>
          <option value="history">Trận đã qua</option>
          <option value="completed">Đã chốt kết quả</option>
          <option value="cancelled">Đã hủy</option>
        </select></label
      >
      <label
        ><span class="field-label">Mỗi trang</span
        ><select v-model="pageSize" class="field">
          <option :value="6">6 trận</option>
          <option :value="12">12 trận</option>
          <option :value="24">24 trận</option>
          <option :value="48">48 trận</option>
        </select></label
      >
    </div>
    <div v-if="error" class="error-state" role="alert">
      {{ error }} <button class="btn secondary" @click="load">Thử lại</button>
    </div>
    <p v-if="loading" class="muted py-6" role="status">
      Đang tải danh sách trận…
    </p>
    <div v-else-if="items.length" class="match-grid">
      <router-link
        v-for="m in items"
        :key="m.id"
        :to="`/matches/${m.id}`"
        class="match-card"
      >
        <div class="match-card-top">
          <span
            class="badge"
            :class="
              m.report?.status === 'completed'
                ? 'green'
                : m.report?.status === 'cancelled'
                  ? 'red'
                  : 'blue'
            "
            >{{ matchStatus(m) }}</span
          ><span class="match-card-date">{{
            formatVietnamDate(m.start_time)
          }}</span>
        </div>
        <h3>{{ m.title }}</h3>
        <p class="muted text-xs mb-0">
          {{ m.season?.name || "Chưa gắn mùa giải" }}
        </p>
        <p class="match-card-schedule">
          <ClubIcon name="clock" />{{
            formatVietnamDateTime(m.start_time, {
              day: undefined,
              month: undefined,
              year: undefined,
              second: undefined,
            })
          }}
        </p>
        <div class="match-score">
          <span class="flex items-center gap-2 text-xs font-semibold"
            ><span class="team-chip">A</span>Đội A</span
          ><span class="score-small">{{
            m.report?.status === "completed"
              ? `${m.report.score_a} : ${m.report.score_b}`
              : "— : —"
          }}</span
          ><span class="flex items-center gap-2 text-xs font-semibold"
            >Đội B<span class="team-chip b">B</span></span
          >
        </div>
        <div class="match-card-foot">
          <span class="match-location">{{ m.location_name }}</span
          ><span class="flex shrink-0 items-center gap-1"
            >{{ m.report?.roster?.length || 0 }} cầu thủ <ClubIcon name="arrow"
          /></span>
        </div>
      </router-link>
    </div>
    <div v-else class="empty-state">
      <ClubIcon name="calendar" class="mx-auto" />
      <h3>Chưa có trận phù hợp</h3>
      <p class="mb-0">
        Thử đổi bộ lọc hoặc thêm lịch trận trong trang quản trị.
      </p>
    </div>
    <div class="pagination">
      <span
        >{{ total }} trận · Trang {{ page }} / {{ Math.max(1, pages) }}</span
      >
      <div class="pagination-actions">
        <button
          class="btn secondary"
          @click="page--"
          :disabled="page <= 1 || loading"
          aria-label="Trang trước"
        >
          Trang trước</button
        ><button
          class="btn secondary"
          @click="page++"
          :disabled="page >= pages || loading"
          aria-label="Trang sau"
        >
          Trang sau
        </button>
      </div>
    </div>
  </section>
</template>
<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import api from "../../api";
import ClubIcon from "../ClubIcon.vue";
import { formatVietnamDate, formatVietnamDateTime } from "../../utils/datetime";
import { matchStatus } from "../../utils/football";
const props = defineProps({
  initialStatus: { type: String, default: "" },
  seasonId: { type: [String, Number], default: "" },
});
const emit = defineEmits(["season-change"]);
const items = ref([]),
  seasons = ref([]),
  search = ref(""),
  season = ref(props.seasonId),
  status = ref(props.initialStatus),
  pageSize = ref(12),
  page = ref(1),
  total = ref(0),
  pages = ref(0),
  loading = ref(false),
  error = ref("");
let timer, controller;
const load = async () => {
  controller?.abort();
  controller = new AbortController();
  const current = controller;
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/competition/matches", {
      params: {
        search: search.value,
        season: season.value,
        status: status.value,
        page: page.value,
        pageSize: pageSize.value,
      },
      signal: current.signal,
    });
    items.value = data.items;
    total.value = data.total;
    pages.value = data.pages;
    if (page.value > Math.max(1, data.pages))
      page.value = Math.max(1, data.pages);
  } catch (e) {
    if (e.code !== "ERR_CANCELED")
      error.value =
        e.response?.data?.message ||
        "Không tải được lịch trận. Kiểm tra kết nối và thử lại.";
  } finally {
    if (controller === current) loading.value = false;
  }
};
watch([season, status, pageSize], () => {
  page.value = 1;
  load();
});
watch(season, (v) => emit("season-change", v));
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(page, load);
watch(
  () => props.seasonId,
  (v) => {
    season.value = v;
  },
);
onMounted(async () => {
  load();
  try {
    seasons.value = (await api.get("/seasons")).data;
  } catch {
    error.value = "Không tải được danh sách mùa giải.";
  }
});
onUnmounted(() => {
  clearTimeout(timer);
  controller?.abort();
});
defineExpose({ reload: load });
</script>
