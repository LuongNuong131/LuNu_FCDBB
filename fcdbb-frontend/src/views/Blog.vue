<template>
  <div class="mx-auto w-full max-w-7xl space-y-8">
    <section class="panel">
      <div
        class="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"
      >
        <div class="max-w-3xl">
          <p class="eyebrow mb-3 text-amber-700">Nhật ký đội bóng</p>
          <h1 class="page-heading max-w-3xl">
            Những khoảnh khắc <strong>đáng nhớ.</strong>
          </h1>
          <p class="page-intro mt-4 max-w-2xl">
            Nơi lưu lại những trận đấu, buổi tập, tiếng cười và tinh thần tập
            thể của FC Đá Bay Bóng.
          </p>
        </div>
        <div
          class="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-xl text-amber-700"
            >✦</span
          >
          <div>
            <p
              class="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500"
            >
              Bộ sưu tập
            </p>
            <p class="mt-1 text-sm font-bold text-slate-900">
              {{ posts.length }} câu chuyện
            </p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="isAdmin" class="glass-panel">
      <div
        class="mb-6 flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center"
      >
        <div>
          <p class="eyebrow mb-2 text-amber-700">Dành cho quản trị viên</p>
          <h2 class="font-display text-xl font-extrabold text-slate-900">
            {{ editingId ? "Chỉnh sửa khoảnh khắc" : "Đăng khoảnh khắc mới" }}
          </h2>
        </div>
        <button
          v-if="editingId"
          @click="resetForm"
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-600 transition hover:bg-slate-50"
        >
          Hủy chỉnh sửa
        </button>
      </div>
      <form
        class="grid gap-5 lg:grid-cols-[1fr_280px]"
        @submit.prevent="savePost"
      >
        <div class="space-y-4">
          <div>
            <label for="blog-title" class="field-label">Tiêu đề</label
            ><input
              id="blog-title"
              v-model="form.title"
              class="glass-input"
              placeholder="VD: Một buổi tối không thể quên"
            />
          </div>
          <div>
            <label for="blog-excerpt" class="field-label">Mô tả ngắn</label
            ><input
              id="blog-excerpt"
              v-model="form.excerpt"
              class="glass-input"
              placeholder="Một câu dẫn ngắn cho khoảnh khắc này"
            />
          </div>
          <div>
            <label for="blog-content" class="field-label">Câu chuyện</label
            ><textarea
              id="blog-content"
              v-model="form.content"
              rows="6"
              class="glass-input resize-y leading-6"
              placeholder="Viết vài dòng về trận đấu, buổi tập hoặc kỷ niệm của đội..."
            ></textarea>
          </div>
          <button type="submit" class="glass-btn btn-gold sm:w-auto sm:px-10">
            {{ editingId ? "Lưu thay đổi" : "Đăng lên Blog" }}
          </button>
        </div>
        <div class="space-y-3">
          <label
            class="group block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-sky-300/25 bg-sky-300/[.04] transition hover:border-amber-300/45 hover:bg-amber-300/[.05]"
          >
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImage"
            />
            <div
              v-if="form.imagePreview || form.image_url"
              class="relative aspect-[4/3]"
            >
              <img
                alt="Ảnh xem trước bài viết"
                :src="resolveMediaUrl(form.imagePreview || form.image_url)"
                class="h-full w-full object-cover"
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100"
              >
                <span
                  class="rounded-xl bg-black/50 px-3 py-2 text-xs font-extrabold text-white"
                  >Đổi ảnh</span
                >
              </div>
            </div>
            <div
              v-else
              class="flex aspect-[4/3] flex-col items-center justify-center px-5 text-center"
            >
              <span class="mb-3 text-4xl text-amber-700">＋</span
              ><span
                class="text-xs font-extrabold uppercase tracking-[.16em] text-slate-900"
                >Thêm ảnh khoảnh khắc</span
              ><span class="mt-2 text-[11px] text-slate-500"
                >JPG, PNG hoặc WEBP</span
              >
            </div>
          </label>
          <p class="text-[10px] leading-5 text-slate-500">
            Thêm ảnh để lưu lại khoảnh khắc của đội. Chỉ quản trị viên được đăng
            bài.
          </p>
        </div>
      </form>
    </section>

    <section
      v-if="loading"
      class="glass-panel flex min-h-[260px] items-center justify-center text-sm text-slate-600"
    >
      Đang tải khoảnh khắc...
    </section>
    <section
      v-else-if="posts.length === 0"
      class="glass-panel flex min-h-[260px] flex-col items-center justify-center text-center"
    >
      <span class="mb-4 text-5xl text-amber-700/70">✦</span>
      <h2 class="font-display text-2xl font-extrabold text-slate-900">
        Chưa có câu chuyện nào.
      </h2>
      <p class="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Những khoảnh khắc đầu tiên của đội bóng sẽ xuất hiện tại đây.
      </p>
    </section>
    <section v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="post in posts"
        :key="post.id"
        class="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300/30 hover:bg-slate-50"
      >
        <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img
            v-if="post.image_url"
            :src="resolveMediaUrl(post.image_url)"
            :alt="post.title"
            class="h-full w-full cursor-zoom-in object-cover transition duration-500 group-hover:scale-105"
            @click="openImage(post)"
          />
          <div
            v-else
            class="flex h-full items-center justify-center bg-emerald-50"
          >
            <ClubIcon name="book" class="!h-12 !w-12 text-emerald-700" />
          </div>
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07111f]/75 via-transparent to-transparent"
          ></div>
          <span
            class="absolute bottom-4 left-4 rounded-full border border-slate-200 bg-black/30 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-white backdrop-blur"
            >Khoảnh khắc FCDBB</span
          >
        </div>
        <div class="p-5">
          <p
            class="text-[10px] font-mono uppercase tracking-[.12em] text-slate-500"
          >
            {{ formatVietnamDateTime(post.created_at) }}
          </p>
          <h2
            class="mt-3 font-display text-xl font-extrabold leading-tight text-slate-900"
          >
            {{ post.title }}
          </h2>
          <p
            v-if="post.excerpt"
            class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600"
          >
            {{ post.excerpt }}
          </p>
          <p
            v-if="post.content"
            class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600"
          >
            {{ post.content }}
          </p>
          <div
            v-if="isAdmin"
            class="mt-5 flex gap-2 border-t border-slate-200 pt-4"
          >
            <button
              @click="editPost(post)"
              class="rounded-lg border border-sky-300/20 bg-sky-300/[.08] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-sky-700 transition hover:bg-sky-300/20"
            >
              Sửa</button
            ><button
              @click="removePost(post.id)"
              class="rounded-lg border border-rose-300/20 bg-rose-400/[.08] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-rose-700 transition hover:bg-rose-400/20"
            >
              Xóa
            </button>
          </div>
        </div>
      </article>
    </section>
    <ImagePreviewModal
      v-if="activeImage"
      :src="activeImage.src"
      :alt="activeImage.alt"
      :filename="activeImage.filename"
      @close="activeImage = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import axios from "axios";
