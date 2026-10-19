# API CONTRACT – SMART CRM MEKONG MOBILE

**Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành  
**Phạm vi:** US1–US7; không đặc tả US8 (Ghi chú trao đổi) trong phiên bản này.  
**Lưu ý:** Đây là hợp đồng API đề xuất dựa trên SRS/BT1 của luồng L2. Tên trường và mã lỗi cần được đối chiếu lần cuối với DDL, giao diện và mã nguồn khi triển khai.

## 1.1. Quy ước chung

| Mục | Quy ước |
|---|---|
| **Base URL** | `/api`; dữ liệu JSON UTF-8; yêu cầu có body dùng `Content-Type: application/json`. |
| **Xác thực** | Header `Authorization: Bearer <access_token>`. Token hợp lệ phải gắn với người dùng đã đăng nhập và vai trò/trung tâm của người đó. Thiếu, sai hoặc hết hạn token trả `401 UNAUTHENTICATED`. |
| **Vai trò** | `RECEPTIONIST` (Nhân viên tiếp nhận), `CENTER_MANAGER` (Quản lý trung tâm), `TECHNICIAN` (Kỹ thuật viên). Mỗi endpoint kiểm tra vai trò và phạm vi trung tâm trước khi trả dữ liệu. |
| **Phạm vi trung tâm** | Người dùng chỉ được xem hoặc thao tác dữ liệu thuộc trung tâm được phép. Truy cập trái quyền trả `403 FORBIDDEN`, không tiết lộ dữ liệu của trung tâm khác. Quyền xem danh sách phiếu áp dụng theo SRS và phân quyền đã cấu hình. |
| **Tên trường** | Dùng `snake_case`, nhất quán với các tên trường trong SRS/CSDL: `customer_id`, `device_id`, `center_id`, `ticket_code`, `issue_desc`, `category_id`, `priority`, `due_date`. |
| **Thời gian** | ISO 8601 kèm múi giờ, ví dụ `2026-10-19T14:30:00+07:00`. Ngày mua dùng `YYYY-MM-DD`. |
| **Mã phiếu** | Máy chủ tự sinh mã duy nhất theo dạng `BH-XXXXXX/YYYY`, ví dụ `BH-000231/2026`; client không tự cấp mã. |
| **Trạng thái** | API dùng mã trạng thái không dấu: `MOI`, `DA_TIEP_NHAN`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` nếu các trạng thái này được cấu hình trong mô hình dữ liệu. Việc chuyển trạng thái phải theo vòng đời đã định nghĩa; không cho quay lại trạng thái trước. Nếu DDL/UC sử dụng bộ trạng thái khác, cần thống nhất trước khi triển khai. |
| **Nhóm sự cố** | Một trong `MAN_HINH`, `PIN`, `SAC`, `PHAN_MEM`, `NUOC_VAO`, `KHAC`; `category_id` có thể `null` nếu chưa phân loại được. |
| **Mức ưu tiên** | `CAO`, `TRUNG_BINH`, `THAP`. Nếu không nhận diện được mức ưu tiên, mặc định `TRUNG_BINH`. |
| **Hạn cam kết** | Sinh tự động theo QT02: `CAO` = 24 giờ, `TRUNG_BINH` = 72 giờ, `THAP` = 120 giờ; chỉ tính ngày làm việc từ thứ Hai đến thứ Bảy. Máy chủ tính `due_date`, không nhận hạn cam kết do client tự khai. |
| **Phân trang** | `page` bắt đầu từ 1, mặc định 1; `size` mặc định 20, tối đa 100. Phản hồi danh sách có `page`, `size`, `total`. |
| **Che số điện thoại** | Theo NFR2, phản hồi gửi tới vai trò không phải `CENTER_MANAGER` phải che số điện thoại, ví dụ `090****567`. Không ghi số điện thoại đầy đủ vào log ứng dụng. |
| **Chống gửi trùng** | `POST /api/tickets` nhận header `Idempotency-Key`. Nếu client thử lại cùng khóa do mất kết nối, máy chủ trả lại kết quả của yêu cầu đã xử lý thay vì tạo phiếu thứ hai. |
| **Định dạng lỗi** | Mọi lỗi trả JSON dạng `{"error":{"code":"...","message":"...","fields":{}}}`. `fields` chứa lỗi theo trường hoặc thông tin liên quan khi phù hợp. |
| **Thứ tự kiểm tra** | (1) xác thực phiên; (2) quyền/vai trò và phạm vi trung tâm; (3) validation đầu vào; (4) kiểm tra bản ghi tồn tại và quan hệ; (5) kiểm tra quy tắc nghiệp vụ; (6) ghi dữ liệu trong giao dịch. Khi lỗi, không để lại dữ liệu ghi dở. |

## 1.2. Danh sách endpoint

| Mã | Phương thức | Đường dẫn | Mục đích | Actor chính | User Story / MoSCoW |
|---|---|---|---|---|---|
| EP1 | `GET` | `/api/customers?phone={phone}` | Tra cứu khách hàng theo số điện thoại đã chuẩn hóa | Nhân viên tiếp nhận | US1 – MUST |
| EP2 | `POST` | `/api/customers` | Tạo khách hàng mới nếu số điện thoại chưa tồn tại | Nhân viên tiếp nhận | US3 – MUST |
| EP3 | `GET` | `/api/customers/{customer_id}/devices` | Lấy danh sách thiết bị của khách hàng | Nhân viên tiếp nhận | US1 – MUST |
| EP4 | `POST` | `/api/tickets` | Tạo phiếu bảo hành; máy chủ đề xuất nhóm sự cố/mức ưu tiên nếu cần | Nhân viên tiếp nhận | US2, US4 – MUST cho tạo phiếu; US4 là SHOULD |
| EP5 | `GET` | `/api/tickets` | Xem danh sách phiếu, lọc theo trạng thái/người phụ trách/quá hạn hoặc thiết bị; phân trang | Quản lý trung tâm, Kỹ thuật viên theo quyền | US5, US7 – SHOULD |
| EP6 | `PATCH` | `/api/tickets/{ticket_id}/status` | Chuyển trạng thái và ghi lịch sử | Kỹ thuật viên theo quyền | US6 – COULD |

**Truy vết tổng quát:** US1 → FR1 → UC1; US2 → FR2 → UC2; US3 → FR3 → UC3; US4 → FR4 → UC4; US5 → FR5 → UC5; US6 → FR6 → UC6; US7 → FR7 → UC7. Các endpoint dưới đây là hợp đồng đề xuất, chưa khẳng định đã được hiện thực trong mã nguồn.

## 1.3. EP1 – GET `/api/customers?phone={phone}` (US1)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Tra cứu khách hàng bằng số điện thoại. Chuẩn hóa số trước khi so khớp; khi tìm thấy, trả hồ sơ khách hàng và cho phép giao diện tải danh sách thiết bị qua EP3. |
| **Tham số** | Query bắt buộc: `phone`. Chấp nhận số điện thoại chuẩn hóa được về 10 chữ số bắt đầu bằng `0`; có thể loại bỏ khoảng trắng, dấu `-`, dấu ngoặc và chuyển tiền tố `+84` về `0` theo QT02. |
| **Quyền** | Người dùng đã đăng nhập và có quyền tiếp nhận/tra cứu khách hàng trong phạm vi được cấp. |
| **Truy vết** | US1 → FR1 → UC1; số điện thoại phản hồi phải được che theo NFR2 nếu người gọi không phải Quản lý trung tâm. |

### Request mẫu

```http
GET /api/customers?phone=%2B84%20901%20234%20567 HTTP/1.1
Authorization: Bearer <access_token>
```

### Response mẫu – `200 OK`

```json
{
  "customer_id": 1024,
  "full_name": "Nguyễn Minh Anh",
  "phone": "090****567",
  "address": "Quận Bình Thạnh, TP. Hồ Chí Minh",
  "segment": "CA_NHAN"
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `200` | Tìm thấy khách hàng. Số điện thoại được che theo vai trò. | — |
| `400` | Thiếu `phone`, không chuẩn hóa được về 10 chữ số bắt đầu bằng `0`. | `VALIDATION_FAILED` |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Người gọi không có quyền tra cứu. | `FORBIDDEN` |
| `404` | Không có khách hàng khớp số điện thoại. Giao diện đề nghị tạo khách hàng mới qua EP2. | `CUSTOMER_NOT_FOUND` |

Ví dụ lỗi `400`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.",
    "fields": { "phone": "INVALID_PHONE" }
  }
}
```

## 1.4. EP2 – POST `/api/customers` (US3)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Tạo hồ sơ khách hàng mới khi số điện thoại chưa tồn tại. Số điện thoại được chuẩn hóa trước khi lưu và phải duy nhất. |
| **Body** | `full_name`, `phone` bắt buộc; `email`, `address` tùy chọn theo SRS. |
| **Quyền** | Nhân viên tiếp nhận đã đăng nhập và được phép tiếp nhận khách hàng. |
| **Truy vết** | US3 → FR3 → UC3; ràng buộc UNIQUE trên số điện thoại để tránh tạo hồ sơ trùng khi hai yêu cầu đồng thời. |

### Request mẫu

```http
POST /api/customers HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "Nguyễn Minh Anh",
  "phone": "0901234567",
  "email": "minhanh@example.com",
  "address": "Quận Bình Thạnh, TP. Hồ Chí Minh"
}
```

### Response mẫu – `201 Created`

```json
{
  "customer_id": 1024,
  "full_name": "Nguyễn Minh Anh",
  "phone": "090****567",
  "email": "minhanh@example.com",
  "address": "Quận Bình Thạnh, TP. Hồ Chí Minh",
  "created_at": "2026-10-19T14:30:00+07:00"
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `201` | Tạo hồ sơ thành công. | — |
| `400` | Thiếu/sai `full_name` hoặc `phone`; tên vượt 120 ký tự; số điện thoại sai định dạng. | `VALIDATION_FAILED` |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Người gọi không có quyền tạo khách hàng. | `FORBIDDEN` |
| `409` | Số điện thoại đã được tạo bởi yêu cầu trước hoặc người dùng khác. Không tạo bản ghi thứ hai; trả `customer_id` hiện có để giao diện tiếp tục. | `PHONE_ALREADY_EXISTS` |

Ví dụ lỗi `409`:

```json
{
  "error": {
    "code": "PHONE_ALREADY_EXISTS",
    "message": "Số điện thoại đã có trong hệ thống. Hãy sử dụng hồ sơ khách hàng hiện có.",
    "fields": { "customer_id": 1024 }
  }
}
```

## 1.5. EP3 – GET `/api/customers/{customer_id}/devices` (US1)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Trả danh sách thiết bị thuộc khách hàng để nhân viên chọn thiết bị cần bảo hành. |
| **Tham số** | Path: `customer_id`. |
| **Quyền** | Người dùng đã đăng nhập, có quyền tra cứu khách hàng trong phạm vi được cấp. |
| **Truy vết** | US1 → FR1 → UC1; dữ liệu thiết bị phục vụ lựa chọn `device_id` ở EP4 và kiểm tra QT01. |

### Request mẫu

```http
GET /api/customers/1024/devices HTTP/1.1
Authorization: Bearer <access_token>
```

### Response mẫu – `200 OK`

```json
{
  "customer_id": 1024,
  "items": [
    {
      "device_id": 3311,
      "product_name": "Điện thoại mẫu A",
      "serial_no": "SN-ABC12345",
      "purchase_date": "2025-03-10",
      "warranty_months": 12
    }
  ],
  "total": 1
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `200` | Tìm thấy khách hàng; `items` có thể là mảng rỗng. | — |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Không có quyền truy cập dữ liệu khách hàng. | `FORBIDDEN` |
| `404` | `customer_id` không tồn tại. | `CUSTOMER_NOT_FOUND` |

## 1.6. EP4 – POST `/api/tickets` (US2, US4)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Tạo phiếu bảo hành mới, sinh mã phiếu, xác định trạng thái ban đầu `MOI`, kiểm tra điều kiện bảo hành và phiếu đang mở, tính hạn cam kết, đồng thời lưu bản ghi lịch sử trạng thái đầu tiên. |
| **Body** | Bắt buộc: `customer_id`, `device_id`, `center_id`, `issue_desc`. Tùy chọn: `category_id`, `priority`, `accessories`, `approved_by`. `category_id`/`priority` có thể do hệ thống đề xuất và nhân viên xác nhận/điều chỉnh. |
| **Quyền** | Nhân viên tiếp nhận; Quản lý trung tâm chỉ khi được phân quyền tạo phiếu. `center_id` phải thuộc phạm vi trung tâm của người gọi. |
| **Giao dịch** | Ghi `ticket` và `ticket_status_log` trong cùng một transaction. Nếu một bước thất bại, rollback toàn bộ. `Idempotency-Key` giúp không tạo phiếu trùng khi gửi lại. |
| **Truy vết** | US2 → FR2 → UC2; US4 → FR4 → UC4; QT01 (bảo hành), QT02 (phân loại/hạn cam kết), QT03 (một thiết bị tối đa một phiếu chưa đóng); NFR1 và NFR3. |

### Request mẫu

```http
POST /api/tickets HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json
Idempotency-Key: 8b4e3a22-9f11-4b55-a7c1-123456789abc

{
  "customer_id": 1024,
  "device_id": 3311,
  "center_id": 2,
  "issue_desc": "Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện.",
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "accessories": ["SAC", "HOP"]
}
```

### Response mẫu – `201 Created`

```json
{
  "ticket_id": 231,
  "ticket_code": "BH-000231/2026",
  "customer_id": 1024,
  "device_id": 3311,
  "center_id": 2,
  "issue_desc": "Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện.",
  "category_id": 3,
  "category_code": "SAC",
  "priority": "TRUNG_BINH",
  "status": "MOI",
  "is_warranty": true,
  "received_at": "2026-10-19T14:30:00+07:00",
  "due_date": "2026-10-22T14:30:00+07:00"
}
```

`due_date` trong ví dụ minh họa cho ưu tiên `TRUNG_BINH` (72 giờ làm việc theo quy tắc thứ Hai–thứ Bảy). Giá trị thực tế phải do máy chủ tính theo thời điểm tiếp nhận và lịch làm việc; không sao chép cứng ngày ví dụ. Nếu không đề xuất được nhóm sự cố, `category_id` có thể là `null`; ưu tiên mặc định `TRUNG_BINH`.

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `201` | Phiếu được tạo thành công; trả mã phiếu, trạng thái và hạn cam kết. | — |
| `400` | Thiếu/sai trường, `issue_desc` ngoài 10–2000 ký tự, `priority` hoặc phụ kiện không hợp lệ, hoặc thiết bị không thuộc khách hàng được gửi. | `VALIDATION_FAILED` |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Người gọi không có quyền tạo phiếu hoặc `center_id` ngoài phạm vi. | `FORBIDDEN` |
| `404` | `customer_id` hoặc `device_id` không tồn tại. | `CUSTOMER_NOT_FOUND` / `DEVICE_NOT_FOUND` |
| `409` | Thiết bị đã có phiếu bảo hành chưa đóng (UC2-8b/QT03); không tạo phiếu mới. | `DEVICE_HAS_OPEN_TICKET` |
| `422` | Thiết bị hết hạn bảo hành hoặc không có ngày mua mà chưa có phê duyệt hợp lệ của Quản lý trung tâm (UC2-8a/QT01). | `WARRANTY_EXPIRED` |
| `500` | Lỗi lưu dữ liệu; transaction rollback, không để lại phiếu/log dở dang. | `INTERNAL_ERROR` |

Ví dụ lỗi `409`:

```json
{
  "error": {
    "code": "DEVICE_HAS_OPEN_TICKET",
    "message": "Thiết bị đang có phiếu bảo hành chưa đóng.",
    "fields": { "open_ticket_code": "BH-000198/2026" }
  }
}
```

Ví dụ lỗi `422`:

```json
{
  "error": {
    "code": "WARRANTY_EXPIRED",
    "message": "Thiết bị đã hết bảo hành hoặc thiếu ngày mua; cần Quản lý trung tâm phê duyệt.",
    "fields": {
      "purchase_date": "2024-06-01",
      "warranty_months": 12,
      "approved_by_required": true
    }
  }
}
```

### Bảng validation EP4

| Trường | Bắt buộc | Kiểu / ràng buộc | Khi sai |
|---|---|---|---|
| `customer_id` | Có | Số nguyên dương; phải tồn tại. | `400` hoặc `404 CUSTOMER_NOT_FOUND` |
| `device_id` | Có | Số nguyên dương; phải tồn tại và thuộc `customer_id`. | `400` hoặc `404 DEVICE_NOT_FOUND` |
| `center_id` | Có | Số nguyên dương; thuộc phạm vi trung tâm của người gọi. | `400` hoặc `403 FORBIDDEN` |
| `issue_desc` | Có | Chuỗi 10–2000 ký tự sau khi trim. | `400 VALIDATION_FAILED` |
| `category_id` | Không | ID nhóm sự cố hợp lệ; cho phép `null` nếu chưa đề xuất được. | `400 VALIDATION_FAILED` |
| `priority` | Không | `CAO`, `TRUNG_BINH`, `THAP`; nếu bỏ trống dùng đề xuất, nếu không có đề xuất thì `TRUNG_BINH`. | `400 VALIDATION_FAILED` |
| `accessories` | Không | Mảng không trùng phần tử; mỗi phần tử thuộc `SAC`, `TAI_NGHE`, `HOP`, `KHAC`. | `400 VALIDATION_FAILED` |
| `approved_by` | Không | ID quản lý trung tâm hợp lệ; bắt buộc về mặt nghiệp vụ khi thiết bị hết hạn/thiếu ngày mua. | `400` hoặc `422 WARRANTY_EXPIRED` |
| `Idempotency-Key` | Khuyến nghị | Chuỗi duy nhất cho một lần gửi tạo phiếu; giữ nguyên khi retry cùng thao tác. | Nếu cùng khóa nhưng payload khác nhau, trả lỗi xung đột theo chính sách idempotency của triển khai. |

### Quy tắc đề xuất phân loại (US4)

Việc đề xuất được thực hiện từ `issue_desc` bằng quy tắc từ khóa, không phải mô hình học máy trong phạm vi L2:

| Từ khóa ví dụ trong mô tả | `category_code` đề xuất |
|---|---|
| `màn hình`, `vỡ`, `sọc` | `MAN_HINH` |
| `pin`, `tụt pin`, `sạc pin` | `PIN` |
| `sạc`, `cổng sạc`, `không vào điện` | `SAC` |
| `phần mềm`, `ứng dụng`, `khởi động` | `PHAN_MEM` |
| `nước`, `vào nước`, `ẩm` | `NUOC_VAO` |
| Không khớp quy tắc | `null`; ưu tiên mặc định `TRUNG_BINH` |

Nếu nhiều nhóm cùng khớp, quy tắc ưu tiên cần được xác định nhất quán trong phần triển khai; nhân viên tiếp nhận vẫn có quyền xác nhận/điều chỉnh trước khi lưu. Bảng từ khóa trên là ví dụ khởi đầu, cần kiểm thử với dữ liệu thực tế.

## 1.7. EP5 – GET `/api/tickets` (US5, US7)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Lấy danh sách phiếu theo bộ lọc; mặc định sắp xếp `due_date` tăng dần. Khi có `device_id`, trả lịch sử phiếu của thiết bị và cảnh báo lỗi lặp lại. |
| **Query** | Tùy chọn: `status`, `assignee_id`, `overdue`, `device_id`, `page`, `size`. `overdue=true` lọc phiếu đã quá hạn nhưng chưa hoàn tất/đóng/hủy. |
| **Quyền** | Quản lý trung tâm xem danh sách phục vụ theo dõi hạn cam kết; Kỹ thuật viên xem danh sách/lịch sử theo quyền và phạm vi được cấp. Dữ liệu ngoài trung tâm bị từ chối. |
| **Truy vết** | US5 → FR5 → UC5; US7 → FR7 → UC7; NFR1: 95% yêu cầu xem danh sách dưới 2 giây với 10.000 phiếu và 20 người dùng đồng thời. |

### Request mẫu – danh sách phiếu

```http
GET /api/tickets?status=MOI&page=1&size=20 HTTP/1.1
Authorization: Bearer <access_token>
```

### Response mẫu – `200 OK`

```json
{
  "items": [
    {
      "ticket_id": 231,
      "ticket_code": "BH-000231/2026",
      "status": "MOI",
      "priority": "TRUNG_BINH",
      "due_date": "2026-10-22T14:30:00+07:00",
      "customer_name": "Nguyễn Minh Anh",
      "customer_phone": "090****567",
      "assignee_id": null,
      "category_name": "Sạc"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1
}
```

### Request mẫu – lịch sử của một thiết bị (US7)

```http
GET /api/tickets?device_id=3311&page=1&size=20 HTTP/1.1
Authorization: Bearer <access_token>
```

Khi truy vấn theo `device_id`, mỗi item cần có tối thiểu `ticket_code`, `received_at`, `status`, `category_code` và `category_name`. `repeat_warning` bằng `true` khi thiết bị có từ ba phiếu bảo hành cùng nhóm sự cố theo FR7; nếu không, bằng `false`.

Ví dụ phần tử lịch sử:

```json
{
  "ticket_code": "BH-000231/2026",
  "received_at": "2026-10-19T14:30:00+07:00",
  "status": "MOI",
  "category_code": "PIN",
  "category_name": "Pin",
  "repeat_warning": true
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `200` | Thành công, kể cả khi không có phiếu khớp (`items: []`, `total: 0`). | — |
| `400` | `status`, `overdue`, `page` hoặc `size` sai; `page < 1`, `size` ngoài 1–100. | `VALIDATION_FAILED` |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Vai trò không được xem danh sách hoặc truy cập ngoài phạm vi trung tâm. | `FORBIDDEN` |

## 1.8. EP6 – PATCH `/api/tickets/{ticket_id}/status` (US6)

| Thuộc tính | Nội dung |
|---|---|
| **Mục đích** | Chuyển trạng thái phiếu theo vòng đời hợp lệ và ghi lịch sử vào `ticket_status_log` trong cùng transaction. |
| **Body** | `to_status` bắt buộc; `note` tùy chọn, tối đa 255 ký tự nếu được dùng để giải thích việc chuyển trạng thái. |
| **Quyền** | Kỹ thuật viên được phân công hoặc người có quyền trên phiếu; chỉ thao tác phiếu thuộc phạm vi được cấp. |
| **Truy vết** | US6 → FR6 → UC6; QT03: không quay lại trạng thái trước, mỗi lần chuyển phải lưu thời điểm và người thực hiện. |

### Request mẫu

```http
PATCH /api/tickets/231/status HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "to_status": "DANG_XU_LY",
  "note": "Bắt đầu kiểm tra thiết bị."
}
```

### Response mẫu – `200 OK`

```json
{
  "ticket_id": 231,
  "ticket_code": "BH-000231/2026",
  "from_status": "MOI",
  "to_status": "DANG_XU_LY",
  "changed_at": "2026-10-19T15:00:00+07:00",
  "changed_by": 77
}
```

### Mã trạng thái HTTP

| Mã | Khi nào | `error.code` |
|---|---|---|
| `200` | Chuyển trạng thái hợp lệ; phiếu và lịch sử được cập nhật cùng transaction. | — |
| `400` | Thiếu `to_status`, giá trị trạng thái không được hỗ trợ hoặc `note` quá 255 ký tự. | `VALIDATION_FAILED` |
| `401` | Token thiếu, sai hoặc hết hạn. | `UNAUTHENTICATED` |
| `403` | Người gọi không có quyền cập nhật phiếu hoặc phiếu nằm ngoài phạm vi. | `FORBIDDEN` |
| `404` | Không tìm thấy phiếu. | `TICKET_NOT_FOUND` |
| `409` | Chuyển trạng thái không đúng vòng đời, gồm chuyển lùi về trạng thái trước. Phiếu và lịch sử không đổi. | `TICKET_STATE_INVALID` |

**Lưu ý triển khai:** SRS quy định không được chuyển trạng thái ngược, nhưng cần thống nhất danh sách chuyển trạng thái hợp lệ cụ thể (ví dụ `MOI → DANG_XU_LY`, `DANG_XU_LY → CHO_LINH_KIEN/HOAN_TAT`) với sơ đồ trạng thái/DDL trước khi viết test.

## 1.9. Bảng kiểm tra các luồng ngoại lệ UC2

| Mã ngoại lệ | Tình huống | Endpoint / phản hồi dự kiến | Kết quả cần bảo đảm |
|---|---|---|---|
| UC2-3b | Số điện thoại không chuẩn hóa được về 10 chữ số bắt đầu bằng `0`. | EP1 trả `400 VALIDATION_FAILED`. | Không truy vấn/tạo khách hàng bằng số sai; giao diện giữ dữ liệu và yêu cầu nhập lại. |
| UC2-6a | Không có quy tắc phân loại khớp mô tả lỗi. | Phần đề xuất trong EP4 trả `category_id: null`, `priority: TRUNG_BINH` nếu chưa nhập ưu tiên. | Nhân viên có thể chọn nhóm sự cố trước khi gửi yêu cầu tạo phiếu. |
| UC2-7a | Mô tả lỗi trống hoặc ngoài 10–2000 ký tự. | EP4 trả `400 VALIDATION_FAILED`. | Không tạo `ticket` hoặc `ticket_status_log`; giữ nguyên nội dung form ở client. |
| UC2-8a | Thiết bị hết bảo hành hoặc thiếu ngày mua, chưa có phê duyệt hợp lệ. | EP4 trả `422 WARRANTY_EXPIRED`. | Không tạo phiếu; yêu cầu phê duyệt của Quản lý trung tâm. |
| UC2-8b | Thiết bị đã có phiếu bảo hành chưa đóng. | EP4 trả `409 DEVICE_HAS_OPEN_TICKET` và `open_ticket_code`. | Không tạo phiếu trùng cho cùng thiết bị. |
| UC2-9a | Mất kết nối trong lúc lưu, người dùng gửi lại. | Client gửi lại cùng `Idempotency-Key`; máy chủ trả kết quả đã xử lý nếu lần đầu thành công. | Không tạo hai phiếu cho một thao tác; nếu lần đầu chưa ghi thành công thì có thể thử lại an toàn. |

## 1.10. Bảng validation tổng hợp

| Endpoint | Trường | Quy tắc | Khi sai |
|---|---|---|---|
| EP1 | `phone` | Bắt buộc; chuẩn hóa về 10 chữ số bắt đầu bằng `0`. | `400 VALIDATION_FAILED`; nếu hợp lệ nhưng không tồn tại thì `404 CUSTOMER_NOT_FOUND`. |
| EP2 | `full_name` | Bắt buộc; sau trim không rỗng; tối đa 120 ký tự. | `400 VALIDATION_FAILED`. |
| EP2 | `phone` | Bắt buộc; chuẩn hóa trước khi lưu; phải duy nhất. | `400` nếu sai định dạng; `409 PHONE_ALREADY_EXISTS` nếu đã tồn tại. |
| EP3 | `customer_id` | Số nguyên dương, khách hàng phải tồn tại. | `404 CUSTOMER_NOT_FOUND`. |
| EP4 | `customer_id`, `device_id`, `center_id` | Số nguyên dương; các bản ghi phải tồn tại; thiết bị phải thuộc khách hàng; trung tâm đúng phạm vi. | `400`, `403` hoặc `404` tùy nguyên nhân. |
| EP4 | `issue_desc` | Bắt buộc; 10–2000 ký tự sau trim. | `400 VALIDATION_FAILED`. |
| EP4 | `priority` | `CAO`, `TRUNG_BINH`, `THAP`; nếu bỏ trống dùng đề xuất hoặc mặc định `TRUNG_BINH`. | `400 VALIDATION_FAILED`. |
| EP4 | `accessories` | Mảng các giá trị `SAC`, `TAI_NGHE`, `HOP`, `KHAC`, không trùng. | `400 VALIDATION_FAILED`. |
| EP4 | `approved_by` | Nếu thiết bị hết hạn/thiếu ngày mua, phải là Quản lý trung tâm hợp lệ có quyền phê duyệt. | `422 WARRANTY_EXPIRED` nếu thiếu/sai phê duyệt. |
| EP5 | `status` | Phải thuộc danh sách trạng thái được hỗ trợ. | `400 VALIDATION_FAILED`. |
| EP5 | `overdue` | Boolean `true` hoặc `false`. | `400 VALIDATION_FAILED`. |
| EP5 | `page`, `size` | `page ≥ 1`; `1 ≤ size ≤ 100`; mặc định `1` và `20`. | `400 VALIDATION_FAILED`. |
| EP6 | `to_status` | Trạng thái hợp lệ và chuyển tiếp được phép từ trạng thái hiện tại. | `400` nếu mã không hợp lệ; `409 TICKET_STATE_INVALID` nếu chuyển tiếp sai. |

## 1.11. Tự kiểm truy vết API

### Bảng A – Endpoint → User Story → FR → Use Case

| Endpoint | User Story | FR | Use Case | MoSCoW |
|---|---|---|---|---|
| EP1 – `GET /api/customers?phone=` | US1 | FR1 | UC1 | MUST |
| EP2 – `POST /api/customers` | US3 | FR3 | UC3 | MUST |
| EP3 – `GET /api/customers/{customer_id}/devices` | US1 | FR1 | UC1 | MUST |
| EP4 – `POST /api/tickets` | US2, US4 | FR2, FR4 | UC2, UC4 | MUST cho US2; SHOULD cho phần đề xuất US4 |
| EP5 – `GET /api/tickets` | US5, US7 | FR5, FR7 | UC5, UC7 | SHOULD |
| EP6 – `PATCH /api/tickets/{ticket_id}/status` | US6 | FR6 | UC6 | COULD |

### Bảng B – Tiêu chí chấp nhận trọng yếu → endpoint → HTTP

| User Story / trường hợp | Endpoint | HTTP dự kiến | Kết quả kiểm tra |
|---|---|---|---|
| US1: tra cứu số hợp lệ có khách hàng | EP1 | `200` | Trả hồ sơ khách hàng và số điện thoại đã che theo vai trò. |
| US1: số điện thoại sai định dạng | EP1 | `400` | Không truy vấn bằng dữ liệu sai. |
| US1: khách hàng chưa tồn tại | EP1 | `404` | Giao diện đề nghị tạo khách hàng mới. |
| US3: tạo khách hàng mới | EP2 | `201` | Hồ sơ được tạo với số điện thoại chuẩn hóa. |
| US3: số điện thoại vừa được tạo đồng thời | EP2 | `409` | Không tạo hồ sơ thứ hai; trả tham chiếu khách hàng hiện có. |
| US2: tạo phiếu hợp lệ | EP4 | `201` | Mã phiếu duy nhất, trạng thái `MOI`, hạn cam kết và lịch sử ban đầu được lưu. |
| UC2-7a: mô tả lỗi không hợp lệ | EP4 | `400` | Không ghi phiếu hoặc log. |
| UC2-8a: hết bảo hành, thiếu phê duyệt | EP4 | `422` | Không tạo phiếu. |
| UC2-8b: thiết bị có phiếu chưa đóng | EP4 | `409` | Không tạo phiếu; trả mã phiếu đang mở. |
| UC2-9a: retry sau mất kết nối | EP4 | `201` hoặc kết quả đã lưu | Cùng `Idempotency-Key` không tạo phiếu trùng. |
| US5: xem danh sách lọc theo trạng thái | EP5 | `200` | Sắp xếp `due_date` tăng dần, có phân trang. |
| US7: thiết bị có từ ba phiếu cùng nhóm sự cố | EP5 với `device_id` | `200` | Hiển thị `repeat_warning: true`. |
| US6: chuyển trạng thái hợp lệ | EP6 | `200` | Cập nhật trạng thái và ghi lịch sử. |
| US6: chuyển trạng thái ngược/sai vòng đời | EP6 | `409` | Không thay đổi trạng thái hoặc lịch sử. |

**Kết quả tự kiểm hợp đồng:** 6/6 endpoint được ánh xạ tới ít nhất một User Story; US1–US3 có endpoint phục vụ các chức năng MUST. US4 được thực hiện như bước đề xuất trong luồng tạo phiếu; US5–US7 có endpoint dự kiến cho các story SHOULD/COULD. Các phản hồi ví dụ và mã HTTP là hợp đồng thiết kế, cần kiểm thử tích hợp và đối chiếu với DDL/mã nguồn ở BT2–BT3 trước khi xem là kết quả triển khai.
