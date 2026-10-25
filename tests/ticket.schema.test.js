const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/backend/utils/AppError');
const {
  createTicketSchema, listQuerySchema, changeStatusSchema, parseOrThrow,
} = require('../src/backend/validators/ticket.schema');

test('createTicket: dữ liệu hợp lệ -> trả dữ liệu đã sạch (luồng đúng)', () => {
  const out = parseOrThrow(createTicketSchema, {
    customer_id: 1, device_id: 2, issue_desc: '   Máy không lên nguồn   ',
  });
  assert.equal(out.issue_desc, 'Máy không lên nguồn');
});

test('createTicket: sai -> AppError 400 kèm fields theo từng trường, tiếng Việt (dữ liệu sai)', () => {
  assert.throws(
    () => parseOrThrow(createTicketSchema, { issue_desc: '' }),
    (e) => e instanceof AppError && e.status === 400 && e.code === 'DU_LIEU_KHONG_HOP_LE'
      && e.fields.customer_id === 'Chưa chọn khách hàng'
      && e.fields.device_id === 'Chưa chọn thiết bị'
      && e.fields.issue_desc === 'Mô tả lỗi cần tối thiểu 10 ký tự',
  );
});

test('createTicket: issue_desc đúng 10 và 2000 ký tự được chấp nhận; 9 và 2001 bị từ chối (giá trị biên)', () => {
  const base = { customer_id: 1, device_id: 2 };
  assert.ok(parseOrThrow(createTicketSchema, { ...base, issue_desc: 'a'.repeat(10) }));
  assert.ok(parseOrThrow(createTicketSchema, { ...base, issue_desc: 'a'.repeat(2000) }));
  assert.throws(() => parseOrThrow(createTicketSchema, { ...base, issue_desc: 'a'.repeat(9) }), AppError);
  assert.throws(() => parseOrThrow(createTicketSchema, { ...base, issue_desc: 'a'.repeat(2001) }), AppError);
});

test('createTicket: priority/accessories ngoài danh mục bị từ chối', () => {
  const base = { customer_id: 1, device_id: 2, issue_desc: 'Máy không lên nguồn' };
  assert.throws(() => parseOrThrow(createTicketSchema, { ...base, priority: 'GAP' }), AppError);
  assert.throws(() => parseOrThrow(createTicketSchema, { ...base, accessories: ['PIN'] }), AppError);
});

test('list: mặc định page=1, size=20; size=101 bị từ chối', () => {
  assert.deepEqual(parseOrThrow(listQuerySchema, {}), { page: 1, size: 20 });
  assert.equal(parseOrThrow(listQuerySchema, { page: '2', size: '5', status: 'MOI' }).size, 5);
  assert.throws(() => parseOrThrow(listQuerySchema, { size: '101' }), AppError);
  assert.throws(() => parseOrThrow(listQuerySchema, { status: 'XYZ' }), AppError);
});

test('changeStatus: to_status bắt buộc và phải thuộc danh sách', () => {
  assert.throws(() => parseOrThrow(changeStatusSchema, {}), AppError);
  assert.equal(parseOrThrow(changeStatusSchema, { to_status: 'DANG_XU_LY' }).to_status, 'DANG_XU_LY');
});

// ---- A1: tham số open; A4: technician_id ----
test('A1: open=true/false được đổi sang boolean; giá trị khác bị từ chối (dữ liệu sai)', () => {
  assert.equal(parseOrThrow(listQuerySchema, { open: 'true' }).open, true);
  assert.equal(parseOrThrow(listQuerySchema, { open: 'false' }).open, false);
  assert.throws(() => parseOrThrow(listQuerySchema, { open: 'abc' }),
    (e) => e instanceof AppError && e.fields.open === 'open chỉ nhận true hoặc false');
});

test('A4: changeStatus nhận technician_id là số nguyên dương, sai thì 400 (dữ liệu sai)', () => {
  assert.equal(parseOrThrow(changeStatusSchema, { to_status: 'DA_PHAN_CONG', technician_id: 33 }).technician_id, 33);
  assert.throws(() => parseOrThrow(changeStatusSchema, { to_status: 'DA_PHAN_CONG', technician_id: -1 }), AppError);
});
