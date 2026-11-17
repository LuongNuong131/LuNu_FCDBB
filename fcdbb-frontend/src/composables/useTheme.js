import { ref } from "vue";
const theme = ref(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);
let listening = false;
const apply = (value) => {
  theme.value = value === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme.value;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.value === "dark" ? "#101923" : "#f3f6f4");
};
export function useTheme() {
  if (!listening) {
    listening = true;
    window.addEventListener("storage", (e) => {
      if (e.key === "fcdbb_theme") apply(e.newValue);
    });
  }
  const toggleTheme = () => {
    apply(theme.value === "dark" ? "light" : "dark");
    try {
      localStorage.setItem("fcdbb_theme", theme.value);
    } catch {
      /* Theme still works for this session. */
    }
  };
  return { theme, toggleTheme };
}
