<template>
  <div class="toast-stack">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.type === 'error' ? 'alert' : 'status'"
        class="club-toast"
        :class="`toast-${toast.type}`"
      >
        <ClubIcon
          :name="
            toast.type === 'success'
              ? 'check'
              : toast.type === 'error'
                ? 'close'
                : 'info'
          "
        />
        <span>{{ toast.message }}</span>
        <button
          @click="removeToast(toast.id)"
          aria-label="Đóng thông báo"
          class="toast-close"
        >
          <ClubIcon name="close" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
<script setup>
import { useToast } from "../composables/useToast";
import ClubIcon from "./ClubIcon.vue";
const { toasts, removeToast } = useToast();
</script>
<style scoped>
.club-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 12px 16px;
  width: 100%;
  border: 1px solid var(--line);
  border-left: 4px solid var(--action);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 8px 30px #102b2426;
}
.club-toast > span {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.7;
}
.club-toast > .icon {
  color: var(--pitch);
}
.toast-error {
  border-left-color: #bb3e52;
}
.toast-warning {
  border-left-color: #ab751e;
}
.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  color: var(--muted);
}
.toast-close:hover {
  background: var(--surface-soft);
  color: var(--ink);
}
.toast-enter-active,
.toast-leave-active {
  transition: transform 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  transform: translateY(10px);
}
</style>
