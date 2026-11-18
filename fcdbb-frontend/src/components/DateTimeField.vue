<template>
  <div class="date-time-field">
    <div class="date-time-heading">
      <label :for="`${id}-date`" :class="toneClass">{{ label }}</label
      ><span>Giờ Việt Nam · 24h</span>
    </div>
    <input
      :id="`${id}-date`"
      v-model="dateDraft"
      type="date"
      class="field"
      @change="emitValue"
    />
    <div class="time-parts">
      <label
        ><span>Giờ</span
        ><select
          v-model="hourDraft"
          :aria-label="`${label} - giờ`"
          class="field"
          @change="emitValue"
        >
          <option v-for="hour in hours" :key="hour" :value="hour">
            {{ hour }}
          </option>
        </select></label
      >
      <label
        ><span>Phút</span
        ><select
          v-model="minuteDraft"
          :aria-label="`${label} - phút`"
          class="field"
          @change="emitValue"
        >
          <option v-for="minute in minutes" :key="minute" :value="minute">
            {{ minute }}
          </option>
        </select></label
      >
      <label
        ><span>Giây</span
        ><select
          v-model="secondDraft"
          :aria-label="`${label} - giây`"
          class="field"
          @change="emitValue"
        >
          <option v-for="second in seconds" :key="second" :value="second">
            {{ second }}
          </option>
        </select></label
      >
    </div>
    <p class="hint">{{ displayValue || "Chọn ngày và giờ của buổi đá." }}</p>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import {
  formatVietnamDateTime,
  toVietnamInput,
  vietnamInputToIso,
} from "../utils/datetime";

const props = defineProps({
  modelValue: { type: [String, Date], default: "" },
  label: { type: String, required: true },
  id: { type: String, required: true },
  tone: { type: String, default: "sky" },
});
const emit = defineEmits(["update:modelValue"]);

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const seconds = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const dateDraft = ref("");
const hourDraft = ref("00");
const minuteDraft = ref("00");
const secondDraft = ref("00");

const syncFromModel = () => {
  const local = toVietnamInput(props.modelValue);
  dateDraft.value = local ? local.slice(0, 10) : "";
  hourDraft.value = local ? local.slice(11, 13) : "00";
  minuteDraft.value = local ? local.slice(14, 16) : "00";
  secondDraft.value = local ? local.slice(17, 19) : "00";
};
watch(() => props.modelValue, syncFromModel, { immediate: true });

const displayValue = computed(() =>
  props.modelValue ? formatVietnamDateTime(props.modelValue) : "",
);
const toneClass = computed(
  () =>
    ({
      green: "text-emerald-700",
      amber: "text-amber-700",
      rose: "text-rose-700",
      sky: "text-sky-700",
    })[props.tone] || "text-sky-700",
);

const emitValue = () => {
  if (!dateDraft.value) return emit("update:modelValue", "");
  const iso = vietnamInputToIso(
    `${dateDraft.value}T${hourDraft.value}:${minuteDraft.value}:${secondDraft.value}`,
  );
  if (iso) emit("update:modelValue", iso);
};
</script>
