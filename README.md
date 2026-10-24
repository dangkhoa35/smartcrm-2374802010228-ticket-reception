# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** Hà Đăng Khoa – **MSSV:** 2374802010228  
**Track:** SE  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang  
**Case study:** Smart CRM – Mekong Mobile (doanh nghiệp mô phỏng) – luồng **L2**

---

## 1. Mô tả bài toán và phạm vi

Luồng nghiệp vụ: **L2 – Tiếp nhận và phân loại yêu cầu bảo hành**

- **Bắt đầu:** khách mang thiết bị đến trung tâm bảo hành; nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại và chọn thiết bị cần bảo hành.
- **Xử lý:** hệ thống kiểm tra thiết bị còn bảo hành hay không (QT01), thiết bị có phiếu chưa đóng hay không (QT03), gán nhóm sự cố và mức ưu tiên, tính hạn cam kết (QT02), rồi ghi phiếu cùng dòng lịch sử đầu tiên trong một giao dịch.
- **Kết thúc:** phiếu có mã dạng `BH-XXXXXX/YYYY`, trạng thái `MOI` và hạn cam kết; kỹ thuật viên tiếp tục chuyển trạng thái theo vòng đời của phiếu.

### Làm (In Scope)
- RESTful API tạo phiếu, xem danh sách, xem chi tiết và chuyển trạng thái phiếu bảo hành.
- Lưu dữ liệu vào PostgreSQL (`smartcrm`) với 8 bảng; nạp danh mục và dữ liệu thử từ bộ dữ liệu mẫu của học phần.
- Quy tắc nghiệp vụ QT01 (bảo hành), QT02 (hạn cam kết chỉ tính thứ Hai đến thứ Bảy), QT03 (một thiết bị một phiếu chưa đóng, vòng đời trạng thái), che số điện thoại, chống gửi trùng bằng `Idempotency-Key`.

### Không làm (Out of Scope)
- Tích hợp thanh toán linh kiện bảo hành trực tuyến.
- Xử lý trực tiếp quy trình sửa chữa kỹ thuật vật lý tại cửa hàng.
- Ứng dụng di động (Mobile App) riêng biệt.

---

## 2. Yêu cầu môi trường

- **Node.js** 20 LTS trở lên (đã chạy thử trên Node 22), **npm** 10
- **PostgreSQL** 16 cài trực tiếp trên máy (không dùng Docker), cổng 5432
- **Biến môi trường:** xem `.env.example` (`DATABASE_URL`, `PORT`)
- **Bộ dữ liệu mẫu** của học phần đặt trong `data/raw/` (không commit lên Git); seed của bộ dữ liệu: `20260901`

---

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ | Trạng thái |
|---|---|---|
| Ngôn ngữ / Runtime | Node.js 20 LTS (CommonJS) | Đang dùng |
| Framework API | Express.js | Đang dùng |
| Truy cập dữ liệu | `pg` (node-postgres), SQL tham số hóa | Đang dùng |
| Cơ sở dữ liệu | PostgreSQL 16 | Đang dùng |
| Đọc CSV | `csv-parse` | Đang dùng |
| Kiểm thử | Bộ chạy test có sẵn của Node.js (`node --test`) | Đang dùng |
| Giao diện | React (Vite) | Dự kiến, chưa làm |
| Tài liệu API | `docs/diagrams/api-contract.md`; Swagger UI | Markdown đã có; Swagger dự kiến |
| Đóng gói | Dockerfile + docker-compose | Dự kiến, chưa dùng ở Sprint 1 |

---

## 4. Cấu trúc thư mục

