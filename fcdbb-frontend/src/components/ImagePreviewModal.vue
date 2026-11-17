<template>
  <Teleport to="body"
    ><div
      v-if="currentSrc"
      class="photo-viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="`Xem ảnh: ${alt}`"
      @click.self="$emit('close')"
    >
      <section ref="panel" class="photo-viewer-panel" tabindex="-1">
        <div class="photo-viewer-bar">
          <div>
            <strong>{{ alt }}</strong
            ><span class="block text-xs"
              >Ảnh {{ currentIndex + 1 }} / {{ gallery.length }}</span
            >
          </div>
          <button
            ref="closeButton"
            type="button"
            class="photo-control"
            aria-label="Đóng xem ảnh"
            @click="$emit('close')"
          >
            <ClubIcon name="close" />
          </button>
        </div>
        <div class="photo-stage">
          <button
            v-if="gallery.length > 1"
            class="photo-control"
            @click="move(-1)"
            aria-label="Ảnh trước"
          >
            <ClubIcon name="arrow" class="rotate-180" /></button
          ><img
            :src="currentSrc"
            :alt="`${alt} — ảnh ${currentIndex + 1}`"
          /><button
            v-if="gallery.length > 1"
            class="photo-control"
            @click="move(1)"
            aria-label="Ảnh tiếp theo"
          >
            <ClubIcon name="arrow" />
          </button>
        </div>
        <div v-if="gallery.length > 1" class="photo-thumbnails">
          <button
            v-for="(url, i) in gallery"
            :key="url"
            @click="currentIndex = i"
            :aria-label="`Xem ảnh ${i + 1}`"
            :aria-pressed="i === currentIndex"
          >
            <img :src="url" alt="" />
          </button>
        </div>
        <div class="flex justify-center gap-3">
          <button
            class="photo-control !w-auto px-4"
            @click="downloadImage"
            :disabled="downloading"
          >
            <ClubIcon name="download" />{{
              downloading ? "Đang tải…" : "Tải hình ảnh"
            }}</button
          ><a
            :href="currentSrc"
            target="_blank"
            rel="noopener noreferrer"
            class="photo-control !w-auto px-4"
            >Mở tab mới</a
          >
        </div>
      </section>
    </div></Teleport
  >
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import ClubIcon from "./ClubIcon.vue";
const props = defineProps({
    src: { type: String, default: "" },
    images: { type: Array, default: () => [] },
    initialIndex: { type: Number, default: 0 },
    alt: { type: String, default: "Ảnh xem trước" },
    filename: { type: String, default: "fcdbb-image" },
  }),
  emit = defineEmits(["close"]);
const gallery = computed(() =>
    props.images.length ? props.images : [props.src].filter(Boolean),
  ),
  currentIndex = ref(0),
  currentSrc = computed(() => gallery.value[currentIndex.value] || ""),
  downloading = ref(false),
  panel = ref(null),
  closeButton = ref(null);
let previousFocus, previousOverflow;
watch(
  () => [props.src, props.images, props.initialIndex],
  () => {
    currentIndex.value = Math.max(
      0,
      Math.min(props.initialIndex, gallery.value.length - 1),
    );
  },
  { immediate: true },
);
const move = (step) => {
  currentIndex.value =
    (currentIndex.value + step + gallery.value.length) % gallery.value.length;
};
const keydown = (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    move(-1);
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    move(1);
  }
  if (e.key === "Tab") {
    const els = [
        ...panel.value.querySelectorAll("button:not(:disabled),a[href]"),
      ],
      first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
};
onMounted(async () => {
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", keydown);
  await nextTick();
  closeButton.value?.focus();
});
onUnmounted(() => {
  document.removeEventListener("keydown", keydown);
  document.body.style.overflow = previousOverflow;
  previousFocus?.focus();
});
const downloadImage = async () => {
  if (downloading.value) return;
  downloading.value = true;
  try {
    const response = await fetch(currentSrc.value);
    if (!response.ok) throw Error();
    const blob = await response.blob(),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `${props.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}-${currentIndex.value + 1}${{ "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" }[blob.type] || ""}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(currentSrc.value, "_blank", "noopener,noreferrer");
  } finally {
    downloading.value = false;
  }
};
</script>
