-- ============================================================
-- Smart CRM – Mekong Mobile · Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành
-- Migration 001: 5 bảng theo ERD/DDL của BT1 sau TD-01 (đã bỏ ticket_note cùng FR8/UC8).
-- Giữ nguyên thiết kế BT1; chỉ sửa lỗi cú pháp (CREATE INDEX kết thúc bằng ';').
-- ============================================================

-- 1. Nhóm sự cố (issue_category)
CREATE TABLE issue_category (
  category_id      SERIAL      PRIMARY KEY,
  category_name    VARCHAR(60) NOT NULL UNIQUE,
  default_priority VARCHAR(10) NOT NULL
    CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE
);

-- 2. Khách hàng (customer)
CREATE TABLE customer (
  customer_id BIGSERIAL    PRIMARY KEY,
  phone       VARCHAR(20)  NOT NULL UNIQUE
    CHECK (phone ~ '^0[0-9]{9}$'),
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(120),
  address     VARCHAR(255),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 3. Thiết bị (device)
CREATE TABLE device (
  device_id       BIGSERIAL    PRIMARY KEY,
  customer_id     BIGINT       NOT NULL REFERENCES customer (customer_id),
  serial_no       VARCHAR(50)  NOT NULL UNIQUE,
  product_name    VARCHAR(120) NOT NULL,
  purchase_date   DATE,
  warranty_months SMALLINT     NOT NULL DEFAULT 12 CHECK (warranty_months >= 0)
);
CREATE INDEX idx_device_customer ON device (customer_id);

-- 4. Phiếu bảo hành (ticket)
CREATE TABLE ticket (
  ticket_id       BIGSERIAL    PRIMARY KEY,
  ticket_code     VARCHAR(20)  NOT NULL UNIQUE,
  customer_id     BIGINT       NOT NULL REFERENCES customer (customer_id),
  device_id       BIGINT       NOT NULL REFERENCES device (device_id),
  category_id     INT          REFERENCES issue_category (category_id),
  center_id       BIGINT       NOT NULL,
  issue_desc      TEXT         NOT NULL
    CHECK (char_length(btrim(issue_desc)) BETWEEN 10 AND 2000),
  priority        VARCHAR(10)  NOT NULL
    CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'MOI'
    CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                      'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
  technician_id   BIGINT,
  received_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  due_date        TIMESTAMPTZ  NOT NULL,
  closed_at       TIMESTAMPTZ,
  is_warranty     BOOLEAN      NOT NULL,
  approved_by     BIGINT,
  acc_sac         BOOLEAN      NOT NULL DEFAULT FALSE,
  acc_tai_nghe    BOOLEAN      NOT NULL DEFAULT FALSE,
  acc_hop         BOOLEAN      NOT NULL DEFAULT FALSE,
  acc_khac        BOOLEAN      NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(64)  UNIQUE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  CHECK (closed_at IS NULL OR closed_at >= received_at)
);

-- QT03: mỗi Thiết bị chỉ có tối đa MỘT Phiếu bảo hành chưa đóng (lỗi 409)
CREATE UNIQUE INDEX uq_ticket_open_per_device
  ON ticket (device_id) WHERE status NOT IN ('DA_DONG', 'DA_HUY');

-- Index phục vụ NFR1
CREATE INDEX idx_ticket_center_status_due ON ticket (center_id, status, due_date);
CREATE INDEX idx_ticket_technician_due    ON ticket (technician_id, due_date);
CREATE INDEX idx_ticket_device_received   ON ticket (device_id, received_at DESC);

-- 5. Lịch sử Trạng thái phiếu (ticket_status_log)
CREATE TABLE ticket_status_log (
  log_id      BIGSERIAL    PRIMARY KEY,
  ticket_id   BIGINT       NOT NULL REFERENCES ticket (ticket_id),
  from_status VARCHAR(20),
  to_status   VARCHAR(20)  NOT NULL,
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  changed_by  BIGINT       NOT NULL,
  note        VARCHAR(255)
);
CREATE INDEX idx_status_log_ticket ON ticket_status_log (ticket_id, changed_at);
