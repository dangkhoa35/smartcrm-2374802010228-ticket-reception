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
- RESTful API: tra cứu và tạo khách hàng, xem thiết bị của khách, tạo phiếu, xem danh sách, xem chi tiết và chuyển trạng thái phiếu bảo hành.
- Giao diện web React: danh sách phiếu, tạo phiếu (tra khách, chọn thiết bị, phân loại), chi tiết phiếu và chuyển trạng thái, xử lý đủ ba trạng thái đang tải, rỗng, lỗi.
- Lưu dữ liệu vào PostgreSQL (`smartcrm`) với 8 bảng; nạp danh mục và dữ liệu thử từ bộ dữ liệu mẫu của học phần.
- Quy tắc nghiệp vụ QT01 (bảo hành), QT02 (hạn cam kết chỉ tính thứ Hai đến thứ Bảy), QT03 (một thiết bị một phiếu chưa đóng, vòng đời trạng thái), che số điện thoại, chống gửi trùng bằng `Idempotency-Key`.
- Hợp đồng dữ liệu viết ra ở mỗi ranh giới: hàm chuyển đổi `contracts/`, kiểm tra đầu vào bằng schema `validators/`, một định dạng lỗi thống nhất.
- Đóng gói để người khác chạy lại được bằng `docker compose` (buổi 11), nhật ký JSON có mã yêu cầu, xử lý lỗi xuyên các lớp.

### Không làm (Out of Scope)
- Tích hợp thanh toán linh kiện bảo hành trực tuyến.
- Xử lý trực tiếp quy trình sửa chữa kỹ thuật vật lý tại cửa hàng.
- Ứng dụng di động (Mobile App) riêng biệt.

---

## 2. Yêu cầu môi trường

Có hai cách chạy. **Cách A (khuyến nghị)** không cần cài Node hay PostgreSQL.

| | Cách A – Docker | Cách B – chạy trực tiếp |
|---|---|---|
| Cần cài | Docker Desktop (Docker Compose v2) | Node.js **22 LTS** (xem `.nvmrc`), npm 10+, PostgreSQL **16** cổng 5432 |
| Dữ liệu nạp | Bộ **mẫu nhỏ** trong `data/sample/` (có sẵn trong repo) | Bộ **đầy đủ** trong `data/raw/` (không commit) |
| Biến môi trường | `.env` (xem `.env.example`) | `.env` và `src/frontend/.env` (xem hai tệp `.env.example`) |

- Bộ dữ liệu đầy đủ của học phần đặt trong `data/raw/`; seed của bộ dữ liệu: `20260901`.
- Bộ mẫu nhỏ `data/sample/` được cắt từ bộ đầy đủ bằng `node scripts/make-sample.js` (300 phiếu, 298 khách, 300 thiết bị, 1.448 dòng lịch sử).

---

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ | Trạng thái |
|---|---|---|
| Ngôn ngữ / Runtime | Node.js 22 LTS (CommonJS) | Đang dùng |
| Framework API | Express.js 5, `cors` | Đang dùng |
| Kiểm tra đầu vào | `zod` (schema ở `validators/`) | Đang dùng |
| Truy cập dữ liệu | `pg` (node-postgres), SQL tham số hóa | Đang dùng |
| Cơ sở dữ liệu | PostgreSQL 16 | Đang dùng |
| Đọc CSV | `csv-parse` | Đang dùng |
| Giao diện | React 19, Vite, React Router | Đang dùng |
| Nhật ký | Logger JSON tự viết (`utils/logger.js`), ghi ra stdout | Đang dùng |
| Kiểm thử backend | Bộ chạy test có sẵn của Node.js (`node --test`) | Đang dùng |
| Kiểm thử frontend | Vitest, Testing Library, jsdom | Đang dùng |
| Đóng gói | Docker, Docker Compose (Dockerfile nhiều giai đoạn; nginx phục vụ giao diện) | Đang dùng |
| Tài liệu API | `docs/diagrams/api-contract.md`; Swagger UI | Markdown đã có; Swagger dự kiến |

---

## 4. Cấu trúc thư mục

