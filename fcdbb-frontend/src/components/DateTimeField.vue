<template>
  <div class="rounded-2xl border border-white/[.09] bg-white/[.025] p-3">
    <div class="mb-2 flex items-center justify-between gap-3">
      <label :for="`${id}-date`" class="text-[10px] font-extrabold uppercase tracking-[.16em]" :class="toneClass">{{ label }}</label>
      <span class="text-[10px] font-semibold text-slate-500">Giờ Việt Nam · 24h</span>
    </div>

    <div class="grid grid-cols-[1.08fr_1fr] gap-2">
      <input :id="`${id}-date`" v-model="dateDraft" type="date" class="glass-input !px-3 !py-2.5 font-mono text-xs" @change="emitValue">
      <div class="grid grid-cols-3 gap-1.5">
        <select v-model="hourDraft" :aria-label="`${label} - giờ`" class="glass-input !px-2 !py-2.5 text-center font-mono text-xs" @change="emitValue">
          <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
        </select>
        <select v-model="minuteDraft" :aria-label="`${label} - phút`" class="glass-input !px-2 !py-2.5 text-center font-mono text-xs" @change="emitValue">
          <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
        </select>
        <select v-model="secondDraft" :aria-label="`${label} - giây`" class="glass-input !px-2 !py-2.5 text-center font-mono text-xs" @change="emitValue">
          <option v-for="second in seconds" :key="second" :value="second">{{ second }}</option>
        </select>
      </div>
    </div>

    <div class="mt-2 grid grid-cols-[1.08fr_1fr] gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-slate-500">
      <span>Ngày / tháng / năm</span>
      <span class="grid grid-cols-3 gap-1.5 text-center"><span>Giờ</span><span>Phút</span><span>Giây</span></span>
    </div>
    <p class="mt-2 text-[10px] text-slate-500">{{ displayValue || 'Chọn ngày và giờ' }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatVietnamDateTime, toVietnamInput, vietnamInputToIso } from '../utils/datetime';

const props = defineProps({
  modelValue: { type: [String, Date], default: '' },
  label: { type: String, required: true },
  id: { type: String, required: true },
  tone: { type: String, default: 'sky' },
});
const emit = defineEmits(['update:modelValue']);

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const seconds = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const dateDraft = ref('');
const hourDraft = ref('00');
const minuteDraft = ref('00');
const secondDraft = ref('00');

const syncFromModel = () => {
  const local = toVietnamInput(props.modelValue);
  dateDraft.value = local ? local.slice(0, 10) : '';
  hourDraft.value = local ? local.slice(11, 13) : '00';
  minuteDraft.value = local ? local.slice(14, 16) : '00';
  secondDraft.value = local ? local.slice(17, 19) : '00';
};
watch(() => props.modelValue, syncFromModel, { immediate: true });

const displayValue = computed(() => props.modelValue ? formatVietnamDateTime(props.modelValue) : '');
const toneClass = computed(() => ({
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  sky: 'text-sky-300',
}[props.tone] || 'text-sky-300'));

const emitValue = () => {
  if (!dateDraft.value) return;
  const iso = vietnamInputToIso(`${dateDraft.value}T${hourDraft.value}:${minuteDraft.value}:${secondDraft.value}`);
  if (iso) emit('update:modelValue', iso);
};
</script>
