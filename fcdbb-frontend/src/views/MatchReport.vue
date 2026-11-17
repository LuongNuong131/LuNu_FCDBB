<template>
  <div>
    <router-link
      to="/matches"
      class="inline-flex items-center gap-2 text-sm muted mb-5"
      >‹ Trở về sổ trận đấu</router-link
    >
    <div v-if="loading" class="empty-state" role="status">
      Đang tải biên bản trận đấu…
    </div>
    <div v-else-if="loadError" class="error-state" role="alert">
      {{ loadError }}
      <button class="btn secondary" @click="load">Thử lại</button>
    </div>
    <template v-else-if="match">
      <div class="page-top">
        <div>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              class="badge"
              :class="
                report.status === 'completed'
                  ? 'green'
                  : report.status === 'cancelled'
                    ? 'red'
                    : 'blue'
              "
              >{{ matchStatus({ ...match, report }) }}</span
            ><span class="badge">{{
              report.season?.name ||
              seasons.find((s) => s.id === report.season_id)?.name ||
              "Chưa gắn mùa giải"
            }}</span>
          </div>
          <h1 class="page-heading">{{ match.title }}</h1>
          <p class="page-intro">
            {{ formatVietnamDateTime(match.start_time) }} ·
            {{ match.location_name }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn secondary" @click="exportReport">
            <ClubIcon name="download" />Xuất biên bản</button
          ><button v-if="isAdmin && !editing" class="btn" @click="beginEdit">
            <ClubIcon name="edit" />{{
              report.revision ? "Chỉnh sửa biên bản" : "Lập biên bản"
            }}
          </button>
        </div>
      </div>
      <MatchFacts :match="match" class="mb-6" />
      <section class="pitch">
        <div class="pitch-lines"></div>
        <div class="pitch-content">
          <div class="scoreboard">
            <div class="scoreboard-team">
              <span class="team-chip">A</span>Đội A<span class="text-xs muted"
                >{{ report.roster.filter((p) => p.team === "A").length }} cầu
                thủ</span
              >
            </div>
            <div class="text-center">
              <div class="score-large">
                {{
                  report.status === "completed"
                    ? `${report.score_a} : ${report.score_b}`
                    : "— : —"
                }}
              </div>
              <p class="text-xs mt-3 mb-0 font-semibold">
                {{ resultLabel(report) }}
              </p>
            </div>
            <div class="scoreboard-team">
              <span class="team-chip b">B</span>Đội B<span class="text-xs muted"
                >{{ report.roster.filter((p) => p.team === "B").length }} cầu
                thủ</span
              >
            </div>
          </div>
        </div>
      </section>
      <form
        v-if="editing"
        class="panel report-editor mt-6"
        @submit.prevent="save"
      >
        <div class="section-head">
          <div>
            <h2>Biên bản trận đấu</h2>
            <p class="hint">
              Chọn đội hình thực tế, ghi nhận bàn thắng rồi chốt kết quả.
            </p>
          </div>
          <button
            type="button"
            class="icon-btn"
            @click="cancelEdit"
            aria-label="Đóng chỉnh sửa"
          >
            <ClubIcon name="close" />
          </button>
        </div>
        <div v-if="saveError" class="error-state" role="alert">
          {{ saveError }}
        </div>
        <nav class="editor-jumps" aria-label="Đi đến phần biên bản">
          <a href="#report-roster">Đội hình</a
          ><a href="#report-goals">Bàn thắng</a
          ><a href="#report-result">Kết quả</a>
        </nav>
        <div class="form-row">
          <label
            ><span class="field-label">Mùa giải</span
            ><select
              v-model="draft.season_id"
              aria-label="Mùa giải"
              class="field"
            >
              <option :value="null">Chưa gắn mùa giải</option>
              <option
                v-for="s in seasons.filter(
                  (s) => !s.archived || s.id === report.season_id,
                )"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name }}
              </option>
            </select></label
          ><label
            ><span class="field-label">Trạng thái biên bản</span
            ><select v-model="draft.status" class="field">
              <option value="draft">Bản nháp / đang mở</option>
              <option value="completed">Chốt kết quả</option>
              <option value="cancelled">Hủy trận</option>
            </select></label
          >
        </div>
        <div id="report-roster" class="section-head mt-7">
          <h2>Đội hình thực tế</h2>
          <button
            type="button"
            class="btn secondary"
            @click="importAttendance"
            :disabled="!details.attendances?.length"
          >
            Nạp người đã điểm danh
          </button>
        </div>
        <p class="team-assignment-note mb-3">
          Đội cố định do admin cấu hình. Nạp điểm danh để lấy đội mặc định, rồi
          chuyển cầu thủ sang đội đối diện khi cần cân bằng quân số. Thay đổi ở
          đây chỉ áp dụng cho trận này.
        </p>
        <label class="block mb-3"
          ><span class="field-label">Tìm cầu thủ để chia đội</span
          ><input
            v-model="playerSearch"
            class="field"
            placeholder="Tên cầu thủ…"
            type="search"
        /></label>
        <div class="team-counter-row">
          <span class="team-counter"
            ><span class="team-chip">A</span
            ><strong>{{
              draft.roster.filter((p) => p.team === "A").length
            }}</strong>
            cầu thủ</span
          ><span class="team-counter"
            ><span class="team-chip b">B</span
            ><strong>{{
              draft.roster.filter((p) => p.team === "B").length
            }}</strong>
            cầu thủ</span
          >
        </div>
        <div class="editor-players">
          <label v-for="p in filteredPlayers" :key="p.id" class="editor-player"
            ><span class="min-w-0"
              ><span class="block text-sm font-medium">{{ p.name }}</span
              ><span class="block text-xs muted">{{
                p.home_team
                  ? `Đội cố định ${p.home_team}`
                  : "Chưa phân đội cố định"
              }}</span
              ><span
                v-if="
                  p.home_team &&
                  draft.roster.find((x) => x.userId === p.id)?.team &&
                  draft.roster.find((x) => x.userId === p.id).team !==
                    p.home_team
                "
                class="team-loan"
                ><ClubIcon name="swap" />Đá cho
                {{ draft.roster.find((x) => x.userId === p.id).team }} ở trận
                này</span
              ></span
            ><select
              class="field"
              :value="draft.roster.find((x) => x.userId === p.id)?.team || ''"
              @change="setTeam(p, $event.target.value)"
              :aria-label="`Đội của ${p.name}`"
            >
              <option value="">Không đá</option>
              <option value="A">Đội A</option>
              <option value="B">Đội B</option>
            </select></label
          >
        </div>
        <div id="report-goals" class="section-head mt-7">
          <div>
            <h2>Bàn thắng & kiến tạo</h2>
            <p class="hint">
              Tổng bàn: A {{ goalCounts.A }} – {{ goalCounts.B }} B. Phản lưới
              được tính cho đội đối phương.
            </p>
          </div>
          <button
            type="button"
            class="btn secondary"
            @click="addGoal"
            :disabled="!draft.roster.length"
          >
            <ClubIcon name="plus" />Thêm bàn
          </button>
        </div>
        <div v-for="(g, i) in draft.goals" :key="i" class="goal-row">
          <label
            ><span class="field-label">Người ghi bàn</span
            ><select
              v-model="g.userId"
              class="field"
              @change="g.assistUserId = null"
            >
              <option :value="null" disabled>Chọn cầu thủ</option>
              <option
                v-for="p in draft.roster"
                :key="p.userId"
                :value="p.userId"
              >
                {{ p.name }} ({{ p.team }})
              </option>
            </select></label
          ><label
            ><span class="field-label">Kiến tạo</span
            ><select
              v-model="g.assistUserId"
              class="field"
              :disabled="g.ownGoal"
            >
              <option :value="null">Không ghi nhận</option>
              <option
                v-for="p in assistsFor(g)"
                :key="p.userId"
                :value="p.userId"
              >
                {{ p.name }}
              </option>
            </select></label
          ><label
            ><span class="field-label">Phút</span
            ><input
              v-model.number="g.minute"
              type="number"
              min="0"
              max="180"
              class="field"
              placeholder="—" /></label
          ><label class="flex items-center gap-2 text-xs pb-2"
            ><input
              v-model="g.ownGoal"
              type="checkbox"
              @change="g.assistUserId = null"
            />Phản lưới</label
          ><button
            class="icon-btn"
            type="button"
            @click="draft.goals.splice(i, 1)"
            :aria-label="`Xóa bàn thắng ${i + 1}`"
          >
            <ClubIcon name="close" />
          </button>
        </div>
        <p v-if="!draft.goals.length" class="hint py-4">
          Chưa có bàn thắng. Trận hòa 0–0 có thể chốt mà không cần thêm bàn.
        </p>
        <div id="report-result" class="form-row score-inputs mt-6">
          <label
            ><span class="field-label">Tỉ số đội A</span
            ><input
              v-model.number="draft.score_a"
              class="field"
              type="number"
              min="0"
              max="200" /></label
          ><label
            ><span class="field-label">Tỉ số đội B</span
            ><input
              v-model.number="draft.score_b"
              class="field"
              type="number"
              min="0"
              max="200"
          /></label>
        </div>
        <button
          type="button"
          class="btn secondary mt-3"
          @click="
            draft.score_a = goalCounts.A;
            draft.score_b = goalCounts.B;
          "
        >
          Điền tỉ số theo bàn thắng đã ghi
        </button>
        <div class="form-row mt-6">
          <label
            ><span class="field-label">Cầu thủ xuất sắc trận (MVP)</span
            ><select v-model="draft.mvp_user_id" class="field">
              <option :value="null">Chưa chọn</option>
              <option
                v-for="p in draft.roster"
                :key="p.userId"
                :value="p.userId"
              >
                {{ p.name }} ({{ p.team }})
              </option>
            </select></label
          ><label
            ><span class="field-label"
              >Lý do chỉnh sửa
              {{ report.status === "completed" ? "(bắt buộc)" : "" }}</span
            ><input
              v-model="draft.reason"
              class="field"
              maxlength="1000"
              :required="report.status === 'completed'"
              placeholder="Ví dụ: Bổ sung người kiến tạo phút 20"
          /></label>
        </div>
        <label class="block mt-5"
          ><span class="field-label">Ghi chú trận đấu</span
          ><textarea
            v-model="draft.notes"
            class="field"
            rows="3"
            maxlength="10000"
            placeholder="Diễn biến đáng nhớ, thay đổi đội hình…"
          ></textarea>
        </label>
        <p class="hint mb-4">
          Khi chốt, tỉ số phải khớp tổng bàn thắng và mỗi đội phải có ít nhất
          một cầu thủ. Mọi thay đổi được lưu vào nhật ký.
        </p>
        <div class="report-save-bar">
          <button class="btn" :disabled="saving">
            {{
              saving
                ? "Đang lưu…"
                : draft.status === "completed"
                  ? "Lưu và chốt kết quả"
                  : "Lưu biên bản"
            }}</button
          ><button
            type="button"
            class="btn secondary"
            @click="cancelEdit"
            :disabled="saving"
          >
            Hủy chỉnh sửa
          </button>
        </div>
      </form>
      <div class="report-layout">
        <div class="stack">
          <section class="panel">
            <div class="section-head">
              <h2>Đội hình ra sân</h2>
              <span class="badge">{{ report.roster.length }} cầu thủ</span>
            </div>
            <div v-if="report.roster.length" class="roster-grid">
              <div v-for="team in ['A', 'B']" :key="team">
                <h3 class="flex items-center gap-2 text-sm font-semibold">
                  <span class="team-chip" :class="{ b: team === 'B' }">{{
                    team
                  }}</span
                  >Đội {{ team }}
                </h3>
                <div
                  v-for="p in report.roster.filter((p) => p.team === team)"
                  :key="p.userId"
                  class="person-row"
                >
                  <span
                    >{{ p.name
                    }}<span
                      v-if="p.homeTeam && p.homeTeam !== p.team"
                      class="team-loan block"
                      >Đội cố định {{ p.homeTeam }} · Đá cho {{ p.team }} trận
                      này</span
                    ></span
                  ><span class="flex gap-1"
                    ><span
                      v-if="report.mvp_user_id === p.userId"
                      class="badge green"
                      >MVP</span
                    ><span v-if="goalsFor(p.userId)" class="badge"
                      >{{ goalsFor(p.userId) }} bàn</span
                    ></span
                  >
                </div>
              </div>
            </div>
            <p v-else class="muted text-sm">
              {{
                isAdmin
                  ? "Chọn “Lập biên bản” để ghi nhận cầu thủ thực tế của hai đội."
                  : "Quản trị viên chưa ghi nhận đội hình trận này."
              }}
            </p>
            <p class="hint">
              Tên cầu thủ được lưu tại lần đầu ghi nhận vào biên bản trận này.
            </p>
          </section>
          <section class="panel">
            <div class="section-head">
              <h2>Diễn biến bàn thắng</h2>
              <span class="badge">{{ report.goals.length }} bàn</span>
            </div>
            <div v-for="(g, i) in sortedGoals" :key="i" class="person-row">
              <span class="flex items-center gap-3"
                ><span class="badge">{{
                  g.minute == null ? "—" : `${g.minute}′`
                }}</span
                ><span
                  ><strong>{{ playerName(g.userId) }}</strong
                  ><span class="block text-xs muted"
                    >Đội
                    {{ report.roster.find((p) => p.userId === g.userId)?.team
                    }}{{ g.ownGoal ? " · Phản lưới nhà" : ""
                    }}{{
                      g.assistUserId
                        ? ` · Kiến tạo: ${playerName(g.assistUserId)}`
                        : ""
                    }}</span
                  ></span
                ></span
              ><ClubIcon name="check" />
            </div>
            <p v-if="!report.goals.length" class="muted text-sm mb-0">
              Chưa ghi nhận bàn thắng.
            </p>
          </section>
          <section v-if="report.notes" class="panel">
            <h2 class="text-lg font-bold mb-3">Ghi chú sau trận</h2>
            <p class="whitespace-pre-line text-sm mb-0">{{ report.notes }}</p>
          </section>
        </div>
        <aside class="stack">
          <section class="panel">
            <div class="section-head">
              <h2>Điểm danh tại sân</h2>
              <span class="badge green"
                >{{ details.attendances?.length || 0 }} người</span
              >
            </div>
            <div
              v-for="a in details.attendances"
              :key="a.id"
              class="person-row"
            >
              <span
                ><strong>{{ a.user.name }}</strong
                ><span class="block text-xs muted">{{
                  formatVietnamDateTime(a.created_at)
                }}</span
                ><span class="block text-xs muted"
                  >{{ a.distance }}m từ sân{{
                    a.delay_seconds > 0
                      ? ` · Muộn ${Math.floor(a.delay_seconds / 60)} phút ${a.delay_seconds % 60} giây`
                      : ""
                  }}</span
                ></span
              ><span
                class="badge"
                :class="a.status === 'Đúng giờ' ? 'green' : 'red'"
                >{{ a.status }}</span
              >
            </div>
            <p v-if="!details.attendances?.length" class="muted text-sm">
              Chưa có lượt điểm danh GPS.
            </p>
            <details class="mt-5">
              <summary class="text-sm cursor-pointer font-semibold">
                Thành viên chưa có điểm danh ({{
                  details.absentUsers?.length || 0
                }})
              </summary>
              <p class="hint">{{ details.absenceNote }}</p>
              <p class="text-xs muted mt-3">
                {{
                  details.absentUsers?.map((p) => p.name).join(", ") ||
                  "Không có."
                }}
              </p>
            </details>
          </section>
          <section class="panel">
            <h2 class="text-base font-bold mb-3">Thông tin buổi đá</h2>
            <dl class="text-xs space-y-4">
              <div>
                <dt class="muted">Khóa điểm danh</dt>
                <dd class="mt-1 font-medium">
                  {{ formatVietnamDateTime(match.lock_time) }}
                </dd>
              </div>
              <div>
                <dt class="muted">Kết thúc buổi đá</dt>
                <dd class="mt-1 font-medium">
                  {{ formatVietnamDateTime(match.end_time) }}
                </dd>
              </div>
              <div v-if="report.updated_at">
                <dt class="muted">Biên bản cập nhật</dt>
                <dd class="mt-1 font-medium">
                  {{ formatVietnamDateTime(report.updated_at) }} · Lần
                  {{ report.revision }}
                </dd>
              </div>
            </dl>
            <a
              v-if="match.map_link"
              :href="match.map_link"
              target="_blank"
              rel="noopener noreferrer"
              class="btn secondary w-full mt-5"
              ><ClubIcon name="pin" />Mở bản đồ sân</a
            >
          </section>
        </aside>
      </div>
      <section v-if="isAdmin" class="panel mt-6">
        <div class="section-head">
          <div>
            <h2>Nhật ký thay đổi</h2>
            <p class="hint">
              Người thực hiện, thời gian, lý do và dữ liệu trước/sau của lịch
              trận và biên bản.
            </p>
          </div>
          <span class="badge">{{ audit.length }} lần ghi nhận</span>
        </div>
        <div v-for="a in audit" :key="a.id" class="audit-entry">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <strong class="text-sm"
              >{{ a.actor_name }} · {{ actionLabel(a.action) }}</strong
            ><span class="text-xs muted">{{
              formatVietnamDateTime(a.created_at)
            }}</span>
          </div>
          <p v-if="a.reason" class="hint">Lý do: {{ a.reason }}</p>
          <details class="mt-3">
            <summary>Xem dữ liệu đã lưu</summary>
            <div class="form-row mt-3">
              <div>
                <p class="field-label">Trước thay đổi</p>
                <pre>{{ JSON.stringify(a.before, null, 2) }}</pre>
              </div>
              <div>
                <p class="field-label">Sau thay đổi</p>
                <pre>{{ JSON.stringify(a.after, null, 2) }}</pre>
              </div>
            </div>
          </details>
        </div>
        <p v-if="!audit.length" class="hint">
          Các thay đổi từ phiên bản mới sẽ xuất hiện tại đây. Dữ liệu cũ chưa có
          nhật ký chỉnh sửa.
        </p>
      </section>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import api from "../api";
