<template>
  <div>
    <div class="page-top journal-heading">
      <div>
        <p class="eyebrow mb-2">Nhật ký FC Đá Bay Bóng</p>
        <h1 class="page-heading">Những khoảnh khắc thành ký ức.</h1>
        <p class="page-intro">
          Một trận hay, một bàn đẹp, một tối cùng đồng đội. Giữ lại câu chuyện
          và cả album ảnh của đội.
        </p>
      </div>
      <button v-if="isAdmin && !editorOpen" class="btn" @click="startPost">
        <ClubIcon name="plus" />Viết bài mới
      </button>
    </div>
    <section
      v-if="editorOpen && isAdmin"
      ref="editorPanel"
      class="panel blog-editor mb-7"
    >
      <div class="section-head">
        <div>
          <h2>
            {{ editingId ? "Chỉnh sửa bài viết" : "Ghi lại một khoảnh khắc" }}
          </h2>
          <p class="hint">
            Ảnh đầu tiên là ảnh bìa. Có thể giữ, thêm hoặc sắp xếp lại ảnh trước
            khi lưu.
          </p>
        </div>
        <button
          type="button"
          class="icon-btn"
          @click="cancelEdit"
          aria-label="Đóng soạn bài"
        >
          <ClubIcon name="close" />
        </button>
      </div>
      <form @submit.prevent="savePost" class="stack">
        <div v-if="saveError" class="error-state" role="alert">
          {{ saveError }}
        </div>
        <label
          ><span class="field-label">Tiêu đề</span
          ><input
            v-model="form.title"
            :disabled="saving"
            class="field"
            maxlength="200"
            required
            placeholder="Ví dụ: Một tối rực lửa ở sân Thống Nhất"
        /></label>
        <label
          ><span class="field-label">Mô tả ngắn</span
          ><input
            v-model="form.excerpt"
            :disabled="saving"
            class="field"
            maxlength="500"
            placeholder="Điều đáng nhớ nhất của buổi đá…"
        /></label>
        <label
          ><span class="field-label">Câu chuyện</span
          ><textarea
            v-model="form.content"
            :disabled="saving"
            class="field"
            rows="7"
            maxlength="30000"
            placeholder="Kể lại diễn biến, những pha bóng và câu chuyện của đội…"
          ></textarea>
        </label>
        <div class="section-head mb-0">
          <div>
            <h3 class="text-base font-semibold mb-0">
              Album ảnh <span class="badge ml-2">{{ photos.length }} / 12</span>
            </h3>
            <p class="hint">JPG, PNG, WEBP hoặc GIF. Tối đa 8 MB mỗi ảnh.</p>
          </div>
          <label class="btn secondary cursor-pointer"
            ><ClubIcon name="image" />Thêm ảnh<input
              ref="fileInput"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="sr-only"
              aria-label="Thêm ảnh cho bài viết"
              @change="addPhotos"
              :disabled="saving"
          /></label>
        </div>
        <div v-if="photos.length" class="photo-editor-grid">
          <figure
            v-for="(photo, i) in photos"
            :key="photo.key"
            class="photo-editor-item"
          >
            <img
              :src="resolveMediaUrl(photo.url)"
              :alt="`Ảnh ${i + 1} trong album đang soạn`"
            />
            <figcaption>
              <span class="badge" :class="i === 0 ? 'green' : ''">{{
                i === 0 ? "Ảnh bìa" : `Ảnh ${i + 1}`
              }}</span>
              <div class="flex gap-1">
                <button
                  v-if="i > 0"
                  type="button"
                  class="icon-btn"
                  @click="movePhoto(i, -1)"
                  :aria-label="`Đưa ảnh ${i + 1} về trước`"
                  :disabled="saving"
                >
                  <ClubIcon name="arrow" class="rotate-180" /></button
                ><button
                  v-if="i < photos.length - 1"
                  type="button"
                  class="icon-btn"
                  @click="movePhoto(i, 1)"
                  :aria-label="`Đưa ảnh ${i + 1} ra sau`"
                  :disabled="saving"
                >
                  <ClubIcon name="arrow" /></button
                ><button
                  type="button"
                  class="icon-btn"
                  @click="removePhoto(i)"
                  :aria-label="`Bỏ ảnh ${i + 1}`"
                  :disabled="saving"
                >
                  <ClubIcon name="close" />
                </button>
              </div>
            </figcaption>
            <button
              v-if="i > 0"
              type="button"
              class="photo-cover-action"
              @click="makeCover(i)"
              :disabled="saving"
            >
              Đặt làm ảnh bìa
            </button>
          </figure>
        </div>
        <div v-else class="empty-state !py-7">
          <ClubIcon name="image" class="mx-auto !h-8 !w-8" />
          <p class="mb-0 mt-2">
            Thêm nhiều ảnh cùng lúc để tạo album. Bạn cũng có thể đăng bài chỉ
            có nội dung.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" class="btn" :disabled="saving">
            {{
              saving
                ? `Đang lưu${uploadProgress ? ` ${uploadProgress}%` : ""}…`
                : editingId
                  ? "Lưu thay đổi"
                  : "Đăng bài viết"
            }}</button
          ><button
            type="button"
            class="btn secondary"
            @click="cancelEdit"
            :disabled="saving"
          >
            Hủy chỉnh sửa
          </button>
        </div>
      </form>
    </section>
    <div class="journal-toolbar">
      <label
        ><span class="field-label">Tìm trong nhật ký</span
        ><input
          v-model="search"
          class="field"
          type="search"
          placeholder="Tên trận, câu chuyện hoặc đồng đội…" /></label
      ><label
        ><span class="field-label">Sắp xếp</span
        ><select v-model="sort" class="field">
          <option value="newest">Mới nhất trước</option>
          <option value="oldest">Cũ nhất trước</option>
        </select></label
      >
      <p class="journal-count">
        <strong>{{ posts.length }}</strong> bài viết
        <span aria-hidden="true">/</span> <strong>{{ totalPhotos }}</strong> ảnh
      </p>
    </div>
    <div v-if="loadError" class="error-state" role="alert">
      {{ loadError }}
      <button class="btn secondary" @click="loadPosts">Thử lại</button>
    </div>
    <div v-if="loading" class="empty-state" role="status">
      Đang mở nhật ký đội bóng…
    </div>
    <div v-else-if="!filteredPosts.length" class="empty-state">
      <ClubIcon name="book" class="mx-auto !h-9 !w-9" />
      <h2 class="text-lg font-bold mt-3">
        {{
          search
            ? "Chưa có câu chuyện phù hợp"
            : "Nhật ký đang chờ câu chuyện đầu tiên"
        }}
      </h2>
      <p class="mb-0">
        {{
          search
            ? "Thử một từ khóa khác để tìm lại khoảnh khắc."
            : "Ghi lại buổi đá, thêm album và chia sẻ với cả đội."
        }}
      </p>
    </div>
    <section v-else class="journal-feed" aria-label="Bài viết của đội">
      <article
        v-for="(post, i) in filteredPosts"
        :key="post.id"
        class="journal-post"
        :class="{ featured: i === 0 }"
      >
        <div
          v-if="post.images.length"
          class="post-mosaic"
          :class="{ 'has-side': post.images.length >= 3 }"
        >
          <button
            v-for="(url, index) in post.images.slice(
              0,
              post.images.length >= 3 ? 3 : 1,
            )"
            :key="url"
            class="post-photo"
            :class="{ cover: index === 0 }"
            @click="openAlbum(post, index)"
            :aria-label="`Xem ảnh ${index + 1} của ${post.title}, ${post.images.length} ảnh${index === 2 && post.images.length > 3 ? ', +' + (post.images.length - 3) + ' ảnh' : ''}`"
          >
            <img
              :src="resolveMediaUrl(url)"
              :alt="`${post.title} — ảnh ${index + 1}`"
              loading="lazy"
            /><span
              v-if="index === 2 && post.images.length > 3"
              class="photo-more"
              >+{{ post.images.length - 3 }} ảnh</span
            ><span v-if="index === 0" class="photo-album-count"
              ><ClubIcon name="image" />{{ post.images.length }} ảnh</span
            >
          </button>
        </div>
        <div v-else class="post-no-photo">
          <ClubIcon name="book" /><span>Câu chuyện của đội</span>
        </div>
        <div class="post-copy">
          <div class="post-meta">
            <span>{{ formatVietnamDate(post.created_at) }}</span
            ><span>{{ post.author_name || "Ban điều hành" }}</span>
          </div>
          <h2>{{ post.title }}</h2>
          <p v-if="post.excerpt" class="post-excerpt">{{ post.excerpt }}</p>
          <details v-if="post.content" class="post-story">
            <summary>Đọc toàn bộ bài viết</summary>
            <p>{{ post.content }}</p>
          </details>
          <button
            v-if="post.images.length"
            class="btn secondary w-fit mt-4"
            @click="openAlbum(post, 0)"
          >
            <ClubIcon name="image" />Xem album ({{ post.images.length }} ảnh)
          </button>
          <div v-if="isAdmin" class="post-admin">
            <button class="btn secondary" @click="editPost(post)">
              <ClubIcon name="edit" />Sửa bài viết</button
            ><button class="btn danger" @click="removePost(post)">
              Xóa bài viết
            </button>
          </div>
        </div>
      </article>
    </section>
    <ImagePreviewModal
      v-if="album"
      :images="album.images"
      :initial-index="album.index"
      :alt="album.title"
      :filename="`fcdbb-blog-${album.id}`"
      @close="album = null"
    />
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import api from "../api";
import ClubIcon from "../components/ClubIcon.vue";
import ImagePreviewModal from "../components/ImagePreviewModal.vue";
import { useToast } from "../composables/useToast";
import { useDialog } from "../composables/useDialog";
import { formatVietnamDate } from "../utils/datetime";
import { resolveMediaUrl } from "../utils/media";
const isAdmin =
    JSON.parse(localStorage.getItem("fcdbb_user") || "{}").role === "admin",
  { addToast } = useToast(),
  { openConfirm } = useDialog();
