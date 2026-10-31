# API CONTRACT – SMART CRM MEKONG MOBILE

**Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành  
**Phiên bản:** 1.5 – BT2: thêm đăng nhập và đăng ký (EP11–EP13), xác thực bằng Bearer JWT thay header tạm (mục 1.15); kế thừa v1.4 – Sprint 2 (buổi 11): thêm mã `503 LOI_HE_THONG` khi CSDL hoặc hạ tầng không với tới được (mục 1.14); kế thừa v1.3 (buổi 10): thêm EP9, EP10,  
**Phạm vi:** US1–US7; không đặc tả US8 (Ghi chú trao đổi) theo TD-01.  
**Cột "Hiện thực":** `Đã làm` = đã hiện thực trong Sprint 1–2; `Chưa làm` = đã thiết kế, chưa hiện thực.

## 1.1. Quy ước chung

| Mục | Quy ước |
|---|---|
| **Base URL** | `/api`; dữ liệu JSON UTF-8; yêu cầu có body dùng `Content-Type: application/json`. Đường dẫn kiểm tra sống: `GET /health` trả `{"status":"ok"}`. |
| **Xác thực** | `Authorization: Bearer <token>`; token là JWT (HS256) lấy từ EP11, **hết hạn sau 30 phút** (NFR2). Vai trò, `employee_id`, `center_id` của người thao tác lấy từ token do máy chủ ký, không nhận từ header hay body. Thiếu token hoặc token sai chữ ký trả `401 CHUA_XAC_THUC`, token hết hạn trả `401 PHIEN_HET_HAN`. Nhóm `/api/auth/*` (EP11–EP13) công khai, không cần token. Header `x-role`, `x-employee-id`, `x-center-id` của Sprint 1 **đã bỏ** (mục 1.15). |
| **CORS** | Máy chủ chỉ cho phép trình duyệt từ nguồn đặt trong biến môi trường `CORS_ORIGIN` (mặc định `http://localhost:5173`, cổng của Vite). Công cụ như curl và Postman không bị ảnh hưởng. |
| **Vai trò** | `NHAN_VIEN_TIEP_NHAN` (Nhân viên tiếp nhận), `QUAN_LY_TRUNG_TAM` (Quản lý trung tâm), `KY_THUAT_VIEN` (Kỹ thuật viên). Mỗi endpoint kiểm tra vai trò trước khi xử lý; sai vai trò trả `403 KHONG_DU_QUYEN`. |
| **Phạm vi trung tâm** | Trung tâm của người thao tác (`center_id`) lấy từ token đăng nhập, **không nhận từ body**. Danh sách và chi tiết phiếu chỉ trả phiếu của trung tâm đó; phiếu của trung tâm khác trả `404 KHONG_TIM_THAY` để không tiết lộ dữ liệu. |
| **Tên trường** | `snake_case`, thống nhất với DDL: `customer_id`, `device_id`, `center_id`, `ticket_code`, `issue_desc`, `category_id`, `priority`, `due_date`. |
| **Thời gian** | ISO 8601 theo UTC (hậu tố `Z`) ở Sprint 1, ví dụ `2026-10-20T10:37:19.199Z`. Ngày mua dùng `YYYY-MM-DD`. |
| **Mã phiếu** | Máy chủ tự sinh, duy nhất, dạng `BH-XXXXXX/YYYY` (số lấy từ sequence `ticket_code_seq`, năm theo ngày tiếp nhận), ví dụ `BH-007801/2026`; client không tự cấp mã. |
| **Trạng thái** | `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` (đúng ràng buộc CHECK trong DDL). Phiếu mới luôn ở `MOI`. Chuyển trạng thái chỉ theo bảng ở EP6, không quay lại trạng thái trước (QT03). |
| **Nhóm sự cố** | Lấy từ bảng `issue_category` qua EP8: `MAN_HINH`, `PIN`, `SAC`, `PHAN_MEM`, `NUOC_VAO`, `KHAC`. `category_id` có thể `null` nếu chưa phân loại. |
| **Mức ưu tiên** | `CAO`, `TRUNG_BINH`, `THAP`. Nếu client không gửi: lấy `default_priority` của nhóm sự cố; không có nhóm sự cố thì `TRUNG_BINH`. |
| **Hạn cam kết** | Máy chủ tính theo QT02, client không được tự khai: `CAO` = 1 ngày, `TRUNG_BINH` = 3 ngày, `THAP` = 5 ngày (tương ứng 24/72/120 giờ), tính từ giờ tiếp nhận, **bỏ qua Chủ nhật** (chỉ tính thứ Hai đến thứ Bảy). |
| **Phân trang** | `page` ≥ 1, mặc định 1; `size` từ 1 đến 100, mặc định 20. Phản hồi danh sách có `paging` gồm `page`, `size`, `total`, `total_pages`. |
| **Che số điện thoại** | Theo NFR2, phản hồi gửi tới vai trò không phải `QUAN_LY_TRUNG_TAM` che số điện thoại, ví dụ `078****918`. Áp dụng cho phiếu (EP4–EP7) và khách hàng (EP1, EP2). |
| **Chống gửi trùng** | `POST /api/tickets` nhận header `Idempotency-Key`. Gửi lại cùng khóa thì máy chủ trả lại phiếu đã tạo với `200 OK` thay vì tạo phiếu thứ hai. |
| **Định dạng thành công** | Một đối tượng: `{"data": { ... }}`. Danh sách: `{"data": [ ... ], "paging": { ... }}`. |
| **Định dạng lỗi** | Ba trường cố định: `{"error":"MA_LOI","message":"câu cho người đọc","fields":{"ten_truong":"thông báo"}}`. `error` là mã máy đọc, frontend rẽ nhánh theo trường này, không theo câu chữ của `message`. `fields` chỉ có khi lỗi kiểm tra dữ liệu (`400`), mỗi trường một thông báo tiếng Việt viết cho người dùng. Lỗi `500` có `message` kèm mã tra cứu để đối chiếu log, không bao giờ có chi tiết kỹ thuật. |
| **Thứ tự kiểm tra** | (1) token hợp lệ và chưa hết hạn → 401; (2) vai trò được phép → 403; (3) kiểm tra dữ liệu đầu vào → 400; (3b) nếu `Idempotency-Key` đã dùng thì trả lại phiếu cũ với 200 và dừng; (4) thiết bị tồn tại và thuộc khách hàng → 422; (5) thiết bị chưa có phiếu mở → 409; (6) bảo hành/phê duyệt → 422; (7) nhóm sự cố tồn tại → 422; (8) ghi `ticket` và `ticket_status_log` trong một giao dịch. Khi lỗi, không để lại dữ liệu ghi dở. |