import MatchFacts from "../components/football/MatchFacts.vue";
import ClubIcon from "../components/ClubIcon.vue";
import { useToast } from "../composables/useToast";
import { useDialog } from "../composables/useDialog";
import { formatVietnamDateTime } from "../utils/datetime";
import { matchStatus, resultLabel, downloadCsv } from "../utils/football";
const route = useRoute(),
  { addToast } = useToast(),
  { openConfirm } = useDialog(),
  isAdmin =
    JSON.parse(localStorage.getItem("fcdbb_user") || "{}").role === "admin";
const match = ref(null),
  report = ref({ roster: [], goals: [] }),
  details = ref({}),
  seasons = ref([]),
  users = ref([]),
  audit = ref([]),
  loading = ref(true),
  loadError = ref(""),
  editing = ref(false),
  draft = ref({ roster: [], goals: [] }),
  playerSearch = ref(""),
  saving = ref(false),
  saveError = ref("");
const load = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const id = route.params.id;
    const [r, d, s, ...extra] = await Promise.all([
      api.get(`/matches/${id}/report`),
      api.get(`/matches/${id}/details`),
      api.get("/seasons"),
      ...(isAdmin ? [api.get("/users"), api.get(`/matches/${id}/audit`)] : []),
    ]);
    match.value = r.data.match;
    report.value = r.data.report;
    details.value = d.data;
    seasons.value = s.data;
    if (isAdmin) {
      users.value = extra[0].data;
      audit.value = extra[1].data;
    }
  } catch (e) {
    loadError.value =
      e.response?.data?.message || "Không tải được biên bản. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
};
watch(() => route.params.id, load, { immediate: true });
const availablePlayers = computed(() => [
  ...users.value,
  ...report.value.roster
    .filter((p) => !users.value.some((u) => u.id === p.userId))
    .map((p) => ({ id: p.userId, name: p.name, home_team: p.homeTeam })),
]);
const filteredPlayers = computed(() =>
  availablePlayers.value.filter((p) =>
    p.name
      .toLocaleLowerCase("vi")
      .includes(playerSearch.value.toLocaleLowerCase("vi")),
  ),
);
const beginEdit = () => {
  draft.value = JSON.parse(JSON.stringify({ ...report.value, reason: "" }));
  playerSearch.value = "";
  saveError.value = "";
  editing.value = true;
  if (!draft.value.roster.length) importAttendance();
};
const dirty = computed(
  () =>
    editing.value &&
    JSON.stringify({ ...draft.value, reason: undefined, season: undefined }) !==
      JSON.stringify({ ...report.value, reason: undefined, season: undefined }),
);
const confirmDiscard = () =>
  !dirty.value ||
  openConfirm("Các thay đổi chưa lưu sẽ bị bỏ. Tiếp tục?", {
    title: "Bỏ chỉnh sửa?",
    confirmText: "Bỏ thay đổi",
  });
