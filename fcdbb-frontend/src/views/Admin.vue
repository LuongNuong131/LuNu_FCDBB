<template>
  <div>
    <div class="page-top">
      <div>
        <h1 class="page-heading">Không gian quản trị.</h1>
        <p class="page-intro">
          Sắp lịch buổi đá, quản lý thành viên và lưu lại hành trình của đội.
        </p>
      </div>
      <router-link to="/matches" class="btn secondary"
        ><ClubIcon name="trophy" />Mùa giải & biên bản</router-link
      >
    </div>
    <div class="admin-tabs" role="group" aria-label="Khu vực quản trị">
      <button
        class="btn"
        :class="{ secondary: tab !== 'matches' }"
        :aria-pressed="tab === 'matches'"
        @click="tab = 'matches'"
      >
        <ClubIcon name="calendar" />Lịch trận</button
      ><button
        class="btn"
        :class="{ secondary: tab !== 'users' }"
        :aria-pressed="tab === 'users'"
        @click="tab = 'users'"
      >
        <ClubIcon name="users" />Thành viên
      </button>
    </div>
    <div v-if="error" class="error-state" role="alert">{{ error }}</div>
    <div
      v-if="tab === 'matches'"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"
    >
      <section class="panel h-fit admin-match-form">
        <button
          type="button"
          class="disclosure-heading"
          :aria-expanded="matchFormOpen"
          aria-controls="schedule-form"
          @click="matchFormOpen = !matchFormOpen"
        >
          <span
            ><ClubIcon name="plus" /><span>{{
              match.id ? "Sửa lịch trận" : "Thêm lịch trận"
            }}</span></span
          ><ClubIcon name="chevron" :class="{ 'rotate-180': matchFormOpen }" />
        </button>
        <div
          id="schedule-form"
          class="admin-form-body"
          :class="{ 'is-open': matchFormOpen }"
        >
          <form @submit.prevent="saveMatch" class="stack">
            <label v-if="locations.length"
              ><span class="field-label">Dùng lại sân quen</span
              ><select @change="applyLocation" class="field">
                <option value="">Chọn sân từ lịch sử</option>
                <option v-for="(l, i) in locations" :key="i" :value="i">
                  {{ l.location_name }}
                </option>
              </select></label
            >
            <label
              ><span class="field-label">Tên trận</span
              ><input
                v-model="match.title"
                class="field"
                required
                maxlength="200"
                placeholder="Ví dụ: Nội bộ A/B thứ bảy"
            /></label>
            <label
              ><span class="field-label">Tên sân</span
              ><input
                v-model="match.location_name"
                class="field"
                required
                maxlength="200"
                placeholder="Tên sân bóng"
            /></label>
            <div>
              <div class="section-head mb-2">
                <span class="field-label mb-0">Vị trí sân để điểm danh GPS</span
                ><button
                  type="button"
                  class="btn secondary"
                  @click="getGPS"
                  :disabled="locating"
                >
                  <ClubIcon name="pin" />{{
                    locating ? "Đang lấy…" : "Lấy vị trí"
                  }}
                </button>
              </div>
              <div class="form-row">
                <label
                  ><span class="field-label">Vĩ độ</span
                  ><input
                    v-model.number="match.lat"
                    class="field"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    required /></label
                ><label
                  ><span class="field-label">Kinh độ</span
                  ><input
                    v-model.number="match.lng"
                    class="field"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    required
                /></label>
              </div>
            </div>
            <DateTimeField
              v-model="match.start_time"
              id="match-start"
              label="Bắt đầu trận (giờ Việt Nam)"
            />
            <DateTimeField
              v-model="match.lock_time"
              id="match-lock"
              label="Mốc tính đi muộn (giờ Việt Nam)"
              tone="amber"
            />
            <DateTimeField
              v-model="match.end_time"
              id="match-end"
              label="Kết thúc buổi đá (giờ Việt Nam)"
              tone="rose"
            />
            <label
              ><span class="field-label">Bản đồ sân (tùy chọn)</span
              ><input
                v-model="match.map_link"
                class="field"
                type="url"
                placeholder="https://maps.google.com/…"
            /></label>
            <p class="hint">
              Có thể nhập trận đã qua để bổ sung lịch sử. Thứ tự: bắt đầu, mốc
              tính muộn, kết thúc.
            </p>
            <div class="flex gap-3">
              <button class="btn" :disabled="saving">
                {{
                  saving
                    ? "Đang lưu…"
                    : match.id
                      ? "Lưu lịch trận"
                      : "Tạo lịch trận"
                }}</button
              ><button
                v-if="match.id"
                type="button"
                class="btn secondary"
                @click="resetMatch"
              >
                Hủy sửa
              </button>
            </div>
          </form>
        </div>
      </section>
      <section class="panel admin-match-list">
        <div class="section-head">
          <h2>Lịch trận & hồ sơ tham gia</h2>
          <span class="badge">{{ allMatches.length }} trận</span>
        </div>
        <label
          ><span class="field-label">Tìm trận</span
          ><input
            v-model="matchSearch"
            class="field"
            type="search"
            placeholder="Tên trận hoặc sân…"
        /></label>
        <div class="admin-fixtures mt-4">
          <article
            v-for="m in filteredMatches"
            :key="m.id"
            class="border-b border-slate-200 py-5"
          >
            <div class="flex justify-between items-start gap-3">
              <div>
                <h3 class="font-semibold text-base mb-1">{{ m.title }}</h3>
                <p class="text-xs muted mb-1">
                  {{ formatVietnamDateTime(m.start_time) }}
                </p>
                <p class="text-xs muted mb-0">{{ m.location_name }}</p>
              </div>
              <span
                class="badge"
                :class="new Date(m.end_time) > new Date() ? 'blue' : ''"
                >{{
                  new Date(m.end_time) > new Date() ? "Đang mở" : "Đã qua"
                }}</span
              >
            </div>
            <div class="flex flex-wrap gap-2 mt-4">
              <router-link :to="`/matches/${m.id}`" class="btn"
                ><ClubIcon name="users" />Chi tiết & biên bản</router-link
              ><button class="btn secondary" @click="editMatch(m)">
                Sửa lịch</button
              ><button
                v-if="
                  new Date(m.end_time) > new Date() &&
                  new Date(m.lock_time) < new Date()
                "
                class="btn secondary"
                @click="closeMatch(m)"
                :disabled="saving"
              >
                Đóng điểm danh</button
              ><button
                class="btn danger"
                @click="deleteMatch(m)"
                :disabled="saving"
              >
                Xóa lịch
              </button>
            </div>
          </article>
          <p v-if="!filteredMatches.length" class="hint py-8">
            Chưa có trận phù hợp. Thêm lịch trận bằng biểu mẫu bên cạnh.
          </p>
        </div>
        <p class="hint mt-4">
          Trận đã có điểm danh hoặc biên bản được giữ lại để tra cứu; dùng trạng
          thái “Hủy trận” trong biên bản khi cần.
        </p>
      </section>
    </div>
    <div v-else class="stack">
      <section class="panel admin-member-form">
        <button
          type="button"
          class="disclosure-heading"
          :aria-expanded="memberFormOpen"
          aria-controls="member-form"
          @click="memberFormOpen = !memberFormOpen"
        >
          <span><ClubIcon name="plus" /><span>Thêm thành viên</span></span
          ><ClubIcon name="chevron" :class="{ 'rotate-180': memberFormOpen }" />
        </button>
        <div
          id="member-form"
          class="admin-form-body"
          :class="{ 'is-open': memberFormOpen }"
        >
          <form
            @submit.prevent="createUser"
            class="grid gap-4 md:grid-cols-5 items-end"
          >
            <label
              ><span class="field-label">Tài khoản</span
              ><input
                v-model="newUser.username"
                class="field"
                required
                maxlength="100"
                autocomplete="off" /></label
            ><label
              ><span class="field-label">Mật khẩu ban đầu</span
              ><input
                v-model="newUser.password"
                class="field"
                type="password"
                minlength="6"
                required
                autocomplete="new-password" /></label
            ><label
              ><span class="field-label">Họ và tên</span
              ><input
                v-model="newUser.name"
                class="field"
                required
                maxlength="150" /></label
            ><label
              ><span class="field-label">Đội cố định</span
              ><select
                v-model="newUser.home_team"
                class="field"
                aria-label="Đội cố định của thành viên mới"
                required
              >
                <option value="" disabled>Chọn đội</option>
                <option value="A">Đội A</option>
                <option value="B">Đội B</option>
              </select></label
            ><button class="btn" :disabled="saving">Tạo thành viên</button>
          </form>
        </div>
      </section>
      <label class="block max-w-md"
        ><span class="field-label">Tìm thành viên</span
        ><input
          v-model="userSearch"
          class="field"
          type="search"
          placeholder="Tên hoặc tài khoản…"
      /></label>
      <p class="team-assignment-note">
        Đội cố định dùng làm mặc định khi nạp điểm danh. Muốn mượn cầu thủ để
        cân bằng một buổi đá, chỉ chỉnh đội trong biên bản trận đó.
      </p>
      <div class="table-shell responsive-records member-records">
        <table class="data-table" aria-label="Danh sách thành viên">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Thành viên</th>
              <th>Đội cố định</th>
              <th>Quyền truy cập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td data-label="Tài khoản">{{ u.username }}</td>
              <td class="record-primary">
                <div class="flex items-center gap-3">
                  <ClubAvatar
                    :src="u.avatar"
                    :name="u.name"
                    preview
                    class="h-12 w-12 rounded-xl"
                  />
                  <span class="font-semibold">{{ u.name }}</span>
                </div>
              </td>
              <td data-label="Đội cố định">
                <select
                  :value="u.home_team || ''"
                  @change="saveHomeTeam(u, $event)"
                  class="field"
                  :aria-label="`Đội cố định của ${u.name}`"
                  :disabled="saving"
                >
                  <option value="">Chưa phân đội</option>
                  <option value="A">Đội A</option>
                  <option value="B">Đội B</option>
                </select>
              </td>
              <td data-label="Quyền truy cập">
                <select
                  :value="u.role"
                  @change="saveRole(u, $event.target.value)"
                  class="field"
                  :aria-label="`Quyền của ${u.name}`"
                  :disabled="
                    u.id === currentUser.id || u.username === 'admin' || saving
                  "
                >
                  <option value="user">Cầu thủ</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </td>
              <td class="record-actions">
                <div class="flex gap-2">
                  <router-link :to="`/profile/${u.id}`" class="btn secondary"
                    >Hồ sơ</router-link
                  ><button
                    class="btn secondary"
                    @click="resetPass(u)"
                    :disabled="saving"
                  >
                    Đổi mật khẩu</button
                  ><button
                    v-if="u.username !== 'admin' && u.id !== currentUser.id"
                    class="btn danger"
                    @click="deleteUser(u)"
                    :disabled="saving"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length">
              <td colspan="5" class="muted record-empty">
                Không có thành viên phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import ClubAvatar from "../components/ClubAvatar.vue";
