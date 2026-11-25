<template>
  <fieldset class="goal-player-field" :disabled="disabled">
    <legend class="field-label">{{ label }}</legend>
    <div class="goal-player-search">
      <input
        ref="nameField"
        v-model="nameSearch"
        type="search"
        class="field"
        placeholder="Tìm theo tên"
        :aria-label="`Tìm ${label.toLocaleLowerCase('vi')} theo tên`"
        @keydown.enter.prevent="chooseResult"
      />
      <input
        v-model="jerseySearch"
        type="search"
        inputmode="numeric"
        maxlength="2"
        class="field"
        placeholder="Số áo"
        :aria-label="`Tìm ${label.toLocaleLowerCase('vi')} theo số áo`"
        @keydown.enter.prevent="chooseResult"
      />
    </div>
    <select
      v-model="model"
      class="field"
      :aria-label="label"
      @change="clearSearch"
    >
      <option :value="null">{{ placeholder }}</option>
      <option v-for="p in options" :key="p.userId" :value="p.userId">
        {{ p.jersey_number == null ? "" : `#${p.jersey_number} · `
        }}{{ p.name }} ({{ p.team }})
      </option>
    </select>
    <p
      v-if="!disabled && !results.length && (nameSearch || jerseySearch)"
      class="hint mb-0"
    >
      Không tìm thấy cầu thủ phù hợp.
    </p>
  </fieldset>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, required: true },
  players: { type: Array, required: true },
  disabled: Boolean,
});
const model = defineModel({ type: Number, default: null });
const nameField = ref(null);
const nameSearch = ref("");
const jerseySearch = ref("");
const normalize = (value) =>
  value
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("đ", "d");
const results = computed(() =>
  props.players.filter(
    (p) =>
      normalize(p.name).includes(normalize(nameSearch.value)) &&
      (!jerseySearch.value || p.jersey_number === Number(jerseySearch.value)),
  ),
);
// Keep the current player selected while filtering options for a replacement.
const options = computed(() => {
  const selected = props.players.find((p) => p.userId === model.value);
  return selected && !results.value.includes(selected)
    ? [selected, ...results.value]
    : results.value;
});
const clearSearch = () => {
  nameSearch.value = "";
  jerseySearch.value = "";
};
const chooseResult = () => {
  if (results.value.length !== 1) return;
  model.value = results.value[0].userId;
  clearSearch();
};
defineExpose({ focus: () => nameField.value?.focus({ preventScroll: true }) });
</script>

<style scoped>
.goal-player-field {
  min-width: 0;
}
.goal-player-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px;
  gap: 6px;
  margin-bottom: 6px;
}
.goal-player-search .field {
  min-width: 0;
  padding-inline: 8px;
}
</style>
