<template>
  <div class="w-full max-w-5xl mx-auto space-y-6">
    <div class="glass-panel flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <span class="text-4xl">💰</span>
        <h2 class="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Quản Lý Quỹ Đội</h2>
      </div>
      <div class="bg-black/30 px-6 py-3 rounded-xl border border-white/10 shadow-inner">
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Số dư hiện tại</h3>
        <p class="text-3xl font-black font-mono" :class="balance >= 0 ? 'text-green-400' : 'text-red-400'">{{ balance.toLocaleString() }} <span class="text-lg">VNĐ</span></p>
      </div>
    </div>
    
    <div v-if="isAdmin" class="glass-panel relative overflow-hidden">
      <div class="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
      <h3 class="text-sm font-bold uppercase tracking-wider text-gold mb-4 relative z-10 border-b border-white/10 pb-2">➕ Thêm Giao Dịch Mới</h3>
      <div class="flex flex-wrap md:flex-nowrap gap-4 items-center relative z-10">
        <div class="w-full md:w-32">
          <select v-model="form.type" class="glass-input font-bold" :class="form.type === 'THU' ? 'text-green-400' : 'text-red-400'">
            <option value="THU">📈 THU</option>
            <option value="CHI">📉 CHI</option>
          </select>
        </div>
        <input v-model="form.amount" type="number" placeholder="Số tiền (VNĐ)" class="glass-input w-full md:w-48 font-mono">
        <input v-model="form.reason" type="text" placeholder="Lý do thu/chi..." class="glass-input flex-1">
        <div class="w-full md:w-auto relative">
          <input type="file" @change="e => form.file = e.target.files[0]" id="fund-file" class="hidden">
          <label for="fund-file" class="cursor-pointer flex items-center justify-center gap-2 bg-white/5 border border-white/20 text-blue-200 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors h-full w-full whitespace-nowrap">
            <span>{{ form.file ? '📎 Đã chọn ảnh' : '📸 Đính kèm ảnh' }}</span>
          </label>
        </div>
        <button @click="addFund" class="glass-btn !w-full md:!w-32 whitespace-nowrap">Lưu GD</button>
      </div>
    </div>

    <div class="glass-panel overflow-x-auto p-0 rounded-2xl border border-white/20">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="bg-black/40">
          <tr>
            <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Thời gian</th>
            <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Phân Loại</th>
            <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Số tiền</th>
            <th class="p-4 font-bold text-blue-300 uppercase tracking-wider">Nội dung</th>
            <th class="p-4 font-bold text-blue-300 uppercase tracking-wider text-center">Minh chứng</th>
            <th v-if="isAdmin" class="p-4 font-bold text-blue-300 uppercase tracking-wider text-right">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in funds" :key="f.id" class="border-t border-white/5 hover:bg-white/5 transition-colors">
            <td class="p-4 font-mono text-gray-300">
              {{ new Date(f.created_at).toLocaleDateString('vi-VN') }}
              <span class="text-xs text-gray-500 ml-1">{{ new Date(f.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) }}</span>
            </td>
            <td class="p-4">
              <span class="px-2 py-1 rounded text-xs font-black tracking-widest" :class="f.type === 'THU' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'">{{ f.type }}</span>
            </td>
            <td class="p-4 font-mono font-bold" :class="f.type === 'THU' ? 'text-green-400' : 'text-red-400'">
              {{ f.type === 'THU' ? '+' : '-' }}{{ f.amount.toLocaleString() }}đ
            </td>
            <td class="p-4 max-w-[250px] truncate text-white" :title="f.reason">{{ f.reason }}</td>
            <td class="p-4 text-center">
              <button v-if="f.proof_image" @click="viewImage(f.proof_image)" class="text-blue-300 bg-blue-500/10 border border-blue-400/20 px-3 py-1.5 rounded hover:bg-blue-500/20 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-1 mx-auto">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Xem
              </button>
              <span v-else class="text-gray-600 text-xs italic">-</span>
            </td>
            <td v-if="isAdmin" class="p-4 text-right">
              <button @click="deleteFund(f.id)" class="text-red-400 bg-red-500/10 border border-red-400/20 px-3 py-1.5 rounded hover:bg-red-500/20 hover:text-white transition-colors text-xs font-bold">Xóa</button>
            </td>
          </tr>
          <tr v-if="funds.length === 0">
            <td :colspan="isAdmin ? 6 : 5" class="p-8 text-center text-gray-400 italic">Chưa có giao dịch nào được ghi nhận.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Image Modal -->
    <transition name="page">
      <div v-if="modalImg" class="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="modalImg = null">
        <div class="relative max-w-4xl w-full flex flex-col items-center">
          <button class="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 font-bold text-white hover:bg-red-500 hover:border-red-400 transition-all text-xl" title="Đóng">&times;</button>
          <img :src="modalImg" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" @click.stop>
        </div>
      </div>
    </transition>
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