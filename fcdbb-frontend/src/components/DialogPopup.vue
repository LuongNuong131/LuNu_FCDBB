<template>
  <transition name="dialog-fade">
    <div v-if="dialog" class="fixed inset-0 z-[60] flex items-center justify-center bg-[#020813]/75 p-4 backdrop-blur-md" @click.self="close(false)">
      <section class="w-full max-w-md rounded-[1.5rem] border border-white/[.14] bg-[#10243b] p-5 shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:p-6" role="dialog" aria-modal="true" :aria-label="dialog.title">
        <div class="flex items-start gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg" :class="toneClasses">{{ dialog.mode === 'prompt' ? '✎' : '!' }}</div>
          <div class="min-w-0 flex-1">
            <h2 class="font-display text-lg font-extrabold text-white">{{ dialog.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate-300">{{ dialog.message }}</p>
          </div>
          <button @click="close(false)" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-white/[.08] hover:text-white" aria-label="Đóng">&times;</button>
        </div>

        <input v-if="dialog.mode === 'prompt'" v-model="inputValue" :type="dialog.inputType" :placeholder="dialog.placeholder" class="glass-input mt-5" @keyup.enter="submitPrompt">

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button @click="close(false)" class="rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-extrabold uppercase tracking-[.12em] text-slate-300 transition hover:bg-white/[.08] hover:text-white">{{ dialog.cancelText }}</button>
          <button @click="submit" class="rounded-xl border px-4 py-3 text-xs font-extrabold uppercase tracking-[.12em] transition hover:-translate-y-0.5" :class="confirmClasses">{{ dialog.confirmText }}</button>
        </div>
      </section>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useDialog } from '../composables/useDialog';

const { dialog, close } = useDialog();
const inputValue = ref('');

watch(dialog, (value) => {
  inputValue.value = value?.initialValue || '';
});

const toneClasses = computed(() => {
  if (dialog.value?.tone === 'danger') return 'border-rose-300/20 bg-rose-400/10 text-rose-300';
  if (dialog.value?.tone === 'info') return 'border-sky-300/20 bg-sky-300/10 text-sky-300';
  return 'border-amber-300/20 bg-amber-300/10 text-amber-300';
});

const confirmClasses = computed(() => {
  if (dialog.value?.tone === 'danger') return 'border-rose-300/30 bg-rose-400/15 text-rose-200 hover:bg-rose-400/25';
  if (dialog.value?.tone === 'info') return 'border-sky-300/30 bg-sky-300/15 text-sky-200 hover:bg-sky-300/25';
  return 'border-amber-300/35 bg-amber-300/15 text-amber-100 hover:bg-amber-300/25';
});

const submitPrompt = () => {
  if (dialog.value?.mode === 'prompt') close(inputValue.value.trim() || null);
};

const submit = () => {
  if (dialog.value?.mode === 'prompt') submitPrompt();
  else close(true);
};
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity .2s ease; }
.dialog-fade-enter-active section, .dialog-fade-leave-active section { transition: transform .2s ease, opacity .2s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
.dialog-fade-enter-from section, .dialog-fade-leave-to section { opacity: 0; transform: translateY(12px) scale(.98); }
</style>