```text
smartcrm-2374802010228-ticket-reception/
├── data/
│   ├── raw/                          # CSV đầy đủ của học phần (KHÔNG commit)
│   └── sample/                       # bộ mẫu nhỏ (CÓ commit) để chạy bằng Docker
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
│   ├── screenshots/                  # ảnh chụp kết quả chạy API, giao diện, Docker
│   └── bug-log.md                    # nhật ký lỗi đã gỡ (buổi 11)
├── scripts/
│   └── make-sample.js                # cắt data/raw thành data/sample
├── src/
│   ├── backend/
│   │   ├── contracts/                # hợp đồng dữ liệu + hàm chuyển đổi: ticket, customer
│   │   ├── db/
│   │   │   ├── migrations/           # 001_init_schema.sql, 002_aux_tables.sql
│   │   │   ├── csv.js
│   │   │   ├── import-history.js
│   │   │   ├── migrate.js
│   │   │   ├── pool.js
│   │   │   └── seed.js
│   │   ├── middlewares/              # actor.js, errorHandler.js, requireRole.js
│   │   ├── repositories/             # customer, device, issueCategory, ticket
│   │   ├── routes/                   # index.js, ticket, customer, issueCategory
│   │   ├── services/                 # ticket, customer, issueCategory
│   │   ├── utils/                    # AppError.js, dueDate.js, phone.js, logger.js
│   │   ├── validators/               # parse.js, ticket.schema.js, customer.schema.js (zod)
│   │   ├── app.js
│   │   └── server.js
│   └── frontend/                     # React + Vite
│       ├── src/
│       │   ├── api/                  # lớp gọi API duy nhất (client.js, *.api.js)
│       │   ├── auth/                 # phiên làm việc tạm thời
│       │   ├── components/           # DataState (ba trạng thái), Layout, Badge, Pagination, FieldError
│       │   ├── hooks/                # useApi, useTickets
│       │   ├── pages/                # Login, TicketList, ReceiveDevice, TicketDetail
│       │   ├── utils/                # labels.js (nhãn tiếng Việt), format.js
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── tests/                    # *.spec.js(x) chạy bằng vitest
│       ├── .dockerignore
│       ├── .env.example
│       ├── Dockerfile                # dựng bản sản xuất rồi phục vụ bằng nginx
│       ├── index.html
│       ├── nginx.conf
│       ├── package.json
│       └── vite.config.js
├── tests/                            # test backend: dueDate, phone, ticket/customer, logger, errorHandler, server
├── .dockerignore
├── .env                              # cấu hình cục bộ, KHÔNG commit
├── .env.example
├── .gitattributes
├── .gitignore
├── .nvmrc
├── Dockerfile                        # ảnh API (và bước nạp dữ liệu)
├── docker-compose.yml                # db, init, api, web
├── package-lock.json
├── package.json
└── README.md
```

### Ánh xạ thư mục với sơ đồ kiến trúc 5 lớp

| Lớp trong `architecture.drawio` | Thư mục / tệp | Trách nhiệm |
|---|---|---|
| 1. Giao diện web | `src/frontend/` | Hiển thị, gọi API qua `src/api/`, xử lý ba trạng thái đang tải, rỗng, lỗi |
| 2. Lớp API (REST controller) | `src/backend/routes/`, `validators/`, `middlewares/` | Nhận và trả JSON, kiểm tra dữ liệu đầu vào một lần ở cửa vào, kiểm tra vai trò |
| 3. Lớp nghiệp vụ (service) | `src/backend/services/`, `contracts/` | Quy tắc QT01–QT03, che số điện thoại, chống gửi trùng; hàm chuyển đổi dòng CSDL thành JSON theo hợp đồng |
| 4. Lớp truy cập dữ liệu (repository) | `src/backend/repositories/` | Chỉ chứa SQL; mở và đóng giao dịch |
| 5. Cơ sở dữ liệu PostgreSQL | `src/backend/db/` | Migration, seed, nạp dữ liệu thử |

`middlewares/` và `utils/` là mã hỗ trợ kỹ thuật, không phải một lớp nghiệp vụ riêng.

---

## 5. Hướng dẫn cài đặt và chạy

### Cách A – Docker (hai lệnh)

Cần Docker Desktop đang chạy. Dừng `npm run dev` (nếu có) để khỏi trùng cổng 3000 và 5173.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```
Trên macOS/Linux/Git Bash, lệnh đầu là `cp .env.example .env`. Có thể giữ nguyên các giá trị mẫu trong `.env` để chạy thử trên máy cá nhân; muốn dùng mật khẩu riêng thì đổi `DB_PASSWORD` (không dùng ký tự `@ : / # ?`).

Lần dựng đầu mất vài phút. Kiểm tra bằng `docker compose ps -a`: `db`, `api`, `web` phải ở trạng thái **healthy**; `init` (nạp dữ liệu một lần) ở trạng thái **Exited (0)** là bình thường.

