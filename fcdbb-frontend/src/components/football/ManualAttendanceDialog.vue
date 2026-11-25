<template>
  <dialog
    ref="dialog"
    class="attendance-dialog"
    aria-labelledby="attendance-title"
    @cancel="guardCancel"
  >
    <form class="attendance-form" @submit.prevent="save">
      <header class="attendance-header">
        <div>
          <h2 id="attendance-title">Bổ sung điểm danh</h2>
          <p>{{ match.title }}</p>
        </div>
        <button
          class="icon-btn"
          type="button"
          aria-label="Đóng bổ sung điểm danh"
          :disabled="saving"
          @click="dialog.close()"
        >
          <ClubIcon name="close" />
        </button>
      </header>

      <div class="attendance-scroll">
        <fieldset class="attendance-fields" :disabled="saving">
          <label>
            <span class="field-label">Cầu thủ cần điểm danh</span>
            <select v-model="userId" class="field" required autofocus>
              <option :value="null" disabled>Chọn cầu thủ</option>
              <option v-for="p in players" :key="p.id" :value="p.id">
                {{ p.jersey_number == null ? "" : `#${p.jersey_number} · `
                }}{{ p.name }}
              </option>
            </select>
          </label>
          <DateTimeField
            id="attendance-checked-at"
            v-model="checkedAt"
            label="Giờ cầu thủ đến"
          />
          <p v-if="error" class="error-state" role="alert">{{ error }}</p>
        </fieldset>
      </div>

      <footer class="attendance-footer">
        <button
          type="button"
          class="btn secondary"
          :disabled="saving"
          @click="dialog.close()"
        >
          Hủy
        </button>
        <button class="btn" :disabled="saving || !userId || !checkedAt">
          {{ saving ? "Đang lưu…" : "Lưu điểm danh" }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<script setup>
import { ref } from "vue";
import api from "../../api";
import ClubIcon from "../ClubIcon.vue";
import DateTimeField from "../DateTimeField.vue";

const props = defineProps({
  match: { type: Object, required: true },
  players: { type: Array, required: true },
});
const emit = defineEmits(["saved"]);
const dialog = ref(null);
const userId = ref(null);
const checkedAt = ref("");
const error = ref("");
const saving = ref(false);

const open = () => {
  if (!dialog.value || dialog.value.open) return;
  userId.value = null;
  checkedAt.value = props.match.start_time;
  error.value = "";
  dialog.value.showModal();
};
const guardCancel = (event) => {
  if (saving.value) event.preventDefault();
};
const save = async () => {
  if (saving.value || !userId.value || !checkedAt.value) return;
  const matchId = props.match.id;
  saving.value = true;
  error.value = "";
  try {
    await api.post(`/matches/${matchId}/attendance`, {
      userId: userId.value,
      checkedAt: checkedAt.value,
    });
    dialog.value?.close();
    emit("saved", matchId);
  } catch (e) {
    error.value = e.response?.data?.message || "Không cập nhật được điểm danh.";
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped>
.attendance-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(460px, calc(100% - 32px));
  max-width: none;
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 16px 56px #071f2940;
}
.attendance-dialog::backdrop {
  background: #071f29a6;
}
.attendance-form {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}
.attendance-header,
.attendance-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  padding: 16px 20px;
}
.attendance-header {
  border-bottom: 1px solid var(--line);
}
.attendance-header h2 {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
}
.attendance-header p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-size: 12px;
  color: var(--muted);
}
.attendance-header .icon-btn {
  flex-shrink: 0;
}
.attendance-scroll {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.attendance-fields {
  display: grid;
  gap: 14px;
  padding: 16px 20px;
  min-width: 0;
}
.attendance-fields .field,
.attendance-fields :deep(input[type="date"]) {
  min-width: 0;
  max-width: 100%;
}
.attendance-fields :deep(.date-time-field .hint),
.attendance-fields .error-state {
  margin-bottom: 0;
}
.attendance-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--line);
}
@media (max-width: 600px) {
  .attendance-dialog {
    inset: auto 0 0;
    margin: 0;
    width: 100%;
    max-height: calc(100dvh - max(12px, env(safe-area-inset-top)));
    border-radius: 18px 18px 0 0;
  }
  .attendance-header,
  .attendance-fields,
  .attendance-footer {
    padding-inline: 16px;
  }
  .attendance-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }
}
</style>
