import { createRouter, createWebHistory } from 'vue-router'
import UserCheckin from './views/UserCheckin.vue'
import AdminDashboard from './views/AdminDashboard.vue'

const routes = [
  { path: '/', component: UserCheckin },
  { path: '/admin', component: AdminDashboard }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router