<template>
  <transition name="page">
    <div
      v-if="src"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      :aria-label="`Xem ảnh: ${alt}`"
      @click="$emit('close')"
    >
      <div class="relative flex w-full max-w-5xl flex-col items-center gap-4" @click.stop>
        <button
          type="button"
          class="absolute -right-1 -top-12 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl text-white transition hover:bg-rose-400/30"
          title="Đóng"
          aria-label="Đóng xem ảnh"
          @click="$emit('close')"
        >
          &times;
        </button>
        <img
          :src="src"
          :alt="alt"
          class="max-h-[78vh] max-w-full rounded-2xl border border-white/10 object-contain shadow-2xl"
        >
        <div class="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-2 shadow-xl">
          <button
            type="button"
            class="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-amber-200 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-60"
            :disabled="downloading"
            @click="downloadImage"
          >
            {{ downloading ? 'Đang tải...' : 'Tải hình ảnh' }}
          </button>
          <a
            :href="src"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-xl border border-sky-300/20 bg-sky-300/[.08] px-4 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-sky-200 transition hover:bg-sky-300/20"
          >
            Mở tab mới
          </a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: 'Ảnh xem trước' },
  filename: { type: String, default: 'fcdbb-image' },
});

defineEmits(['close']);
const downloading = ref(false);

const downloadImage = async () => {
  if (!props.src || downloading.value) return;
  downloading.value = true;
  try {
    const response = await fetch(props.src);
    if (!response.ok) throw new Error('Không thể tải ảnh');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = props.filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'fcdbb-image';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Một số storage cloud chặn fetch cross-origin; mở tab mới là fallback an toàn.
    window.open(props.src, '_blank', 'noopener,noreferrer');
  } finally {
    downloading.value = false;
  }
};
</script>
