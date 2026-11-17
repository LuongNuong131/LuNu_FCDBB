<template>
  <div v-if="profile" class="mx-auto w-full max-w-4xl space-y-6">
    <section class="glass-panel relative overflow-hidden !p-0">
      <div class="h-36 bg-emerald-100 sm:h-44">
        <div
          class="h-full opacity-30"
          style="
            background-image: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.12) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.12) 50%,
              rgba(255, 255, 255, 0.12) 75%,
              transparent 75%
            );
            background-size: 26px 26px;
          "
        ></div>
      </div>
      <div class="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <div
          class="-mt-16 flex flex-col items-center gap-4 sm:-mt-20 sm:flex-row sm:items-end"
        >
          <div class="flex shrink-0 flex-col items-center gap-3">
            <ClubAvatar
              :src="profile.avatar"
              :name="profile.name"
              preview
              class="h-32 w-32 rounded-[1.75rem] border-4 border-white object-cover shadow-sm sm:h-40 sm:w-40"
            />
            <template v-if="isOwner || isAdmin">
              <button
                type="button"
                class="btn secondary"
                :disabled="uploadingAvatar"
                @click="avatarInput?.click()"
              >
                {{ uploadingAvatar ? "Đang tải ảnh…" : "Đổi ảnh đại diện" }}
              </button>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                aria-label="Chọn ảnh đại diện mới"
                class="sr-only"
                tabindex="-1"
                :disabled="uploadingAvatar"
                @change="uploadAvatar"
              />
            </template>
          </div>
          <div class="min-w-0 flex-1 text-center sm:pb-2 sm:text-left">
            <p class="eyebrow mb-2">Hồ sơ cầu thủ</p>
            <h1
              class="truncate font-display text-3xl font-extrabold tracking-[-.04em] text-slate-900 sm:text-4xl"
            >
              {{ profile.name }}
            </h1>
            <span
              class="badge mt-3"
              :class="profile.home_team === 'A' ? 'green' : 'blue'"
              >{{
                profile.home_team
                  ? `Đội cố định ${profile.home_team}`
                  : "Chưa phân đội cố định"
              }}</span
            >
            <div
              class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"
            >
              <span
                class="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-700"
                >{{ profile.position || "Chưa rõ vị trí" }}</span
              ><span
                v-if="isOwner"
                class="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-700"
                >Hồ sơ của bạn</span
              >
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="glass-panel">
      <div
        class="mb-6 flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center"
      >
        <div>
          <p class="eyebrow mb-2">Thông tin cá nhân</p>
          <h2 class="font-display text-xl font-extrabold text-slate-900">
            Thông tin cầu thủ
          </h2>
        </div>
        <p class="text-xs text-slate-500">
          {{
            isOwner || isAdmin
              ? "Bạn có thể chỉnh sửa thông tin."
              : "Chế độ chỉ xem."
          }}
        </p>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            for="profile-profile-name"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Họ và tên</label
          ><input
            id="profile-profile-name"
            v-model="profile.name"
            class="glass-input"
            disabled
          />
        </div>
        <div>
          <label
            for="profile-profile-dob"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Ngày sinh</label
          ><input
            id="profile-profile-dob"
            v-model="profile.dob"
            type="date"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-phone"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Số điện thoại</label
          ><input
            id="profile-profile-phone"
            v-model="profile.phone"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-email"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Email</label
          ><input
            id="profile-profile-email"
            v-model="profile.email"
            type="email"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-height"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Chiều cao (cm)</label
          ><input
            id="profile-profile-height"
            v-model="profile.height"
            type="number"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-weight"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Cân nặng (kg)</label
          ><input
            id="profile-profile-weight"
            v-model="profile.weight"
            type="number"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-left_foot"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Chân trái (/5)</label
          ><input
            id="profile-profile-left_foot"
            v-model="profile.left_foot"
            type="number"
            min="1"
            max="5"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-right_foot"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Chân phải (/5)</label
          ><input
            id="profile-profile-right_foot"
            v-model="profile.right_foot"
            type="number"
            min="1"
            max="5"
            class="glass-input"
            :disabled="!isOwner && !isAdmin"
          />
        </div>
        <div>
          <label
            for="profile-profile-position"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-amber-700"
            >Vị trí · Admin phân công</label
          ><select
            id="profile-profile-position"
            v-model="profile.position"
            class="glass-input"
            :disabled="!isAdmin"
          >
            <option value="Chưa rõ">Chưa rõ</option>
            <option value="Tiền đạo">Tiền đạo</option>
            <option value="Tiền vệ">Tiền vệ</option>
            <option value="Hậu vệ">Hậu vệ</option>
            <option value="Thủ môn">Thủ môn</option>
          </select>
        </div>
        <div>
          <label
            for="profile-profile-bmi"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Chỉ số BMI</label
          ><input
            id="profile-profile-bmi"
            v-model="profile.bmi"
            class="glass-input font-black text-emerald-700"
            disabled
          />
        </div>
      </div>
      <button
        v-if="isOwner || isAdmin"
        @click="save"
        class="glass-btn btn-gold mt-7 sm:mx-auto sm:w-1/2"
      >
        Lưu hồ sơ
      </button>
    </section>
    <section v-if="isOwner" class="glass-panel">
      <div
        class="mb-6 flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center"
      >
        <div>
          <p class="eyebrow mb-2 text-amber-700">Bảo mật tài khoản</p>
          <h2 class="font-display text-xl font-extrabold text-slate-900">
            Đổi mật khẩu
          </h2>
        </div>
        <p class="text-xs text-slate-500">
          Xác thực bằng mật khẩu hiện tại của bạn.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            for="profile-currentPassword"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Mật khẩu hiện tại</label
          ><input
            id="profile-currentPassword"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="glass-input"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>
        <div>
          <label
            for="profile-newPassword"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Mật khẩu mới</label
          ><input
            id="profile-newPassword"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="glass-input"
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
        <div>
          <label
            for="profile-confirmPassword"
            class="mb-2 block text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-700"
            >Xác nhận mật khẩu mới</label
          ><input
            id="profile-confirmPassword"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="glass-input"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
      </div>
      <button @click="changePassword" class="glass-btn mt-6 sm:mx-0 sm:w-auto">
        Đổi mật khẩu
      </button>
    </section>
  </div>
  <div
    v-else
    class="glass-panel mx-auto flex min-h-[280px] max-w-4xl items-center justify-center text-sm text-slate-600"
  >
    Đang tải hồ sơ...
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import ClubAvatar from "../components/ClubAvatar.vue";
import { useToast } from "../composables/useToast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const route = useRoute();
const profile = ref(null);
const avatarInput = ref(null);
const uploadingAvatar = ref(false);
const currentUser = JSON.parse(localStorage.getItem("fcdbb_user") || "{}");
const { addToast } = useToast();
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isOwner = computed(() => currentUser.id == route.params.id);
const isAdmin = computed(() => currentUser.role === "admin");

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/users/${route.params.id}`);
    profile.value = res.data;
  } catch (e) {
    console.error("Lỗi lấy thông tin:", e);
  }
});

const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file || uploadingAvatar.value) return;
  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return addToast("Vui lòng chọn một tệp hình ảnh.", "warning");
  }
  uploadingAvatar.value = true;
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await axios.post(
      `${API}/users/${route.params.id}/avatar`,
      formData,
    );
    profile.value.avatar = res.data.avatar;
    if (isOwner.value) {
      currentUser.avatar = res.data.avatar;
      localStorage.setItem("fcdbb_user", JSON.stringify(currentUser));
    }
    addToast("Đổi ảnh đại diện thành công!", "success");
  } catch (e) {
    addToast("Lỗi tải ảnh đại diện!", "error");
  } finally {
    uploadingAvatar.value = false;
    event.target.value = "";
  }
};

const save = async () => {
  try {
    const res = await axios.put(
      `${API}/users/${route.params.id}`,
      profile.value,
    );
    profile.value = res.data;
    addToast("Lưu hồ sơ thành công!", "success");
  } catch (e) {
    addToast("Lỗi lưu hồ sơ!", "error");
  }
};

const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    return addToast("Vui lòng nhập đầy đủ thông tin mật khẩu.", "warning");
  }
  if (newPassword.value.length < 6) {
    return addToast("Mật khẩu mới phải có ít nhất 6 ký tự.", "warning");
  }
  if (newPassword.value !== confirmPassword.value) {
    return addToast("Mật khẩu xác nhận không khớp.", "warning");
  }

  try {
    await axios.put(`${API}/users/${route.params.id}/change-password`, {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    addToast("Đổi mật khẩu thành công!", "success");
  } catch (e) {
    const message = e.response?.data?.message;
    addToast(
      Array.isArray(message)
        ? message.join(", ")
        : message || "Không thể đổi mật khẩu.",
      "error",
    );
  }
};
</script>
