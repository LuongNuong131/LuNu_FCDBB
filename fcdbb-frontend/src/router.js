import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";
import Home from "./views/Home.vue";
import Profile from "./views/Profile.vue";
import Players from "./views/Players.vue";
import Funds from "./views/Funds.vue";
import Blog from "./views/Blog.vue";
import Admin from "./views/Admin.vue";
import Matches from "./views/Matches.vue";
import MatchReport from "./views/MatchReport.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/", component: Home, meta: { requiresAuth: true } },
  { path: "/profile/:id", component: Profile, meta: { requiresAuth: true } },
  { path: "/matches", component: Matches, meta: { requiresAuth: true } },
  {
    path: "/matches/:id",
    component: MatchReport,
    meta: { requiresAuth: true },
  },
  { path: "/players", component: Players, meta: { requiresAuth: true } },
  { path: "/funds", component: Funds, meta: { requiresAuth: true } },
  { path: "/blog", component: Blog, meta: { requiresAuth: true } },
  {
    path: "/admin",
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  let user;
  try {
    user = JSON.parse(localStorage.getItem("fcdbb_user") || "null");
  } catch {
    user = null;
  }
  if (!localStorage.getItem("fcdbb_token")) user = null;
  if (to.meta.requiresAuth && !user) next("/login");
  else if (to.meta.requiresAdmin && user?.role !== "admin") next("/");
  else next();
});

export default router;
