-- ============================================================
-- Migration 003: tài khoản đăng nhập (TD-12)
-- Thêm cột đăng nhập vào bảng employee. 60 mã nhân viên nạp từ dữ liệu lịch sử
-- không có tài khoản (username IS NULL) nên không đăng nhập được; chỉ tài khoản
-- mẫu (seed.js) và tài khoản tự đăng ký mới có username + password_hash.
-- ============================================================
ALTER TABLE employee
  ADD COLUMN username      VARCHAR(30) UNIQUE,
  ADD COLUMN password_hash TEXT,
  ADD COLUMN is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Tên đăng nhập luôn viết thường; username và password_hash luôn đi cùng nhau
ALTER TABLE employee ADD CONSTRAINT employee_username_lower
  CHECK (username IS NULL OR username = lower(username));
ALTER TABLE employee ADD CONSTRAINT employee_account_pair
  CHECK ((username IS NULL) = (password_hash IS NULL));