```text
smartcrm-2374802010228-ticket-reception/
├── data/
│   └── raw/                          # CSV của học phần (KHÔNG commit)
├── docs/
│   ├── diagrams/
│   │   ├── export/                   # ảnh xuất từ sơ đồ (architecture, erd, usecase, wireframe)
│   │   ├── ai-disclosure.md
│   │   ├── api-contract.md
│   │   ├── architecture.drawio
│   │   ├── erd.drawio
│   │   ├── srs.md
│   │   ├── thay-doi-thiet-ke.md
│   │   ├── usecase.drawio
│   │   └── usecase.png
│   └── screenshots/                  # ảnh chụp kết quả chạy API
├── src/
│   ├── backend/
│   │   ├── db/
│   │   │   ├── migrations/           # 001_init_schema.sql, 002_aux_tables.sql
│   │   │   ├── csv.js
│   │   │   ├── import-history.js
│   │   │   ├── migrate.js
│   │   │   ├── pool.js
│   │   │   └── seed.js
│   │   ├── middlewares/              # actor.js, errorHandler.js, requireRole.js
│   │   ├── repositories/             # device, issueCategory, ticket
│   │   ├── routes/                   # index.js, ticket.routes.js
│   │   ├── services/                 # ticket.service.js
│   │   ├── utils/                    # AppError.js, dueDate.js, phone.js
│   │   ├── app.js
│   │   └── server.js
│   └── frontend/                     # chưa làm (.gitkeep)
├── tests/                            # dueDate, phone, ticket.service
├── .env                              # cấu hình cục bộ, KHÔNG commit
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

### Ánh xạ thư mục với sơ đồ kiến trúc 5 lớp

| Lớp trong `architecture.drawio` | Thư mục / tệp | Trách nhiệm |
|---|---|---|
| 1. Giao diện web | `src/frontend/` | Chưa làm |
| 2. Lớp API (REST controller) | `src/backend/routes/`, `middlewares/` | Nhận và trả JSON, kiểm tra kiểu dữ liệu, kiểm tra vai trò |
| 3. Lớp nghiệp vụ (service) | `src/backend/services/` | Quy tắc QT01–QT03, che số điện thoại, chống gửi trùng |
| 4. Lớp truy cập dữ liệu (repository) | `src/backend/repositories/` | Chỉ chứa SQL; mở và đóng giao dịch |
| 5. Cơ sở dữ liệu PostgreSQL | `src/backend/db/` | Migration, seed, nạp dữ liệu thử |

`middlewares/` và `utils/` là mã hỗ trợ kỹ thuật, không phải một lớp nghiệp vụ riêng.

---

## 5. Hướng dẫn cài đặt và chạy

1. **Clone repository:**
   ```bash
   git clone https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
   cd smartcrm-2374802010228-ticket-reception
   ```

2. **Cài thư viện:**
   ```bash
   npm install
   ```

3. **Tạo user và database trong PostgreSQL** (mở `psql` bằng tài khoản `postgres`):
   ```sql
   CREATE USER smartcrm WITH PASSWORD 'mat-khau-cua-ban';
   CREATE DATABASE smartcrm OWNER smartcrm;
   ```

4. **Cấu hình biến môi trường:** sao chép `.env.example` thành `.env` rồi điền mật khẩu thật.
   ```powershell
   Copy-Item .env.example .env
   ```
   ```env
   PORT=3000
   DATABASE_URL=postgresql://smartcrm:mat-khau-cua-ban@localhost:5432/smartcrm
   ```

5. **Đặt bộ dữ liệu mẫu** vào `data/raw/` (tải từ trang học phần, mục "Mekong Mobile – Dataset Smart CRM"). Cần 7 tệp: `service_centers.csv`, `issue_categories.csv`, `technicians.csv`, `products.csv`, `customers_raw.csv`, `tickets_history.csv`, `ticket_status_log.csv`.

6. **Tạo bảng và nạp dữ liệu** (chạy theo đúng thứ tự):
   ```bash
   npm run migrate          # tạo 8 bảng theo DDL
   npm run seed             # danh mục: 6 trung tâm, 6 nhóm sự cố, 38 kỹ thuật viên, 60 mã nhân viên
   npm run import:history   # dữ liệu thử: 6.443 khách, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử
   ```
   Cả ba lệnh chạy lại được. Muốn nạp lại dữ liệu phiếu từ đầu: `npm run import:history -- --reset`.

7. **Chạy server và kiểm thử:**
   ```bash
   npm run dev              # http://localhost:3000
   npm test                 # chạy unit test
   ```

8. **Gọi thử API** (Git Bash hoặc Postman; trong PowerShell dùng `curl.exe`):
   ```bash
   curl -s localhost:3000/health
   curl -s "localhost:3000/api/tickets?status=DANG_XU_LY&size=3"
   curl -i -s -X POST localhost:3000/api/tickets -H "Content-Type: application/json" -d '{"issue_desc":""}'
   ```
   Kết quả mong đợi: `{"status":"ok"}`; danh sách phiếu kèm `paging`, số điện thoại đã che; `400 DU_LIEU_KHONG_HOP_LE`. Đặc tả đầy đủ: [`docs/diagrams/api-contract.md`](docs/diagrams/api-contract.md).

   Người thao tác hiện lấy từ header tạm `x-role`, `x-employee-id`, `x-center-id` (mặc định: tiếp nhận, mã 1, trung tâm 1). Cuối lệnh `import:history` có in sẵn cặp `device_id`/`customer_id` để thử `POST /api/tickets`.

### Lỗi môi trường thường gặp

| Thông báo | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Bật dịch vụ PostgreSQL (`services.msc`, dịch vụ `postgresql-x64-16`) |
| `password authentication failed` | Mật khẩu trong `DATABASE_URL` khác mật khẩu của user `smartcrm` |
| `Không thấy ...\data\raw\*.csv` | Chép đủ 7 tệp CSV vào `data/raw/` |
| `EADDRINUSE :::3000` | Đổi `PORT` trong `.env` hoặc tắt tiến trình đang dùng cổng 3000 |

---

## 6. Trạng thái hiện tại (buổi 8 – Sprint 1)

- [x] Migration `001`–`002`: 8 bảng theo DDL BT1 (đã bỏ `ticket_note` theo TD-01, thêm 3 bảng danh mục theo TD-07)
- [x] Seed danh mục: 6 trung tâm, 6 nhóm sự cố, 38 kỹ thuật viên, 60 mã nhân viên
- [x] Nạp dữ liệu thử từ bộ mẫu: 6.443 khách, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử
- [x] `POST /api/tickets`, `GET /api/tickets` (lọc `status`, phân trang), `GET /api/tickets/{id}`, `PATCH /api/tickets/{id}/status` qua routes → services → repositories
- [x] Quy tắc QT01, QT02, QT03, che số điện thoại, `Idempotency-Key`; ghi `ticket` và `ticket_status_log` trong một giao dịch
- [x] 37 unit test cho lớp nghiệp vụ (`npm test`)
- [ ] Đăng nhập thật (hiện dùng header `x-role` tạm thời) – dự kiến BT2
- [x] Entity thứ hai: tra cứu và tạo khách hàng (EP1–EP3)
- [ ] Đề xuất nhóm sự cố từ mô tả (US4); lọc `overdue`/`assignee_id`; lịch sử thiết bị và cảnh báo lỗi lặp lại (US7)
- [ ] Giao diện React (`src/frontend/`)

---

## 7. Tài liệu liên quan

| Nội dung | Tệp |
|---|---|
| Đặc tả yêu cầu phần mềm (SRS) | [`docs/diagrams/srs.md`](docs/diagrams/srs.md) |
| Hợp đồng API (v1.1) | [`docs/diagrams/api-contract.md`](docs/diagrams/api-contract.md) |
| Nhật ký thay đổi thiết kế | [`docs/diagrams/thay-doi-thiet-ke.md`](docs/diagrams/thay-doi-thiet-ke.md) |
| Sơ đồ Use Case | [`docs/diagrams/usecase.drawio`](docs/diagrams/usecase.drawio) |
| Sơ đồ kiến trúc | [`docs/diagrams/architecture.drawio`](docs/diagrams/architecture.drawio) |
| Sơ đồ ERD | [`docs/diagrams/erd.drawio`](docs/diagrams/erd.drawio) |
| Wireframe | [`docs/diagrams/export/wireframe.png`](docs/diagrams/export/wireframe.png) |
| Ảnh chụp kết quả chạy API | [`docs/screenshots/`](docs/screenshots/) |
| Khai báo sử dụng công cụ AI | [`docs/diagrams/ai-disclosure.md`](docs/diagrams/ai-disclosure.md) |
| Hình ảnh sơ đồ đã xuất | [`docs/diagrams/export/`](docs/diagrams/export/) |

---

## 8. Phụ lục – Khai báo sử dụng công cụ AI

### 8.1. Công cụ AI được sử dụng

| Công cụ AI | Phần áp dụng | Cách dùng (tóm tắt yêu cầu đã gửi) | Em đã kiểm chứng / chỉnh sửa gì |
|---|---|---|---|
| **Claude** | Mục 1 (SRS, User Story) | Nhờ soạn nháp User Story, SRS 6 mục, tiêu chí Given–When–Then từ tài liệu buổi 3 và case study | Tôi đã kiểm chứng bảng thuật ngữ với file gốc cùng với tài liệu tự học buổi 3 và lý thuyết buổi 3. Kiểm tra các yêu cầu chức năng và phi chức năng có phù hợp với yêu cầu của đề bài hay không. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 2 (Use Case) | Nhờ vẽ Use Case Diagram và soạn đặc tả UC2 | Tôi đã kiểm chứng với file gốc cũng như tài liệu tự học buổi 4 và lý thuyết buổi 4. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 3 (Kiến trúc) | Nhờ vẽ sơ đồ 5 lớp theo mẫu và soạn các câu lập luận "Vì NFR…" | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 4 (Mô hình dữ liệu) | Nhờ thiết kế ERD 6 bảng, phân tích 3NF, viết DDL PostgreSQL | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 5 (Wireframe) | Nhờ vẽ 3 màn hình và đối chiếu trường với ERD | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Sprint 1 – migration, seed, nạp dữ liệu (`src/backend/db/`) | Gửi slide buổi 8, BT1 và bộ dữ liệu mẫu, nhờ hướng dẫn chặng 2–3 và soạn mã nền | Em tự chạy `migrate`, `seed`, `import:history` trên PostgreSQL cài trực tiếp; đối chiếu số dòng với CSV (6 / 6 / 38 / 60 và 6.443 / 7.800 / 7.800 / 38.112); đối chiếu DDL với BT1, bỏ bảng `ticket_note` theo TD-01; chạy lại nhiều lần không bị nhân đôi dữ liệu. |
| **Claude** | Sprint 1 – API phiếu bảo hành (`routes`, `services`, `repositories`, `middlewares`, `utils`) | Nhờ soạn mã 3 lớp theo thiết kế kiến trúc và quy tắc QT01–QT03 | Em đọc từng lớp để hiểu trách nhiệm; gọi API bằng curl/Postman, chụp ảnh lưu trong `docs/screenshots/`; đối chiếu các quy tắc với SRS. |
| **Claude** | Sprint 1 – unit test (`tests/`) | Nhờ viết test cho QT01, QT02, QT03 và che số điện thoại | Em chạy `npm test` (37 test đạt) và đọc từng trường hợp thử. |
| **Claude** | Tài liệu: `README.md`, `api-contract.md` v1.1 | Gửi bản cũ, nhờ đồng bộ với mã nguồn Sprint 1 | Em đối chiếu từng endpoint, mã lỗi và ví dụ với kết quả gọi API thực tế. |
| **Antigravity** | Rà soát repo trước khi push | Gửi prompt kiểm tra checklist buổi 8 (chỉ đọc, không sửa) | Em tự đọc từng mục FAIL/WARN, quyết định sửa; bỏ qua cảnh báo không áp dụng (ví dụ tệp PDF BT1 là bài nộp). |

### 8.2. Các phần tự thực hiện, không sử dụng AI

| Công cụ AI | Công việc | Áp dụng ở phần nào | Kiểm chứng / chỉnh sửa |
|---|---|---|---|
| Không dùng | Tự vẽ sơ đồ Use Case. | Mục 2 | Không áp dụng. |
| Không dùng | Tự vẽ kiến trúc phân lớp của luồng L2. | Mục 3 | Không áp dụng. |
| Không dùng | Tự vẽ wireframe. | Mục 5 | Không áp dụng. |
| Không dùng | Tự vẽ sơ đồ ERD. | Mục 4.1 | Không áp dụng. |