const cancelEdit = async () => {
  if (await confirmDiscard()) editing.value = false;
};
onBeforeRouteLeave(confirmDiscard);
const setTeam = (p, team) => {
  const old = draft.value.roster.find((x) => x.userId === p.id);
  draft.value.roster = draft.value.roster.filter((x) => x.userId !== p.id);
  if (team)
    draft.value.roster.push({
      userId: p.id,
      name: old?.name || p.name,
      team,
      homeTeam: old?.homeTeam ?? p.home_team ?? null,
    });
  draft.value.goals = draft.value.goals
    .filter((g) => team || g.userId !== p.id)
    .map((g) => ({
      ...g,
      assistUserId: g.assistUserId === p.id ? null : g.assistUserId,
    }));
  if (!team && draft.value.mvp_user_id === p.id) draft.value.mvp_user_id = null;
  draft.value.goals.forEach((g) => {
    if (!assistsFor(g).some((p) => p.userId === g.assistUserId))
      g.assistUserId = null;
  });
};
const importAttendance = () => {
  let missing = 0;
  (details.value.attendances || []).forEach((a) => {
    if (draft.value.roster.some((p) => p.userId === a.user.id)) return;
    if (a.user.home_team) setTeam(a.user, a.user.home_team);
    else missing++;
  });
  if (missing)
    addToast(
      `${missing} cầu thủ chưa có đội cố định. Chọn đội trận thủ công hoặc phân đội trong Quản trị.`,
      "warning",
    );
};
const addGoal = () => {
  draft.value.goals.push({
    userId: draft.value.roster[0]?.userId ?? null,
    assistUserId: null,
    minute: null,
    ownGoal: false,
  });
};
const assistsFor = (g) =>
  draft.value.roster.filter(
    (p) =>
      p.userId !== g.userId &&
      p.team === draft.value.roster.find((s) => s.userId === g.userId)?.team,
  );
