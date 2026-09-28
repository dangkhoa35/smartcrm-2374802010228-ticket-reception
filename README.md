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
```text
smartcrm-2374802010228-ticket-reception/
├── data/              # Dữ liệu mẫu, các file script SQL khởi tạo DB
├── docs/              # Tài liệu đặc tả, hình ảnh minh chứng Smoke Test
├── src/               # Mã nguồn chính của ứng dụng
│   ├── backend/       # Mã nguồn xử lý Backend (Express.js)
│   │   └── index.js   # File khởi tạo Server Express và kết nối PostgreSQL
│   └── frontend/      # Mã nguồn giao diện ứng dụng (React)
├── tests/             # Kịch bản và mã nguồn kiểm thử (Unit test/Integration test)
├── .env               # File cấu hình biến môi trường
├── .env.example       # File mẫu cấu hình biến môi trường
├── .gitignore          # Danh sách file/thư mục bỏ qua khi push Git
├── package.json       # Khai báo thông tin dự án và các thư viện npm
└── README.md          # Tài liệu hướng dẫn dự án
```
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
   Tạo file \.env\ từ \.env.example\ và điều chỉnh thông số kết nối CSDL MySQL:
   ```bash
   cp .env.example .env
   ```
   *Cấu hình mẫu trong file \.env\:*
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=smartcrm
   DB_USER=postgres
   DB_PASSWORD=
   PORT=3000
   ```

4. **Tạo Cơ sở dữ liệu:**
   Đảm bảo dịch vụ PostgreSQL đang chạy và tạo database smartcrm qua pgAdmin 4 hoặc psql:
   ```psql
   CREATE DATABASE smartcrm;
   ```

5. **Khởi chạy ứng dụng ở chế độ Phát triển (Development):**
   ```bash
   npm run dev
   ```

6. **Kiểm tra hoạt động (Smoke Test):**
   - Truy cập trang chủ: [http://localhost:3000/](http://localhost:3000/) $\rightarrow$ Trả về \Hello Smart CRM\
   - Truy cập kiểm tra CSDL: [http://localhost:3000/db-check](http://localhost:3000/db-check) $\rightarrow$ Trả về \{"status":"OK", "server_time":"..."}\

---

## 6. Khai báo sử dụng công cụ AI

| Công cụ | Dùng vào việc gì | Cách tự kiểm chứng |
|---|---|---|
| **Gemini / ChatGPT** | Tối ưu hóa file cấu hình (.gitignore, .env), xử lý đường dẫn tuyệt đối bằng path.resolve để đọc file .env chuẩn kĩ thuật và hỗ trợ cấu hình kết nối PostgreSQL (pg). | Tự chạy lệnh npm run dev, thực hiện Smoke Test thành công tại cổng 3000 và đối chiếu dữ liệu thời gian hệ thống trả về từ PostgreSQL (/db-check). |
| **GitHub Copilot** | Gợi ý cú pháp mã nguồn Node.js, viết các hàm xử lý truy vấn PostgreSQL (pg) và tạo dữ liệu kiểm thử. | Chạy thử nghiệm kiểm thử đơn vị (Unit tests), đối chiếu kết quả trả về với yêu cầu đặc tả của đề bài. |
