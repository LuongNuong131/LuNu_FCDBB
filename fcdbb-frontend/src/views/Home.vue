<template>
  <div>
    <div class="page-top">
      <div>
        <h1 class="page-heading">Sẵn sàng cho trận tiếp theo.</h1>
        <p class="page-intro">
          Chào {{ user.name }}. Mọi hoạt động của FC Đá Bay Bóng, ngay tại đây.
        </p>
      </div>
      <router-link to="/matches" class="btn secondary"
        ><ClubIcon name="calendar" />Trận đấu & mùa giải</router-link
      >
    </div>
    <div v-if="error" class="error-state" role="alert">
      {{ error }} <button class="btn secondary" @click="load">Thử lại</button>
    </div>
    <div class="home-main">
      <section class="pitch">
        <div class="pitch-lines"></div>
        <div class="pitch-content">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="badge green">{{
              activeMatch
                ? new Date(activeMatch.start_time) > new Date()
                  ? "Lịch hẹn tiếp theo"
                  : "Trận đang mở"
                : "Lịch sinh hoạt đội"
            }}</span
            ><span class="text-xs muted">FC Đá Bay Bóng</span>
          </div>
          <div class="scoreboard">
            <div class="scoreboard-team">
              <span class="team-chip">A</span>Đội A
            </div>
            <div class="score-large">vs</div>
            <div class="scoreboard-team">
              <span class="team-chip b">B</span>Đội B
            </div>
          </div>
          <h2 class="text-xl font-bold mb-3">
            {{ activeMatch?.title || "Hẹn gặp nhau trên sân." }}
          </h2>
          <div
            v-if="activeMatch"
            class="flex flex-wrap gap-x-5 gap-y-2 text-xs"
          >
            <span class="flex items-center gap-2"
              ><ClubIcon name="calendar" />{{
                formatVietnamDateTime(activeMatch.start_time)
              }}</span
            ><a
              v-if="activeMatch.map_link"
              :href="activeMatch.map_link"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 underline"
              ><ClubIcon name="pin" />{{ activeMatch.location_name }}</a
            ><span v-else class="flex items-center gap-2"
              ><ClubIcon name="pin" />{{ activeMatch.location_name }}</span
            >
          </div>
          <p v-else class="muted text-sm">
            {{
              loading
                ? "Đang tải lịch thi đấu…"
                : "Chưa có lịch trận mới. Quản trị viên có thể thêm lịch trong khu vực quản trị."
            }}
          </p>
          <div v-if="activeMatch" class="mt-6 flex flex-wrap gap-3">
            <button
              class="btn"
              @click="checkin"
              :disabled="checking || hasCheckedIn"
            >
              <ClubIcon :name="hasCheckedIn ? 'check' : 'pin'" />{{
                checking
                  ? "Đang lấy vị trí…"
                  : hasCheckedIn
                    ? "Đã điểm danh"
                    : "Điểm danh tại sân"
              }}</button
            ><router-link
              :to="`/matches/${activeMatch.id}`"
              class="btn secondary"
              >Xem chi tiết trận<ClubIcon name="arrow"
            /></router-link>
          </div>
          <p v-if="activeMatch" class="hint">
            Điểm danh trong bán kính 50m. Mốc tính đi muộn:
            {{ formatVietnamDateTime(activeMatch.lock_time) }}.
          </p>
        </div>
      </section>
      <aside class="home-side">
        <section class="panel">
          <div class="section-head">
            <h2>Nhịp thi đấu A/B</h2>
            <ClubIcon name="trophy" />
          </div>
          <div v-for="t in summary.standings" :key="t.team" class="person-row">
            <span class="flex items-center gap-3"
              ><span class="team-chip" :class="{ b: t.team === 'B' }">{{
                t.team
              }}</span
              ><span
                ><strong>Đội {{ t.team }}</strong
                ><span class="block text-xs muted"
                  >{{ t.won }} thắng / {{ t.drawn }} hòa /
                  {{ t.lost }} thua</span
                ></span
              ></span
            ><strong class="text-lg"
              >{{ t.points }}
              <span class="text-xs font-normal muted">điểm</span></strong
            >
          </div>
          <p class="hint">
            Toàn bộ biên bản đã chốt · Thắng 3 điểm, hòa 1 điểm.
          </p>
        </section>
        <section class="panel">
          <h2 class="text-sm font-bold mb-1">Không bỏ lỡ hoạt động đội</h2>
          <router-link to="/players" class="quick-link"
            ><span class="flex items-center gap-3"
              ><ClubIcon name="users" />Danh sách cầu thủ</span
            ><ClubIcon name="arrow" /></router-link
          ><router-link to="/funds" class="quick-link"
            ><span class="flex items-center gap-3"
              ><ClubIcon name="wallet" />Thu chi quỹ đội</span
            ><ClubIcon name="arrow" /></router-link
          ><router-link to="/blog" class="quick-link"
            ><span class="flex items-center gap-3"
              ><ClubIcon name="book" />Khoảnh khắc trên sân</span
            ><ClubIcon name="arrow"
          /></router-link>
        </section>
      </aside>
    </div>
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
        <span class="stat-label">Cầu thủ đã ra sân</span
        ><strong class="metric-value">{{ summary.players }}</strong>
      </div>
      <div class="metric">
        <span class="stat-label">Điểm danh trận tới</span
        ><strong class="metric-value"
          >{{ activeDetails.attendances?.length || 0 }}
          <span class="text-xs muted font-normal">người</span></strong
        >
      </div>
    </div>
    <div class="section-head">
      <div>
        <h2>Nhìn lại những trận đã qua</h2>
        <p class="hint">
          Lịch sân, đội hình, bàn thắng và điểm danh của từng buổi.
        </p>
      </div>
    </div>
    <MatchList initial-status="history" />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import MatchList from "../components/football/MatchList.vue";
