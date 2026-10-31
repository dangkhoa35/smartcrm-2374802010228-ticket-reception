# Bug Log – Smart CRM, luồng L2 (buổi 11)

Chỉ ghi lỗi **thật** đã gặp và đã gỡ trong dự án. Mỗi mục có đủ 7 dòng. Dòng 5 là **nguyên nhân** (chỗ đầu tiên vi phạm hợp đồng), không phải triệu chứng. Dòng 7 có liên kết commit và một test hồi quy đã được chạy **FAIL trước khi sửa, PASS sau khi sửa**.

Thang mức độ: **Critical** (mất dữ liệu hoặc hệ thống không chạy), **Major** (một chức năng hoặc tín hiệu vận hành sai, có cách vòng), **Minor** (khó điều tra hoặc sai mã trạng thái, người dùng cuối ít bị ảnh hưởng).

---

## BUG-001 · Minor — Log yêu cầu luôn ghi đường dẫn `/`

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-001 · Minor |
| 2. Phát hiện bởi | Đọc `docker compose logs api` sau khi gọi `curl.exe -s "localhost:3000/api/tickets?size=2"` (phép thử tự kiểm buổi 11) |
| 3. Triệu chứng | Mọi dòng log `yêu cầu hoàn tất` của các yêu cầu `/api/*` thành công đều ghi `"duong_dan":"/"` thay vì `/api/tickets`, nên không biết yêu cầu nào đã chạy |
| 4. Cách tái lập | Chạy hệ thống, gọi `curl.exe -s "localhost:3000/api/tickets?size=2"`, rồi `docker compose logs api --tail 3` |
| 5. Nguyên nhân | Express tạm bỏ tiền tố điểm gắn (`/api`) khỏi `req.path` khi yêu cầu còn nằm trong router con. Hàm ghi log đọc `req.path` ở sự kiện `finish`, lúc đó vẫn đang ở trong router nên nhận `/`. Lỗi chỉ lộ ở yêu cầu thành công; yêu cầu lỗi đi qua bộ xử lý lỗi ở cấp ứng dụng nên vẫn ghi đúng |
| 6. Cách sửa | Dùng `req.originalUrl.split('?')[0]` (đường dẫn đầy đủ, bỏ chuỗi truy vấn vì chuỗi truy vấn có thể chứa số điện thoại) trong `src/backend/utils/logger.js` và `src/backend/middlewares/errorHandler.js` |
| 7. Commit và xác nhận | [f1647af](https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception/commit/f1647af) · test `log yêu cầu hoàn tất ghi đường dẫn ĐẦY ĐỦ, không có query string (BUG đường dẫn "/")` trong `tests/logger.test.js`: FAIL trước (`actual: '/'`, `expected: '/api/tickets'`), PASS sau; sau sửa, log hiện `"duong_dan":"/api/tickets"` |

---

## BUG-002 · Major — API báo "đã khởi động" dù không mở được cổng, rồi thoát mã 0

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-002 · Major |
| 2. Phát hiện bởi | Chạy `npm run dev` khi container `api` của Docker đang giữ cổng 3000 |
| 3. Triệu chứng | Terminal in `"API đã khởi động"` rồi ngay sau đó `Completed running 'src/backend/server.js'. Waiting for file changes before restarting...`. Tiến trình đã thoát, không nhận được yêu cầu nào, và không có dòng ERROR nào giải thích |
| 4. Cách tái lập | `docker compose up -d` (cổng 3000 bị Docker giữ), rồi ở thư mục gốc chạy `npm run dev`. Cách khác không cần Docker: giữ cổng 3000 bằng một tiến trình bất kỳ rồi chạy `node src/backend/server.js` |
| 5. Nguyên nhân | Từ Express 5, khi `app.listen` không mở được cổng (ví dụ `EADDRINUSE`), lỗi **được truyền vào hàm callback** thay vì bị ném ra. `server.js` bỏ qua đối số lỗi của callback và luôn ghi log thành công, sau đó tiến trình hết việc nên thoát mã 0 |
| 6. Cách sửa | Kiểm tra `err` trong callback của `app.listen`: nếu có lỗi thì ghi log ERROR (`không mở được cổng, API dừng`) và `process.exit(1)` (`src/backend/server.js`) |
| 7. Commit và xác nhận | [1e8fb64](https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception/commit/1e8fb64) · test `cổng đã bị chiếm -> server thoát mã 1, ghi log ERROR, không báo "đã khởi động"` trong `tests/server.test.js`: FAIL trước (`0 !== 1`), PASS sau; sau sửa, `npm run dev` ghi `"muc":"error"` kèm `EADDRINUSE` rồi dừng |

