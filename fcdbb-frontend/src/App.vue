<template>
  <div class="min-h-screen flex flex-col items-center py-10 px-4">
    <nav class="flex gap-4 mb-8 glass-panel py-3 px-6 rounded-full">
      <router-link to="/" class="font-semibold hover:text-blue-300" active-class="text-blue-400">📝 Điểm Danh</router-link>
      <span class="text-white/30">|</span>
      <router-link to="/admin" class="font-semibold hover:text-blue-300" active-class="text-blue-400">⚙️ Quản Trị</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>