| Dịch vụ | Địa chỉ trên máy | Vai trò |
|---|---|---|
| Giao diện (`web`) | http://localhost:5173 | **Địa chỉ duy nhất để mở giao diện** khi chạy bằng Docker |
| API (`api`) | http://localhost:3000 (thử `/health`) | Backend Express |
| CSDL (`db`) | `localhost:5433` | PostgreSQL 16; cổng 5433 để không đụng PostgreSQL cài sẵn ở 5432 |

Các lệnh thường dùng (trong PowerShell cũ, chạy **từng lệnh riêng**, không dùng `&&`):
```powershell
docker compose logs api --tail 20      # nhật ký JSON của API, có requestId
docker compose logs init               # kết quả tạo bảng và nạp dữ liệu
docker compose down                    # dừng, giữ dữ liệu
docker compose down -v                 # dừng và xóa dữ liệu, dựng lại từ đầu lần sau
```
- Nạp bộ dữ liệu **đầy đủ** thay vì bộ mẫu: thêm `DATASET_HOST_DIR=./data/raw` vào `.env`, rồi `docker compose down -v` và `docker compose up -d --build`.
- Đổi cổng nếu bị trùng: `API_PORT`, `WEB_PORT`, `DB_HOST_PORT` trong `.env`. Nếu đổi `WEB_PORT`, phải đổi `CORS_ORIGIN` cho khớp địa chỉ mở giao diện.

Thử nhanh (trong PowerShell dùng `curl.exe`):
```powershell
curl.exe -s localhost:3000/health
curl.exe -s "localhost:3000/api/tickets?size=2"
```

### Cách B – chạy trực tiếp trên máy

1. **Clone repository:**
   ```bash
   git clone https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
   cd smartcrm-2374802010228-ticket-reception
   ```

2. **Cài thư viện** (dùng `npm ci` để đúng phiên bản trong `package-lock.json`):
   ```bash
   npm ci
   npm ci --prefix src/frontend
   ```

3. **Tạo user và database trong PostgreSQL** (mở `psql` bằng tài khoản `postgres`):
   ```sql
   CREATE USER smartcrm WITH PASSWORD 'mat-khau-cua-ban';
   CREATE DATABASE smartcrm OWNER smartcrm;
   ```

4. **Cấu hình biến môi trường:** sao chép `.env.example` thành `.env` rồi điền mật khẩu thật vào dòng `DATABASE_URL`.
   ```powershell
   Copy-Item .env.example .env
   Copy-Item src/frontend/.env.example src/frontend/.env
   ```
   Trên macOS/Linux/Git Bash dùng `cp`. Phần dùng cho cách B trong `.env`:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://smartcrm:mat-khau-cua-ban@localhost:5432/smartcrm
   CORS_ORIGIN=http://localhost:5173
   ```
   và trong `src/frontend/.env`: `VITE_API_BASE_URL=http://localhost:3000`.

5. **Đặt bộ dữ liệu mẫu** vào `data/raw/` (tải từ trang học phần, mục "Mekong Mobile – Dataset Smart CRM"). Cần 7 tệp: `service_centers.csv`, `issue_categories.csv`, `technicians.csv`, `products.csv`, `customers_raw.csv`, `tickets_history.csv`, `ticket_status_log.csv`.

6. **Tạo bảng và nạp dữ liệu** (chạy theo đúng thứ tự):
   ```bash
   npm run migrate          # tạo 8 bảng theo DDL
   npm run seed             # danh mục: 6 trung tâm, 6 nhóm sự cố, 38 kỹ thuật viên, 60 mã nhân viên
   npm run import:history   # dữ liệu thử: 6.443 khách, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử
   ```
   Cả ba lệnh chạy lại được. Muốn nạp lại dữ liệu phiếu từ đầu: `npm run import:history -- --reset`.

7. **Chạy backend và kiểm thử:**
   ```bash
   npm run dev              # http://localhost:3000
   npm test                 # 58 test backend (node --test)
   ```

8. **Chạy giao diện** (mở cửa sổ terminal khác; backend phải đang chạy):
   ```bash
   cd src/frontend
   npm run dev              # http://localhost:5173
   npm test                 # test giao diện (vitest)
   npm run build            # bản dựng sản xuất vào src/frontend/dist/
   ```
   Màn đăng nhập hiện chỉ chọn vai trò, mã nhân viên và mã trung tâm (xem mục 6.1). Mã nhân viên phải là mã có thật trong bảng `employee` (mặc định `1`). Muốn chuyển trạng thái phiếu thì chọn vai trò Kỹ thuật viên ở thanh đầu trang; muốn tạo phiếu thì chọn Nhân viên tiếp nhận.

