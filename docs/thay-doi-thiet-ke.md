# Nhật ký thay đổi thiết kế

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

### TD-01 Đưa US8 (ghi chú trao đổi) sang phạm vi sau
- Phản hồi của GV: Có 8 User Story, đề yêu cầu 5–7; có thể đưa US8 vào phạm vi sau.
- Quyết định: SỬA
- Lý do: US8 là COULD, không phục vụ luồng chính tạo/xem phiếu; giữ lại làm lệch
  phạm vi so với yêu cầu 5–7 User Story.
- Ảnh hưởng: Còn 7 US; bỏ FR8, UC8, bảng ticket_note (ERD 6 → 5 bảng), phần ghi chú
  ở wireframe Chi tiết, cập nhật bảng truy vết 1.6, srs.md, erd.drawio, usecase.drawio.

### TD-02 Sửa DDL mục 4.8 chạy được trên PostgreSQL
- Phản hồi của GV: DDL kết thúc câu lệnh bằng dấu phẩy thay vì dấu chấm phẩy nên không chạy được.
- Quyết định: SỬA
- Lý do: DDL là đầu vào trực tiếp của migration ở Sprint 1; phải chạy được nguyên văn.
- Ảnh hưởng: Thay "," bằng ";" ở cuối mọi CREATE TABLE / CREATE INDEX / ALTER TABLE;
  DDL đã chạy thử trên PostgreSQL, lưu ở db/migrations/001_init_schema.sql.

### TD-03 Bổ sung ngày vào bảng khai báo AI
- Phản hồi của GV: Dòng cam kết phụ AI thiếu ngày.
- Quyết định: SỬA
- Lý do: Cam kết phải truy vết được thời điểm sử dụng.
- Ảnh hưởng: Thêm cột "Ngày" và ngày ký cam kết trong ai-disclosure.md.

### TD-04 Viết cụ thể cột "Em đã kiểm chứng / chỉnh sửa gì"
- Phản hồi của GV: Cột này lặp một câu chung cho mọi mục.
- Quyết định: SỬA
- Lý do: Phải nêu được đã sửa cụ thể điều gì.
- Ảnh hưởng: Viết lại từng dòng trong ai-disclosure.md.

### TD-05 Bổ sung docs/api-contract.md
- Phản hồi của GV: Repo chưa có api-contract.md dù bài viết có dẫn đường dẫn.
- Quyết định: SỬA
- Lý do: Mục 3 của SRS tham chiếu hợp đồng API giữa giao diện và lớp API.
- Ảnh hưởng: Thêm docs/api-contract.md cho POST /api/tickets, khớp luồng 3b, 7a, 8a, 8b, 9a.

### TD-06 Rút gọn srs.md
- Phản hồi của GV: Bài dài 25 trang, gần gấp 3 đỉnh ý.
- Quyết định: SỬA một phần
- Lý do: Bản Word đã nộp giữ nguyên làm bằng chứng; bản srs.md trong repo là bản làm việc.
- Ảnh hưởng: Rút gọn srs.md, chuyển bảng chi tiết xuống phụ lục.

## Thay đổi trong Giai đoạn 2 (Sprint 1–2, BT2)

### TD-07 Thêm ba bảng danh mục: service_center, employee, technician
- Phát hiện khi: nạp bộ dữ liệu của học phần ở Sprint 1.
- Quyết định: SỬA (bổ sung)
- Lý do: Bộ dữ liệu có trung tâm, nhân viên và kỹ thuật viên; phiếu cần khóa ngoại tới chúng để kiểm tra quyền theo trung tâm và phê duyệt.
- Ảnh hưởng: ERD từ 5 lên 8 bảng; thêm migration 002; seed nạp 6 trung tâm, 38 kỹ thuật viên, 60 mã nhân viên.

### TD-08 Đổi định dạng lỗi từ details sang fields
- Phát hiện khi: làm hợp đồng ở ranh giới giữa giao diện và API.
- Quyết định: SỬA (thay đổi phá vỡ, đổi một lần vì chưa có bên gọi nào dùng details)
- Lý do: Giao diện hiện lỗi ngay cạnh từng ô nhập nên tra theo tên trường; một định dạng lỗi ba trường cố định `error`, `message`, `fields`.
- Ảnh hưởng: `api-contract.md` v1.2; thêm CORS; tách `contracts/` và `validators/` (zod).

