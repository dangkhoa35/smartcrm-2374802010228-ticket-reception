# Test Report — Luồng L2 (track SE)

> **Cách dùng:** mỗi test case có 8 cột theo mẫu buổi 13. Cột 1–6 đã viết sẵn từ code test; **cột 7 (Kết quả thực tế) và cột 8 (PASS/FAIL) em chỉ điền SAU KHI chạy thật bằng lệnh ghi dưới mỗi test case**, rồi chụp ảnh lưu `docs/screenshots/TC-xx.png`. Khác mong đợi ở bất kỳ điểm nào là FAIL.

> Chạy cả bộ: `npm test` · Chạy riêng một test case: lệnh ở dòng "Lệnh chạy" của từng mục.

| Mã | Loại | Tầng | Mức ưu tiên | Kết quả | Ảnh |
|---|---|---|---|---|---|
| TC-01 | QT01 – luồng đúng | unit | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-01.png |
| TC-02 | QT02 – luồng đúng | unit | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-02.png |
| TC-03 | QT01 – biên (ngày cuối hạn) | unit | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-03.png |
| TC-04 | QT01 – biên (sau hạn 1 ngày) | unit | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-04.png |
| TC-05 | QT02 – biên (bỏ qua Chủ nhật) | unit | Trung bình | _(điền sau khi chạy)_ | docs/screenshots/TC-05.png |
| TC-06 | Dữ liệu sai – mô tả lỗi quá ngắn | unit | Trung bình | _(điền sau khi chạy)_ | docs/screenshots/TC-06.png |
| TC-07 | Dữ liệu sai – thiếu mô tả lỗi | unit | Trung bình | _(điền sau khi chạy)_ | docs/screenshots/TC-07.png |
| TC-08 | QT03/QT02 – luồng đúng (lưu CSDL) | integration | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-08.png |
| TC-09 | QT03 – xung đột phiếu mở (kiểm tác dụng phụ) | integration | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-09.png |
| TC-10 | Tái lập – migrate + seed lần hai | integration | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-10.png |
| TC-11 | Bảo mật A01 – kiểm soát truy cập | api | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-11.png |
| TC-12 | API – luồng đúng tạo phiếu | api | Cao | _(điền sau khi chạy)_ | docs/screenshots/TC-12.png |
| TC-13 | Hồi quy BUG-004 – cộng tháng không tràn | unit | Trung bình | _(điền sau khi chạy)_ | docs/screenshots/TC-13.png |

## TC-01 — QT01 – luồng đúng

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-01 |
| 2. Tiền điều kiện | Không cần CSDL. Thiết bị mua 01/03/2026, bảo hành 12 tháng. |
| 3. Các bước | 1. Gọi isUnderWarranty(thiết bị, ngày tiếp nhận 28/02/2027 09:00) |
| 4. Dữ liệu thử | `purchase_date = 01/03/2026; warranty_months = 12; receivedAt = 28/02/2027 09:00` |
| 5. Kết quả mong đợi | Trả về true (còn bảo hành) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-01.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-01" tests/bt3/unit.test.js`

## TC-02 — QT02 – luồng đúng

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-02 |
| 2. Tiền điều kiện | Không cần CSDL. |
| 3. Các bước | 1. Gọi computeDueDate(thứ Sáu 06/11/2026 09:00 +07, "CAO") |
| 4. Dữ liệu thử | `receivedAt = 2026-11-06T09:00:00+07:00; priority = CAO` |
| 5. Kết quả mong đợi | Hạn cam kết = thứ Bảy 07/11/2026 09:00 (+07) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-02.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-02" tests/bt3/unit.test.js`

## TC-03 — QT01 – biên (ngày cuối hạn)

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-03 |
| 2. Tiền điều kiện | Không cần CSDL. Hạn bảo hành của thiết bị là ngày 01/03/2027. |
| 3. Các bước | 1. Gọi isUnderWarranty(thiết bị, tiếp nhận 01/03/2027 09:00) |
| 4. Dữ liệu thử | `purchase_date = 01/03/2026; warranty_months = 12; receivedAt = 01/03/2027 09:00` |
| 5. Kết quả mong đợi | Trả về true: QT01 dùng dấu ≤ nên đúng ngày cuối hạn VẪN còn bảo hành |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-03.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-03" tests/bt3/unit.test.js`

