<template>
  <div class="home-page">
    <div class="page-top home-welcome">
      <div>
        <h1 class="page-heading">Sẵn sàng cho trận tiếp theo.</h1>
        <p class="page-intro">
          Chào {{ user.name }}. Hẹn nhau trên sân, cùng lưu lại hành trình.
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
      <div class="home-feature">
        <section class="pitch home-pitch">
          <div class="pitch-lines" aria-hidden="true"></div>
          <div class="pitch-content">
            <div class="fixture-heading">
              <span class="badge green">{{
                activeMatch
                  ? new Date(activeMatch.start_time) > new Date()
                    ? "Lịch hẹn tiếp theo"
                    : "Trận đang mở"
                  : "Lịch sinh hoạt đội"
              }}</span
              ><span class="fixture-club">FC Đá Bay Bóng</span>
            </div>
            <div v-if="activeMatch" class="scoreboard">
              <div class="scoreboard-team">
                <span class="team-chip">A</span>Đội A
              </div>
              <div class="score-large">vs</div>
              <div class="scoreboard-team">
                <span class="team-chip b">B</span>Đội B
              </div>
            </div>
            <div v-else class="next-fixture-empty">
              <ClubIcon name="calendar" />
              <div>
                <h2>Hẹn gặp nhau trên sân.</h2>
                <p>
                  {{
                    loading
                      ? "Đang tải lịch thi đấu…"
                      : "Chưa có lịch trận mới. Cùng theo dõi lịch hẹn tiếp theo của đội."
                  }}
                </p>
              </div>
            </div>
            <h2 v-if="activeMatch" class="fixture-title">
              {{ activeMatch.title }}
            </h2>
            <MatchFacts v-if="activeMatch" :match="activeMatch" />
            <div v-if="activeMatch" class="fixture-actions">
              <button
                class="btn"
                @click="checkin(activeMatch.id, load)"
                :disabled="checking || hasCheckedIn"
              >
                <ClubIcon :name="hasCheckedIn ? 'check' : 'pin'" />{{
                  checking
                    ? "Đang lấy vị trí…"
                    : hasCheckedIn
                      ? "Đã điểm danh"
                      : user.role === "admin"
                        ? "Điểm danh GPS"
                        : "Điểm danh tại sân"
                }}</button
              ><router-link
                :to="`/matches/${activeMatch.id}`"
                class="btn secondary"
                >Xem chi tiết trận<ClubIcon name="arrow"
              /></router-link>
            </div>
            <router-link
              v-else-if="user.role === 'admin' && !loading"
              to="/admin"
              class="btn secondary"
              ><ClubIcon name="plus" />Lên lịch buổi đá</router-link
            >
            <p
              v-if="activeMatch?.checkin_open_time"
              class="text-xs muted mt-3 mb-0"
            >
              Có thể điểm danh từ
              {{
                formatVietnamDateTime(activeMatch.checkin_open_time, {
                  second: undefined,
                })
              }}{{ user.role === "admin" ? " (cầu thủ)." : "." }}
            </p>
            <p v-if="activeMatch" class="hint">
              {{
                user.role === "admin"
                  ? "Admin có thể điểm danh GPS bất cứ lúc nào."
                  : "Điểm danh trong bán kính 50 m."
              }}
              Mốc tính đi muộn
              {{ formatVietnamDateTime(activeMatch.lock_time) }}.
            </p>
            <p v-if="ownAttendance?.distance != null" class="hint">
              Cách sân {{ formatFieldDistance(ownAttendance.distance) }} khi
              điểm danh.
            </p>
          </div>
        </section>
        <div class="metric-grid home-metrics">
          <div class="metric">
            <ClubIcon name="calendar" /><span class="stat-label"
              >Trận đã chốt</span
            ><strong class="metric-value">{{ summary.completed }}</strong>
          </div>
          <div class="metric">
            <ClubIcon name="trophy" /><span class="stat-label">Bàn thắng</span
            ><strong class="metric-value">{{ summary.totalGoals }}</strong>
          </div>
          <div class="metric">
            <ClubIcon name="users" /><span class="stat-label"
              >Cầu thủ ra sân</span
            ><strong class="metric-value">{{ summary.players }}</strong>
          </div>
          <div class="metric">
            <ClubIcon name="check" /><span class="stat-label"
              >Điểm danh trận tới</span
            ><strong class="metric-value"
              >{{ activeDetails.attendances?.length || 0
              }}<span class="metric-unit">người</span></strong
            >
          </div>
        </div>
      </div>
      <aside class="home-side">
        <section class="panel home-standings">
          <div class="section-head">
            <h2>Nhịp thi đấu A/B</h2>
            <ClubIcon name="trophy" />
          </div>
          <div class="home-team-list">
            <div
              v-for="t in summary.standings"
              :key="t.team"
              class="person-row"
            >
              <span class="team-chip" :class="{ b: t.team === 'B' }">{{
                t.team
              }}</span
              ><span class="home-team-copy"
                ><strong>Đội {{ t.team }}</strong
                ><span
                  >{{ t.won }} thắng / {{ t.drawn }} hòa /
                  {{ t.lost }} thua</span
                ></span
              ><strong class="home-team-points"
                >{{ t.points }}<span>điểm</span></strong
              >
            </div>
          </div>
          <router-link to="/matches" class="standings-link"
            >Xem bảng xếp hạng<ClubIcon name="arrow"
          /></router-link>
        </section>
        <nav class="home-shortcuts" aria-label="Tiện ích đội bóng">
          <router-link to="/players"
            ><ClubIcon name="users" /><span>Cầu thủ</span
            ><ClubIcon name="arrow" /></router-link
          ><router-link to="/funds"
            ><ClubIcon name="wallet" /><span>Thu chi quỹ</span
            ><ClubIcon name="arrow" /></router-link
          ><router-link to="/blog"
            ><ClubIcon name="book" /><span>Khoảnh khắc</span
            ><ClubIcon name="arrow"
          /></router-link>
        </nav>
      </aside>
    </div>
    <section class="home-history" aria-labelledby="history-title">
      <div class="section-head">
        <div>
          <h2 id="history-title">Nhìn lại những trận đã qua</h2>
          <p class="hint">Lịch sân, đội hình và dấu ấn của từng buổi đá.</p>
        </div>
        <ClubIcon name="calendar" />
      </div>
      <MatchList initial-status="history" />
    </section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import MatchFacts from "../components/football/MatchFacts.vue";
import MatchList from "../components/football/MatchList.vue";
import { formatVietnamDateTime } from "../utils/datetime";
import { formatFieldDistance } from "../utils/football";
import { useCheckin } from "../composables/useCheckin";
const user = JSON.parse(localStorage.getItem("fcdbb_user") || "{}");
const { checking, checkin } = useCheckin();
const activeMatch = ref(null),
  activeDetails = ref({}),
  summary = ref({ completed: 0, totalGoals: 0, players: 0, standings: [] }),
  error = ref(""),
  loading = ref(true);
const ownAttendance = computed(() =>
  activeDetails.value.attendances?.find((a) => a.user.id === user.id),
);
const hasCheckedIn = computed(() => Boolean(ownAttendance.value));
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
onMounted(load);
</script>