const posts = ref([]),
  loading = ref(true),
  loadError = ref(""),
  search = ref(""),
  sort = ref("newest"),
  editorOpen = ref(false),
  editorPanel = ref(null),
  editingId = ref(null),
  saving = ref(false),
  saveError = ref(""),
  uploadProgress = ref(0),
  photos = ref([]),
  fileInput = ref(null),
  album = ref(null),
  form = reactive({ title: "", excerpt: "", content: "", revision: null });
let baseline = "";
const snapshot = () =>
  JSON.stringify({
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    photos: photos.value.map((p) => p.key),
  });
const dirty = computed(() => editorOpen.value && snapshot() !== baseline);
const totalPhotos = computed(() =>
  posts.value.reduce((sum, p) => sum + p.images.length, 0),
);
const filteredPosts = computed(() =>
  posts.value
    .filter((p) =>
      `${p.title} ${p.excerpt || ""} ${p.content || ""} ${p.author_name || ""}`
        .toLocaleLowerCase("vi")
        .includes(search.value.toLocaleLowerCase("vi")),
    )
    .sort((a, b) =>
      sort.value === "newest"
        ? new Date(b.created_at) - new Date(a.created_at) || b.id - a.id
        : new Date(a.created_at) - new Date(b.created_at) || a.id - b.id,
    ),
);
const loadPosts = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    posts.value = (await api.get("/blog")).data.map((p) => ({
      ...p,
      images: p.images ?? (p.image_url ? [p.image_url] : []),
    }));
  } catch (e) {
    loadError.value =
      e.response?.data?.message || "Chưa tải được nhật ký. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
};
const releasePhotos = () =>
  photos.value.forEach((p) => {
    if (p.file) URL.revokeObjectURL(p.url);
  });