const goalCounts = computed(() => {
  const counts = { A: 0, B: 0 };
  draft.value.goals.forEach((g) => {
    const team = draft.value.roster.find((p) => p.userId === g.userId)?.team;
    if (team) counts[g.ownGoal ? (team === "A" ? "B" : "A") : team]++;
  });
  return counts;
});
const save = async () => {
  saving.value = true;
  saveError.value = "";
  try {
    await api.put(`/matches/${match.value.id}/report`, {
      ...draft.value,
      goals: draft.value.goals.map((g) => ({
        ...g,
        minute: g.minute === "" ? null : g.minute,
      })),
      score_a: draft.value.score_a === "" ? null : draft.value.score_a,
      score_b: draft.value.score_b === "" ? null : draft.value.score_b,
    });
    editing.value = false;
    addToast("Đã lưu biên bản trận đấu.", "success");
    await load();
  } catch (e) {
    saveError.value =
      e.response?.data?.message ||
      "Không lưu được biên bản. Kiểm tra kết nối và thử lại.";
  } finally {
    saving.value = false;
  }
};
const playerName = (id) =>
  report.value.roster.find((p) => p.userId === id)?.name || `Cầu thủ #${id}`;
const goalsFor = (id) =>
  report.value.goals.filter((g) => g.userId === id && !g.ownGoal).length;
