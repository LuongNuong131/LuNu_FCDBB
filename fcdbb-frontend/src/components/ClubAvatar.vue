<template>
  <span class="club-avatar" role="img" :aria-label="name || 'Cầu thủ'"
    ><img
      v-if="validSrc && !failed"
      :src="validSrc"
      alt=""
      @error="failed = true"
    /><span v-else aria-hidden="true">{{ initials }}</span></span
  >
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { resolveMediaUrl } from "../utils/media";
const props = defineProps({ src: String, name: String }),
  failed = ref(false);
const validSrc = computed(() =>
  props.src && !props.src.includes("/images/players/default.jpg")
    ? resolveMediaUrl(props.src)
    : "",
);
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
  },
);
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
</style>
