# Tổng kết công cụ AI và quy trình áp dụng
Ngày 19/10/2026 · Họ tên: Hà Đăng Khoa · MSSV: 2374802010228

| Công cụ AI | Phần áp dụng | Cách dùng (tóm tắt yêu cầu đã gửi) | Em đã kiểm chứng / chỉnh sửa gì |
|---|---|---|---|
| **Claude** | Mục 1 (SRS, User Story) | Nhờ soạn nháp User Story, SRS 6 mục, tiêu chí Given–When–Then từ tài liệu buổi 3 và case study | Tôi đã kiểm chứng bảng thuật ngữ với file gốc cùng với tài liệu tự học buổi 3 và lý thuyết buổi 3. Kiểm tra các yêu cầu chức năng và phi chức năng có phù hợp với yêu cầu của đề bài hay không. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 2 (Use Case) | Nhờ vẽ Use Case Diagram và soạn đặc tả UC2 | Tôi đã kiểm chứng với file gốc cũng như tài liệu tự học buổi 4 và lý thuyết buổi 4. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 3 (Kiến trúc) | Nhờ vẽ sơ đồ 5 lớp theo mẫu và soạn các câu lập luận "Vì NFR…" | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 4 (Mô hình dữ liệu) | Nhờ thiết kế ERD 6 bảng, phân tích 3NF, viết DDL PostgreSQL | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Mục 5 (Wireframe) | Nhờ vẽ 3 màn hình và đối chiếu trường với ERD | Tôi đã kiểm chứng với file gốc, tài liệu lý thuyết buổi 5 và tài liệu tự học buổi 5. Sửa các phần không đúng với yêu cầu. |
| **Claude** | Sprint 1 – migration, seed, nạp dữ liệu (`src/backend/db/`) | Gửi slide buổi 8, BT1 và bộ dữ liệu mẫu, nhờ hướng dẫn chặng 2–3 và soạn mã nền | Em tự chạy `migrate`, `seed`, `import:history` trên PostgreSQL cài trực tiếp; đối chiếu số dòng với CSV (6 / 6 / 38 / 60 và 6.443 / 7.800 / 7.800 / 38.112); đối chiếu DDL với BT1, bỏ bảng `ticket_note` theo TD-01; chạy lại nhiều lần không bị nhân đôi dữ liệu. |
| **Claude** | Sprint 1 – API phiếu bảo hành (`routes`, `services`, `repositories`, `middlewares`, `utils`) | Nhờ soạn mã 3 lớp theo thiết kế kiến trúc và quy tắc QT01–QT03 | Em đọc từng lớp để hiểu trách nhiệm; gọi API bằng curl/Postman, chụp ảnh lưu trong `docs/screenshots/`; đối chiếu các quy tắc với SRS. |
| **Claude** | Sprint 1 – unit test (`tests/`) | Nhờ viết test cho QT01, QT02, QT03 và che số điện thoại | Em chạy `npm test` (15 test đạt) và đọc từng trường hợp thử. |
| **Claude** | Tài liệu: `README.md`, `api-contract.md` v1.1 | Gửi bản cũ, nhờ đồng bộ với mã nguồn Sprint 1 | Em đối chiếu từng endpoint, mã lỗi và ví dụ với kết quả gọi API thực tế. |
| **Antigravity** | Rà soát repo trước khi push | Gửi prompt kiểm tra checklist buổi 8 (chỉ đọc, không sửa) | Em tự đọc từng mục FAIL/WARN, quyết định sửa; bỏ qua cảnh báo không áp dụng (ví dụ tệp PDF BT1 là bài nộp). |


| Công cụ AI | Công việc | Áp dụng ở phần nào | Kiểm chứng / chỉnh sửa |
|---|---|---|---|
| Không dùng | Tự vẽ sơ đồ Use Case. | Mục 2 | Không áp dụng. |
| Không dùng | Tự vẽ kiến trúc phân lớp của luồng L2. | Mục 3 | Không áp dụng. |
| Không dùng | Tự vẽ wireframe. | Mục 5 | Không áp dụng. |
| Không dùng | Tự vẽ sơ đồ ERD. | Mục 4.1 | Không áp dụng. |