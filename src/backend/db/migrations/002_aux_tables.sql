-- ============================================================
-- Migration 002: bảng phụ trợ + khóa ngoại + sequence sinh mã phiếu
-- BT1 để các bảng này lại cho BT2 (xem chú thích cuối DDL). Sprint 1 cần nạp danh mục
-- từ bộ dữ liệu mẫu (service_centers.csv, technicians.csv) nên làm sớm;
-- ghi vào docs/thay-doi-thiet-ke.md. Cột lấy theo đúng các file CSV của học phần.
-- ============================================================

CREATE TABLE service_center (
  center_id   BIGSERIAL    PRIMARY KEY,
  center_code VARCHAR(10)  NOT NULL UNIQUE,
  center_name VARCHAR(120) NOT NULL UNIQUE,
  city        VARCHAR(60)
);

-- Bộ dữ liệu mẫu không có bảng nhân viên, nhưng ticket_status_log.changed_by tham chiếu
-- 60 mã người thực hiện; bảng này chứa các mã đó (seed.js tự sinh) và là nơi gán vai trò.
CREATE TABLE employee (
  employee_id BIGSERIAL    PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  role        VARCHAR(30)  NOT NULL
    CHECK (role IN ('NHAN_VIEN_TIEP_NHAN', 'KY_THUAT_VIEN', 'QUAN_LY_TRUNG_TAM')),
  center_id   BIGINT       NOT NULL REFERENCES service_center (center_id)
);

CREATE TABLE technician (
  technician_id   BIGSERIAL    PRIMARY KEY,
  technician_code VARCHAR(10)  NOT NULL UNIQUE,
  full_name       VARCHAR(120) NOT NULL,
  center_id       BIGINT       NOT NULL REFERENCES service_center (center_id),
  level           VARCHAR(10)  NOT NULL CHECK (level IN ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP')),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

ALTER TABLE ticket            ADD FOREIGN KEY (center_id)     REFERENCES service_center (center_id);
ALTER TABLE ticket            ADD FOREIGN KEY (technician_id) REFERENCES technician (technician_id);
ALTER TABLE ticket            ADD FOREIGN KEY (approved_by)   REFERENCES employee (employee_id);
ALTER TABLE ticket_status_log ADD FOREIGN KEY (changed_by)    REFERENCES employee (employee_id);

-- Mã phiếu dạng BH-000231/2026: phần số lấy từ sequence (không tái lập theo năm ở Sprint 1)
CREATE SEQUENCE IF NOT EXISTS ticket_code_seq;
