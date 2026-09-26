# SmartCRM - Tiep nhan va phan loai yeu cau bao hanh

Sinh viên: Hà Đăng Khoa - 2374802010228 <br>
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027 <br>
Track SE - Luồng nghiệp vụ: L02 - Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu

Hệ thống SmartCRM hỗ trợ tiếp nhận, phân loại vầ theo dõi các yêu cầu bảo hành từ khách hàng một cách tự động và tối ưu quy trình xử lý.

## 2. Công nghệ sử dụng (Track SE - Luồng A)
- Ngôn ngữ / runtime: Node.js 20 LTS
- Framework API: Express.js
- Truy cập dữ liệu: mysql2 / Prisma
- Cỡ sở dữ liệu: MySQL 8.0 (Port 3306)
- Giao diện: React (Vite)
- Kiểm thử: Jest / Vitest
- Tài liệu API: Swagger UI
- Đóng gói: Dockerfile + docker-compose

## 3. Huong dan chay
- cp .env.example .env
- npm install
- npm run dev

## 4. Cau truc thu muc
- docs/: Chua tai lieu dac ta va minh chung
- src/: Ma nguon chinh cua ung dung
- tests/: Kich ban va ma nguon kiem thu
- data/: Du lieu mau va file cau hinh

## 5. Trang thai hien tai
- [x] Khoi tao project, setup gitignore, env.example va README khung (Buoi 2)
- [x] Kiem tra moi truong A.1 ^(Tools^), A.2 ^(MySQL^), A.3 ^(Node.js + Express Smoke Test^)
- [ ] Xay dung API tiep nhan yeu cau (Buoi 8-10)
- [ ] Xay dung module phan loai ticket (Buoi 10-12)
