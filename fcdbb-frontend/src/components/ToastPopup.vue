<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none w-[min(320px,90vw)]">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="relative overflow-hidden p-4 pr-10 rounded-xl shadow-glow-blue-lg flex items-start gap-3 text-white backdrop-blur-xl border animate-slide-in pointer-events-auto"
        :class="{
          'bg-emerald-500/15 border-emerald-400/30': toast.type === 'success',
          'bg-red-500/15 border-red-400/30': toast.type === 'error',
          'bg-gold/15 border-gold/40 text-gold': toast.type === 'warning'
        }"
      >
        <span class="text-lg leading-none mt-0.5">
          <template v-if="toast.type === 'success'">✅</template>
          <template v-else-if="toast.type === 'error'">⚠️</template>
          <template v-else>🔔</template>
        </span>
        <span class="font-semibold text-sm leading-snug flex-1">{{ toast.message }}</span>
        <button @click="removeToast(toast.id)" class="absolute top-2 right-2 text-lg font-bold opacity-50 hover:opacity-100 transition-opacity">&times;</button>
        <div class="absolute bottom-0 left-0 h-0.5 bg-white/40 toast-bar"></div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';
const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-leave-active {
  animation: fade-out 0.25s forwards;
}
.toast-bar {
  animation: toastShrink 3s linear forwards;
}
@keyframes toastShrink {
  from { width: 100%; }
  to { width: 0%; }
}
</style>