const sortedGoals = computed(() =>
  [...report.value.goals].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999)),
);
const actionLabel = (a) =>
  ({
    "report.saved": "Lưu biên bản",
    "match.created": "Tạo lịch trận",
    "match.updated": "Sửa lịch trận",
    "match.deleted": "Xóa lịch trận",
  })[a] || a;
const exportReport = () =>
  downloadCsv(`fcdbb-tran-${match.value.id}.csv`, [
    ["Trận đấu", match.value.title],
    ["Thời gian", formatVietnamDateTime(match.value.start_time)],
    ["Sân", match.value.location_name],
    ["Mùa giải", report.value.season?.name || "Chưa gắn"],
    ["Trạng thái", matchStatus({ ...match.value, report: report.value })],
    [
      "Kết quả",
      report.value.status === "completed"
        ? `${report.value.score_a} - ${report.value.score_b}`
        : "Chưa chốt",
    ],
    [],
    ["Đội hình", "Đội cố định khi ghi nhận", "Đội trận", "Bàn", "MVP"],
    ...report.value.roster.map((p) => [
      p.name,
      p.homeTeam || "Chưa ghi nhận",
      p.team,
      goalsFor(p.userId),
      report.value.mvp_user_id === p.userId ? "Có" : "",
    ]),
    [],
    ["Người ghi bàn", "Phút", "Kiến tạo", "Phản lưới"],
    ...sortedGoals.value.map((g) => [
      playerName(g.userId),
      g.minute,
      g.assistUserId ? playerName(g.assistUserId) : "",
      g.ownGoal ? "Có" : "",
    ]),
    [],
    ["Điểm danh", "Thời gian", "Trạng thái", "Muộn (giây)", "Khoảng cách (m)"],
    ...(details.value.attendances || []).map((a) => [
      a.user.name,
      formatVietnamDateTime(a.created_at),
      a.status,
      a.delay_seconds,
      a.distance,
    ]),
    [],
    ["Ghi chú", report.value.notes],
  ]);
</script>
