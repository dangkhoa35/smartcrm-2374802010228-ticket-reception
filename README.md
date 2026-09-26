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
- Lưu trữ thông tin yêu cầu bảo hành vào cơ sở dữ liệu MySQL (\smartcrm\).
- Phân loại yêu cầu bảo hành theo danh mục (Lỗi phần cứng, Lỗi phần mềm, Hướng dẫn sử dụng) và mức độ ưu tiên.
- Định tuyến tự động ticket đến nhân viên/bộ phận kĩ thuật phù hợp.
- Cung cấp API kiểm tra trạng thái môi trường (\/health\, \/db-check\).

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
| Truy cập dữ liệu | \mysql2\ (Promise API) |
| Cơ sở dữ liệu | MySQL 8.0 (Port 3306) |
| Giao diện | React (Vite) |
| Kiểm thử | Jest / Vitest |
| Tài liệu API | Swagger UI |
| Đóng gói | Dockerfile + docker-compose |

---

## 4. Cấu trúc thư mục

\\\	ext
smartcrm-2374802010228-ticket-reception/
├── data/              # Dữ liệu mẫu, các file script SQL khởi tạo DB
├── docs/              # Tài liệu đặc tả, hình ảnh minh chứng Smoke Test
├── src/               # Mã nguồn chính của ứng dụng
│   ├── config/        # Cấu hình kết nối CSDL, biến môi trường
│   ├── controllers/   # Xử lý logic request/response cho API
│   ├── models/        # Định nghĩa mô hình dữ liệu (MySQL queries)
│   ├── routes/        # Định nghĩa danh sách các Endpoint REST API
│   └── index.js       # File khởi tạo và chạy Server Express
├── tests/             # Kịch bản và mã nguồn kiểm thử (Unit test/Integration test)
├── .env.example       # File mẫu cấu hình biến môi trường
├── .gitignore          # Danh sách file/thư mục bỏ qua khi push Git
├── package.json       # Khai báo thông tin dự án và các thư viện npm
└── README.md          # Tài liệu hướng dẫn dự án
\\\

---

## 5. Hướng dẫn cài đặt & chạy

### Yêu cầu tiên quyết:
- **Node.js**: v20 LTS trở lên
- **MySQL Server**: v8.0 trở lên (chạy ở cổng 3306)

### Các bước khởi chạy:

1. **Clone repository và di chuyển vào thư mục dự án:**
   \\\ash
   git clone https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
   cd smartcrm-2374802010228-ticket-reception
   \\\

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   \\\ash
   npm install
   \\\

3. **Cấu hình biến môi trường:**
   Tạo file \.env\ từ \.env.example\ và điều chỉnh thông số kết nối CSDL MySQL:
   \\\ash
   cp .env.example .env
   \\\
   *Cấu hình mẫu trong file \.env\:*
   \\\env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=smartcrm
   DB_USER=root
   DB_PASSWORD=
   PORT=3000
   \\\

4. **Tạo Cơ sở dữ liệu:**
   Đảm bảo MySQL đang chạy và tạo database \smartcrm\:
   \\\sql
   CREATE DATABASE IF NOT EXISTS smartcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   \\\

5. **Khởi chạy ứng dụng ở chế độ Phát triển (Development):**
   \\\ash
   npm run dev
   \\\

6. **Kiểm tra hoạt động (Smoke Test):**
   - Truy cập trang chủ: [http://localhost:3000/](http://localhost:3000/) $\rightarrow$ Trả về \Hello Smart CRM\
   - Truy cập kiểm tra CSDL: [http://localhost:3000/db-check](http://localhost:3000/db-check) $\rightarrow$ Trả về \{"status":"OK", "server_time":"..."}\

---

## 6. Khai báo sử dụng công cụ AI

| Công cụ | Dùng vào việc gì | Cách tự kiểm chứng |
|---|---|---|
| **Gemini / ChatGPT** | Tối ưu hóa file cấu hình (\.gitignore\, \.env.example\), hỗ trợ viết script khởi tạo Node.js + Express và giải quyết lỗi kết nối CSDL MySQL. | Tự chạy thử lệnh \
pm run dev\, thực hiện Smoke Test trên trình duyệt tại cổng \3000\ và đối chiếu dữ liệu trả về từ MySQL (\/db-check\). |
| **GitHub Copilot** | Gợi ý cú pháp mã nguồn Node.js, viết các hàm xử lý truy vấn MySQL (\mysql2/promise\) và tạo dữ liệu kiểm thử. | Chạy thử nghiệm kiểm thử đơn vị (Unit tests), đối chiếu kết quả trả về với yêu cầu đặc tả của đề bài. |
