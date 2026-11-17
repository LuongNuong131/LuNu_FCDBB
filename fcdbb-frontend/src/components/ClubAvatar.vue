<template>
  <component
    :is="canPreview ? 'button' : 'span'"
    class="club-avatar"
    :class="{ 'club-avatar-preview': canPreview }"
    :type="canPreview ? 'button' : undefined"
    :role="canPreview ? undefined : 'img'"
    :aria-label="
      canPreview
        ? `Xem ảnh đại diện của ${name || 'cầu thủ'}`
        : name || 'Cầu thủ'
    "
    :aria-haspopup="canPreview ? 'dialog' : undefined"
    :title="canPreview ? 'Xem ảnh đại diện' : undefined"
    @click="openPreview"
  >
    <img
      v-if="validSrc && !failed"
      :src="validSrc"
      alt=""
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ initials }}</span>
    <span v-if="canPreview" class="avatar-preview-hint" aria-hidden="true">
      <ClubIcon name="search" />
    </span>
    <ImagePreviewModal
      v-if="previewOpen"
      :src="validSrc"
      :alt="`Ảnh đại diện của ${name || 'cầu thủ'}`"
      filename="fcdbb-avatar"
      @close="previewOpen = false"
    />
  </component>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { resolveMediaUrl } from "../utils/media";
import ClubIcon from "./ClubIcon.vue";
import ImagePreviewModal from "./ImagePreviewModal.vue";
const props = defineProps({ src: String, name: String, preview: Boolean }),
  failed = ref(false),
  previewOpen = ref(false);
const validSrc = computed(() =>
  props.src && !props.src.includes("/images/players/default.jpg")
    ? resolveMediaUrl(props.src)
    : "",
);
const canPreview = computed(
  () => props.preview && validSrc.value && !failed.value,
);
const openPreview = () => {
  if (canPreview.value) previewOpen.value = true;
};
const initials = computed(() =>
  (props.name || "FC")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((x) => x[0])
    .join("")
    .toUpperCase(),
);
watch(
  () => props.src,
  () => {
    failed.value = false;
    previewOpen.value = false;
  },
);
watch(canPreview, (available) => {
  if (!available) previewOpen.value = false;
});
</script>
<style scoped>
.club-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: #e7f1ed;
  color: #166347;
  font-weight: 700;
  font-size: 1.3em;
}
.club-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}
.club-avatar-preview {
  cursor: zoom-in;
}
.avatar-preview-hint {
  position: absolute;
  right: 3px;
  bottom: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #102b24e6;
  color: #fff;
  pointer-events: none;
}
.avatar-preview-hint :deep(svg) {
  width: 14px;
  height: 14px;
}
</style>
