# Quản lý trận đấu và mùa giải

## Quy trình sử dụng

1. **Quản trị → Lịch trận:** tạo lịch sân và ba mốc giờ Việt Nam. Có thể nhập trận đã qua để bổ sung lịch sử.
2. **Trận đấu & mùa giải → Quản lý mùa giải:** tạo khoảng ngày cho mùa giải. Có thể sửa tên/ngày hoặc lưu trữ; không xóa lịch sử mùa giải.
3. Mở **Chi tiết & biên bản** của một trận. Bấm **Lập biên bản**, gắn mùa giải và chia cầu thủ thực tế vào đội A/B. Mỗi trận có đội hình riêng, không thay đổi đội hình các trận trước.
4. Thêm bàn thắng, kiến tạo, phút ghi bàn, phản lưới (nếu có), MVP và ghi chú. Điền tỉ số theo các bàn đã ghi hoặc nhập tỉ số trực tiếp.
5. Chọn **Chốt kết quả** rồi lưu. Tỉ số phải khớp số bàn, mỗi đội có ít nhất một cầu thủ và trận đã bắt đầu. Bản nháp và trận hủy không tính bảng xếp hạng.
6. Khi sửa kết quả đã chốt, nhập lý do. Có thể đưa về bản nháp để đối chiếu hoặc chỉnh lịch. Mỗi lần lưu tạo một phiên bản trong nhật ký.

## Tra cứu và thống kê

- Trang chủ mặc định có **12 trận đã qua/trang**; chọn 6/12/24/48 trận. Tìm theo tên trận/sân, lọc mùa giải hoặc trạng thái, chuyển trang để xem toàn bộ lịch sử.
- Chi tiết trận hiển thị đội hình A/B, tỉ số, bên thắng/hòa, diễn biến bàn thắng, MVP, ghi chú và điểm danh GPS: tên, thời điểm, khoảng cách, trạng thái, số giây đi muộn.
- **Đội hình thi đấu** và **điểm danh** là hai dữ liệu riêng: đến sân không đồng nghĩa chắc chắn được xếp vào đội hình. “Nạp người đã điểm danh” hỗ trợ chia luân phiên A/B; admin cần kiểm tra và sửa đội hình thực tế.
- Bảng xếp hạng: thắng 3 điểm, hòa 1, thua 0. Đồng điểm xét hiệu số rồi số bàn thắng. Phong độ hiển thị 5 trận mới nhất, từ trái sang phải.
- Thống kê cầu thủ gồm số trận ra sân, bàn thắng, kiến tạo, MVP và số trận thắng. Bàn phản lưới tính cho đối phương, không tính vào thành tích ghi bàn của cầu thủ.
- **Xuất thống kê** xuất toàn bộ cầu thủ của mùa đang lọc, kể cả khi bảng chỉ hiển thị top 10. **Xuất biên bản** xuất đội hình, bàn thắng, điểm danh và ghi chú. CSV dùng UTF-8 BOM để mở tiếng Việt trong Excel và vô hiệu hóa giá trị có thể bị đọc như công thức.

## Lịch sử và quyền truy cập

- Tên cầu thủ được chụp lại khi lần đầu đưa vào biên bản của trận. Đổi tên hồ sơ không viết lại tên trong biên bản cũ. Xóa tài khoản chưa có điểm danh vẫn giữ bản chụp trong biên bản.
- Nhật ký lưu người sửa (ID và tên tại thời điểm sửa), giờ, lý do, bản trước/sau và bản chụp điểm danh tại thời điểm lưu biên bản. Lịch trận tạo/sửa/xóa cũng được ghi lại. Nhật ký chỉ dành cho admin, không có API sửa/xóa.
- Nhật ký mới không thể tái dựng những chỉnh sửa đã xảy ra trước bản nâng cấp này. Danh sách “chưa có điểm danh” đối chiếu với **thành viên hiện tại**, không khẳng định ai vắng trong đội hình lịch sử.
- Mọi API dữ liệu nội bộ yêu cầu JWT; chỉ `/api/ping` và `/api/auth/login` công khai. Backend kiểm tra tài khoản và quyền hiện tại từ database, không tin vai trò frontend. Thành viên chỉ cập nhật hồ sơ/mật khẩu/avatar của mình; điểm danh luôn dùng ID từ token.
- Trận đã có điểm danh hoặc biên bản không được xóa. Hủy trận qua biên bản để giữ hồ sơ. Thành viên có dữ liệu điểm danh cũng không được xóa.
- Biên bản dùng số `revision` để phát hiện hai phiên sửa đồng thời. Nếu gặp HTTP 409, giữ ghi chú cần thiết rồi tải lại để đối chiếu trước khi lưu tiếp.

