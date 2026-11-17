<template>
  <button
    type="button"
    class="icon-btn theme-toggle"
    @click="toggleTheme"
    :aria-label="
      theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'
    "
    :title="theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'"
  >
    <ClubIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
  </button>
</template>
<script setup>
import ClubIcon from "./ClubIcon.vue";
import { useTheme } from "../composables/useTheme";
const { theme, toggleTheme } = useTheme();
</script>