## 1.2. Danh mục mã lỗi

| `error` | HTTP | Khi nào |
|---|---|---|
| `CHUA_XAC_THUC` | 401 | Thiếu token, token sai chữ ký hoặc không đúng định dạng. |
| `PHIEN_HET_HAN` | 401 | Token đã quá hạn 30 phút; giao diện xoá phiên và về trang đăng nhập. |
| `SAI_THONG_TIN_DANG_NHAP` | 401 | (EP11) Sai tên đăng nhập hoặc mật khẩu, hoặc tài khoản ngừng hoạt động: **cùng một câu** cho mọi nguyên nhân. |
| `TAI_KHOAN_TAM_KHOA` | 429 | (EP11) Sai 5 lần liên tiếp, khoá 15 phút. |
| `MA_DANG_KY_SAI` | 403 | (EP12) Vai trò Kỹ thuật viên/Quản lý nhập sai hoặc thiếu mã đăng ký; kèm `fields.registration_code`. |
| `DANG_KY_VAI_TRO_BI_KHOA` | 403 | (EP12) Vai trò đó chưa được cấu hình mã đăng ký nên không mở đăng ký tự do. |
| `TEN_DANG_NHAP_DA_TON_TAI` | 409 | (EP12) Tên đăng nhập đã có người dùng, kể cả hai yêu cầu đồng thời; kèm `fields.username`. |
| `KHONG_DU_QUYEN` | 403 | Vai trò không được thực hiện thao tác. |
| `DU_LIEU_KHONG_HOP_LE` | 400 | Thiếu hoặc sai trường, sai kiểu, ngoài khoảng cho phép, JSON hỏng. |
| `KHONG_TIM_THAY` | 404 | Không có bản ghi (hoặc nằm ngoài trung tâm của người gọi), hoặc đường dẫn không tồn tại. |
| `THIET_BI_KHONG_THUOC_KHACH_HANG` | 422 | Thiết bị không tồn tại hoặc không thuộc `customer_id` gửi lên. |
| `THIET_BI_DANG_CO_PHIEU_MO` | 409 | Thiết bị đã có phiếu chưa đóng (QT03). |
| `CAN_QUAN_LY_PHE_DUYET` | 422 | Thiết bị hết bảo hành hoặc không có ngày mua mà chưa có `approved_by` (QT01). |
| `NHOM_SU_CO_KHONG_TON_TAI` | 422 | `category_id` không có trong danh mục nhóm sự cố. |
| `CHUYEN_TRANG_THAI_KHONG_HOP_LE` | 422 | Chuyển trạng thái không nằm trong vòng đời cho phép (QT03). |
| `XUNG_DOT_TRANG_THAI` | 409 | Trạng thái phiếu vừa bị người khác thay đổi trong lúc xử lý. |
| `LOI_HE_THONG` | 503 | CSDL hoặc hạ tầng không với tới được (ví dụ `ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`); cùng định dạng và `message` như lỗi 500, áp dụng cho mọi endpoint. Lỗi tạm thời, client nên cho người dùng bấm Thử lại. |
| `SDT_DA_TON_TAI` | 409 | (EP2) Số điện thoại đã có hồ sơ khách hàng, kể cả khi hai yêu cầu cùng số được gửi đồng thời. |
| `SERIAL_DA_TON_TAI` | 409 | (EP9) Số serial đã được đăng ký cho một thiết bị khác; kèm `fields.serial_no`. |
| `NGUOI_PHE_DUYET_KHONG_HOP_LE` | 422 | (EP4) `approved_by` không tồn tại, không phải Quản lý trung tâm hoặc thuộc trung tâm khác (SRS 8a). |
| `CAN_CHON_KY_THUAT_VIEN` | 422 | (EP6) Chuyển sang `DA_PHAN_CONG` mà không gửi `technician_id`; kèm `fields.technician_id`. |
| `KY_THUAT_VIEN_KHONG_HOP_LE` | 422 | (EP6) `technician_id` không tồn tại, ngừng hoạt động hoặc thuộc trung tâm khác; kèm `fields.technician_id`. |

## 1.3. Danh sách endpoint

| Mã | Phương thức | Đường dẫn | Mục đích | Vai trò | User Story / MoSCoW | Hiện thực |
|---|---|---|---|---|---|---|
| EP1 | `GET` | `/api/customers?phone={phone}` | Tra cứu khách hàng theo số điện thoại đã chuẩn hóa | Nhân viên tiếp nhận | US1 – MUST | Đã làm |
| EP2 | `POST` | `/api/customers` | Tạo khách hàng mới nếu số điện thoại chưa tồn tại | Nhân viên tiếp nhận | US3 – MUST | Đã làm |
| EP3 | `GET` | `/api/customers/{customer_id}/devices` | Danh sách thiết bị của khách hàng | Nhân viên tiếp nhận | US1 – MUST | Đã làm |
| EP4 | `POST` | `/api/tickets` | Tạo phiếu bảo hành | Nhân viên tiếp nhận | US2 – MUST (US4 – SHOULD, đề xuất phân loại) | Đã làm (US4 chưa làm) |
| EP5 | `GET` | `/api/tickets` | Danh sách phiếu, lọc theo trạng thái, phân trang | Mọi vai trò, trong trung tâm của mình | US5 – SHOULD | Đã làm một phần |
| EP6 | `PATCH` | `/api/tickets/{ticket_id}/status` | Chuyển trạng thái và ghi lịch sử | Kỹ thuật viên | US6 – COULD | Đã làm |
| EP7 | `GET` | `/api/tickets/{ticket_id}` | Chi tiết một phiếu | Mọi vai trò, trong trung tâm của mình | US5 – SHOULD | Đã làm |
| EP8 | `GET` | `/api/issue-categories` | Danh mục nhóm sự cố cho ô chọn trên giao diện | Mọi vai trò hợp lệ | Hỗ trợ US2 / US4 | Đã làm |
| EP9 | `POST` | `/api/customers/{customer_id}/devices` | Thêm thiết bị cho khách hàng (khách mới chưa có thiết bị vẫn tạo được phiếu) | Nhân viên tiếp nhận | Hỗ trợ US2 | Đã làm (buổi 10) |
| EP10 | `GET` | `/api/technicians` | Kỹ thuật viên đang hoạt động của trung tâm, để chọn khi phân công | Kỹ thuật viên, Quản lý trung tâm | Hỗ trợ US6 | Đã làm (buổi 10) |
| EP11 | `POST` | `/api/auth/login` | Đăng nhập, nhận token | Công khai | Hỗ trợ NFR2 | Đã làm (BT2) |
| EP12 | `POST` | `/api/auth/register` | Đăng ký tài khoản | Công khai | Hỗ trợ NFR2 | Đã làm (BT2) |
| EP13 | `GET` | `/api/auth/centers` | Danh sách trung tâm cho ô chọn ở trang đăng ký | Công khai | Hỗ trợ EP12 | Đã làm (BT2) |

