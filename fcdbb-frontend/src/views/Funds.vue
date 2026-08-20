<template>
  <div class="mx-auto w-full max-w-6xl space-y-8">
    <section class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p class="eyebrow mb-3">TEAM FINANCE · TRANSPARENCY</p><h1 class="page-heading">Quỹ <strong>đội bóng.</strong></h1><p class="page-intro mt-3">Mọi khoản thu chi đều được ghi nhận rõ ràng để tập thể luôn chủ động và minh bạch.</p></div><div class="rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] p-4 sm:min-w-[230px]"><p class="stat-label text-emerald-300">Số dư hiện tại</p><p class="mt-2 font-display text-2xl font-extrabold" :class="balance >= 0 ? 'text-emerald-300' : 'text-rose-300'">{{ balance.toLocaleString() }}<span class="ml-1 text-sm font-semibold text-slate-400">VNĐ</span></p></div></section>
    <section v-if="isAdmin" class="glass-panel"><div class="mb-5 flex items-center gap-3 border-b border-white/[.08] pb-4"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-lg text-amber-300">＋</span><div><p class="eyebrow text-amber-300">ADMIN TOOL</p><h2 class="font-display text-lg font-extrabold text-white">Thêm giao dịch mới</h2></div></div><div class="grid gap-3 md:grid-cols-[140px_180px_1fr_auto] md:items-center"><select v-model="form.type" class="glass-input font-bold" :class="form.type === 'THU' ? 'text-emerald-300' : 'text-rose-300'"><option value="THU">＋ THU</option><option value="CHI">− CHI</option></select><input v-model="form.amount" type="number" placeholder="Số tiền (VNĐ)" class="glass-input font-mono"><input v-model="form.reason" type="text" placeholder="Lý do thu / chi..." class="glass-input"><div class="flex gap-2"><input type="file" @change="e => form.file = e.target.files[0]" id="fund-file" class="hidden"><label for="fund-file" class="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-4 text-center text-xs font-bold text-sky-200 transition hover:bg-white/[.08] md:flex-none">{{ form.file ? 'Đã chọn ảnh' : 'Đính kèm ảnh' }}</label><button @click="addFund" class="glass-btn !w-auto whitespace-nowrap px-5">Lưu</button></div></div></section>
    <section class="space-y-4"><div class="flex items-center justify-between"><div><p class="eyebrow mb-2">LEDGER</p><h2 class="font-display text-2xl font-extrabold text-white">Lịch sử giao dịch</h2></div><span class="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-bold text-slate-400">{{ funds.length }} bản ghi</span></div><div class="table-shell"><table class="w-full min-w-[720px] text-left text-sm"><thead><tr><th>Thời gian</th><th>Phân loại</th><th>Số tiền</th><th>Nội dung</th><th class="text-center">Minh chứng</th><th v-if="isAdmin" class="text-right">Tác vụ</th></tr></thead><tbody><tr v-for="f in funds" :key="f.id"><td class="font-mono text-xs text-slate-300">{{ new Date(f.created_at).toLocaleDateString('vi-VN') }} <span class="text-slate-500">{{ new Date(f.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) }}</span></td><td><span class="rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[.14em]" :class="f.type === 'THU' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-300/20 bg-rose-400/10 text-rose-300'">{{ f.type }}</span></td><td class="font-mono font-bold" :class="f.type === 'THU' ? 'text-emerald-300' : 'text-rose-300'">{{ f.type === 'THU' ? '+' : '-' }}{{ f.amount.toLocaleString() }}đ</td><td class="max-w-[280px] truncate font-medium text-white" :title="f.reason">{{ f.reason }}</td><td class="text-center"><button v-if="f.proof_image" @click="viewImage(f.proof_image)" class="rounded-lg border border-sky-300/20 bg-sky-300/[.08] px-3 py-1.5 text-xs font-bold text-sky-200 transition hover:bg-sky-300/20">Xem ảnh</button><span v-else class="text-xs italic text-slate-600">—</span></td><td v-if="isAdmin" class="text-right"><button @click="deleteFund(f.id)" class="rounded-lg border border-rose-300/20 bg-rose-400/[.08] px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-400/20">Xóa</button></td></tr><tr v-if="funds.length === 0"><td :colspan="isAdmin ? 6 : 5" class="p-12 text-center text-sm text-slate-500">Chưa có giao dịch nào được ghi nhận.</td></tr></tbody></table></div></section>
    <transition name="page"><div v-if="modalImg" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" @click="modalImg = null"><div class="relative flex w-full max-w-4xl justify-center"><button class="absolute -right-2 -top-12 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl text-white hover:bg-rose-400/30" title="Đóng">&times;</button><img :src="modalImg" class="max-h-[85vh] max-w-full rounded-2xl border border-white/10 object-contain shadow-2xl" @click.stop></div></div></transition>
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