## TC-04 — QT01 – biên (sau hạn 1 ngày)

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-04 |
| 2. Tiền điều kiện | Như TC-03. |
| 3. Các bước | 1. Gọi isUnderWarranty(thiết bị, tiếp nhận 02/03/2027 09:00) |
| 4. Dữ liệu thử | `receivedAt = 02/03/2027 09:00` |
| 5. Kết quả mong đợi | Trả về false (hết bảo hành) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-04.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-04" tests/bt3/unit.test.js`

## TC-05 — QT02 – biên (bỏ qua Chủ nhật)

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-05 |
| 2. Tiền điều kiện | Không cần CSDL. |
| 3. Các bước | 1. Gọi computeDueDate(thứ Bảy 07/11/2026 15:00 +07, "CAO") |
| 4. Dữ liệu thử | `receivedAt = 2026-11-07T15:00:00+07:00; priority = CAO` |
| 5. Kết quả mong đợi | Hạn = thứ Hai 09/11/2026 15:00 (+07), Chủ nhật không được tính |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-05.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-05" tests/bt3/unit.test.js`

## TC-06 — Dữ liệu sai – mô tả lỗi quá ngắn

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-06 |
| 2. Tiền điều kiện | Không cần CSDL. |
| 3. Các bước | 1. Chạy parseOrThrow(createTicketSchema, dữ liệu có issue_desc 9 ký tự) |
| 4. Dữ liệu thử | `issue_desc = "aaaaaaaaa" (9 ký tự); các trường khác hợp lệ` |
| 5. Kết quả mong đợi | Ném lỗi status 400, code DU_LIEU_KHONG_HOP_LE, fields.issue_desc chứa "tối thiểu 10 ký tự" |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-06.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-06" tests/bt3/unit.test.js`

## TC-07 — Dữ liệu sai – thiếu mô tả lỗi

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-07 |
| 2. Tiền điều kiện | Không cần CSDL. |
| 3. Các bước | 1. Chạy parseOrThrow(createTicketSchema, dữ liệu KHÔNG có trường issue_desc) |
| 4. Dữ liệu thử | `{ customer_id: 1, device_id: 1 }` |
| 5. Kết quả mong đợi | Ném lỗi status 400; fields.issue_desc = "Vui lòng mô tả lỗi" |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-07.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-07" tests/bt3/unit.test.js`

## TC-08 — QT03/QT02 – luồng đúng (lưu CSDL)

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-08 |
| 2. Tiền điều kiện | CSDL smartcrm_test đã resetDb + seedFixtures; thiết bị id=1 còn bảo hành, chưa có phiếu; bảng ticket và ticket_status_log trống. |
| 3. Các bước | 1. Gọi ticketService.createTicket(...) với tư cách Nhân viên tiếp nhận (trung tâm 1)<br>2. Đọc lại dòng vừa lưu trong bảng ticket và ticket_status_log |
| 4. Dữ liệu thử | `{ customer_id: 1, device_id: 1, issue_desc: "Màn hình bị sọc ngang sau khi rơi", priority: "CAO", accessories: ["SAC"] }` |
| 5. Kết quả mong đợi | Phiếu mã dạng BH-XXXXXX/YYYY; status MOI; is_warranty = true; hạn cách giờ nhận 24 hoặc 48 giờ và không rơi vào Chủ nhật; ticket_status_log đúng 1 dòng (from NULL → MOI, changed_by = 1) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-08.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-08" tests/bt3/integration.test.js`

## TC-09 — QT03 – xung đột phiếu mở (kiểm tác dụng phụ)

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-09 |
| 2. Tiền điều kiện | Thiết bị id=1 đang có phiếu ở trạng thái DANG_XU_LY (dựng bằng SQL). Ghi lại số dòng ticket và ticket_status_log TRƯỚC khi chạy. |
| 3. Các bước | 1. Gọi ticketService.createTicket(...) cho CÙNG thiết bị id=1<br>2. Đếm lại ticket và ticket_status_log |
| 4. Dữ liệu thử | `{ customer_id: 1, device_id: 1, issue_desc: "Máy không lên nguồn nữa" }` |
| 5. Kết quả mong đợi | Bị từ chối: status 409, code THIET_BI_DANG_CO_PHIEU_MO; số dòng ticket và ticket_status_log KHÔNG đổi |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-09.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-09" tests/bt3/integration.test.js`