**Truy vết tổng quát:** US1 → FR1 → UC1; US2 → FR2 → UC2; US3 → FR3 → UC3; US4 → FR4 → UC4; US5 → FR5 → UC5; US6 → FR6 → UC6; US7 → FR7 → UC7.

## 1.4. EP4 – POST `/api/tickets` (US2, US4) – Đã làm

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Tạo phiếu bảo hành: sinh mã phiếu, đặt trạng thái `MOI`, kiểm tra thiết bị thuộc khách hàng, phiếu đang mở (QT03) và bảo hành (QT01), tính hạn cam kết (QT02), ghi dòng đầu của `ticket_status_log`. |
| **Body** | Bắt buộc: `customer_id`, `device_id`, `issue_desc`. Tùy chọn: `category_id`, `priority`, `accessories`, `approved_by`. `center_id` không nằm trong body. |
| **Quyền** | Chỉ `NHAN_VIEN_TIEP_NHAN`. |
| **Giao dịch** | `ticket` và `ticket_status_log` ghi trong cùng một giao dịch (BEGIN/COMMIT, rollback khi lỗi). |
| **Truy vết** | US2 → FR2 → UC2; QT01, QT02, QT03; NFR1, NFR3. |

### Request mẫu

```http
POST /api/tickets HTTP/1.1
Content-Type: application/json
Idempotency-Key: 8b4e3a22-9f11-4b55-a7c1-123456789abc
Authorization: Bearer <token của Nhân viên tiếp nhận>

{
  "customer_id": 34018,
  "device_id": 63,
  "category_id": 3,
  "issue_desc": "Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện.",
  "accessories": ["SAC", "HOP"]
}
```

### Response mẫu – `201 Created`

```json
{
  "data": {
    "ticket_id": 7801,
    "ticket_code": "BH-007801/2026",
    "customer_id": 34018,
    "device_id": 63,
    "category_id": 3,
    "center_id": 1,
    "issue_desc": "Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện.",
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "received_at": "2026-10-20T10:37:19.199Z",
    "due_date": "2026-10-23T10:37:19.199Z",
    "closed_at": null,
    "is_warranty": true,
    "technician_id": null,
    "accessories": ["SAC", "HOP"]
  }
}
```

Mã phiếu, id và thời điểm trong ví dụ chỉ để minh họa; giá trị thật do máy chủ sinh. `priority` ở ví dụ là `TRUNG_BINH` vì client không gửi và nhóm sự cố `SAC` có mức mặc định `TRUNG_BINH`.

### Mã trạng thái HTTP

| Mã | Khi nào | `error` |
|---|---|---|
| `201` | Tạo phiếu thành công. | — |
| `200` | Gửi lại cùng `Idempotency-Key`: trả lại phiếu đã tạo, không tạo phiếu mới. | — |
| `400` | Thiếu/sai trường, `issue_desc` ngoài 10–2000 ký tự, `priority` hoặc `accessories` không hợp lệ, JSON hỏng. | `DU_LIEU_KHONG_HOP_LE` |
| `401` | Vai trò không hợp lệ. | `CHUA_XAC_THUC` |
| `403` | Vai trò khác `NHAN_VIEN_TIEP_NHAN`. | `KHONG_DU_QUYEN` |
| `409` | Thiết bị đã có phiếu chưa đóng (UC2-8b, QT03). | `THIET_BI_DANG_CO_PHIEU_MO` |
| `422` | Thiết bị không tồn tại hoặc không thuộc khách hàng. | `THIET_BI_KHONG_THUOC_KHACH_HANG` |
| `422` | Hết bảo hành hoặc thiếu ngày mua và chưa có `approved_by` (UC2-8a, QT01). | `CAN_QUAN_LY_PHE_DUYET` |
| `422` | `category_id` không có trong danh mục. | `NHOM_SU_CO_KHONG_TON_TAI` |
| `500` | Lỗi lưu dữ liệu; giao dịch rollback. | `LOI_HE_THONG` |

Ví dụ lỗi `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu gửi lên không hợp lệ",
  "fields": {
    "customer_id": "Chưa chọn khách hàng",
    "device_id": "Chưa chọn thiết bị",
    "issue_desc": "Mô tả lỗi cần tối thiểu 10 ký tự"
  }
}
```

Ví dụ lỗi `409`:

```json
{
  "error": "THIET_BI_DANG_CO_PHIEU_MO",
  "message": "Thiết bị đang có phiếu chưa đóng: BH-007801/2026"
}
```

Ví dụ lỗi `422` (QT01):

```json
{
  "error": "CAN_QUAN_LY_PHE_DUYET",
  "message": "Thiết bị hết bảo hành hoặc không có ngày mua, cần Quản lý trung tâm phê duyệt"
}
```

### Bảng kiểm tra dữ liệu EP4

| Trường | Bắt buộc | Kiểu / ràng buộc |
|---|---|---|
| `customer_id` | Có | Số nguyên dương. Thiết bị phải thuộc khách hàng này. |
| `device_id` | Có | Số nguyên dương; phải tồn tại. |
| `issue_desc` | Có | Chuỗi 10–2000 ký tự sau khi bỏ khoảng trắng hai đầu. |
| `category_id` | Không | Số nguyên dương có trong `issue_category`; có thể bỏ trống hoặc `null`. |
| `priority` | Không | `CAO`, `TRUNG_BINH`, `THAP`; bỏ trống thì dùng mức mặc định của nhóm sự cố, không có nhóm thì `TRUNG_BINH`. |
| `accessories` | Không | Mảng, mỗi phần tử thuộc `SAC`, `TAI_NGHE`, `HOP`, `KHAC`. |
| `approved_by` | Không | Số nguyên dương là mã nhân viên phê duyệt. Bắt buộc về nghiệp vụ khi thiết bị hết bảo hành hoặc thiếu ngày mua. (Chưa làm) Việc kiểm tra người phê duyệt có vai trò Quản lý trung tâm chưa hiện thực. |
| `Idempotency-Key` (header) | Khuyến nghị | Chuỗi duy nhất cho một lần gửi; giữ nguyên khi gửi lại cùng thao tác. |