import { formatVietnamDateTime } from "../utils/datetime";
import { useToast } from "../composables/useToast";
const user = JSON.parse(localStorage.getItem("fcdbb_user") || "{}"),
  { addToast } = useToast();
const activeMatch = ref(null),
  activeDetails = ref({}),
  summary = ref({ completed: 0, totalGoals: 0, players: 0, standings: [] }),
  error = ref(""),
  loading = ref(true),
  checking = ref(false);
const hasCheckedIn = computed(() =>
  activeDetails.value.attendances?.some((a) => a.user.id === user.id),
);
const load = async () => {
  error.value = "";
  loading.value = true;
  try {
    const [home, stats] = await Promise.all([
      api.get("/home"),
      api.get("/competition/summary"),
    ]);
    activeMatch.value = home.data.activeMatch;
    summary.value = stats.data;
    activeDetails.value = activeMatch.value
      ? (await api.get(`/matches/${activeMatch.value.id}/details`)).data
      : {};
  } catch (e) {
    error.value =
      e.response?.data?.message ||
      "Chưa tải được dữ liệu đội bóng. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
};
const checkin = () => {
  if (!navigator.geolocation)
    return addToast("Trình duyệt không hỗ trợ định vị.", "warning");
  checking.value = true;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await api.post("/attendance/checkin", {
          matchId: activeMatch.value.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        addToast("Điểm danh thành công.", "success");
        await load();
      } catch (e) {
        addToast(
          e.response?.data?.message || "Không thể điểm danh. Thử lại.",
          "error",
        );
      } finally {
        checking.value = false;
      }
    },
    (e) => {
      checking.value = false;
      addToast(
        e.code === 1
          ? "Cho phép truy cập vị trí để điểm danh tại sân."
          : "Chưa lấy được vị trí. Bật GPS và thử lại.",
        "error",
      );
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
};
onMounted(load);
</script>
