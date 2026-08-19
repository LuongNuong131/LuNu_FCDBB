import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import Home from './views/Home.vue'
import Profile from './views/Profile.vue'
import Players from './views/Players.vue'
import Funds from './views/Funds.vue'
import Admin from './views/Admin.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/profile/:id', component: Profile, meta: { requiresAuth: true } },
  { path: '/players', component: Players, meta: { requiresAuth: true } },
  { path: '/funds', component: Funds, meta: { requiresAuth: true } },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('fcdbb_user') || 'null');
  if (to.meta.requiresAuth && !user) next('/login');
  else if (to.meta.requiresAdmin && user?.role !== 'admin') next('/');
  else next();
})

export default router