### Đề xuất phân loại tự động (US4) – Chưa làm

Chưa hiện thực trong Sprint 1: client gửi `category_id`; máy chủ chỉ suy ra mức ưu tiên từ `default_priority` của nhóm. Thiết kế dự kiến là quy tắc từ khóa (không dùng học máy trong phạm vi L2):

| Từ khóa ví dụ trong mô tả | Nhóm sự cố đề xuất |
|---|---|
| `màn hình`, `vỡ`, `sọc` | `MAN_HINH` |
| `pin`, `tụt pin` | `PIN` |
| `sạc`, `cổng sạc`, `không vào điện` | `SAC` |
| `phần mềm`, `ứng dụng`, `khởi động` | `PHAN_MEM` |
| `nước`, `vào nước`, `ẩm` | `NUOC_VAO` |
| Không khớp | `null`, ưu tiên `TRUNG_BINH` |

## 1.5. EP5 – GET `/api/tickets` (US5) Đã làm một phần

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Danh sách phiếu của trung tâm người gọi, sắp xếp `due_date` tăng dần (phiếu gần hạn nhất trước). |
| **Query đã hiện thực** | `status` (một trong 7 trạng thái), `open` (`true`: loại phiếu `DA_DONG`, `DA_HUY`; kết hợp với `status` theo AND), `page`, `size`. Giao diện mặc định gửi `open=true` ("Đang mở"). |
| **Query chưa hiện thực** | `assignee_id`, `overdue`, `device_id` (lịch sử thiết bị và cảnh báo lỗi lặp lại – US7/FR7). |
| **Quyền** | Mọi vai trò hợp lệ, trong phạm vi trung tâm của mình. |
| **Hiệu năng** | Lọc, sắp xếp và phân trang thực hiện trong SQL, dùng index `idx_ticket_center_status_due` (NFR1: 95% yêu cầu dưới 2 giây với 10.000 phiếu). |

### Request mẫu

```http
GET /api/tickets?open=true&page=1&size=20 HTTP/1.1
Authorization: Bearer <token của Quản lý trung tâm>
```

### Response mẫu – `200 OK`

```json
{
  "data": [
    {
      "ticket_id": 7801,
      "ticket_code": "BH-007801/2026",
      "customer_id": 34018,
      "device_id": 63,
      "category_id": 3,
      "center_id": 1,
      "issue_desc": "Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện.",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "received_at": "2026-10-20T10:37:19.199Z",
      "due_date": "2026-10-23T10:37:19.199Z",
      "closed_at": null,
      "is_warranty": true,
      "technician_id": null,
      "accessories": ["SAC", "HOP"],
      "customer_name": "Đỗ Đức Cường",
      "customer_phone": "078****918",
      "product_name": "Samsung Note 8",
      "serial_no": "SN928032948926",
      "category_name": "SAC"
    }
  ],
  "paging": { "page": 1, "size": 20, "total": 1, "total_pages": 1 }
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error` |
|---|---|---|
| `200` | Thành công, kể cả khi không có phiếu khớp (`data: []`, `total: 0`). | — |
| `400` | `status` không thuộc danh sách; `open` khác `true`/`false`; `page` < 1; `size` ngoài 1–100. | `DU_LIEU_KHONG_HOP_LE` |
| `401` | Vai trò không hợp lệ. | `CHUA_XAC_THUC` |

## 1.6. EP7 – GET `/api/tickets/{ticket_id}` (US5) – Đã làm

Trả chi tiết một phiếu, cùng các trường nối như một phần tử của EP5 (`customer_name`, `customer_phone`, `product_name`, `serial_no`, `category_name`), bọc trong `{"data": { ... }}`.

| Mã | Khi nào | `error` |
|---|---|---|
| `200` | Tìm thấy phiếu của trung tâm người gọi. | — |
| `400` | `ticket_id` không phải số nguyên dương. | `DU_LIEU_KHONG_HOP_LE` |
| `401` | Vai trò không hợp lệ. | `CHUA_XAC_THUC` |
| `404` | Không có phiếu, hoặc phiếu thuộc trung tâm khác. | `KHONG_TIM_THAY` |

## 1.7. EP6 – PATCH `/api/tickets/{ticket_id}/status` (US6) – Đã làm

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Chuyển trạng thái phiếu theo vòng đời và ghi một dòng vào `ticket_status_log` (trạng thái cũ, mới, thời điểm, người thực hiện, ghi chú) trong cùng giao dịch. |
| **Body** | `to_status` bắt buộc (một trong 7 trạng thái); `note` tùy chọn, chuỗi tối đa 255 ký tự; `technician_id` **bắt buộc khi `to_status` = `DA_PHAN_CONG`** (kỹ thuật viên đang hoạt động, cùng trung tâm; lấy danh sách từ EP10), bỏ qua với trạng thái khác. |
| **Quyền** | Chỉ `KY_THUAT_VIEN`. Người thực hiện lấy từ `employee_id` trong token. |
| **Truy vết** | US6 → FR6 → UC6; QT03: không quay lại trạng thái trước, mỗi lần chuyển lưu thời điểm và người thực hiện. |

### Vòng đời trạng thái cho phép

| Từ trạng thái | Được chuyển tới |
|---|---|
| `MOI` | `DA_PHAN_CONG`, `DA_HUY` |
| `DA_PHAN_CONG` | `DANG_XU_LY`, `DA_HUY` |
| `DANG_XU_LY` | `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_HUY` |
| `CHO_LINH_KIEN` | `HOAN_TAT`, `DA_HUY` |
| `HOAN_TAT` | `DA_DONG` |
| `DA_DONG`, `DA_HUY` | (không chuyển tiếp) |

Khi chuyển sang `DA_DONG` hoặc `DA_HUY`, máy chủ ghi `closed_at`.

### Request mẫu

```http
PATCH /api/tickets/7801/status HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token của Kỹ thuật viên>

{
  "to_status": "DA_PHAN_CONG",
  "technician_id": 33,
  "note": "Nhận phiếu"
}
```

### Response mẫu – `200 OK`

Trả toàn bộ phiếu sau khi cập nhật, cùng dạng với EP7: `{"data": { "ticket_id": 7801, "ticket_code": "BH-007801/2026", "status": "DA_PHAN_CONG", ... }}`.

