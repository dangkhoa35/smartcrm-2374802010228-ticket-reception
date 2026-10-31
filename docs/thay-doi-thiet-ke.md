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
  DDL đã chạy thử trên PostgreSQL, lưu ở db/migrations/001_init.sql.

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