---

## BUG-003 · Minor — Mất CSDL trong Docker trả 500 thay vì 503

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-003 · Minor |
| 2. Phát hiện bởi | Bài thử suy giảm có kiểm soát: `docker compose stop db` rồi gọi API |
| 3. Triệu chứng | `GET /api/tickets` trả `500 LOI_HE_THONG` sau 5.045 ms (`thoi_gian_ms`) thay vì `503`, dù thiết kế là mất kết nối CSDL trả 503 |
| 4. Cách tái lập | `docker compose stop db`, rồi `curl.exe -s -i "localhost:3000/api/tickets?size=1"` và `docker compose logs api --tail 3` |
| 5. Nguyên nhân | Khi container CSDL dừng, Docker không phân giải được tên `db`, Node báo `getaddrinfo EAI_AGAIN db` (mã `EAI_AGAIN`). Mã này chưa có trong danh sách lỗi hạ tầng `MA_LOI_HA_TANG` của `errorHandler.js` nên rơi vào nhánh lỗi chung 500. Cùng một tình huống, Docker có lúc báo `ENOTFOUND` (đã có trong danh sách, trả 503), có lúc báo `EAI_AGAIN`, nên lỗi lúc có lúc không |
| 6. Cách sửa | Thêm `EAI_AGAIN` vào `MA_LOI_HA_TANG` trong `src/backend/middlewares/errorHandler.js` |
| 7. Commit và xác nhận | [5dd8430](https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception/commit/5dd8430) · test `không phân giải được tên máy CSDL (EAI_AGAIN) -> 503` trong `tests/errorHandler.test.js`: FAIL trước (`500 !== 503`), PASS sau. Sau sửa `npm test`: 58/58 đạt. Ở lần thử ngay sau đó (`ENOTFOUND`), API trả 503 và mã tra cứu `8edcbd75-…` khớp `requestId` trong log |

---

## Sự cố môi trường khi đóng gói (không phải lỗi mã nguồn)

Các sự cố dưới đây không có test hồi quy vì nguyên nhân nằm ở môi trường hoặc thao tác. Ghi lại để lần sau xử lý nhanh; cách xử lý đã đưa vào bảng "Lỗi môi trường thường gặp" của `README.md`.

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `docker compose up` báo `read-only file system` ở `meta.db` | Docker Desktop không ghi được vào ổ chứa dữ liệu của nó (ổ C: đầy) | Giải phóng ổ đĩa, đổi nơi lưu ở Settings > Resources > Advanced, `wsl --shutdown`, mở lại Docker Desktop |
| Dựng ảnh lỗi `"/app/node_modules": not found` dù `npm ci` đã chạy | Chưa xác định chắc. Nghi do `init` và `api` cùng dựng một Dockerfile song song và bộ nhớ đệm build bị ảnh hưởng sau sự cố ổ đĩa. Hết lỗi sau khi dọn cache (`docker builder prune -af`) và cho `init` dùng chung ảnh `smartcrm-api:local` | Như cột trái; cấu hình đã được đổi để chỉ dựng một lần |
| `init` thoát mã 1: `Không thấy /data/service_centers.csv` | Thư mục `data/sample/` chưa có (rỗng), nên Docker tạo thư mục rỗng để gắn vào `/data` | Chạy `node scripts/make-sample.js` để tạo `data/sample/`, rồi `docker compose up -d` |
| Giao diện báo "Không kết nối được tới hệ thống" dù API khỏe | Mở giao diện ở `localhost:5174` (Vite dev). API chỉ cho phép trang từ `CORS_ORIGIN=http://localhost:5173` nên trình duyệt chặn (CORS) | Mở đúng `http://localhost:5173`; không chạy Vite dev cùng lúc với Docker |
| `docker compose down -v && ...` báo `&&` không hợp lệ | Windows PowerShell 5.1 không hỗ trợ `&&` | Chạy từng lệnh riêng hoặc nối bằng `;` |