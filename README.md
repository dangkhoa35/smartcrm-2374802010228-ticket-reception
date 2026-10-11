# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** Hà Đăng Khoa – **MSSV:** 2374802010228  
**Track:** SE  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang  

---

## 1. Mô tả bài toán

Luồng nghiệp vụ: **L02 - Tiếp nhận và phân loại yêu cầu bảo hành**

- **Bắt đầu:** Khách hàng hoặc bộ phận Chăm sóc Khách hàng (CSKH) gửi yêu cầu bảo hành/hỗ trợ kĩ thuật cho sản phẩm qua hệ thống Smart CRM.
- **Xử lý:** Hệ thống ghi nhận thông tin ticket, tự động hoặc hỗ trợ nhân viên phân loại mức độ ưu tiên (Low/Medium/High/Critical), gán loại sự cố và định tuyến đến đúng bộ phận kĩ thuật/bảo hành có thẩm quyền.
- **Kết thúc:** Yêu cầu bảo hành được chuyển sang trạng thái "Đang xử lý" (In Progress), phát hành mã theo dõi ticket cho khách hàng và sẵn sàng cho luồng xử lý kĩ thuật tiếp theo.

---

## 2. Phạm vi

### - Làm (In Scope):
- Thiết lập RESTful API tiếp nhận thông tin yêu cầu bảo hành từ khách hàng/CSKH.
- Lưu trữ thông tin yêu cầu bảo hành vào cơ sở dữ liệu PostgreSQL (`smartcrm`).
- Phân loại yêu cầu bảo hành theo danh mục (Lỗi phần cứng, Lỗi phần mềm, Hướng dẫn sử dụng) và mức độ ưu tiên.
- Định tuyến tự động ticket đến nhân viên/bộ phận kĩ thuật phù hợp.
- Cung cấp API kiểm tra trạng thái môi trường (`/`, `/db-check`).

### - Không làm (Out of Scope):
- Tích hợp thanh toán linh kiện bảo hành trực tuyến.
- Xử lý trực tiếp quy trình sửa chữa kĩ thuật vật lý tại cửa hàng.
- Xây dựng ứng dụng di động (Mobile App) riêng biệt.

---

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ / Runtime | Node.js 20 LTS |
| Framework API | Express.js |
| Truy cập dữ liệu | `pg` (PostgreSQL Client) |
| Cơ sở dữ liệu | PostgreSQL (Port 5432) |
| Giao diện | React (Vite) |
| Kiểm thử | Jest / Vitest |
| Tài liệu API | Swagger UI |
| Đóng gói | Dockerfile + docker-compose |

---

## 4. Cấu trúc thư mục

```text
smartcrm-2374802010228-ticket-reception/
├── docs/
│   └── diagrams/
│       ├── export/
│       │   ├── architecture.png
│       │   ├── erd.png
│       │   ├── usecase.png
│       │   └── wireframe.png
│       ├── .gitkeep
│       ├── ai-disclosure.md
│       ├── architecture.drawio
│       ├── erd.drawio
│       ├── srs.md
│       ├── usecase.drawio
│       └── usecase.png
├── src/
│   ├── backend/
│   │   ├── .gitkeep
│   │   └── index.js
│   └── frontend/
│       └── .gitkeep
├── tests/
│   └── .gitkeep
├── .env                         # Cấu hình môi trường cục bộ; không chia sẻ công khai
├── .env.example                 # Mẫu cấu hình môi trường
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

### Ý nghĩa các thư mục và tệp chính

- `docs/diagrams/`: lưu tài liệu phân tích, thiết kế và khai báo sử dụng AI.
- `docs/diagrams/export/`: các hình ảnh xuất ra từ sơ đồ để chèn vào tài liệu hoặc xem nhanh.
- `*.drawio`: các tệp sơ đồ gốc, mở và chỉnh sửa bằng draw.io / diagrams.net.
- `docs/diagrams/srs.md`: tài liệu đặc tả yêu cầu phần mềm (SRS).
- `docs/diagrams/ai-disclosure.md`: bảng khai báo sử dụng công cụ AI.
- `src/backend/index.js`: file khởi tạo Server Express và kết nối PostgreSQL.
- `src/frontend/`: dành cho giao diện React; hiện mới có `.gitkeep`.
- `tests/`: dành cho mã kiểm thử; hiện mới có `.gitkeep`.
- `package.json`: khai báo thông tin dự án và các thư viện npm.
- `.env.example`: mẫu các biến môi trường cần cấu hình.
- `.env`: cấu hình riêng trên máy cá nhân; không commit các giá trị bí mật lên GitHub.
---

## 5. Hướng dẫn cài đặt & chạy

### Yêu cầu tiên quyết:
- **Node.js**: v20 LTS trở lên
- **PostgreSQL**: v14/v16 (chạy ở cổng 5432)

### Các bước khởi chạy:

1. **Clone repository và di chuyển vào thư mục dự án:**
```bash
   git clone https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
   cd smartcrm-2374802010228-ticket-reception