## Schema và triển khai

Giữ nguyên các bảng hiện có. Thêm `seasons`, `match_reports`, `match_audit`. Biên bản dùng JSON dạng text tương thích SQLite và PostgreSQL, ràng buộc khóa ngoại tới trận/mùa giải và index để tra cứu.

- **SQLite local:** TypeORM tạo bảng mới bằng cơ chế synchronize sẵn có.
- **PostgreSQL production:** migration `ClubManagement1794900000000` tự chạy khi backend khởi động. Migration chỉ tạo ba bảng mới nếu chưa có, không drop/rebuild bảng cũ. Tài khoản database cần quyền CREATE TABLE/INDEX và REFERENCES. Giữ `TYPEORM_SYNCHRONIZE=false` trên database production.
- Migration không tự tạo mùa giải hay bịa kết quả cho dữ liệu cũ. Admin có thể lập biên bản cho các trận cũ sau khi đối chiếu.
- Trước khi đưa phiên bản lên production, sao lưu database theo quy trình vận hành. Deploy backend trước frontend do frontend mới cần API mới; tải lại/đăng nhập lại nếu token cũ đã hết hạn. Rollback ứng dụng giữ nguyên bảng mới; lệnh down cố ý không xóa dữ liệu audit.
- Việc push nhánh GitHub không tự thay thế cấu hình deployment. Bản này không thay đổi dịch vụ hosting hoặc dữ liệu production.

## API mới

Tất cả đường dẫn có prefix `/api` và header `Authorization: Bearer <token>`.

| Method     | Endpoint                          | Chức năng                                        | Quyền      |
| ---------- | --------------------------------- | ------------------------------------------------ | ---------- |
| GET        | `/seasons`                        | Danh sách mùa giải                               | Thành viên |
| POST / PUT | `/seasons`, `/seasons/:id`        | Tạo/sửa/lưu trữ                                  | Admin      |
| GET        | `/competition/matches`            | `search`, `season`, `status`, `page`, `pageSize` | Thành viên |
| GET        | `/competition/summary?season=:id` | Bảng xếp hạng và thống kê cầu thủ                | Thành viên |
| GET        | `/matches/:id/report`             | Lịch trận và biên bản                            | Thành viên |
| PUT        | `/matches/:id/report`             | Lưu biên bản kèm revision/lý do                  | Admin      |
| GET        | `/matches/:id/audit`              | Nhật ký trước/sau                                | Admin      |

## Kiểm tra

```sh
cd fcdbb-backend
npm ci
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand

cd ../fcdbb-frontend
npm ci
npm run build
npx playwright install chromium
npm test
```

Playwright tự chạy backend cổng 3001 và frontend 5174 với SQLite tạm trong thư mục hệ thống, dọn database sau khi kết thúc. Không dùng `.env` production cho kiểm thử. Nếu máy đã có Chromium, chạy với `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm test`.

GitHub Actions tự build hai ứng dụng, chạy unit/e2e backend, kiểm thử browser và axe cho các luồng chính, kiểm tra bố cục ở 375/768/1024/1440px. Kiểm thử SQLite không thay thế việc xác minh migration trên bản sao PostgreSQL production.
