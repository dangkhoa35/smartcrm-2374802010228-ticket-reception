# Luồng chính chạy end-to-end (buổi 10)

Phân hệ L2 – Tiếp nhận và phân loại yêu cầu bảo hành. Chạy cục bộ trên dữ liệu mẫu thật (7 file CSV nạp vào PostgreSQL bằng `npm run migrate`, `npm run seed`, `npm run import:history`).

**Môi trường:** backend `http://localhost:3000`, giao diện `http://localhost:5173`, trung tâm 1.
**Dữ liệu nền:** 6 trung tâm, 38 kỹ thuật viên, 60 mã nhân viên, 6.443 khách hàng, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử trạng thái.

## 1. Luồng chính (UC2 tạo phiếu → UC6 phân công)

| # | Vai trò | Thao tác (đầu vào) | Kết quả quan sát (đầu ra) | API | Ảnh |
|---|---|---|---|---|---|
| 1 | Nhân viên tiếp nhận (NV 1, TT 1) | Vào `/tickets/new`, chọn khách hàng **dao kieu lam** | Hiện hồ sơ: `dao kieu lam · 091****959 · 1234 đường cách mạng tháng 8` (số điện thoại bị che theo NFR2) | EP1 (tra cứu), EP2 (tạo mới nếu chưa có) | `buoi10-tao_phieu.png` |
| 2 | Nhân viên tiếp nhận | Xem danh sách thiết bị của khách | Khách chưa có thiết bị: hiện câu "Khách hàng này chưa có thiết bị nào trong hệ thống…" kèm biểu mẫu **Thêm thiết bị mới** (trạng thái rỗng có hành động) | EP3 | `buoi10-tao_phieu.png` |
| 3 | Nhân viên tiếp nhận | Thêm thiết bị: tên `tai nghe`, serial `1112233345`, ngày mua `25/10/2026`, bảo hành `12` tháng | Thiết bị được lưu và chọn sẵn; hiện "Ngày mua: 25/10/2026 · Bảo hành: 12 tháng · Tình trạng: Còn bảo hành" | EP9 (`201`) | `buoi10-loi_serial.png` |
| 4 | Nhân viên tiếp nhận | Thử thêm thiết bị thứ hai `laptop MSI` với **cùng serial** `1112233345` | Lỗi hiện ngay dưới ô serial: "Số serial này đã được đăng ký cho một thiết bị khác"; biểu mẫu vẫn còn để sửa | EP9 (`409 SERIAL_DA_TON_TAI`) | `buoi10-loi_serial.png` |
| 5 | Nhân viên tiếp nhận | Mô tả lỗi `tai nghe hư một bên`, nhóm sự cố **Phần mềm**, phụ kiện **Khác**, bấm **Lưu phiếu bảo hành** | Chuyển sang `/tickets/7802`, thông báo "Đã tạo phiếu bảo hành **BH-007802/2026**"; trạng thái **Mới**; mức ưu tiên Trung bình; ngày tiếp nhận 20:27 25/10/2026; hạn cam kết **20:27 28/10/2026** (Còn 2 ngày, hệ thống tự tính theo QT02); bảo hành "Còn bảo hành"; kỹ thuật viên "Chưa phân công" | EP4 (`201`), EP7 | `buoi10-chi_tiet_phieu.png` |
| 6 | Nhân viên tiếp nhận | Mở `/tickets` | Mặc định lọc **Đang mở** (ẩn phiếu đã đóng, đã hủy); ô lọc có "Đang mở", "Tất cả" và từng trạng thái; dòng "15 phiếu quá hạn trong trang này"; các phiếu quá hạn của dữ liệu 2024 nằm trên cùng | EP5 (`open=true`) | `buoi10-danh_sach.png` |
| 7 | Kỹ thuật viên | Đổi vai trò, mở `/tickets/7802`, chọn trạng thái **Đã phân công** | Xuất hiện ô **Kỹ thuật viên phụ trách**; danh sách chọn có `Phan Kim Hạnh (KT033)` | EP7, EP10 | `buoi10-phan_cong_ktv.png` |
| 8 | Kỹ thuật viên | Chọn `Phan Kim Hạnh (KT033)` rồi bấm **Cập nhật** | Theo hợp đồng API: `200`, `status = DA_PHAN_CONG`, `technician_id = 33`, `technician_name = Phan Kim Hạnh`; chi tiết phiếu hiện tên kỹ thuật viên thay vì "Chưa phân công". **[CẦN XÁC NHẬN bằng ảnh chụp sau khi bấm Cập nhật rồi sửa dòng này thành kết quả quan sát]** | EP6 (`PATCH`, kèm `technician_id`) | (chưa có) |

## 2. Các nhánh lỗi đã thử trên giao diện

| # | Tình huống | Đầu vào | Kết quả quan sát | API | Ảnh |
|---|---|---|---|---|---|
| L1 | Thiết bị hết bảo hành, mã phê duyệt sai | Khách `hà dang khoa` (090****368), thiết bị `iphone 12` (serial `IP124NS31`, ngày mua 25/10/2026, bảo hành 0 tháng), mã Quản lý phê duyệt `99999`, mô tả `vỡ màn hình`, nhóm Màn hình | Hiện "Hết bảo hành"; lỗi nằm ngay dưới ô mã phê duyệt: "Mã phê duyệt không phải của một Quản lý trung tâm thuộc trung tâm này" (không còn báo "Hệ thống đang gặp sự cố") | EP4 (`422 NGUOI_PHE_DUYET_KHONG_HOP_LE`) | `buoi10-loi_BH.png` |
| L2 | Backend không chạy | Tắt backend, mở `/tickets` | Khung lỗi "Không tải được dữ liệu – Không kết nối được tới hệ thống. Kiểm tra mạng và bảo đảm máy chủ đang chạy, rồi bấm Thử lại" kèm nút **Thử lại** | – | `buoi10-loi_backend.png` |

## 3. Chỗ đứt gãy phát hiện khi tích hợp

| Triệu chứng | Loại | Khắc phục |
|---|---|---|
| Danh sách mặc định hiện phiếu cũ đã đóng ở đầu, phiếu mới nằm trang cuối | Logic | EP5 thêm `open=true`; giao diện mặc định "Đang mở" |
| Khách mới không thêm được thiết bị nên không tạo được phiếu | Thiếu chức năng | Thêm EP9 và biểu mẫu thêm thiết bị |
| Mã phê duyệt không tồn tại báo lỗi hệ thống (500) | Logic | Kiểm tra người phê duyệt, trả `422 NGUOI_PHE_DUYET_KHONG_HOP_LE` |
| Chuyển "Đã phân công" nhưng phiếu không có kỹ thuật viên | Logic | Bắt buộc `technician_id`, ghi vào phiếu; thêm EP10 |
| Chi tiết phiếu hiện "Kỹ thuật viên: 20" | Hợp đồng dữ liệu | EP5, EP7 trả thêm `technician_name` |
| Ngày hiện năm 2 chữ số (1/9/24) | Hiển thị | `formatDateTime` dùng năm 4 chữ số |

Chi tiết hợp đồng: `docs/diagrams/api-contract.md` v1.3 (mục 1.13). Phần đã cắt: `docs/diagrams/thay-doi-thiet-ke.md` (TD-09 đến TD-12).

## 4. Kiểm thử

- Backend: `npm test` → `tests 48`, `pass 48`, `fail 0`.
- Giao diện: `npm test --prefix src/frontend` → 7 file test, 36 test PASS.
