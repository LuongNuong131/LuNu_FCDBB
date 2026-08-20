<template>
  <div class="rounded-2xl border border-white/[.09] bg-white/[.025] p-3">
    <div class="mb-2 flex items-center justify-between gap-3">
      <label :for="`${id}-date`" class="text-[10px] font-extrabold uppercase tracking-[.16em]" :class="toneClass">{{ label }}</label>
      <span class="text-[10px] font-semibold text-slate-500">Giờ Việt Nam</span>
    </div>
    <div class="grid grid-cols-[1.15fr_.85fr] gap-2">
      <input :id="`${id}-date`" :value="dateValue" type="date" class="glass-input !px-3 !py-2.5 font-mono text-xs" @input="updateDate($event.target.value)">
      <input :id="`${id}-time`" :value="timeValue" type="text" inputmode="numeric" maxlength="8" pattern="^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$" placeholder="HH:mm:ss" class="glass-input !px-3 !py-2.5 font-mono text-xs tracking-wider" @change="updateTime($event.target.value)">
    </div>
    <p class="mt-2 text-[10px] text-slate-500">{{ displayValue || 'Chưa chọn thời gian' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatVietnamDateTime, toVietnamInput, vietnamInputToIso } from '../utils/datetime';

const props = defineProps({
  modelValue: { type: [String, Date], default: '' },
  label: { type: String, required: true },
  id: { type: String, required: true },
  tone: { type: String, default: 'sky' },
});
const emit = defineEmits(['update:modelValue']);

const localValue = computed(() => toVietnamInput(props.modelValue));
const dateValue = computed(() => localValue.value ? localValue.value.slice(0, 10) : '');
const timeValue = computed(() => localValue.value ? localValue.value.slice(11, 19) : '');
const displayValue = computed(() => props.modelValue ? formatVietnamDateTime(props.modelValue) : '');
const toneClass = computed(() => ({
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  sky: 'text-sky-300',
}[props.tone] || 'text-sky-300'));

const emitValue = (date, time) => {
  if (!date || !time) {
    emit('update:modelValue', date || time ? `${date}T${time}` : '');
    return;
  }
  emit('update:modelValue', vietnamInputToIso(`${date}T${time}`));
};

const updateDate = (date) => emitValue(date, timeValue.value || '00:00:00');
const updateTime = (time) => emitValue(dateValue.value, time || '00:00:00');
</script>
