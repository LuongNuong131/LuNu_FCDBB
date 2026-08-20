<template>
  <div class="w-full max-w-4xl">
    <div class="glass-panel mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-blue-200">Quản Lý Quỹ Đội</h2>
      <h3 class="text-xl font-bold">Số dư: <span :class="balance >= 0 ? 'text-green-400' : 'text-red-400'">{{ balance.toLocaleString() }}đ</span></h3>
    </div>
    
    <div v-if="isAdmin" class="glass-panel mb-6 flex flex-wrap gap-4 items-center">
      <select v-model="form.type" class="glass-input !w-24"><option value="THU">Thu</option><option value="CHI">Chi</option></select>
      <input v-model="form.amount" type="number" placeholder="Số tiền" class="glass-input !w-32">
      <input v-model="form.reason" type="text" placeholder="Lý do" class="glass-input flex-1">
      <input type="file" @change="e => form.file = e.target.files[0]" class="text-xs w-48 text-gray-300">
      <button @click="addFund" class="glass-btn !w-auto">Thêm GD</button>
    </div>

    <div class="glass-panel overflow-x-auto">
      <table class="w-full text-left text-sm">
        <tr class="border-b border-white/20"><th>Ngày (Giờ)</th><th>Loại</th><th>Số tiền</th><th>Lý do</th><th class="text-center">Minh chứng</th><th v-if="isAdmin" class="text-right">Hành động</th></tr>
        <tr v-for="f in funds" :key="f.id" class="border-b border-white/10 hover:bg-white/5 transition">
          <td class="py-3">
            {{ new Date(f.created_at).toLocaleDateString('vi-VN') }}
            <span class="text-xs text-gray-400 ml-1">{{ new Date(f.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) }}</span>
          </td>
          <td :class="f.type === 'THU' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'">{{ f.type }}</td>
          <td>{{ f.amount.toLocaleString() }}đ</td>
          <td class="max-w-[200px] truncate" :title="f.reason">{{ f.reason }}</td>
          <td class="text-center">
            <button v-if="f.proof_image" @click="viewImage(f.proof_image)" class="text-blue-400 hover:text-blue-300 underline text-xs">📷 Xem ảnh</button>
          </td>
          <td v-if="isAdmin" class="text-right">
            <button @click="deleteFund(f.id)" class="text-red-400 hover:text-red-300 text-xs ml-2">Xóa</button>
          </td>
        </tr>
      </table>
    </div>

    <div v-if="modalImg" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" @click="modalImg = null">
      <div class="relative max-w-3xl max-h-[90vh]">
        <button class="absolute -top-10 right-0 font-bold text-xl text-white hover:text-red-400">Đóng (X)</button>
        <img :src="modalImg" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/20" @click.stop>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const funds = ref([]);
const isAdmin = JSON.parse(localStorage.getItem('fcdbb_user') || '{}')?.role === 'admin';
const form = ref({ type: 'THU', amount: '', reason: '', file: null });
const modalImg = ref(null);

const balance = computed(() => {
  if (!funds.value || !Array.isArray(funds.value)) return 0;
  return funds.value.reduce((acc, curr) => curr.type === 'THU' ? acc + curr.amount : acc - curr.amount, 0);
});

const load = async () => { 
  try {
    const res = await axios.get(`${API}/funds`); 
    funds.value = res.data || []; 
  } catch (e) { console.error("Lỗi load quỹ:", e); }
};
onMounted(load);

const viewImage = (url) => { modalImg.value = url; };

const addFund = async () => {
  if (!form.value.amount || !form.value.reason) return alert('Vui lòng nhập đủ số tiền và lý do!');
  const fd = new FormData();
  fd.append('type', form.value.type); fd.append('amount', form.value.amount); fd.append('reason', form.value.reason);
  if(form.value.file) fd.append('file', form.value.file);
  try {
    await axios.post(`${API}/funds`, fd);
    form.value = { type: 'THU', amount: '', reason: '', file: null };
    load(); alert('Đã lưu giao dịch!');
  } catch (e) { alert("Lỗi lưu quỹ!"); }
};

const deleteFund = async (id) => {
  if(confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) { 
    try {
      await axios.delete(`${API}/funds/${id}`); 
      load(); 
    } catch (e) { alert("Lỗi xóa!"); }
  }
};
</script>