## TC-10 — Tái lập – migrate + seed lần hai

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-10 |
| 2. Tiền điều kiện | CSDL smartcrm_test đã migrate + seed một lần. Ghi lại số dòng các bảng schema_migrations, service_center, issue_category, technician, employee. |
| 3. Các bước | 1. Chạy lại node src/backend/db/migrate.js<br>2. Chạy lại node src/backend/db/seed.js<br>3. Đếm lại số dòng các bảng trên |
| 4. Dữ liệu thử | `DATASET_DIR = data/sample` |
| 5. Kết quả mong đợi | Cả hai lệnh thoát mã 0, không báo lỗi; số dòng mọi bảng giữ nguyên (không nhân đôi) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-10.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-10" tests/bt3/integration.test.js`

## TC-11 — Bảo mật A01 – kiểm soát truy cập

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-11 |
| 2. Tiền điều kiện | Tài khoản tiepnhan (trung tâm 1) đã tạo 1 phiếu (MOI). Tài khoản KTV ktv.tt2 thuộc trung tâm 2 (đăng ký bằng mã đăng ký test). |
| 3. Các bước | 1. KTV trung tâm 2 gọi GET /api/tickets/{id} phiếu của trung tâm 1<br>2. KTV trung tâm 2 gọi PATCH /api/tickets/{id}/status → DA_HUY<br>3. Nhân viên tiếp nhận gọi PATCH cùng đường dẫn<br>4. Gọi GET không kèm token<br>5. Đọc lại phiếu trong CSDL |
| 4. Dữ liệu thử | `to_status = DA_HUY` |
| 5. Kết quả mong đợi | Bước 1 và 2: 404 KHONG_TIM_THAY; bước 3: 403 KHONG_DU_QUYEN; bước 4: 401; phiếu vẫn MOI, ticket_status_log vẫn 1 dòng |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-11.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-11" tests/bt3/api.test.js`

## TC-12 — API – luồng đúng tạo phiếu

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-12 |
| 2. Tiền điều kiện | Đăng nhập tiepnhan; khách id=1, thiết bị id=1 còn bảo hành; bảng ticket trống. |
| 3. Các bước | 1. POST /api/tickets kèm Bearer token<br>2. Đếm bảng ticket<br>3. GET /api/tickets/{ticket_id} |
| 4. Dữ liệu thử | `{ customer_id: 1, device_id: 1, issue_desc: "Pin sụt nhanh, sạc không vào điện", priority: "THAP" }` |
| 5. Kết quả mong đợi | 201; data.ticket_code dạng BH-XXXXXX/YYYY; status MOI; priority THAP; ticket có 1 dòng; GET trả 200 với customer_phone dạng 090****567 (che số) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-12.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-12" tests/bt3/api.test.js`

## TC-13 — Hồi quy BUG-004 – cộng tháng không tràn

| Cột | Nội dung |
|---|---|
| 1. Mã | TC-13 |
| 2. Tiền điều kiện | Không cần CSDL. Thiết bị mua 31/08/2026, bảo hành 6 tháng (hạn đúng là 28/02/2027). |
| 3. Các bước | 1. isUnderWarranty với tiếp nhận 28/02/2027 09:00<br>2. isUnderWarranty với tiếp nhận 02/03/2027 09:00 |
| 4. Dữ liệu thử | `purchase_date = 31/08/2026; warranty_months = 6` |
| 5. Kết quả mong đợi | Bước 1: true; bước 2: false |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | _(điền bằng lời CỤ THỂ sau khi chạy: mã trạng thái, thông báo, số dòng trước/sau …)_ |
| 8. PASS / FAIL | _(điền sau khi chạy)_ · ảnh: `docs/screenshots/TC-13.png` |

Lệnh chạy: `node --test --test-name-pattern="TC-13" tests/bt3/regression.test.js`