import DateTimeField from "../components/DateTimeField.vue";
import { formatVietnamDateTime, toVietnamInput } from "../utils/datetime";
import { useToast } from "../composables/useToast";
import { useDialog } from "../composables/useDialog";
const { addToast } = useToast(),
  { openConfirm, openPrompt } = useDialog(),
  currentUser = JSON.parse(localStorage.getItem("fcdbb_user") || "{}");
const matchFormOpen = ref(window.matchMedia("(min-width: 981px)").matches),
  memberFormOpen = ref(window.matchMedia("(min-width: 981px)").matches);
const tab = ref("matches"),
  allMatches = ref([]),
  users = ref([]),
  error = ref(""),
  saving = ref(false),
  locating = ref(false),
  matchSearch = ref(""),
  userSearch = ref("");
const emptyMatch = () => ({
    title: "",
    location_name: "",
    lat: "",
    lng: "",
    map_link: "",
    start_time: "",
    lock_time: "",
    end_time: "",
  }),
  match = ref(emptyMatch()),
  newUser = ref({ username: "", password: "", name: "", home_team: "" });
const load = async () => {
  try {
    const [m, u] = await Promise.all([api.get("/matches"), api.get("/users")]);
    allMatches.value = m.data;
    users.value = u.data;
  } catch (e) {
    error.value =
      e.response?.data?.message || "Không tải được dữ liệu quản trị.";
  }
};
const locations = computed(() => [
  ...new Map(allMatches.value.map((m) => [m.location_name, m])).values(),
]);
const filteredMatches = computed(() =>
  allMatches.value.filter((m) =>
    `${m.title} ${m.location_name}`
      .toLocaleLowerCase("vi")
      .includes(matchSearch.value.toLocaleLowerCase("vi")),
  ),
);
const filteredUsers = computed(() =>
  users.value.filter((u) =>
    `${u.name} ${u.username}`
      .toLocaleLowerCase("vi")
      .includes(userSearch.value.toLocaleLowerCase("vi")),
  ),
);
const run = async (action, message) => {
  saving.value = true;
  error.value = "";
  try {
    await action();
    await load();
    addToast(message, "success");
  } catch (e) {
    error.value =
      e.response?.data?.message ||
      "Không thực hiện được thao tác. Kiểm tra dữ liệu và thử lại.";
    addToast(error.value, "error");
  } finally {
    saving.value = false;
  }
};
const applyLocation = (e) => {
  if (e.target.value === "") return;
  const l = locations.value[Number(e.target.value)];
  Object.assign(match.value, {
    location_name: l.location_name,
    lat: l.lat,
    lng: l.lng,
    map_link: l.map_link,
  });
};
const getGPS = () => {
  if (!navigator.geolocation)
    return addToast("Trình duyệt không hỗ trợ định vị.", "warning");
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (p) => {
      match.value.lat = p.coords.latitude;
      match.value.lng = p.coords.longitude;
      locating.value = false;
    },
    () => {
      locating.value = false;
      addToast(
        "Bật định vị và cho phép truy cập vị trí để lấy tọa độ sân.",
        "error",
      );
    },
    { enableHighAccuracy: true, timeout: 15000 },
  );
};
const resetMatch = () => {
  match.value = emptyMatch();
};
const saveMatch = () =>
  run(async () => {
    if (match.value.id)
      await api.put(`/matches/${match.value.id}`, match.value);
    else await api.post("/matches", match.value);
    resetMatch();
  }, "Đã lưu lịch trận.");