### Mã trạng thái HTTP

| Mã | Khi nào | `error` |
|---|---|---|
| `200` | Chuyển trạng thái hợp lệ; phiếu và lịch sử cập nhật cùng giao dịch. | — |
| `400` | Thiếu hoặc sai `to_status`; `note` không phải chuỗi hoặc quá 255 ký tự; `ticket_id` không hợp lệ. | `DU_LIEU_KHONG_HOP_LE` |
| `401` | Vai trò không hợp lệ. | `CHUA_XAC_THUC` |
| `403` | Vai trò khác `KY_THUAT_VIEN`. | `KHONG_DU_QUYEN` |
| `404` | Không có phiếu, hoặc phiếu thuộc trung tâm khác. | `KHONG_TIM_THAY` |
| `422` | Chuyển trạng thái ngoài vòng đời cho phép, gồm chuyển lùi; phiếu và lịch sử không đổi. | `CHUYEN_TRANG_THAI_KHONG_HOP_LE` |
| `422` | `DA_PHAN_CONG` thiếu `technician_id`, hoặc kỹ thuật viên không hợp lệ (A4). | `CAN_CHON_KY_THUAT_VIEN`, `KY_THUAT_VIEN_KHONG_HOP_LE` |
| `409` | Trạng thái phiếu vừa bị người khác đổi trong lúc xử lý. | `XUNG_DOT_TRANG_THAI` |

Ví dụ lỗi `422`:

```json
{
  "error": "CHUYEN_TRANG_THAI_KHONG_HOP_LE",
  "message": "Không được chuyển từ DA_PHAN_CONG sang MOI"
}
```

## 1.8. EP1–EP3 – Nhóm khách hàng và EP8 – Danh mục nhóm sự cố – Đã làm (Sprint 2)

Dùng cùng quy ước thành công `{"data": ...}` và định dạng lỗi ở mục 1.1. Số điện thoại được chuẩn hóa theo QT02 ngay ở lớp API trước khi so khớp hoặc lưu (chấp nhận khoảng trắng, dấu chấm, tiền tố `84` và `+84`), bằng hàm `normalizePhone` trong `src/backend/utils/phone.js`. Ba endpoint khách hàng chỉ dành cho `NHAN_VIEN_TIEP_NHAN`; vai trò khác nhận `403 KHONG_DU_QUYEN`.

**Hợp đồng dữ liệu khách hàng** (`toCustomerView`, `src/backend/contracts/customer.contract.js`): `customer_id` (số nguyên), `full_name` (chuỗi), `phone` (chuỗi 10 số, che theo NFR2), `email` (chuỗi hoặc `null`), `address` (chuỗi hoặc `null`).

**Hợp đồng dữ liệu thiết bị** (`toDeviceView`): `device_id`, `product_name`, `serial_no`, `purchase_date` (chuỗi `YYYY-MM-DD` hoặc `null` nếu chưa có ngày mua), `warranty_months` (số nguyên ≥ 0, đơn vị tháng).

| Endpoint | Đầu vào | Thành công | Lỗi chính |
|---|---|---|---|
| EP1 `GET /api/customers?phone={phone}` | Query `phone` bắt buộc, chuẩn hóa được về 10 chữ số bắt đầu bằng `0`. | `200` với `data` là một khách hàng (`customer_id`, `full_name`, `phone` đã che, `email`, `address`). | `400 DU_LIEU_KHONG_HOP_LE` kèm `fields.phone` (thiếu hoặc sai định dạng, UC2-3b); `404 KHONG_TIM_THAY` (chưa có khách, giao diện đề nghị tạo mới). |
| EP2 `POST /api/customers` | Body: `full_name` (bắt buộc, 1–120 ký tự), `phone` (bắt buộc, duy nhất), `email` (tùy chọn, đúng định dạng, tối đa 120), `address` (tùy chọn, tối đa 255). Chuỗi rỗng coi như `null`. | `201` với hồ sơ vừa tạo (cùng dạng EP1). | `400 DU_LIEU_KHONG_HOP_LE` kèm `fields`; `409 SDT_DA_TON_TAI` khi số đã có hồ sơ (kể cả hai yêu cầu đồng thời; thân phản hồi không kèm `customer_id`, giao diện gọi EP1 với cùng số để lấy hồ sơ có sẵn). |
| EP3 `GET /api/customers/{customer_id}/devices` | Path `customer_id` là số nguyên dương. | `200` với `data` là mảng thiết bị; khách chưa có thiết bị trả `[]`, không phải lỗi. | `400 DU_LIEU_KHONG_HOP_LE` (`customer_id` sai); `404 KHONG_TIM_THAY` khi khách không tồn tại. |
| EP9 `POST /api/customers/{customer_id}/devices` | Path `customer_id`. Body: `product_name` (bắt buộc, 1–120), `serial_no` (bắt buộc, 1–50, duy nhất), `purchase_date` (tùy chọn, `YYYY-MM-DD`, không ở tương lai; rỗng = chưa có ngày mua), `warranty_months` (bắt buộc, số nguyên 0–120). | `201` với thiết bị vừa tạo (dạng `toDeviceView`). | `400 DU_LIEU_KHONG_HOP_LE` kèm `fields`; `404 KHONG_TIM_THAY` (khách không tồn tại); `409 SERIAL_DA_TON_TAI` kèm `fields.serial_no`. |
| EP10 `GET /api/technicians` | Không có tham số; chỉ `KY_THUAT_VIEN`, `QUAN_LY_TRUNG_TAM`. | `200` với `data` là mảng `technician_id`, `technician_code`, `full_name`, `level` của trung tâm người gọi, sắp theo tên. | `403 KHONG_DU_QUYEN` (vai trò khác). |
| EP8 `GET /api/issue-categories` | Không có tham số. Mọi vai trò hợp lệ. | `200` với `data` là mảng nhóm sự cố đang dùng (`category_id`, `category_name`, `default_priority`), sắp theo `category_id`. | `401 CHUA_XAC_THUC`. |

### Ví dụ EP1 – `200 OK`

```http
GET /api/customers?phone=%2B84781234918 HTTP/1.1
Authorization: Bearer <token của Nhân viên tiếp nhận>
```

```json
{
  "data": {
    "customer_id": 34018,
    "full_name": "Đỗ Đức Cường",
    "phone": "078****918",
    "email": null,
    "address": null
  }
}
```

