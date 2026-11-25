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
          <a v-if="isAdmin" href="#match-attendance" class="btn secondary">
            <ClubIcon name="pin" />Điểm danh
          </a>
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
                  displayedScore
                    ? `${displayedScore.score_a} : ${displayedScore.score_b}`
                    : "— : —"
                }}
              </div>
              <p class="text-xs mt-3 mb-0 font-semibold">
                {{
                  editing && displayedScore === draft
                    ? "Tỉ số đang nhập"
                    : resultLabel(report)
                }}
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
              Có thể chốt tỉ số trước rồi bổ sung đội hình, bàn thắng và kiến
              tạo sau.
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
            ><select
              v-model="draft.status"
              class="field"
              @change="statusChosen = true"
            >
              <option value="draft">Bản nháp / đang mở</option>
              <option value="completed">Chốt kết quả</option>
              <option value="cancelled">Hủy trận</option>
            </select></label
          >
        </div>
        <div id="report-roster" class="section-head mt-7">
          <h2>Đội hình thực tế</h2>
          <div class="roster-actions">
            <button
              type="button"
              class="btn secondary"
              @click="importAttendance"
              :disabled="!details.attendances?.length"
            >
              Nạp người đã điểm danh
            </button>
            <button
              ref="addPlayerButton"
              type="button"
              class="btn secondary"
              :aria-expanded="showPlayerPicker"
              aria-controls="extra-match-players"
              @click="togglePlayerPicker"
            >
              <ClubIcon name="plus" />Thêm cầu thủ
            </button>
          </div>
        </div>
        <p class="team-assignment-note mb-3">
          Mặc định chỉ hiện cầu thủ đã điểm danh và những người đã được thêm vào
          biên bản. Đội cố định được dùng để nạp điểm danh; đổi đội ở đây chỉ áp
          dụng cho trận này. Muốn bổ sung người chưa điểm danh, chọn “Thêm cầu
          thủ”.
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
                class="badge mt-1"
                :class="attendeeIds.has(p.id) ? 'green' : 'blue'"
                >{{
                  attendeeIds.has(p.id)
                    ? "Đã điểm danh"
                    : "Bổ sung ngoài điểm danh"
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
        <p v-if="!filteredPlayers.length" class="empty-state !py-6 mt-3">
          {{
            playerSearch
              ? "Không tìm thấy cầu thủ trong danh sách trận."
              : "Chưa có cầu thủ điểm danh trong trận này. Chọn “Thêm cầu thủ” để bổ sung người tham gia."
          }}
        </p>
        <section
          v-if="showPlayerPicker"
          id="extra-match-players"
          ref="playerPicker"
          class="extra-player-picker"
          tabindex="-1"
          aria-label="Thêm cầu thủ chưa điểm danh"
          @keydown.esc.stop.prevent="closePlayerPicker"
        >
          <div class="section-head">
            <div>
              <h3>Cầu thủ chưa điểm danh</h3>
              <p class="hint">
                Chọn đội A hoặc B để thêm riêng vào trận này. Thao tác này không
                tạo lượt điểm danh và không đổi đội cố định.
              </p>
            </div>
            <button
              type="button"
              class="icon-btn"
              aria-label="Đóng danh sách bổ sung"
              @click="closePlayerPicker"
            >
              <ClubIcon name="close" />
            </button>
          </div>
          <label class="block mb-3"
            ><span class="field-label">Tìm cầu thủ chưa điểm danh</span
            ><input
              v-model="extraPlayerSearch"
              type="search"
              class="field"
              placeholder="Tên cầu thủ cần bổ sung…"
          /></label>
          <div class="extra-player-list">
            <div
              v-for="p in extraCandidates"
              :key="p.id"
              class="extra-player-row"
            >
              <div class="min-w-0">
                <strong>{{ p.name }}</strong
                ><span class="block text-xs muted">{{
                  p.home_team
                    ? `Đội cố định ${p.home_team}`
                    : "Chưa phân đội cố định"
                }}</span>
              </div>
              <div class="extra-team-actions">
                <button
                  type="button"
                  class="btn secondary"
                  :aria-label="`Thêm ${p.name} vào đội A`"
                  @click="addExtraPlayer(p, 'A')"
                >
                  Đội A</button
                ><button
                  type="button"
                  class="btn secondary"
                  :aria-label="`Thêm ${p.name} vào đội B`"
                  @click="addExtraPlayer(p, 'B')"
                >
                  Đội B
                </button>
              </div>
            </div>
          </div>
          <p v-if="!extraCandidates.length" class="hint py-4">
            {{
              extraPlayerSearch
                ? "Không tìm thấy cầu thủ phù hợp."
                : "Không còn cầu thủ chưa điểm danh để bổ sung."
            }}
          </p>
        </section>
        <div id="report-goals" class="section-head mt-7">
          <div>
            <h2>Bàn thắng & kiến tạo</h2>
            <p class="hint">
              Đã ghi chi tiết {{ goalCounts.A }} bàn đội A và
              {{ goalCounts.B }} bàn đội B.
            </p>
          </div>
          <button
            type="button"
            ref="addGoalButton"
            class="btn secondary"
            @click="addGoal"
            :disabled="!draft.roster.length || draft.goals.length >= 200"
          >
            <ClubIcon name="plus" />Thêm bàn
          </button>
        </div>
        <div
          v-if="activeGoal"
          ref="goalEditor"
          :key="activeGoalIndex"
          class="goal-editor"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 class="text-sm font-bold">Bàn {{ activeGoalIndex + 1 }}</h3>
            <button
              class="icon-btn"
              type="button"
              @click="removeGoal(activeGoalIndex)"
              :aria-label="`Xóa bàn thắng ${activeGoalIndex + 1}`"
            >
              <ClubIcon name="close" />
            </button>
          </div>
          <div class="form-row">
            <GoalPlayerField
              ref="goalScorerField"
              :model-value="activeGoal.userId"
              label="Người ghi bàn"
              placeholder="Chọn cầu thủ"
              :players="goalPlayers"
              @update:model-value="setGoalScorer"
            />
            <GoalPlayerField
              v-model="activeGoal.assistUserId"
              label="Kiến tạo"
              placeholder="Không ghi nhận"
              :players="assistsFor(activeGoal)"
              :disabled="!activeGoal.userId || activeGoal.ownGoal"
            />
          </div>
          <details class="mt-3">
            <summary class="text-sm cursor-pointer">
              Phút ghi bàn và phản lưới
            </summary>
            <div class="form-row mt-3">
              <label
                ><span class="field-label">Phút</span
                ><input
                  v-model.number="activeGoal.minute"
                  type="number"
                  min="0"
                  max="180"
                  class="field"
                  placeholder="—" /></label
              ><label class="flex items-center gap-2 text-xs"
                ><input
                  v-model="activeGoal.ownGoal"
                  type="checkbox"
                  @change="activeGoal.assistUserId = null"
                />Phản lưới</label
              >
            </div>
          </details>
          <p v-if="goalError" class="error-state mt-3" role="alert">
            {{ goalError }}
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              class="btn"
              :disabled="draft.goals.length >= 200"
              @click="addGoal"
            >
              <ClubIcon name="plus" />Thêm bàn tiếp
            </button>
            <button type="button" class="btn secondary" @click="finishGoal">
              Thu gọn bàn
            </button>
          </div>
        </div>
        <div v-for="(g, i) in draft.goals" :key="i">
          <button
            v-if="i !== activeGoalIndex"
            type="button"
            class="goal-summary"
            @click="completeActiveGoal() && openGoal(i)"
          >
            <span>
              <strong>Bàn {{ i + 1 }} · {{ goalPlayerName(g.userId) }}</strong>
              <span
                v-if="
                  g.ownGoal ||
                  g.assistUserId ||
                  (g.minute != null && g.minute !== '')
                "
                class="block muted text-xs"
              >
                {{
                  [
                    g.ownGoal ? "Phản lưới" : "",
                    g.assistUserId
                      ? `Kiến tạo · ${goalPlayerName(g.assistUserId)}`
                      : "",
                    g.minute != null && g.minute !== ""
                      ? `Phút ${g.minute}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                }}
              </span>
            </span>
            <span class="sr-only">Chỉnh sửa</span><ClubIcon name="edit" />
          </button>
        </div>
        <p v-if="!draft.roster.length" class="hint py-4">
          Thêm cầu thủ vào đội hình để ghi chi tiết bàn thắng.
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
          Nhập tỉ số cả hai đội để chốt kết quả, kể cả 0–0. Số bàn đã ghi chi
          tiết của mỗi đội tối đa bằng tỉ số đã nhập.
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
          <section id="match-attendance" class="panel">
            <div class="section-head">
              <h2>Điểm danh</h2>
              <span class="badge green"
                >{{ details.attendances?.length || 0 }} người</span
              >
            </div>
            <div
              v-if="isAdmin && report.status !== 'cancelled'"
              class="flex flex-wrap gap-2 mb-3"
            >
              <button
                v-if="!attendeeIds.has(currentUser.id)"
                class="btn secondary"
                :disabled="checking"
                @click="checkin(match.id, refreshAttendance)"
              >
                <ClubIcon name="pin" />{{
                  checking ? "Đang lấy vị trí…" : "Điểm danh GPS"
                }}
              </button>
              <button
                v-if="manualCandidates.length"
                type="button"
                class="btn secondary"
                aria-haspopup="dialog"
                :disabled="refreshingManualAttendance"
                @click="attendanceDialog?.open()"
              >
                <ClubIcon name="plus" />Bổ sung điểm danh
              </button>
            </div>
            <ManualAttendanceDialog
              v-if="isAdmin && report.status !== 'cancelled'"
              ref="attendanceDialog"
              :match="match"
              :players="manualCandidates"
              @saved="manualAttendanceSaved"
            />
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
                  >{{
                    a.source === "manual"
                      ? "Admin bổ sung"
                      : `Cách sân ${formatFieldDistance(a.distance)}`
                  }}{{
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
              Chưa có lượt điểm danh.
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
              trận, điểm danh và biên bản.
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
import { ref, computed, watch, nextTick } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import api from "../api";
import MatchFacts from "../components/football/MatchFacts.vue";
import GoalPlayerField from "../components/football/GoalPlayerField.vue";
import ClubIcon from "../components/ClubIcon.vue";
import ManualAttendanceDialog from "../components/football/ManualAttendanceDialog.vue";
import { useToast } from "../composables/useToast";
import { useCheckin } from "../composables/useCheckin";
import { useDialog } from "../composables/useDialog";
import { formatVietnamDateTime } from "../utils/datetime";
import {
  matchStatus,
  resultLabel,
  downloadCsv,
  formatFieldDistance,
} from "../utils/football";
const route = useRoute(),
  { addToast } = useToast(),
  { openConfirm } = useDialog(),
  currentUser = JSON.parse(localStorage.getItem("fcdbb_user") || "{}"),
  isAdmin = currentUser.role === "admin";
const { checking, checkin } = useCheckin();
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
  extraPlayerSearch = ref(""),
  showPlayerPicker = ref(false),
  addPlayerButton = ref(null),
  playerPicker = ref(null),
  saving = ref(false),
  saveError = ref(""),
  statusChosen = ref(false),
  activeGoalIndex = ref(null),
  goalError = ref(""),
  goalEditor = ref(null),
  goalScorerField = ref(null),
  addGoalButton = ref(null),
  attendanceDialog = ref(null),
  refreshingManualAttendance = ref(false);
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
const attendeeIds = computed(
  () => new Set((details.value.attendances || []).map((a) => a.user.id)),
);
const manualCandidates = computed(() =>
  users.value.filter(
    (p) => p.id !== currentUser.id && !attendeeIds.value.has(p.id),
  ),
);
const refreshAttendance = async () => {
  const id = match.value.id;
  const [d, a] = await Promise.all([
    api.get(`/matches/${id}/details`),
    api.get(`/matches/${id}/audit`),
  ]);
  if (Number(route.params.id) !== id) return;
  details.value = d.data;
  audit.value = a.data;
};
const manualAttendanceSaved = async (matchId) => {
  if (Number(route.params.id) !== matchId) return;
  refreshingManualAttendance.value = true;
  addToast("Đã bổ sung điểm danh.", "success");
  try {
    await refreshAttendance();
  } catch (e) {
    addToast(
      e.response?.data?.message || "Không tải lại được danh sách điểm danh.",
      "error",
    );
  } finally {
    refreshingManualAttendance.value = false;
  }
};

const availablePlayers = computed(() => {
  const byId = new Map(users.value.map((p) => [p.id, p]));
  for (const a of details.value.attendances || []) {
    if (!byId.has(a.user.id)) byId.set(a.user.id, a.user);
  }
  for (const p of report.value.roster) {
    if (!byId.has(p.userId))
      byId.set(p.userId, { id: p.userId, name: p.name, home_team: p.homeTeam });
  }
  return [...byId.values()];
});
const matchPlayers = computed(() =>
  availablePlayers.value
    .filter(
      (p) =>
        attendeeIds.value.has(p.id) ||
        draft.value.roster.some((entry) => entry.userId === p.id),
    )
    .map((p) => ({
      ...p,
      name:
        draft.value.roster.find((entry) => entry.userId === p.id)?.name ||
        p.name,
    })),
);
const matchesPlayerSearch = (name, query) =>
  name.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"));
const filteredPlayers = computed(() =>
  matchPlayers.value.filter((p) =>
    matchesPlayerSearch(p.name, playerSearch.value),
  ),
);
const extraCandidates = computed(() =>
  availablePlayers.value.filter(
    (p) =>
      !attendeeIds.value.has(p.id) &&
      !draft.value.roster.some((entry) => entry.userId === p.id) &&
      matchesPlayerSearch(p.name, extraPlayerSearch.value),
  ),
);
const closePlayerPicker = async () => {
  showPlayerPicker.value = false;
  extraPlayerSearch.value = "";
  await nextTick();
  addPlayerButton.value?.focus();
};
const togglePlayerPicker = async () => {
  if (showPlayerPicker.value) return closePlayerPicker();
  showPlayerPicker.value = true;
  extraPlayerSearch.value = "";
  await nextTick();
  playerPicker.value?.focus({ preventScroll: true });
  playerPicker.value?.scrollIntoView({ block: "start", behavior: "auto" });
};
const addExtraPlayer = (p, team) => {
  playerSearch.value = "";
  setTeam(p, team);
  closePlayerPicker();
};
const beginEdit = () => {
  draft.value = JSON.parse(JSON.stringify({ ...report.value, reason: "" }));
  playerSearch.value = "";
  extraPlayerSearch.value = "";
  showPlayerPicker.value = false;
  saveError.value = "";
  statusChosen.value = false;
  activeGoalIndex.value = null;
  goalError.value = "";
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
  const currentGoal = activeGoal.value;
  if (!team) {
    draft.value.goals = draft.value.goals.filter((g) => g.userId !== p.id);
    const index = draft.value.goals.indexOf(currentGoal);
    activeGoalIndex.value = index < 0 ? null : index;
  }
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
const validScore = (value) =>
  Number.isInteger(value) && value >= 0 && value <= 200;
const hasScore = (entry) =>
  validScore(entry.score_a) && validScore(entry.score_b);
const displayedScore = computed(() =>
  editing.value && hasScore(draft.value) && draft.value.status !== "cancelled"
    ? draft.value
    : report.value.status === "completed"
      ? report.value
      : null,
);
watch(
  [() => draft.value.score_a, () => draft.value.score_b],
  () => {
    if (!editing.value || statusChosen.value || report.value.status !== "draft")
      return;
    if (Date.now() >= new Date(match.value.start_time).getTime())
      draft.value.status = hasScore(draft.value) ? "completed" : "draft";
  },
  { flush: "sync" },
);
const activeGoal = computed(() => draft.value.goals[activeGoalIndex.value]);
const goalPlayers = computed(() => {
  const numbers = new Map(users.value.map((p) => [p.id, p.jersey_number]));
  return draft.value.roster.map((p) => ({
    ...p,
    jersey_number: numbers.get(p.userId) ?? null,
  }));
});
const goalPlayerName = (id) =>
  goalPlayers.value.find((p) => p.userId === id)?.name || "Chưa chọn cầu thủ";
const setGoalScorer = (id) => {
  if (activeGoal.value.userId !== id) activeGoal.value.assistUserId = null;
  activeGoal.value.userId = id;
  goalError.value = "";
};
const openGoal = async (index) => {
  activeGoalIndex.value = index;
  goalError.value = "";
  await nextTick();
  goalEditor.value?.scrollIntoView({ block: "nearest" });
  goalScorerField.value?.focus();
};
const completeActiveGoal = () => {
  if (activeGoal.value && !activeGoal.value.userId) {
    goalError.value = "Chọn người ghi bàn trước khi tiếp tục.";
    goalScorerField.value?.focus();
    return false;
  }
  return true;
};
const finishGoal = async () => {
  if (!completeActiveGoal()) return;
  activeGoalIndex.value = null;
  await nextTick();
  addGoalButton.value?.focus();
};
const addGoal = () => {
  if (!completeActiveGoal()) return;
  draft.value.goals.push({
    userId: null,
    assistUserId: null,
    minute: null,
    ownGoal: false,
  });
  openGoal(draft.value.goals.length - 1);
};
const removeGoal = (index) => {
  activeGoalIndex.value = null;
  draft.value.goals.splice(index, 1);
  finishGoal();
};
const assistsFor = (g) =>
  goalPlayers.value.filter(
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
  const incomplete = draft.value.goals.findIndex((g) => !g.userId);
  if (incomplete >= 0) {
    await openGoal(incomplete);
    completeActiveGoal();
    return;
  }
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
    "attendance.added": "Bổ sung điểm danh",
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
    [
      "Điểm danh",
      "Thời gian",
      "Trạng thái",
      "Muộn (giây)",
      "Khoảng cách (m)",
      "Hình thức",
    ],
    ...(details.value.attendances || []).map((a) => [
      a.user.name,
      formatVietnamDateTime(a.created_at),
      a.status,
      a.delay_seconds,
      a.distance,
      a.source === "manual" ? "Admin bổ sung" : "GPS",
    ]),
    [],
    ["Ghi chú", report.value.notes],
  ]);
</script>
