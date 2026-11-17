<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.calendar" />
  </svg>
</template>
<script setup>
defineProps({ name: { type: String, default: "calendar" } });
const paths = {
  info: "M12 8h.01M11 12h1v5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  filter: "M4 7h16M7 12h10m-7 5h4M7 4v6m10-1v6m-5-1v6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  chevron: "m6 9 6 6 6-6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
  image: "M4 3h16v18H4ZM4 16l5-5 4 4 3-3 4 4M15 7h.01",
  swap: "M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4",

  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  calendar:
    "M7 3v4M17 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2ZM7 14h2m6 0h2m-10 3h2",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75",
  wallet: "M21 8H5a2 2 0 0 1 0-4h14v4M3 6v13a2 2 0 0 0 2 2h16V8m0 5h-5v4h5",
  book: "M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V3Zm0 15a3 3 0 0 1 3-3h13M8 7h8m-8 4h5",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-5h4l1 3 3 1 3 2v6l-3 2-3 1-1 3h-4l-1-3-3-1-3-2V9l3-2 3-1Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  pin: "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  clock: "M12 8v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  logout: "M9 4H4v16h5m5-12 4 4-4 4M8 12h12",
  trophy:
    "M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v7m-4 0h8",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6",
};
</script>
