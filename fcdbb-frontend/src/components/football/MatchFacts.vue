<template>
  <div class="venue-time-grid">
    <component
      :is="match.map_link ? 'a' : 'div'"
      class="match-fact location"
      :href="match.map_link || undefined"
      :target="match.map_link ? '_blank' : undefined"
      :rel="match.map_link ? 'noopener noreferrer' : undefined"
      ><ClubIcon name="pin" /><span class="min-w-0"
        ><span class="match-fact-label"
          >Sân thi đấu{{ match.map_link ? " · Mở bản đồ" : "" }}</span
        ><strong class="match-fact-value">{{
          match.location_name
        }}</strong></span
      ></component
    >
    <div class="match-fact kickoff">
      <ClubIcon name="clock" /><span
        ><span class="match-fact-label">Giờ bóng lăn · Giờ Việt Nam</span
        ><strong class="match-fact-value">{{ time }}</strong
        ><span class="block text-sm muted mt-1">{{
          formatVietnamDate(match.start_time)
        }}</span></span
      >
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import ClubIcon from "../ClubIcon.vue";
import { formatVietnamDate, formatVietnamDateTime } from "../../utils/datetime";
const props = defineProps({ match: { type: Object, required: true } });
const time = computed(() =>
  formatVietnamDateTime(props.match.start_time, {
    day: undefined,
    month: undefined,
    year: undefined,
    hour: "2-digit",
    minute: "2-digit",
    second: undefined,
  }),
);
</script>