const resetForm = () => {
  releasePhotos();
  photos.value = [];
  Object.assign(form, { title: "", excerpt: "", content: "", revision: null });
  editingId.value = null;
  saveError.value = "";
  if (fileInput.value) fileInput.value.value = "";
};
const scrollToEditor = async () => {
  await nextTick();
  editorPanel.value?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
};
const canDiscard = () =>
  !dirty.value ||
  openConfirm("Những nội dung và ảnh chưa lưu sẽ bị bỏ.", {
    title: "Bỏ chỉnh sửa bài viết?",
    confirmText: "Bỏ thay đổi",
  });
const startPost = async () => {
  if (!(await canDiscard())) return;
  resetForm();
  editorOpen.value = true;
  baseline = snapshot();
  scrollToEditor();
};
const editPost = async (post) => {
  if (!(await canDiscard())) return;
  resetForm();
  Object.assign(form, {
    title: post.title,
    excerpt: post.excerpt || "",
    content: post.content || "",
    revision: post.revision,
  });
  photos.value = post.images.map((url) => ({ key: crypto.randomUUID(), url }));
  editingId.value = post.id;
  editorOpen.value = true;
  baseline = snapshot();
  scrollToEditor();
};
const cancelEdit = async () => {
  if (saving.value) return;
  if (await canDiscard()) {
    editorOpen.value = false;
    resetForm();
  }
};
onBeforeRouteLeave(canDiscard);
const addPhotos = (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  saveError.value = "";
  if (files.length + photos.value.length > 12) {
    saveError.value = "Mỗi bài viết tối đa 12 ảnh. Bỏ bớt ảnh trước khi thêm.";
    return;
  }
  if (
    files.some(
      (f) =>
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          f.type,
        ) || f.size > 8 * 1024 * 1024,
    )
  ) {
    saveError.value = "Chọn ảnh JPG, PNG, WEBP hoặc GIF, tối đa 8 MB mỗi ảnh.";
    return;
  }
  photos.value.push(
    ...files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    })),
  );
};
const removePhoto = (i) => {
  const [p] = photos.value.splice(i, 1);
  if (p.file) URL.revokeObjectURL(p.url);
};
const movePhoto = (i, step) => {
  const [p] = photos.value.splice(i, 1);
  photos.value.splice(i + step, 0, p);
};
const makeCover = (i) => {
  const [p] = photos.value.splice(i, 1);
  photos.value.unshift(p);
};
const openAlbum = (post, index) => {
  album.value = { ...post, index, images: post.images.map(resolveMediaUrl) };
};
const savePost = async () => {
  saving.value = true;
  saveError.value = "";
  uploadProgress.value = 0;
  const data = new FormData();
  data.append("title", form.title);
  data.append("excerpt", form.excerpt);
  data.append("content", form.content);
  if (editingId.value) data.append("revision", String(form.revision));
  data.append(
    "retained_images",
    JSON.stringify(photos.value.filter((p) => !p.file).map((p) => p.url)),
  );
  let index = 0;
  data.append(
    "image_order",
    JSON.stringify(photos.value.map((p) => (p.file ? index++ : p.url))),
  );
  photos.value
    .filter((p) => p.file)
    .forEach((p) => data.append("images", p.file));
  try {
    const config = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total)
          uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      },
    };
    if (editingId.value)
      await api.put(`/blog/${editingId.value}`, data, config);
    else await api.post("/blog", data, config);
    addToast(
      editingId.value
        ? "Đã cập nhật bài viết và album."
        : "Đã đăng bài viết và album.",
      "success",
    );
    editorOpen.value = false;
    resetForm();
    await loadPosts();
  } catch (e) {
    saveError.value =
      e.response?.status === 413
        ? "Mỗi ảnh tối đa 8 MB, mỗi bài tối đa 12 ảnh."
        : e.response?.data?.message ||
          "Chưa lưu được bài viết. Nội dung đang soạn vẫn được giữ lại.";
  } finally {
    saving.value = false;
  }
};
const removePost = async (post) => {
  if (
    !(await openConfirm(`Xóa bài “${post.title}” và toàn bộ album ảnh?`, {
      title: "Xóa bài viết?",
      confirmText: "Xóa bài viết",
      tone: "danger",
    }))
  )
    return;
  try {
    await api.delete(`/blog/${post.id}`);
    if (editingId.value === post.id) {
      editorOpen.value = false;
      resetForm();
    }
    await loadPosts();
    addToast("Đã xóa bài viết và album.", "success");
  } catch (e) {
    addToast(e.response?.data?.message || "Không xóa được bài viết.", "error");
  }
};
onMounted(loadPosts);
onUnmounted(releasePhotos);
</script>