9. **Gọi thử API** (Git Bash hoặc Postman; trong PowerShell dùng `curl.exe`):
   ```bash
   curl -s localhost:3000/health
   curl -s "localhost:3000/api/tickets?status=DANG_XU_LY&size=3"
   curl -s localhost:3000/api/issue-categories
   curl -i -s -X POST localhost:3000/api/tickets -H "Content-Type: application/json" -d '{"issue_desc":""}'
   ```
   Kết quả mong đợi: `{"status":"ok"}`; danh sách phiếu kèm `paging`, số điện thoại đã che; danh mục nhóm sự cố; `400 DU_LIEU_KHONG_HOP_LE` kèm `fields` theo từng trường. Đặc tả đầy đủ: [`docs/diagrams/api-contract.md`](docs/diagrams/api-contract.md).

   Trong PowerShell, gửi JSON bằng tệp để tránh lỗi dấu nháy: `curl.exe -i -s -X POST localhost:3000/api/tickets -H "Content-Type: application/json" --data-binary "@body.json"`.

   Người thao tác ở API hiện lấy từ header tạm `x-role`, `x-employee-id`, `x-center-id` (mặc định: tiếp nhận, mã 1, trung tâm 1). Cuối lệnh `import:history` có in sẵn cặp `device_id`/`customer_id` để thử `POST /api/tickets`.

### Lỗi môi trường thường gặp