import ClubIcon from "../components/ClubIcon.vue";
import ImagePreviewModal from "../components/ImagePreviewModal.vue";
import { useToast } from "../composables/useToast";
import { useDialog } from "../composables/useDialog";
import { formatVietnamDateTime } from "../utils/datetime";
import { resolveMediaUrl } from "../utils/media";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const currentUser = JSON.parse(localStorage.getItem("fcdbb_user") || "{}");
const isAdmin = computed(() => currentUser.role === "admin");
const { addToast } = useToast();
const { openConfirm } = useDialog();
const posts = ref([]);
const loading = ref(true);
const editingId = ref(null);
const form = reactive({
  title: "",
  excerpt: "",
  content: "",
  image: null,
  image_url: "",
  imagePreview: "",
});
const activeImage = ref(null);

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("fcdbb_token") || ""}`,
});

const loadPosts = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API}/blog`);
    posts.value = res.data || [];
  } catch (error) {
    addToast("Không thể tải Blog.", "error");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  editingId.value = null;
  Object.assign(form, {
    title: "",
    excerpt: "",
    content: "",
    image: null,
    image_url: "",
    imagePreview: "",
  });
};

const handleImage = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  form.image = file;
  form.imagePreview = URL.createObjectURL(file);
};

const openImage = (post) => {
  if (!post.image_url) return;
  activeImage.value = {
    src: resolveMediaUrl(post.image_url),
    alt: post.title || "Ảnh bài viết Blog",
    filename: `fcdbb-blog-${post.id || "image"}`,
  };
};

const editPost = (post) => {
  editingId.value = post.id;
  Object.assign(form, {
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    image: null,
    image_url: post.image_url || "",
    imagePreview: "",
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const savePost = async () => {
  if (!form.title.trim())
    return addToast("Vui lòng nhập tiêu đề bài viết.", "warning");
  const data = new FormData();
  data.append("title", form.title);
  data.append("excerpt", form.excerpt);
  data.append("content", form.content);
  data.append("author_id", String(currentUser.id || ""));
  if (form.image) data.append("image", form.image);
  try {
    const config = { headers: authHeaders() };
    if (editingId.value)
      await axios.put(`${API}/blog/${editingId.value}`, data, config);
    else await axios.post(`${API}/blog`, data, config);
    addToast(
      editingId.value ? "Đã cập nhật bài viết." : "Đã đăng khoảnh khắc mới.",
      "success",
    );
    resetForm();
    await loadPosts();
  } catch (error) {
    const message = error.response?.data?.message;
    addToast(
      Array.isArray(message)
        ? message.join(", ")
        : message || "Không thể lưu bài viết.",
      "error",
    );
  }
};

const removePost = async (id) => {
  if (
    !(await openConfirm("Xóa vĩnh viễn khoảnh khắc này?", {
      title: "Xóa bài viết?",
      tone: "danger",
      confirmText: "Xóa bài viết",
    }))
  )
    return;
  try {
    await axios.delete(`${API}/blog/${id}`, { headers: authHeaders() });
    addToast("Đã xóa bài viết.", "success");
    await loadPosts();
  } catch (error) {
    addToast(
      error.response?.data?.message || "Không thể xóa bài viết.",
      "error",
    );
  }
};

onMounted(loadPosts);
</script>
