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
| Dữ liệu nạp | Bộ **mẫu nhỏ** trong `data/sample/` (có sẵn trong repo) | Bộ **đầy đủ** trong `data/raw/` (không commit), hoặc bộ mẫu nhỏ nếu đặt `DATASET_DIR=data/sample` |
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
Trên macOS/Linux/Git Bash, lệnh đầu là `cp .env.example .env`. Có thể giữ nguyên các giá trị mẫu trong `.env` để chạy thử trên máy cá nhân; muốn dùng mật khẩu riêng thì đổi `DB_PASSWORD` (không dùng ký tự `@ : / # ?`). `.env` còn phải có `JWT_SECRET` (khoá ký phiên đăng nhập, tối thiểu 16 ký tự): nếu `.env` cũ thiếu dòng này, `docker compose` dừng với thông báo "Thiếu JWT_SECRET"; chép dòng đó từ `.env.example`. Đăng nhập bằng một trong 3 tài khoản mẫu ở mục 6.1.

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
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"username":"quanly","password":"Quanly@123"}'
Invoke-RestMethod "http://localhost:3000/api/tickets?size=2" -Headers @{ Authorization = "Bearer $($r.data.token)" }
```
Từ phiên bản này mọi API ngoài `/api/auth/*` đều cần token; gọi không token trả `401`.

### Cách B – chạy trực tiếp trên máy (không dùng Docker)

Cách này tự cài Node.js và PostgreSQL trên máy rồi chạy ba thành phần riêng: **PostgreSQL** (cổng 5432) ← **backend** (cổng 3000) ← **giao diện** (cổng 5173). Làm lần lượt từ Bước 0 đến Bước 9; mỗi bước có phép kiểm tra để biết đã xong đúng chưa. Mọi lệnh `npm` ở Bước 2–9 chạy **tại thư mục gốc của repo**, trừ khi ghi rõ `cd src/frontend`, vì `dotenv` đọc tệp `.env` ở thư mục đang đứng.

> Đang chạy Docker (cách A)? Chạy `docker compose down` trước để nhả cổng 3000 và 5173. Cơ sở dữ liệu của Docker dùng cổng 5433 nên không đụng PostgreSQL cài trên máy ở cổng 5432.

#### Bước 0 – Cài công cụ và kiểm tra phiên bản

| Công cụ | Phiên bản | Cách cài |
|---|---|---|
| Git | bất kỳ bản mới | https://git-scm.com |
| Node.js | **22 LTS** (ghi trong `.nvmrc`) | Windows/macOS: tải bản LTS 22 từ https://nodejs.org. Có `nvm`: chạy `nvm install 22` rồi `nvm use 22` |
| npm | 10 trở lên (đi kèm Node 22) | không cần cài riêng |
| PostgreSQL | **16**, cổng 5432 | Windows: bộ cài EnterpriseDB (https://www.postgresql.org/download/windows/), **ghi nhớ mật khẩu của tài khoản `postgres`** đặt lúc cài. macOS: `brew install postgresql@16` rồi `brew services start postgresql@16`. Ubuntu/Debian: `sudo apt install postgresql-16` (hoặc `postgresql`), dịch vụ tự chạy |

Kiểm tra (mở terminal mới sau khi cài):
```bash
git --version
node -v          # phải bắt đầu bằng v22
npm -v           # 10.x trở lên
psql --version   # psql (PostgreSQL) 16.x
```
Windows báo `psql` không tồn tại: thêm `C:\Program Files\PostgreSQL\16\bin` vào biến môi trường `Path`, hoặc mở **SQL Shell (psql)** trong Start Menu và dùng nó ở Bước 3.

#### Bước 1 – Clone repository
```bash
git clone https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
cd smartcrm-2374802010228-ticket-reception
```
Chấm bài theo tag nộp: thêm `--branch v0.2` vào lệnh `git clone`.

#### Bước 2 – Cài thư viện
Dùng `npm ci` (không dùng `npm install`) để đúng phiên bản trong `package-lock.json`:
```bash
npm ci
npm ci --prefix src/frontend
```
Kiểm tra: không báo lỗi đỏ; xuất hiện thư mục `node_modules/` ở thư mục gốc và ở `src/frontend/`.

#### Bước 3 – Tạo user và database trong PostgreSQL
Mở `psql` bằng tài khoản quản trị:
```bash
psql -U postgres -h localhost          # Windows/macOS, nhập mật khẩu đặt lúc cài
sudo -u postgres psql                  # Ubuntu/Debian
```
Trong dấu nhắc `postgres=#`, chạy (đổi `mat-khau-cua-ban`; **không dùng** các ký tự `@ : / # ?` vì mật khẩu sẽ nằm trong chuỗi kết nối):
```sql
CREATE USER smartcrm WITH PASSWORD 'mat-khau-cua-ban';
CREATE DATABASE smartcrm OWNER smartcrm;
\q
```
Kiểm tra đăng nhập bằng tài khoản mới (phải in ra một dòng `1`):
```bash
psql "postgresql://smartcrm:mat-khau-cua-ban@localhost:5432/smartcrm" -c "SELECT 1;"
```

#### Bước 4 – Tạo hai tệp cấu hình `.env`
```bash
cp .env.example .env
cp src/frontend/.env.example src/frontend/.env
```
Windows PowerShell: thay `cp` bằng `Copy-Item` (cú pháp `Copy-Item <nguồn> <đích>`).

Mở **`.env`** ở thư mục gốc. Cách B chỉ dùng các dòng sau; các biến `DB_*`, `API_PORT`, `WEB_PORT`, `PUBLIC_API_URL` là của Docker, có thể để nguyên:
```env
PORT=3000
DATABASE_URL=postgresql://smartcrm:mat-khau-cua-ban@localhost:5432/smartcrm
CORS_ORIGIN=http://localhost:5173
DATASET_DIR=data/sample
JWT_SECRET=doi_khoa_bi_mat_nay_toi_thieu_16_ky_tu
REGISTER_CODE_KY_THUAT_VIEN=KTV-2026
REGISTER_CODE_QUAN_LY=QL-2026
```
- `DATABASE_URL`: thay `doi_mat_khau_nay` bằng đúng mật khẩu đã đặt ở Bước 3.
- `DATASET_DIR=data/sample`: dòng này trong `.env.example` đang bị comment (`# DATASET_DIR=...`); **xóa dấu `#`** và đặt giá trị như trên để nạp bộ mẫu nhỏ có sẵn trong repo (xem Bước 5).
- `CORS_ORIGIN` phải đúng địa chỉ mở giao diện, mặc định `http://localhost:5173`.
- `JWT_SECRET`: **bắt buộc**, tối thiểu 16 ký tự; backend dùng để ký mã phiên đăng nhập. Thiếu hoặc quá ngắn thì đăng nhập báo "Hệ thống đang gặp sự cố" và log backend ghi rõ lý do. Khi triển khai thật hãy đặt chuỗi ngẫu nhiên của riêng bạn.
- `REGISTER_CODE_KY_THUAT_VIEN`, `REGISTER_CODE_QUAN_LY`: mã đăng ký cho hai vai trò quyền cao (mục 6.1). Để trống thì không ai tự đăng ký được vai trò đó.

Tệp **`src/frontend/.env`** chỉ cần một dòng (đã có sẵn khi sao chép):
```env
VITE_API_BASE_URL=http://localhost:3000
```
Không commit hai tệp `.env` này (đã nằm trong `.gitignore`).

#### Bước 5 – Chọn bộ dữ liệu
| | Bộ mẫu nhỏ (khuyến nghị) | Bộ đầy đủ của học phần |
|---|---|---|
| Vị trí | `data/sample/` (có sẵn trong repo) | `data/raw/` (không commit, tự tải từ trang học phần, mục "Mekong Mobile – Dataset Smart CRM") |
| Cấu hình | `DATASET_DIR=data/sample` | để comment `DATASET_DIR`, hoặc `DATASET_DIR=data/raw` |
| Số dòng sau khi nạp | 6 trung tâm, 6 nhóm sự cố, 38 kỹ thuật viên; 298 khách, 300 thiết bị, 300 phiếu, 1.448 dòng lịch sử | 6 / 6 / 38 / 60 mã nhân viên; 6.443 khách, 7.800 thiết bị, 7.800 phiếu, 38.112 dòng lịch sử |

Cả hai bộ cần đủ 7 tệp: `service_centers.csv`, `issue_categories.csv`, `technicians.csv`, `products.csv`, `customers_raw.csv`, `tickets_history.csv`, `ticket_status_log.csv`. Thiếu tệp thì lệnh ở Bước 6 báo `Không thấy <tên tệp>`.

#### Bước 6 – Tạo bảng và nạp dữ liệu
Chạy **đúng thứ tự**, mỗi lệnh phải kết thúc không lỗi rồi mới chạy lệnh sau:
```bash
npm run migrate          # tạo 8 bảng theo DDL, thêm cột đăng nhập (migration 001–003; ghi tệp đã chạy vào schema_migrations)
npm run seed             # danh mục: trung tâm, nhóm sự cố, kỹ thuật viên, mã nhân viên và 3 tài khoản mẫu
npm run import:history   # khách, thiết bị, phiếu, lịch sử trạng thái
```
Kiểm tra số dòng bằng `psql` (đối chiếu với bảng ở Bước 5):
```bash
psql "postgresql://smartcrm:mat-khau-cua-ban@localhost:5432/smartcrm" -c "SELECT (SELECT count(*) FROM customer) AS khach, (SELECT count(*) FROM device) AS thiet_bi, (SELECT count(*) FROM ticket) AS phieu, (SELECT count(*) FROM ticket_status_log) AS lich_su;"
```
Cả ba lệnh **chạy lại được** mà không nhân đôi dữ liệu. Muốn nạp lại dữ liệu phiếu từ đầu: `npm run import:history -- --reset`. Cuối lệnh `import:history` có in cặp `device_id` / `customer_id` để thử `POST /api/tickets`.

#### Bước 7 – Chạy backend
```bash
npm run dev              # tự khởi động lại khi sửa mã; dùng npm start nếu không cần tự khởi động lại
```
Giữ terminal này mở. Mở terminal thứ hai và kiểm tra:
```bash
curl -s localhost:3000/health          # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3000/api/tickets?size=2"   # 401: chưa có token, đúng như thiết kế
```
Trong PowerShell dùng `curl.exe` thay cho `curl`. Terminal backend in mỗi yêu cầu thành một dòng JSON có `requestId`.

#### Bước 8 – Chạy giao diện
Ở terminal thứ hai (backend vẫn phải đang chạy):
```bash
cd src/frontend
npm run dev              # http://localhost:5173
```
Mở **http://localhost:5173** (đúng cổng này, vì CORS chỉ cho phép `CORS_ORIGIN`). Ở màn `/login` đăng nhập bằng một tài khoản mẫu; vai trò do tài khoản quyết định, không phải chọn. Bấm **Xem** ở khung "Tài khoản dùng thử" để mở bảng tài khoản và nút **Điền sẵn** (bảng đầy đủ ở mục 6.1):
- **Nhân viên tiếp nhận** (`tiepnhan`): tạo phiếu bảo hành mới (`/tickets/new`).
- **Kỹ thuật viên** (`kythuatvien`): đổi trạng thái và phân công trên màn chi tiết phiếu.
- **Quản lý trung tâm** (`quanly`): xem số điện thoại đầy đủ và phê duyệt.

Chưa có tài khoản riêng? Bấm **Đăng ký** ở màn đăng nhập.

#### Bước 9 – Chạy kiểm thử
Kiểm thử **không cần PostgreSQL hay backend đang chạy**:
```bash
npm test                          # tại thư mục gốc: 78 test backend (node --test)
npm test --prefix src/frontend    # 48 test giao diện (vitest)
```
Kết quả đúng: backend `pass 78`, `fail 0`; giao diện `Tests 48 passed (48)`. Bản dựng sản xuất của giao diện: `npm run build --prefix src/frontend` (ra `src/frontend/dist/`).

#### Gọi thử API bằng curl / Postman
```bash
# 1) Đăng nhập, lấy token (Bash; cần Node để tách token)
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"quanly","password":"Quanly@123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

# 2) Gọi API kèm token
curl -s localhost:3000/health
curl -s "localhost:3000/api/tickets?status=DANG_XU_LY&size=3" -H "Authorization: Bearer $TOKEN"
curl -s localhost:3000/api/issue-categories -H "Authorization: Bearer $TOKEN"
curl -i -s -X POST localhost:3000/api/tickets -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"issue_desc":""}'
```
PowerShell:
```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"username":"quanly","password":"Quanly@123"}'
$h = @{ Authorization = "Bearer $($r.data.token)" }
Invoke-RestMethod "http://localhost:3000/api/tickets?status=DANG_XU_LY&size=3" -Headers $h
```
Postman: gọi `POST /api/auth/login`, chép `data.token`, rồi ở tab Authorization của yêu cầu sau chọn **Bearer Token** và dán vào. Token hết hạn sau 30 phút.
Kết quả mong đợi: `{"status":"ok"}`; danh sách phiếu kèm `paging` (số điện thoại đầy đủ với Quản lý, đã che với vai trò khác); danh mục nhóm sự cố; `400 DU_LIEU_KHONG_HOP_LE` kèm `fields` theo từng trường. Đặc tả đầy đủ: [`docs/diagrams/api-contract.md`](docs/diagrams/api-contract.md).

Trong PowerShell, gửi JSON bằng tệp để tránh lỗi dấu nháy: `curl.exe -i -s -X POST localhost:3000/api/tickets -H "Content-Type: application/json" --data-binary "@body.json"`.

Vai trò, mã nhân viên và trung tâm của người gọi lấy **từ token do máy chủ ký**, không còn header `x-role` tự khai (header cũ bị bỏ qua và yêu cầu không token bị `401`).

#### Dừng và dọn dẹp
- Dừng backend hoặc giao diện: nhấn `Ctrl + C` trong terminal tương ứng.
- Nạp lại dữ liệu phiếu từ đầu: `npm run import:history -- --reset`.
- Xóa sạch cơ sở dữ liệu để làm lại từ Bước 3: trong `psql -U postgres` chạy `DROP DATABASE smartcrm;` rồi `DROP USER smartcrm;`.

#### Lỗi thường gặp riêng của cách B
| Thông báo / triệu chứng | Nguyên nhân và cách xử lý |
|---|---|
| `psql` không được nhận diện | Chưa có trong `Path`; dùng SQL Shell (psql) hoặc thêm thư mục `bin` của PostgreSQL vào `Path` (Bước 0) |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL chưa chạy. Windows: `services.msc` → dịch vụ `postgresql-x64-16` → Start. macOS: `brew services start postgresql@16`. Linux: `sudo systemctl start postgresql` |
| `password authentication failed for user "smartcrm"` | Mật khẩu trong `DATABASE_URL` khác mật khẩu ở Bước 3. Đặt lại: `ALTER USER smartcrm WITH PASSWORD '...';` trong `psql -U postgres` |
| `database "smartcrm" does not exist` | Chưa chạy `CREATE DATABASE` ở Bước 3, hoặc `DATABASE_URL` ghi sai tên |
| `Cannot find module 'dotenv'` / `Cannot find package` | Chưa chạy `npm ci` (Bước 2), hoặc chạy lệnh sai thư mục |
| `getaddrinfo ENOTFOUND db` | `DATABASE_URL` còn dùng tên máy `db` của Docker; đổi thành `localhost` |
| `Không thấy ...csv` khi `seed` hoặc `import:history` | Thiếu tệp CSV, hoặc `DATASET_DIR` trống nên script tìm ở `data/raw/`. Đặt `DATASET_DIR=data/sample` (xóa dấu `#`) |
| `relation "ticket" does not exist` | Chưa chạy `npm run migrate`, hoặc `DATABASE_URL` trỏ nhầm database |
| `EADDRINUSE :::3000` | Cổng 3000 đang bị chiếm, thường là container `api` của Docker: chạy `docker compose down`, hoặc đổi `PORT` trong `.env` (và `VITE_API_BASE_URL` cho khớp) |
| Giao diện báo "Chưa cấu hình địa chỉ máy chủ" | Chưa có `src/frontend/.env`; sao chép từ `.env.example` rồi chạy lại `npm run dev` (biến `VITE_*` chỉ đọc lúc khởi động) |
| Giao diện báo "Không kết nối được tới hệ thống" | Backend chưa chạy, hoặc mở giao diện ở cổng khác 5173 (bị CORS chặn). Mở đúng http://localhost:5173 |
| Danh sách phiếu trống trơn | Chưa chạy `npm run import:history`; kiểm tra số dòng bằng lệnh `psql` ở Bước 6 |

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
| Đăng nhập báo "Hệ thống đang gặp sự cố" | Thường do thiếu hoặc quá ngắn `JWT_SECRET`; tra mã hiện trên màn hình trong log: `docker compose logs api` (hoặc log backend ở cách B) |
| `Thiếu JWT_SECRET trong .env` khi `docker compose up` | `.env` cũ chưa có dòng `JWT_SECRET`; chép từ `.env.example` |
| "Sai tên đăng nhập hoặc mật khẩu" dù nhập đúng | Tài khoản mẫu chỉ có sau `npm run seed`; kiểm tra đã chạy `seed` và đúng mật khẩu ở mục 6.1 |
| "Nhập sai quá nhiều lần" (429) | Sai 5 lần liên tiếp bị khoá 15 phút; khởi động lại backend để xoá khoá khi đang thử nghiệm |
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
- [x] 78 test backend (`npm test` ở thư mục gốc) và 48 test giao diện (`npm test` trong `src/frontend`), gồm luồng đúng, giá trị biên, dữ liệu sai và luồng lỗi 409/422/503
- [x] Đăng nhập / đăng ký thật: mật khẩu băm scrypt, phiên JWT 30 phút, 3 vai trò, tài khoản mẫu (xem mục 6.1 và TD-12)
- [ ] Đề xuất nhóm sự cố từ mô tả (US4) – hoãn (TD-10)
- [ ] Lọc `overdue`/`assignee_id`/serial; lịch sử trạng thái trên màn chi tiết; lịch sử thiết bị và cảnh báo lỗi lặp lại (US7) – hoãn (TD-11)

### 6.1. Đăng nhập, đăng ký và hạn chế đã biết

**Tài khoản mẫu** (tạo bởi `npm run seed`, mỗi vai trò một tài khoản riêng; chỉ để chạy thử và chấm bài):

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Nhân viên tiếp nhận | `tiepnhan` | `Tiepnhan@123` |
| Kỹ thuật viên | `kythuatvien` | `Kythuat@123` |
| Quản lý trung tâm | `quanly` | `Quanly@123` |

- **Đăng nhập (`/login`):** chỉ nhập tên đăng nhập và mật khẩu (EP11); vai trò là của tài khoản (chọn lúc đăng ký), đăng nhập xong thanh đầu trang hiện tên và vai trò. Sai tên hoặc sai mật khẩu đều trả cùng một câu để không lộ tài khoản nào có thật. Khung "Tài khoản dùng thử" mặc định thu gọn, bấm **Xem** để mở. Sai 5 lần liên tiếp thì khoá tài khoản đó 15 phút (429).
- **Đăng ký (`/register`):** họ tên, tên đăng nhập (4–30 ký tự chữ thường không dấu, số, `.`, `_`), mật khẩu (tối thiểu 8 ký tự, có chữ và số), vai trò, trung tâm (EP12, EP13). Nhân viên tiếp nhận đăng ký tự do; **Kỹ thuật viên và Quản lý trung tâm cần mã đăng ký** (`REGISTER_CODE_KY_THUAT_VIEN`, `REGISTER_CODE_QUAN_LY` trong `.env`; mẫu `KTV-2026`, `QL-2026`). Để trống mã nào thì vai trò đó không đăng ký tự do được, tránh ai cũng tự cấp quyền Quản lý.
- **Phiên:** máy chủ ký JWT (HS256) hết hạn sau 30 phút (NFR2); giao diện gửi `Authorization: Bearer <token>` và tự đăng xuất khi hết hạn hoặc khi API trả `401`. Vai trò, mã nhân viên, trung tâm do **token** quyết định, nên sửa `localStorage` không nâng được quyền.
- **Mật khẩu:** lưu dạng băm `scrypt` có muối ngẫu nhiên; không ghi mật khẩu vào log.
- **Hạn chế đã biết:** token lưu trong `localStorage` (đọc được nếu trang có lỗ hổng XSS; hướng cải tiến là cookie `httpOnly`); bộ đếm khoá đăng nhập nằm trong bộ nhớ nên mất khi khởi động lại backend và có thể bị lợi dụng để khoá tài khoản người khác; chưa có đổi/quên mật khẩu và chưa có trang quản trị tài khoản; 60 mã nhân viên của dữ liệu lịch sử không có tài khoản. Trước khi triển khai thật: đổi `JWT_SECRET`, xoá hoặc đổi mật khẩu 3 tài khoản mẫu, đặt `SHOW_DEMO_ACCOUNTS=false`.
- **Khi API trả `401`:** lớp gọi API xóa phiên và chuyển về `/login`.
- Một số quy tắc trên giao diện (nhãn tình trạng bảo hành lúc chọn thiết bị, danh sách trạng thái kế tiếp) chỉ để gợi ý; máy chủ luôn là nơi quyết định và trả lỗi `422` nếu sai.

### 6.2. Màn hình, câu hỏi người dùng và ngữ cảnh so sánh

| Màn hình | Câu hỏi mà màn hình trả lời | Ngữ cảnh so sánh | API |
|---|---|---|---|
| Danh sách phiếu `/tickets` | "Hôm nay tôi phải xử lý phiếu nào trước?" | Mặc định "Đang mở" (ẩn phiếu đã đóng/hủy), sắp theo hạn cam kết tăng dần, tô đỏ phiếu quá hạn, đếm số phiếu quá hạn của trang và tổng số phiếu | EP5 |
| Tạo phiếu `/tickets/new` | "Thiết bị này tiếp nhận được chưa, hạn bảo hành thế nào?" | Ngày mua, số tháng bảo hành và tình trạng bảo hành hiện ngay khi chọn thiết bị; khách chưa có thiết bị thì thêm ngay tại màn này | EP1, EP2, EP3, EP9, EP8, EP4 |
| Chi tiết phiếu `/tickets/:id` | "Phiếu này đang ở đâu, ai phụ trách, còn bao lâu đến hạn?" | Hạn cam kết kèm "Quá hạn N ngày" hoặc "Còn N giờ"; tên kỹ thuật viên; chọn kỹ thuật viên khi phân công | EP7, EP6, EP10 |
| Đăng nhập `/login` | "Tôi vào hệ thống bằng tài khoản nào?" | Tên đăng nhập, mật khẩu; lỗi chung một câu; khung tài khoản dùng thử thu gọn, bấm để mở | EP11 |
| Đăng ký `/register` | "Tôi tự tạo tài khoản thế nào?" | Lỗi hiện cạnh từng ô; ô mã đăng ký chỉ hiện với vai trò quyền cao; danh sách trung tâm có đủ ba trạng thái | EP12, EP13 |

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
| **Claude** | BT2 – đăng nhập / đăng ký (`utils/password.js`, `utils/token.js`, `services/auth.service.js`, `routes/auth.routes.js`, `validators/auth.schema.js`, `middlewares/actor.js`, migration `003`, `seed.js`, `LoginPage.jsx`, `RegisterPage.jsx`, `session.js`, `client.js`, các test `password`, `token`, `auth.*`, `actor`, `loginPage`, `registerPage`) | Nhờ thiết kế và soạn mã đăng nhập 3 vai trò, đăng ký, JWT 30 phút, băm mật khẩu, khoá khi sai nhiều lần | Em chạy `migrate`/`seed` hai lần, đăng nhập đủ 3 vai trò, thử sai mật khẩu, sai vai trò, token giả, hết hạn và 6 lần sai liên tiếp; đọc từng hàm để giải thích được; chạy `npm test` hai gói. [Em bổ sung: điều em đã tự sửa hoặc phát hiện] |
| **Antigravity** | Rà soát repo trước khi push | Gửi prompt kiểm tra checklist buổi 8 (chỉ đọc, không sửa) | Em tự đọc từng mục FAIL/WARN, quyết định sửa; bỏ qua cảnh báo không áp dụng (ví dụ tệp PDF BT1 là bài nộp). |

### 8.2. Các phần tự thực hiện, không sử dụng AI

| Công cụ AI | Công việc | Áp dụng ở phần nào | Kiểm chứng / chỉnh sửa |
|---|---|---|---|
| Không dùng | Tự vẽ sơ đồ Use Case. | Mục 2 | Không áp dụng. |
| Không dùng | Tự vẽ kiến trúc phân lớp của luồng L2. | Mục 3 | Không áp dụng. |
| Không dùng | Tự vẽ wireframe. | Mục 5 | Không áp dụng. |
| Không dùng | Tự vẽ sơ đồ ERD. | Mục 4.1 | Không áp dụng. |