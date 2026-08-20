# Notification verification

The login page was opened in the local preview and the empty-login validation was triggered. The message `Vui lòng nhập đủ tài khoản và mật khẩu!` appeared in the custom branded toast layer at the top-right instead of a native browser alert. A source search found no remaining `alert(`, `confirm(`, or `prompt(` calls in the Vue views.

The production build completed successfully after adding the shared `DialogPopup` and `useDialog` service.
