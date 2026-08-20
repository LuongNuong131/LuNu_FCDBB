<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="min-w-[250px] p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md flex items-center gap-3 text-white animate-slide-in pointer-events-auto border"
        :class="{
          'bg-blue-600/90 border-blue-400': toast.type === 'success',
          'bg-red-600/90 border-red-400': toast.type === 'error',
          'bg-yellow-500/90 border-yellow-300 text-gray-900': toast.type === 'warning'
        }"
      >
        <span class="font-bold flex-1">{{ toast.message }}</span>
        <button @click="removeToast(toast.id)" class="text-xl font-bold opacity-70 hover:opacity-100 transition-opacity">&times;</button>
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
  animation: fade-out 0.3s forwards;
}
</style>