### TD-09 Sửa các chỗ đứt gãy khi tích hợp end-to-end
- Phát hiện khi: chạy luồng chính trên giao diện và dữ liệu thật (xem `docs/e2e-luong-chinh.md`).
- Quyết định: SỬA
- Lý do: Danh sách hiện phiếu cũ đã đóng ở đầu; khách mới không thêm được thiết bị; mã phê duyệt sai báo lỗi hệ thống 500; phân công không ghi kỹ thuật viên; ngày hiện năm 2 chữ số.
- Ảnh hưởng: `api-contract.md` v1.3: thêm tham số `open=true` cho EP5, thêm EP9 (thêm thiết bị) và EP10 (danh sách kỹ thuật viên), kiểm tra người phê duyệt trả 422, `DA_PHAN_CONG` bắt buộc `technician_id`, trả thêm `technician_name`, năm 4 chữ số.

### TD-10 Hoãn đề xuất nhóm sự cố từ mô tả (US4)
- Quyết định: HOÃN
- Lý do: US4 là SHOULD, không chặn luồng tạo phiếu; ưu tiên cho luồng chính chạy ổn định, có kiểm thử và chạy lại được.
- Ảnh hưởng: Người dùng chọn nhóm sự cố thủ công từ EP8; mục "Đề xuất phân loại" trong `api-contract.md` ghi "Chưa làm".

### TD-11 Hoãn lọc nâng cao và lịch sử thiết bị (US7)
- Quyết định: HOÃN
- Lý do: Cùng lý do TD-10; danh sách đã có lọc theo trạng thái và "Đang mở", đủ cho câu hỏi chính của màn hình.
- Ảnh hưởng: Chưa có lọc `overdue`, `assignee_id`, serial; chưa có lịch sử trạng thái trên màn chi tiết và cảnh báo lỗi lặp lại.

### TD-12 Thay header tự khai bằng đăng nhập JWT
- Phát hiện khi: rà soát bảo mật trước BT2.
- Quyết định: SỬA (thay đổi phá vỡ; giao diện là bên gọi duy nhất nên đổi một lần)
- Lý do: Header `x-role` tự khai cho phép ai cũng giả làm Quản lý; vai trò phải đến từ token do máy chủ ký.
- Ảnh hưởng: `api-contract.md` v1.5: thêm EP11 đăng nhập, EP12 đăng ký, EP13 danh sách trung tâm; token HS256 hết hạn 30 phút; mật khẩu băm scrypt; migration 003 thêm `username`, `password_hash`, `is_active`, `created_at` vào `employee`; yêu cầu không token bị 401; thêm trang đăng nhập và đăng ký.

## Sau phản hồi Bài tập 2 (buổi 14, ngày 06/11/2026)

### TD-13 Ghi nhận phản hồi BT2: không có lỗi cần khắc phục
- Nhận xét của giảng viên: Điểm mạnh về giao dịch ghi phiếu + dòng lịch sử đầu tiên, vòng đời 7 trạng thái chỉ đi tới, 13 endpoint, 3 vai trò, React 5 trang đủ 3 trạng thái, bộ xử lý lỗi có mã tra cứu, Docker Compose 4 dịch vụ có healthcheck; mục "Cần khắc phục": không có lỗi đáng kể; bảng 4.2 đạt đủ mục chung và mục theo track.
- Quyết định: GIỮ NGUYÊN thiết kế và mã của BT2, không sửa theo phản hồi.
- Lý do: Không có nhận xét cần xử lý. Tuy vậy phản hồi tốt không có nghĩa là không còn lỗi: bộ test BT3 (buổi 13–14) kiểm các tình huống biên mà BT2 chưa kiểm; lỗi tìm thấy khi kiểm thử được ghi ở `docs/bug-log.md`, không ghi ở đây.
- Ảnh hưởng: Không đổi `api-contract.md` hay cấu trúc. Giữ cách làm đã được khen cho BT3: ảnh minh chứng chụp từ bản clone theo tag (`v1.0`).