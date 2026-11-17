import { createApp } from "vue";
import "./style.css";
import "./club-ui.css";
import "./api";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
