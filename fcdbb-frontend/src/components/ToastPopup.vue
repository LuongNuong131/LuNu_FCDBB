<template>
  <div
    class="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
  >
    <transition-group name="toast">
      <div
        role="status"
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur-xl animate-slide-in"
        :class="{
          'bg-sky-700/90 border-sky-300/30 text-white':
            toast.type === 'success',
          'bg-rose-700/90 border-rose-300/30 text-white':
            toast.type === 'error',
          'bg-amber-300/95 border-amber-100/50 text-slate-950':
            toast.type === 'warning',
        }"
      >
        <span class="font-bold flex-1">{{ toast.message }}</span>
        <button
          @click="removeToast(toast.id)"
          aria-label="Đóng thông báo"
          class="text-xl font-bold opacity-70 hover:opacity-100 transition-opacity"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from "../composables/useToast";
const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-leave-active {
  animation: fade-out 0.3s forwards;
}
</style>