Ví dụ lỗi `404`:

```json
{
  "error": "KHONG_TIM_THAY",
  "message": "Chưa có khách hàng với số điện thoại này"
}
```

Ví dụ lỗi `400` (số điện thoại sai):

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu gửi lên không hợp lệ",
  "fields": { "phone": "Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)" }
}
```

### Ví dụ EP2 – `201 Created` và `409`

```http
POST /api/customers HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token của Nhân viên tiếp nhận>

{ "full_name": "Nguyễn An", "phone": "0912 345 678", "address": "Cần Thơ" }
```

```json
{
  "data": {
    "customer_id": 6444,
    "full_name": "Nguyễn An",
    "phone": "091****678",
    "email": null,
    "address": "Cần Thơ"
  }
}
```

```json
{
  "error": "SDT_DA_TON_TAI",
  "message": "Số điện thoại này đã có hồ sơ khách hàng"
}
```

### Ví dụ EP3 – `200 OK`

```json
{
  "data": [
    { "device_id": 63, "product_name": "Samsung Note 8", "serial_no": "SN928032948926", "purchase_date": "2026-03-10", "warranty_months": 12 },
    { "device_id": 64, "product_name": "iPhone 11", "serial_no": "SN928032948927", "purchase_date": null, "warranty_months": 12 }
  ]
}
```

`purchase_date` là `null` nghĩa là chưa xác minh được ngày mua: theo QT01 coi như hết bảo hành, tạo phiếu cần Quản lý trung tâm phê duyệt (`CAN_QUAN_LY_PHE_DUYET`).

### Ví dụ EP8 – `200 OK`

```json
{
  "data": [
    { "category_id": 1, "category_name": "MAN_HINH", "default_priority": "CAO" },
    { "category_id": 2, "category_name": "PIN", "default_priority": "TRUNG_BINH" }
  ]
}
```

`category_name` là mã nhóm sự cố; giao diện tự đổi sang nhãn tiếng Việt khi hiển thị.

## 1.9. Bảng kiểm tra các luồng ngoại lệ UC2

| Mã | Tình huống | Phản hồi thực tế | Hiện thực |
|---|---|---|---|
| UC2-3b | Số điện thoại không chuẩn hóa được. | EP1 trả `400 DU_LIEU_KHONG_HOP_LE` kèm `fields.phone`. | Đã làm (EP1) |
| UC2-6a | Không có quy tắc phân loại khớp mô tả. | `category_id` là `null`, ưu tiên `TRUNG_BINH` nếu client không gửi `priority`. | Đã làm |
| UC2-7a | Mô tả lỗi trống hoặc ngoài 10–2000 ký tự. | EP4 trả `400`; không ghi `ticket` hay `ticket_status_log`. | Đã làm |
| UC2-8a | Hết bảo hành hoặc thiếu ngày mua, chưa có phê duyệt. | EP4 trả `422 CAN_QUAN_LY_PHE_DUYET`; không tạo phiếu. | Đã làm |
| UC2-8b | Thiết bị đã có phiếu chưa đóng. | EP4 trả `409 THIET_BI_DANG_CO_PHIEU_MO`; không tạo phiếu. Chỉ mục UNIQUE một phần trong CSDL chặn lần cuối khi hai yêu cầu đồng thời. | Đã làm |
| UC2-9a | Mất kết nối khi lưu, người dùng gửi lại. | Gửi lại cùng `Idempotency-Key` thì trả phiếu đã tạo với `200`, không tạo phiếu thứ hai. | Đã làm |

## 1.10. Truy vết

### Bảng A – Endpoint → User Story → FR → Use Case

| Endpoint | User Story | FR | Use Case | MoSCoW | Hiện thực |
|---|---|---|---|---|---|
| EP1 | US1 | FR1 | UC1 | MUST | Đã làm |
| EP2 | US3 | FR3 | UC3 | MUST | Đã làm |
| EP3 | US1 | FR1 | UC1 | MUST | Đã làm |
| EP4 | US2 (US4 một phần) | FR2 (FR4) | UC2 (UC4) | MUST (SHOULD) | Đã làm |
| EP8 | US2 (US4 một phần) | FR2 (FR4) | UC2 (UC4) | MUST (SHOULD) | Đã làm |
| EP5, EP7 | US5 | FR5 | UC5 | SHOULD | Đã làm một phần |
| EP6 | US6 | FR6 | UC6 | COULD | Đã làm |
| (chưa có endpoint) | US7 | FR7 | UC7 | SHOULD | Chưa làm (cần `device_id` ở EP5) |

### Bảng B – Tiêu chí chấp nhận trọng yếu → endpoint → HTTP

| User Story / trường hợp | Endpoint | HTTP | Kết quả cần bảo đảm |
|---|---|---|---|
| US2: tạo phiếu hợp lệ | EP4 | `201` | Mã phiếu duy nhất, trạng thái `MOI`, hạn cam kết, lịch sử ban đầu được lưu. |
| UC2-7a: mô tả lỗi không hợp lệ | EP4 | `400` | Không ghi phiếu hay lịch sử. |
| UC2-8a: hết bảo hành, thiếu phê duyệt | EP4 | `422` | Không tạo phiếu. |
| UC2-8b: thiết bị có phiếu chưa đóng | EP4 | `409` | Không tạo phiếu trùng. |
| UC2-9a: gửi lại sau mất kết nối | EP4 | `200` | Cùng `Idempotency-Key` không tạo phiếu thứ hai. |
| US5: danh sách lọc theo trạng thái | EP5 | `200` | Sắp xếp `due_date` tăng dần, có phân trang, số điện thoại được che. |
| US6: chuyển trạng thái hợp lệ | EP6 | `200` | Cập nhật trạng thái và ghi lịch sử. |
| US6: chuyển lùi hoặc sai vòng đời | EP6 | `422` | Không đổi trạng thái hay lịch sử. |
| US1: tra khách theo số điện thoại | EP1 | `200` / `404` / `400` | Trả hồ sơ với số đã che; chưa có khách thì `404`; số sai định dạng thì `400` kèm `fields.phone`. |
| US3: tạo khách mới | EP2 | `201` / `409` | Số điện thoại duy nhất; trùng thì `409 SDT_DA_TON_TAI`, không tạo hồ sơ thứ hai. |
| US1: xem thiết bị của khách | EP3 | `200` / `404` | Trả mảng thiết bị (có thể rỗng); khách không tồn tại thì `404`. |
| Sai vai trò | EP4, EP6 | `403` | Không thực hiện thao tác. |

## 1.11. Thay đổi so với v1.0 (BT1)

| Nội dung | v1.0 (BT1) | v1.1 (Sprint 1) | Lý do |
|---|---|---|---|
| Tên vai trò | `RECEPTIONIST`, `CENTER_MANAGER`, `TECHNICIAN` | `NHAN_VIEN_TIEP_NHAN`, `QUAN_LY_TRUNG_TAM`, `KY_THUAT_VIEN` | Thống nhất với bảng `employee` và thuật ngữ SRS. |
| Mã lỗi | Tiếng Anh (`VALIDATION_FAILED`, `DEVICE_HAS_OPEN_TICKET`, `WARRANTY_EXPIRED`, ...) | Tiếng Việt không dấu (xem mục 1.2) | Thống nhất với ví dụ của buổi 8 và mã nguồn. |
| Định dạng lỗi | `{"error":{"code","message","fields"}}` | `{"error","message","details"}` | Khớp mã nguồn. |
| Định dạng thành công | Đối tượng phẳng, danh sách có khóa `items` | Bọc trong `data`; danh sách kèm `paging` | Khớp mã nguồn. |
| Trạng thái | Có `DA_TIEP_NHAN` | Bỏ `DA_TIEP_NHAN`; dùng đúng 7 trạng thái của DDL | `MOI` là trạng thái đầu; tránh lệch với CHECK trong DDL. |
| `center_id` | Trong body của EP4 | Lấy từ người thao tác | Tránh client khai sai trung tâm. |
| Chuyển trạng thái sai | `409 TICKET_STATE_INVALID` | `422 CHUYEN_TRANG_THAI_KHONG_HOP_LE`; `409 XUNG_DOT_TRANG_THAI` cho xung đột đồng thời | Phân biệt lỗi nghiệp vụ và xung đột. |
| Thiết bị/khách không hợp lệ khi tạo phiếu | `404` (không tồn tại) và `400` (thiết bị không thuộc khách) | `422 THIET_BI_KHONG_THUOC_KHACH_HANG` | Một kiểm tra duy nhất cho cặp khách hàng và thiết bị. |
| Phản hồi EP6 | `from_status`, `to_status`, `changed_at`, `changed_by` | Toàn bộ phiếu sau cập nhật; lịch sử lưu ở `ticket_status_log` | Khớp mã nguồn. |
| Xác thực | Bearer token | Bearer là đích; Sprint 1 dùng header tạm | Chưa có đăng nhập, dành cho BT2. |
| EP7 | Chưa có | Thêm `GET /api/tickets/{ticket_id}` | Cần xem chi tiết một phiếu. |
| Ghi chú trao đổi (US8) | Có `POST` và `GET /api/tickets/{id}/notes` | Bỏ khỏi hợp đồng | TD-01: US8, FR8, UC8 và bảng `ticket_note` chuyển sang phạm vi sau. |
| Quyền tạo phiếu (EP4) | Nhân viên tiếp nhận và Quản lý trung tâm | Chỉ Nhân viên tiếp nhận | Khớp SRS mục 2: Quản lý trung tâm không tạo phiếu. |
| Múi giờ | `+07:00` | UTC (hậu tố `Z`) | Máy chủ trả cùng một thời điểm theo UTC; giao diện đổi sang giờ Việt Nam khi hiển thị. |
| EP1–EP3, lọc `assignee_id`/`overdue`/`device_id`, đề xuất phân loại | Đã thiết kế | Giữ nguyên thiết kế, đánh dấu Chưa làm | Chưa hiện thực trong Sprint 1. |

## 1.12. Thay đổi so với v1.1 (Sprint 2, buổi 9)

| Nội dung | v1.1 (Sprint 1) | v1.2 (Sprint 2) | Lý do |
|---|---|---|---|
| Định dạng lỗi kiểm tra dữ liệu | `{"error","message","details":[{"field","message"}]}` | `{"error","message","fields":{"ten_truong":"thông báo"}}` | Thay đổi **phá vỡ** (TD-08). Bài giảng buổi 9: một định dạng lỗi ba trường cố định; giao diện hiện lỗi ngay cạnh từng ô nhập nên tra theo tên trường. Chưa có bên gọi nào dùng `details` nên đổi một lần, không cần giai đoạn song song. |
| Thông báo lỗi kiểm tra dữ liệu | Mô tả ràng buộc ("bắt buộc, dài 10–2000 ký tự") | Câu tiếng Việt viết cho người dùng ("Mô tả lỗi cần tối thiểu 10 ký tự") | Thông báo hiển thị trực tiếp cho người dùng. Quy tắc kiểm tra không đổi. |
| Thông báo lỗi `500` | "Lỗi hệ thống" | Câu chung kèm mã tra cứu, ghi log cùng mã | Người dùng biết phải làm gì; không lộ chi tiết kỹ thuật. |
| EP1–EP3 | Chưa làm | Đã làm; thêm `email` vào dữ liệu khách hàng; `409 SDT_DA_TON_TAI` không kèm `customer_id` | Màn tiếp nhận cần tra khách và chọn thiết bị trước khi tạo phiếu; định dạng lỗi chỉ có ba trường cố định. |
| EP8 `GET /api/issue-categories` | Chưa có | Thêm mới | Ô chọn nhóm sự cố lấy từ API, không ghi cứng trong giao diện. |
| CORS | Chưa có | Cho phép nguồn `CORS_ORIGIN` | Giao diện (cổng 5173) gọi API (cổng 3000). |
| Cấu trúc mã nguồn | Hàm chuyển đổi và kiểm tra nằm lẫn trong service và routes | `contracts/` (toTicketView, toCustomerView, toDeviceView) và `validators/` (zod) | Hợp đồng viết và thi hành ở một chỗ; đổi tên cột CSDL chỉ sửa một nơi. |
## 1.13. Thay đổi so với v1.2 (Sprint 2, buổi 10)

| Nội dung | v1.2 | v1.3 | Lý do |
|---|---|---|---|
| EP5 `GET /api/tickets` | Chỉ lọc `status` | Thêm `open=true` (loại `DA_DONG`, `DA_HUY`); giao diện mặc định "Đang mở" | Danh sách sắp theo hạn tăng dần nên phiếu cũ đã đóng chiếm đầu danh sách, phiếu mới nằm trang cuối (A1). Thay đổi **tương thích ngược**: không gửi `open` thì hành vi như cũ. |
| EP4 `POST /api/tickets` | `approved_by` sai khóa ngoại trả `500` | Kiểm tra người phê duyệt: phải là Quản lý trung tâm cùng trung tâm, sai trả `422 NGUOI_PHE_DUYET_KHONG_HOP_LE` | Lỗi dữ liệu người dùng không được báo là lỗi hệ thống (A3, SRS 8a). |
| EP6 `PATCH .../status` | Không ghi kỹ thuật viên | `DA_PHAN_CONG` bắt buộc `technician_id`, ghi vào phiếu; EP7 và EP5 trả thêm `technician_name` | Phân công mà phiếu không có kỹ thuật viên là sai nghiệp vụ (A4, C2). `employee` và `technician` là hai bảng không liên kết nên phải chọn kỹ thuật viên tường minh. Thay đổi **phá vỡ nhẹ**: gọi `DA_PHAN_CONG` không kèm `technician_id` nay bị `422`. |
| EP9, EP10 | Chưa có | Thêm mới | Khách mới tạo chưa có thiết bị thì không tạo được phiếu (A2); giao diện cần danh sách kỹ thuật viên để phân công. |

## 1.14. Thay đổi so với v1.3 (Sprint 2, buổi 11)

| Nội dung | v1.3 | v1.4 | Lý do |
|---|---|---|---|
| Lỗi khi CSDL hoặc hạ tầng không với tới được (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `EAI_AGAIN`) | `500 LOI_HE_THONG` | `503 LOI_HE_THONG`, cùng định dạng và `message` kèm mã tra cứu | Phân biệt lỗi tạm thời (thử lại được) với lỗi bất ngờ trong mã. Giao diện xử lý cả hai bằng thông báo và nút Thử lại. Thay đổi **tương thích ngược**: mã `error` không đổi, client chỉ dựa vào `error` vẫn chạy đúng. |
| Mã tra cứu trong lỗi 5xx | Có trong `message` | Là `requestId` của yêu cầu, cũng trả ở header `X-Request-Id`; mọi dòng nhật ký của yêu cầu mang cùng mã | Lần theo một yêu cầu từ màn hình đến nhật ký. |
| Nhật ký | Văn bản thường | Một dòng JSON mỗi sự kiện ra stdout, che dữ liệu nhạy cảm | Đọc được bằng `docker compose logs api`. |

## 1.15. EP11–EP13 – Đăng nhập và đăng ký – Đã làm (BT2)

Ba endpoint này **công khai**, gắn trước bước xác thực. Mã nguồn: `routes/auth.routes.js` → `services/auth.service.js` → `repositories/account.repository.js`.

### EP11 – POST `/api/auth/login`

| Mục | Nội dung |
|---|---|
| **Body** | `username` (không phân biệt hoa thường) và `password`, cả hai bắt buộc. **Không gửi vai trò**: vai trò là thuộc tính của tài khoản, máy chủ đọc từ CSDL và đưa vào token. |
| **Thành công** | `200`: `{"data":{"token":"<JWT>","expires_at":"2026-10-30T08:30:00.000Z","user":{"employee_id":3,"full_name":"Quản lý Mẫu","username":"quanly","role":"QUAN_LY_TRUNG_TAM","center_id":1}}}`. Không bao giờ trả `password_hash`. |
| **Lỗi** | `400 DU_LIEU_KHONG_HOP_LE` (thiếu trường, kèm `fields`); `401 SAI_THONG_TIN_DANG_NHAP`; `429 TAI_KHOAN_TAM_KHOA`. |
| **Bảo mật** | Cùng một câu cho mọi nguyên nhân sai (không lộ tài khoản nào có thật); tên không tồn tại vẫn tốn một lần băm để không lộ qua thời gian phản hồi; sai 5 lần liên tiếp khoá 15 phút. |

### EP12 – POST `/api/auth/register`

| Mục | Nội dung |
|---|---|
| **Body** | `full_name` (2–120 ký tự), `username` (4–30 ký tự `a-z 0-9 . _`, tự chuyển thường), `password` (8–128 ký tự, có chữ và số), `role`, `center_id`, `registration_code` (chỉ bắt buộc với `KY_THUAT_VIEN` và `QUAN_LY_TRUNG_TAM`). |
| **Thành công** | `201`: `{"data":{"employee_id":63,"full_name":"Lê Thị Bình","username":"binh.le","role":"KY_THUAT_VIEN","center_id":3}}`. Không tự đăng nhập; giao diện chuyển sang `/login`. |
| **Lỗi** | `400 DU_LIEU_KHONG_HOP_LE` kèm `fields` theo từng trường (kể cả `center_id` không tồn tại); `403 MA_DANG_KY_SAI`; `403 DANG_KY_VAI_TRO_BI_KHOA`; `409 TEN_DANG_NHAP_DA_TON_TAI`. |
| **Lưu trữ** | Mật khẩu băm `scrypt` với muối ngẫu nhiên; không lưu và không ghi log mật khẩu gốc. |

### EP13 – GET `/api/auth/centers`

`200`: `{"data":[{"center_id":1,"center_code":"TT01","center_name":"TTBH Quận 10","city":"TP. Hồ Chí Minh"}, ...]}`. Chỉ để đổ ô chọn trung tâm ở trang đăng ký.

### Thay đổi so với v1.4 (BT2)

| Nội dung | v1.4 | v1.5 | Lý do |
|---|---|---|---|
| Xác thực | 3 header tự khai `x-role`, `x-employee-id`, `x-center-id`; không mật khẩu | `Authorization: Bearer <JWT>`; mật khẩu; hết hạn 30 phút | TD-12. Header tự khai cho phép ai cũng giả làm Quản lý. Thay đổi **phá vỡ**: yêu cầu không token nay bị `401`; giao diện là bên gọi duy nhất nên đổi một lần. |
| Bảng `employee` | `employee_id`, `full_name`, `role`, `center_id` | Thêm `username` (duy nhất), `password_hash`, `is_active`, `created_at` | Migration 003. 60 mã nhân viên của dữ liệu lịch sử không có tài khoản. |
| Mã lỗi | 401 `CHUA_XAC_THUC` | Thêm `PHIEN_HET_HAN`, `SAI_THONG_TIN_DANG_NHAP`, `TAI_KHOAN_TAM_KHOA`, `MA_DANG_KY_SAI`, `DANG_KY_VAI_TRO_BI_KHOA`, `TEN_DANG_NHAP_DA_TON_TAI` | Giao diện rẽ nhánh theo mã lỗi (mục 1.2). |
