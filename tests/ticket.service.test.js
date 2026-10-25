const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/backend/utils/AppError');
const {
  TRANSITIONS, isUnderWarranty, checkApprover, checkAssignment,
} = require('../src/backend/services/ticket.service');

test('QT01: còn bảo hành khi ngày tiếp nhận <= ngày mua + số tháng bảo hành', () => {
  const device = { purchase_date: new Date(2026, 2, 10), warranty_months: 12 };
  assert.equal(isUnderWarranty(device, new Date(2026, 9, 20)), true);
});

test('QT01: hết bảo hành khi quá hạn', () => {
  const device = { purchase_date: new Date(2025, 0, 15), warranty_months: 12 };
  assert.equal(isUnderWarranty(device, new Date(2026, 9, 20)), false);
});

test('QT01: không có ngày mua thì coi như không còn bảo hành', () => {
  assert.equal(isUnderWarranty({ purchase_date: null, warranty_months: 12 }, new Date()), false);
});

test('QT03: vòng đời chỉ đi tới, không quay lại', () => {
  assert.ok(TRANSITIONS.MOI.includes('DA_PHAN_CONG'));
  assert.ok(!TRANSITIONS.DANG_XU_LY.includes('MOI'));
  assert.ok(!TRANSITIONS.DANG_XU_LY.includes('DA_PHAN_CONG'));
});

test('QT03: trạng thái cuối DA_DONG và DA_HUY không chuyển đi đâu nữa', () => {
  assert.deepEqual(TRANSITIONS.DA_DONG, []);
  assert.deepEqual(TRANSITIONS.DA_HUY, []);
});

// ---- A3: người phê duyệt (SRS 8a) ----
test('A3: Quản lý cùng trung tâm được chấp nhận làm người phê duyệt (luồng đúng)', () => {
  assert.doesNotThrow(() => checkApprover({ employee_id: 3, role: 'QUAN_LY_TRUNG_TAM', center_id: 1 }, 1));
});

test('A3: mã không tồn tại, sai vai trò hoặc khác trung tâm -> 422 NGUOI_PHE_DUYET_KHONG_HOP_LE (dữ liệu sai)', () => {
  const sai = [
    null,
    { employee_id: 1, role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 },
    { employee_id: 13, role: 'QUAN_LY_TRUNG_TAM', center_id: 2 },
  ];
  for (const approver of sai) {
    assert.throws(() => checkApprover(approver, 1),
      (e) => e instanceof AppError && e.status === 422 && e.code === 'NGUOI_PHE_DUYET_KHONG_HOP_LE');
  }
});

// ---- A4: phân công kỹ thuật viên ----
test('A4: chuyển sang trạng thái khác DA_PHAN_CONG thì không cần kỹ thuật viên (trả null)', () => {
  assert.equal(checkAssignment('DANG_XU_LY', undefined, null, 1), null);
});

test('A4: DA_PHAN_CONG mà thiếu kỹ thuật viên -> 422 CAN_CHON_KY_THUAT_VIEN kèm fields.technician_id (biên)', () => {
  assert.throws(() => checkAssignment('DA_PHAN_CONG', undefined, null, 1),
    (e) => e.status === 422 && e.code === 'CAN_CHON_KY_THUAT_VIEN' && typeof e.fields.technician_id === 'string');
});

test('A4: kỹ thuật viên khác trung tâm hoặc ngừng hoạt động bị từ chối; hợp lệ thì trả technician_id', () => {
  const tv = { technician_id: 33, center_id: 1, is_active: true };
  assert.equal(checkAssignment('DA_PHAN_CONG', 33, tv, 1), 33);
  assert.throws(() => checkAssignment('DA_PHAN_CONG', 33, { ...tv, center_id: 2 }, 1),
    (e) => e.code === 'KY_THUAT_VIEN_KHONG_HOP_LE');
  assert.throws(() => checkAssignment('DA_PHAN_CONG', 33, { ...tv, is_active: false }, 1),
    (e) => e.code === 'KY_THUAT_VIEN_KHONG_HOP_LE');
});