const editMatch = (m) => {
  matchFormOpen.value = true;
  match.value = {
    ...m,
    start_time: toVietnamInput(m.start_time),
    lock_time: toVietnamInput(m.lock_time),
    end_time: toVietnamInput(m.end_time),
  };
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const closeMatch = async (m) => {
  if (
    await openConfirm("Kết thúc điểm danh buổi đá này ngay bây giờ?", {
      title: "Đóng điểm danh?",
      confirmText: "Đóng điểm danh",
    })
  )
    run(
      () => api.put(`/matches/${m.id}`, { end_time: new Date().toISOString() }),
      "Đã đóng điểm danh.",
    );
};
const deleteMatch = async (m) => {
  if (
    await openConfirm(
      "Chỉ lịch trận chưa có dữ liệu mới có thể xóa. Lịch sử thao tác vẫn được lưu.",
      {
        title: `Xóa lịch “${m.title}”?`,
        confirmText: "Xóa lịch",
        tone: "danger",
      },
    )
  )
    run(() => api.delete(`/matches/${m.id}`), "Đã xóa lịch trận.");
};
const createUser = () =>
  run(async () => {
    await api.post("/users", newUser.value);
    newUser.value = { username: "", password: "", name: "", home_team: "" };
  }, "Đã tạo thành viên.");
const saveHomeTeam = async (u, event) => {
  const select = event.target;
  saving.value = true;
  error.value = "";
  try {
    const { data } = await api.put(`/users/${u.id}/team`, {
      home_team: select.value || null,
    });
    u.home_team = data.home_team;
    addToast(
      "Đã lưu đội cố định. Đội hình các trận đã lưu được giữ nguyên.",
      "success",
    );
  } catch (e) {
    select.value = u.home_team || "";
    error.value =
      e.response?.data?.message ||
      "Không lưu được đội cố định. Vui lòng thử lại.";
    addToast(error.value, "error");
  } finally {
    saving.value = false;
  }
};
const saveRole = (u, role) =>
  run(() => api.put(`/users/${u.id}`, { role }), "Đã cập nhật quyền truy cập.");
const resetPass = async (u) => {
  const password = await openPrompt(
    `Nhập mật khẩu mới cho ${u.name} (ít nhất 6 ký tự).`,
    {
      title: "Đặt lại mật khẩu",
      inputType: "password",
      confirmText: "Lưu mật khẩu",
    },
  );
  if (password)
    run(
      () => api.put(`/users/${u.id}/reset-password`, { password }),
      "Đã đặt lại mật khẩu.",
    );
};
const deleteUser = async (u) => {
  if (
    await openConfirm(
      `Xóa tài khoản ${u.name}? Biên bản đã lưu vẫn giữ tên cầu thủ. Thành viên có điểm danh được bảo lưu.`,
      {
        title: "Xóa thành viên?",
        confirmText: "Xóa thành viên",
        tone: "danger",
      },
    )
  )
    run(() => api.delete(`/users/${u.id}`), "Đã xóa thành viên.");
};
onMounted(load);
</script>
