# Test Plan — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

## 1. Phạm vi
**Kiểm:** tạo phiếu bảo hành (UC2); QT01 thời hạn bảo hành; QT02 hạn cam kết (chỉ tính thứ Hai–thứ Bảy); QT03 một thiết bị chỉ một phiếu chưa đóng và ghi lịch sử trạng thái; kiểm tra dữ liệu vào (400); phân quyền theo vai trò và theo trung tâm (OWASP A01); che số điện thoại (NFR2); tái lập khi chạy migrate + seed lần hai.

**CHỦ Ý KHÔNG kiểm:** giao diện React (có bộ test riêng ở `src/frontend/tests`, không tính vào 12 test case của BT3); hiệu năng và tải, rà soát bảo mật đầy đủ (thuộc Chuyên đề tốt nghiệp 2); đề xuất phân loại tự động US4 (chưa làm, ghi ở `docs/api-contract.md`).

## 2. Loại test và số lượng
**7 unit** (hàm thuần, không CSDL) · **3 integration** (service + repository + PostgreSQL thật) · **2 API** (HTTP vào app Express + PostgreSQL thật, có đăng nhập) · **+1 test hồi quy** (TC-13, sinh ra từ BUG-004).
Kỹ thuật chọn dữ liệu: **phân vùng tương đương** cho `issue_desc` (< 10 / 10–2000 / > 2000 ký tự) và **giá trị biên** cho QT01 (01/03/2027 còn hạn, 02/03/2027 hết hạn) và QT02 (nhận thứ Bảy, mức CAO).
Đủ 5 loại BT3: luồng đúng ×4 (TC-01, 02, 08, 12) · biên ×3 (TC-03, 04, 05) · dữ liệu sai ×3 (TC-06, 07, 09) · bảo mật ×1 (TC-11) · tái lập ×1 (TC-10). Mỗi quy tắc đã hiện thực (QT01, QT02, QT03) có ≥ 1 test.

## 3. Tiêu chí thành công (đặt TRƯỚC khi chạy)
- 12/12 test case có kết quả thực tế và ảnh chụp; QT01, QT02, QT03 mỗi quy tắc có ≥ 1 test luồng đúng và ≥ 1 test biên hoặc dữ liệu sai.
- Không còn bug Critical đang mở; bug Major còn lại có lý do và hướng xử lý.
- `npm test` chạy PASS toàn bộ bằng một lệnh, kể cả trên CI (GitHub Actions xanh).

## 4. Môi trường và dữ liệu thử
Node.js 22; PostgreSQL 16 (container `db` của `docker-compose.yml`, cổng 5433), dùng **CSDL riêng `smartcrm_test`** — không đụng CSDL phát triển.
Dữ liệu: danh mục lấy từ `data/sample/*.csv` qua `migrate.js` + `seed.js`; dữ liệu giao dịch (2 khách, 3 thiết bị) dựng bằng code trong `tests/helpers/db.js` và **dọn lại trước MỖI test** (`resetDb`). Ngày mua thiết bị tính tương đối so với hôm nay để test không hết hạn theo thời gian.
Lệnh chạy: `docker compose up -d db` rồi `npm test`. CI: `.github/workflows/ci.yml`.