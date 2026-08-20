import { ref } from 'vue';

const dialog = ref(null);
let resolver = null;

const finish = (value) => {
  const resolve = resolver;
  resolver = null;
  dialog.value = null;
  resolve?.(value);
};

export function useDialog() {
  const openConfirm = (message, options = {}) => new Promise((resolve) => {
    resolver = resolve;
    dialog.value = {
      mode: 'confirm',
      title: options.title || 'Xác nhận thao tác',
      message,
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText || 'Hủy',
      tone: options.tone || 'warning',
    };
  });

  const openPrompt = (message, options = {}) => new Promise((resolve) => {
    resolver = resolve;
    dialog.value = {
      mode: 'prompt',
      title: options.title || 'Nhập thông tin',
      message,
      confirmText: options.confirmText || 'Lưu lại',
      cancelText: options.cancelText || 'Hủy',
      placeholder: options.placeholder || '',
      inputType: options.inputType || 'text',
      tone: options.tone || 'info',
      initialValue: options.initialValue || '',
    };
  });

  const close = (value = false) => finish(value);

  return { dialog, openConfirm, openPrompt, close };
}