| Thông báo / triệu chứng | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` (cách B) | Bật dịch vụ PostgreSQL (`services.msc`, dịch vụ `postgresql-x64-16`) |
| `password authentication failed` (cách B) | Mật khẩu trong `DATABASE_URL` khác mật khẩu của user `smartcrm` |
| `Không thấy ...\data\raw\*.csv` (cách B) | Chép đủ 7 tệp CSV vào `data/raw/` |
| `EADDRINUSE :::3000` | Cổng 3000 đang có tiến trình khác dùng, thường là container `api` của Docker. Chạy Docker thì **không** chạy `npm run dev`; hoặc đổi `PORT`/`API_PORT` |
| `port is already allocated` khi `docker compose up` | Tắt `npm run dev` và Vite đang chạy, hoặc đổi `API_PORT`, `WEB_PORT`, `DB_HOST_PORT` trong `.env` |
| Giao diện báo "Không kết nối được tới hệ thống" | Mở đúng http://localhost:5173 (Docker). Trang ở cổng khác (ví dụ 5174 của Vite dev) bị API chặn theo CORS vì `CORS_ORIGIN` chỉ cho phép 5173. Nếu đúng cổng mà vẫn lỗi: kiểm tra `docker compose ps -a` và `VITE_API_BASE_URL`/`PUBLIC_API_URL` |
| Giao diện báo "Chưa cấu hình địa chỉ máy chủ" (cách B) | Chưa có `src/frontend/.env`; sao chép từ `.env.example` rồi chạy lại `npm run dev` |
| Thao tác ghi báo "Hệ thống đang gặp sự cố" | Mã nhân viên ở màn đăng nhập phải có trong bảng `employee`; tra mã hiện trên màn hình trong log: `docker compose logs api` (hoặc log backend ở cách B) |
| `docker compose logs init` báo `Không thấy /data/service_centers.csv` | Thư mục `data/sample/` đang trống hoặc không có. Chạy `node scripts/make-sample.js` (cần `data/raw/`), rồi `docker compose up -d` |
| `failed to solve ... read-only file system` | Lỗi của Docker Desktop, không phải của dự án: ổ chứa dữ liệu Docker đầy hoặc WSL bị treo. Giải phóng ổ đĩa (hoặc đổi nơi lưu ở Settings > Resources > Advanced), `wsl --shutdown`, mở lại Docker Desktop |
| `failed to calculate checksum ... "/app/node_modules": not found` khi dựng | Chạy `docker builder prune -af` rồi `docker compose up -d --build` |
| PowerShell báo `&&` không hợp lệ | PowerShell 5.1 không hỗ trợ `&&`; chạy từng lệnh riêng hoặc nối bằng `;` |
| Đổi `DB_PASSWORD` mà vẫn báo sai mật khẩu | PostgreSQL giữ mật khẩu cũ trong volume: `docker compose down -v` rồi dựng lại |

---

## 6. Trạng thái hiện tại (buổi 11 – tích hợp hệ thống và xử lý lỗi)

- [x] Migration `001`–`002`: 8 bảng theo DDL BT1 (đã bỏ `ticket_note` theo TD-01, thêm 3 bảng danh mục theo TD-07)
- [x] Seed danh mục: 6 trung tâm, 6 nhóm sự cố, 38 kỹ thuật viên, 60 mã nhân viên
- [x] Nạp dữ liệu thử từ bộ mẫu: 6.443 khách, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử
- [x] `POST /api/tickets`, `GET /api/tickets` (lọc `status`, phân trang), `GET /api/tickets/{id}`, `PATCH /api/tickets/{id}/status` qua routes → services → repositories
- [x] Quy tắc QT01, QT02, QT03, che số điện thoại, `Idempotency-Key`; ghi `ticket` và `ticket_status_log` trong một giao dịch
- [x] Entity thứ hai: tra cứu và tạo khách hàng, thiết bị của khách, danh mục nhóm sự cố (EP1–EP3, EP8)
- [x] Buổi 10: danh sách mặc định "Đang mở" (`open=true`, EP5); thêm thiết bị cho khách (EP9); kiểm tra mã Quản lý phê duyệt (`422 NGUOI_PHE_DUYET_KHONG_HOP_LE`); phân công kỹ thuật viên khi chuyển `DA_PHAN_CONG` (EP6 + EP10), hiện tên kỹ thuật viên; ngày hiển thị năm 4 chữ số (xem `api-contract.md` và TD-09)
- [x] Hợp đồng dữ liệu ở ranh giới: `contracts/` (hàm chuyển đổi), `validators/` (zod), một định dạng lỗi `error` / `message` / `fields`, lỗi 500 kèm mã tra cứu
- [x] Giao diện React: 4 màn hình gọi API thật, ba trạng thái đang tải / rỗng / lỗi, không gọi `fetch` ngoài `src/frontend/src/api/`
- [x] **Buổi 11:** đóng gói bằng Docker Compose (`db`, `init`, `api`, `web`), dựng được từ thư mục sạch bằng hai lệnh (mục 5, cách A)
- [x] **Buổi 11:** bộ dữ liệu mẫu nhỏ `data/sample/` có trong repo; `.env.example` liệt kê đủ biến; tệp khoá `package-lock.json` ở cả hai gói; `.nvmrc` ghi phiên bản Node
- [x] **Buổi 11:** nhật ký JSON ra stdout có `requestId`, che dữ liệu nhạy cảm; một bộ xử lý lỗi duy nhất (lỗi nghiệp vụ ghi INFO, lỗi hệ thống ghi ERROR một lần kèm mã tra cứu); mất kết nối CSDL trả `503` (mục 6.3)
- [x] **Buổi 11:** `docs/bug-log.md` ghi 3 lỗi đã gỡ, mỗi lỗi có test hồi quy FAIL trước, PASS sau
- [x] 58 unit test backend (`npm test` ở thư mục gốc) và 36 test giao diện (`npm test` trong `src/frontend`), gồm luồng đúng, giá trị biên, dữ liệu sai và luồng lỗi 409/422/503
- [ ] Đăng nhập thật (hiện chọn vai trò, xem mục 6.1) – dự kiến BT2 (TD-12)
- [ ] Đề xuất nhóm sự cố từ mô tả (US4) – hoãn (TD-10)
- [ ] Lọc `overdue`/`assignee_id`/serial; lịch sử trạng thái trên màn chi tiết; lịch sử thiết bị và cảnh báo lỗi lặp lại (US7) – hoãn (TD-11)

### 6.1. Xác thực tạm thời và hạn chế đã biết

- **Cách làm:** người dùng chọn vai trò, mã nhân viên và mã trung tâm ở màn `/login`; giao diện lưu trong `localStorage` và gửi lên backend qua ba header `x-role`, `x-employee-id`, `x-center-id` (đúng cơ chế tạm thời ở `api-contract.md` mục 1.1).
- **Hạn chế:** không có mật khẩu, người dùng tự chọn vai trò; `localStorage` đọc được nếu trang có lỗ hổng chèn mã (XSS). Chấp nhận ở mức prototype vì giao diện không hiển thị nội dung HTML do người dùng nhập.
- **Khi API trả `401`:** lớp gọi API xóa phiên và chuyển về `/login`.
- **Thiết kế đích:** JWT Bearer, thay `src/frontend/src/auth/` và hàm `request()` ở BT2; các màn hình giữ nguyên.
- Một số quy tắc trên giao diện (nhãn tình trạng bảo hành lúc chọn thiết bị, danh sách trạng thái kế tiếp) chỉ để gợi ý; máy chủ luôn là nơi quyết định và trả lỗi `422` nếu sai.

### 6.2. Màn hình, câu hỏi người dùng và ngữ cảnh so sánh

| Màn hình | Câu hỏi mà màn hình trả lời | Ngữ cảnh so sánh | API |
|---|---|---|---|
| Danh sách phiếu `/tickets` | "Hôm nay tôi phải xử lý phiếu nào trước?" | Mặc định "Đang mở" (ẩn phiếu đã đóng/hủy), sắp theo hạn cam kết tăng dần, tô đỏ phiếu quá hạn, đếm số phiếu quá hạn của trang và tổng số phiếu | EP5 |
| Tạo phiếu `/tickets/new` | "Thiết bị này tiếp nhận được chưa, hạn bảo hành thế nào?" | Ngày mua, số tháng bảo hành và tình trạng bảo hành hiện ngay khi chọn thiết bị; khách chưa có thiết bị thì thêm ngay tại màn này | EP1, EP2, EP3, EP9, EP8, EP4 |
| Chi tiết phiếu `/tickets/:id` | "Phiếu này đang ở đâu, ai phụ trách, còn bao lâu đến hạn?" | Hạn cam kết kèm "Quá hạn N ngày" hoặc "Còn N giờ"; tên kỹ thuật viên; chọn kỹ thuật viên khi phân công | EP7, EP6, EP10 |
| Đăng nhập `/login` | Chọn vai trò làm việc | Không áp dụng | Không gọi API |

Cả ba màn hình có dữ liệu đều xử lý đủ: đang tải (khung chờ), rỗng (lời giải thích kèm hành động, ví dụ nút Xóa bộ lọc), lỗi (câu giải thích kèm nút Thử lại khi lỗi tạm thời).

### 6.3. Nhật ký và xử lý lỗi (buổi 11)

**Nhật ký.** Mỗi sự kiện là một dòng JSON ghi ra stdout (xem bằng `docker compose logs api`), có thời điểm ISO, mức, thông điệp và ngữ cảnh. Mỗi yêu cầu có một `requestId` (cũng trả về ở header `X-Request-Id`). Mức ghi chỉnh bằng `LOG_LEVEL` (`debug`, `info`, `warn`, `error`). Các trường nhạy cảm (số điện thoại, email, địa chỉ, mật khẩu, token, chuỗi kết nối) bị che thành `***`; log chỉ ghi đường dẫn, không ghi chuỗi truy vấn. Yêu cầu `/health` không bị ghi log để healthcheck không làm ngập nhật ký.

```json
{"thoi_diem":"2026-10-30T03:55:15.338Z","muc":"error","thong_diep":"lỗi hệ thống","requestId":"8edcbd75-1fdf-4dbc-a7b6-05405dce86f2","phuong_thuc":"GET","duong_dan":"/api/tickets","ma_trang_thai":503,"loi":{"loai":"Error","thong_diep":"getaddrinfo ENOTFOUND db","ma":"ENOTFOUND"}}
```

**Phân loại lỗi.** Một bộ xử lý lỗi duy nhất (`middlewares/errorHandler.js`) đăng ký cuối cùng trong `app.js`:

| Loại lỗi | Mã HTTP | Nhật ký | Người dùng thấy |
|---|---|---|---|
| Dữ liệu vào sai, vi phạm quy tắc nghiệp vụ (`AppError`) | 400 / 404 / 409 / 422 | INFO | Thông điệp tiếng Việt, kèm `fields` theo từng trường nếu có |
| Hệ thống lỗi bất ngờ | 500 `LOI_HE_THONG` | ERROR đúng một lần, kèm `requestId` và ngăn xếp | Câu chung kèm **mã tra cứu** = `requestId`, không lộ chi tiết kỹ thuật |
| Mất kết nối CSDL hoặc hạ tầng (`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`...) | 503 `LOI_HE_THONG` | ERROR như trên | Như dòng trên |

Giao diện xử lý được cả hai trường hợp 5xx: hiện thông báo lỗi và nút **Thử lại**; khi CSDL hoặc API bật lại thì bấm **Thử lại** là có dữ liệu, không cần khởi động lại API.

### 6.4. Quyết định đóng gói

| Quyết định | Lý do |
|---|---|
| Thứ tự `db` → `init` → `api` → `web`, dùng `depends_on` với `service_healthy` / `service_completed_successfully` | API chỉ khởi động khi CSDL đã sẵn sàng và bảng đã được tạo, nên không cần vòng thử lại thủ công |
| `init` là dịch vụ chạy một lần: `migrate` → `seed` → `import-history` | Cả ba lệnh chạy lại được, nên `docker compose up` nhiều lần không nhân đôi dữ liệu |
| `init` và `api` dùng chung một ảnh `smartcrm-api:local` | Dựng một lần, tránh hai tiến trình build tranh nhau cùng lớp cache |
| CSV nguồn gắn vào chế độ chỉ đọc (`./data/sample:/data:ro`), không nằm trong ảnh | Ảnh nhỏ, dữ liệu không bị "đóng" vào ảnh; đổi bộ dữ liệu bằng `DATASET_HOST_DIR` |
| Dockerfile nhiều giai đoạn, ảnh gốc ghim phiên bản (`node:22-alpine`, `postgres:16-alpine`, `nginx:1.27-alpine`), cài bằng `npm ci --omit=dev`, API chạy bằng user `node` | Dựng lặp lại được, ảnh nhỏ, không chạy bằng root |
| `.dockerignore` loại `.env`, `node_modules`, `.git`, `data/raw`, `docs`, `tests` | Không đưa bí mật và tệp lớn vào ảnh |
| `healthcheck` cho `db` (`pg_isready`), `api` (`/health`), `web` | Compose biết dịch vụ đã **sẵn sàng**, không chỉ đã khởi động |
| Cổng CSDL ngoài máy là 5433 | Không đụng PostgreSQL cài sẵn ở 5432 |
| Địa chỉ API được đóng vào bản dựng giao diện (`VITE_API_BASE_URL` truyền qua `build.args`) và `CORS_ORIGIN` phải khớp địa chỉ mở giao diện | Biến `VITE_*` chỉ có tác dụng lúc build; API chỉ chấp nhận trang từ `CORS_ORIGIN` |
| `server.js` thoát mã 1 và ghi log ERROR khi không mở được cổng; đóng gọn khi nhận `SIGTERM` | Lỗi cổng không bị che giấu; `docker compose down` dừng nhanh |

---

## 7. Tài liệu liên quan

| Nội dung | Tệp |
|---|---|
| Đặc tả yêu cầu phần mềm (SRS) | [`docs/diagrams/srs.md`](docs/diagrams/srs.md) |
| Hợp đồng API | [`docs/diagrams/api-contract.md`](docs/diagrams/api-contract.md) |
| Nhật ký thay đổi thiết kế | [`docs/diagrams/thay-doi-thiet-ke.md`](docs/diagrams/thay-doi-thiet-ke.md) |
| Nhật ký lỗi đã gỡ (buổi 11) | [`docs/bug-log.md`](docs/bug-log.md) |
| Sơ đồ Use Case | [`docs/diagrams/usecase.drawio`](docs/diagrams/usecase.drawio) |
| Sơ đồ kiến trúc | [`docs/diagrams/architecture.drawio`](docs/diagrams/architecture.drawio) |
| Sơ đồ ERD | [`docs/diagrams/erd.drawio`](docs/diagrams/erd.drawio) |
| Wireframe | [`docs/diagrams/export/wireframe.png`](docs/diagrams/export/wireframe.png) |
| Ảnh chụp kết quả chạy API, giao diện, Docker | [`docs/screenshots/`](docs/screenshots/) |
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
| **Claude** | Sprint 1 – unit test (`tests/`) | Nhờ viết test cho QT01, QT02, QT03 và che số điện thoại | Em chạy `npm test` và đọc từng trường hợp thử. |
| **Claude** | Sprint 2 (buổi 9) – hợp đồng ở ranh giới backend (`contracts/`, `validators/`, `errorHandler.js`, CORS) | Gửi slide và tài liệu tự học buổi 9, nhờ đối chiếu mã Sprint 1 với yêu cầu và soạn mã hàm chuyển đổi, schema zod, định dạng lỗi `fields` | Em chép mã vào dự án, chạy `npm test` (37 test đạt), gọi API bằng `curl.exe` để thấy lỗi 400 có `fields` theo từng trường; đổi định dạng lỗi `details` thành `fields` và ghi vào `thay-doi-thiet-ke.md`. |
| **Claude** | Sprint 2 – EP1–EP3, EP8 (`customer`, `issueCategory`) | Nhờ soạn mã ba lớp, test và ví dụ cho tra cứu và tạo khách hàng, thiết bị của khách, danh mục nhóm sự cố | Em chạy `npm test` và gọi từng endpoint bằng `curl.exe` với số điện thoại thật trong dữ liệu; đối chiếu mã lỗi 404, 409, 400 với `api-contract.md`. |
| **Claude** | Sprint 2 – giao diện React (`src/frontend/`) | Nhờ soạn cấu trúc thành phần, lớp gọi API, thành phần ba trạng thái và bốn màn hình theo wireframe | Em chạy `npm run dev` cùng backend và thử từng màn hình trên trình duyệt, gồm: tắt backend để thấy lỗi có nút Thử lại, lọc ra rỗng, nhập sai để thấy lỗi cạnh ô; chạy `npm test` giao diện (36 test đạt); chụp ảnh lưu trong `docs/screenshots/`. |
| **Claude** | Tài liệu: `README.md`, `api-contract.md` v1.1, v1.2 | Gửi bản cũ, nhờ đồng bộ với mã nguồn Sprint 1 và Sprint 2 | Em đối chiếu từng endpoint, mã lỗi và ví dụ với kết quả gọi API thực tế. |
| **Claude** | Buổi 11 – đóng gói Docker (`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`, `nginx.conf`, `.gitattributes`, `.nvmrc`) | Gửi hai tài liệu buổi 11 và repo, nhờ hướng dẫn đóng gói theo stack Node/React/PostgreSQL | Em tự chạy `docker compose down -v` rồi `up -d --build` từ trạng thái sạch; tự gỡ các sự cố gặp phải (thư mục `data/sample` trống làm `init` thoát mã 1, lỗi dựng song song nên dùng chung ảnh `smartcrm-api:local`, đổi cổng CSDL sang 5433, mở nhầm cổng 5174 bị CORS chặn); thử `POST /api/tickets` nhận 201; kiểm tra `docker compose ps -a` thấy `db`, `api`, `web` healthy và `init` Exited (0). |
| **Claude** | Buổi 11 – nhật ký và xử lý lỗi (`utils/logger.js`, `middlewares/errorHandler.js`, `app.js`, `server.js`, `tests/logger.test.js`, `tests/errorHandler.test.js`, `tests/server.test.js`) | Nhờ soạn logger JSON có `requestId`, bộ xử lý lỗi duy nhất và test | Em chạy `npm test` (58 test đạt); đọc log thật khi chạy và phát hiện 3 lỗi (BUG-001 đến BUG-003 trong `docs/bug-log.md`); với mỗi lỗi, chạy test thấy FAIL trước khi sửa, PASS sau khi sửa; thử tắt `api` và `db` để thấy giao diện hiện lỗi kèm nút Thử lại và API trả 503 kèm mã tra cứu khớp log. |
| **Claude** | Buổi 11 – dữ liệu mẫu nhỏ (`scripts/make-sample.js`, `data/sample/`) | Nhờ soạn script cắt bộ dữ liệu đầy đủ thành bộ mẫu để chạy bằng Docker | Em chạy script, đối chiếu số dòng (300 phiếu, 298 khách, 300 thiết bị, 1.448 dòng lịch sử) với kết quả `docker compose logs init`. |
| **Claude** | Buổi 11 – tài liệu (`README.md`, `docs/bug-log.md`) | Nhờ viết lại README cho cách chạy bằng Docker và nhật ký lỗi | Em đối chiếu từng lệnh, cổng và số liệu với kết quả chạy thật trên máy mình, điền liên kết commit vào bug log. |
| **Antigravity** | Rà soát repo trước khi push | Gửi prompt kiểm tra checklist buổi 8 (chỉ đọc, không sửa) | Em tự đọc từng mục FAIL/WARN, quyết định sửa; bỏ qua cảnh báo không áp dụng (ví dụ tệp PDF BT1 là bài nộp). |

### 8.2. Các phần tự thực hiện, không sử dụng AI

| Công cụ AI | Công việc | Áp dụng ở phần nào | Kiểm chứng / chỉnh sửa |
|---|---|---|---|
| Không dùng | Tự vẽ sơ đồ Use Case. | Mục 2 | Không áp dụng. |
| Không dùng | Tự vẽ kiến trúc phân lớp của luồng L2. | Mục 3 | Không áp dụng. |
| Không dùng | Tự vẽ wireframe. | Mục 5 | Không áp dụng. |
| Không dùng | Tự vẽ sơ đồ ERD. | Mục 4.1 | Không áp dụng. |