```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
```bash
   npm install
```

3. **Cấu hình biến môi trường:**
   Tạo file `.env` từ `.env.example` và điều chỉnh thông số kết nối CSDL PostgreSQL:
```bash
   cp .env.example .env
```
   *Cấu hình mẫu trong file `.env`:*
```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=smartcrm
   DB_USER=postgres
   DB_PASSWORD=
   PORT=3000
```

4. **Tạo Cơ sở dữ liệu:**
   Đảm bảo dịch vụ PostgreSQL đang chạy và tạo database `smartcrm` qua pgAdmin 4 hoặc psql:
```sql
   CREATE DATABASE smartcrm;
```

5. **Khởi chạy ứng dụng ở chế độ Phát triển (Development):**
```bash
   npm run dev
```

6. **Kiểm tra hoạt động (Smoke Test):**
   - Truy cập trang chủ: [http://localhost:3000/](http://localhost:3000/) → trả về `Hello Smart CRM`
   - Truy cập kiểm tra CSDL: [http://localhost:3000/db-check](http://localhost:3000/db-check) → trả về `{"status":"OK","server_time":"..."}`

---

## 6. Tài liệu liên quan

| Nội dung | Tệp |
|---|---|
| Đặc tả yêu cầu phần mềm (SRS) | [`docs/diagrams/srs.md`](docs/diagrams/srs.md) |
| Sơ đồ Use Case | [`docs/diagrams/usecase.drawio`](docs/diagrams/usecase.drawio) |
| Sơ đồ kiến trúc | [`docs/diagrams/architecture.drawio`](docs/diagrams/architecture.drawio) |
| Sơ đồ ERD | [`docs/diagrams/erd.drawio`](docs/diagrams/erd.drawio) |
| Wireframe | [`docs/diagrams/export/wireframe.png`](docs/diagrams/export/wireframe.png) |
| Khai báo sử dụng công cụ AI | [`docs/diagrams/ai-disclosure.md`](docs/diagrams/ai-disclosure.md) |
| Hình ảnh sơ đồ đã xuất | [`docs/diagrams/export/`](docs/diagrams/export/) |

---

## 7. Phụ lục – Khai báo sử dụng công cụ AI

### 7.1. Công cụ AI được sử dụng

| Công cụ AI | Phần áp dụng | Cách dùng (tóm tắt yêu cầu đã gửi) | Em đã kiểm chứng / chỉnh sửa gì |
|---|---|---|---|
| **Claude** | Mục 1 (SRS, User Story) | Nhờ soạn nháp User Story, SRS 6 mục, tiêu chí Given–When–Then từ tài liệu buổi 3 và case study | Tôi đã kiểm chứng bảng thuật ngữ với file gốc cùng với tài liệu tự học buổi 3 và lý thuyết buổi 3. Kiểm tra các yêu cầu chức năng và phi chức năng có phù hợp với yêu cầu của đề bài hay không. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 2 (Use Case) | Nhờ vẽ Use Case Diagram và soạn đặc tả UC2 | Tôi đã kiểm chứng với file gốc cũng như tài liệu tự học buổi 4 và lý thuyết buổi 4. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 3 (Kiến trúc) | Nhờ vẽ sơ đồ 5 lớp theo mẫu và soạn các câu lập luận "Vì NFR…" | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 4 (Mô hình dữ liệu) | Nhờ thiết kế ERD 6 bảng, phân tích 3NF, viết DDL PostgreSQL | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 5 (Wireframe) | Nhờ vẽ 3 màn hình và đối chiếu trường với ERD | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |

### 7.2. Các phần tự thực hiện, không sử dụng AI

| Công cụ AI | Công việc | Áp dụng ở phần nào | Kiểm chứng / chỉnh sửa |
|---|---|---|---|
| Không dùng | Tự vẽ sơ đồ Use Case. | Mục 2 | Không áp dụng. |
| Không dùng | Tự vẽ kiến trúc phân lớp của luồng L5. | Mục 3 | Không áp dụng. |
| Không dùng | Tự vẽ wireframe. | Mục 5 | Không áp dụng. |
| Không dùng | Tự vẽ sơ đồ ERD. | Mục 4.1 | Không áp dụng. |