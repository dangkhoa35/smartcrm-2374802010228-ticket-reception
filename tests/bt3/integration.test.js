// BT3 – tầng INTEGRATION (3 test): service + repository + PostgreSQL thật (CSDL smartcrm_test).
const { prepareDb, resetDb, seedFixtures, insertOpenTicket, count, chay } = require('../helpers/db'); // PHẢI đứng đầu
const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../../src/backend/db/pool');
const ticketService = require('../../src/backend/services/ticket.service');

const tiepNhan = { role: 'NHAN_VIEN_TIEP_NHAN', employeeId: 1, centerId: 1, fullName: 'Tiếp nhận Mẫu' };
const GIO = 3600 * 1000;

test.before(async () => { await prepareDb(); });
test.after(async () => { await pool.end(); });
test.beforeEach(async () => { await resetDb(pool); await seedFixtures(pool); });

test('TC-08 QT03/QT02 luồng đúng: tạo phiếu mức CAO -> lưu đúng mã, trạng thái MOI, hạn cam kết và 1 dòng lịch sử', async () => {
  const { ticket, created } = await ticketService.createTicket(
    { customer_id: 1, device_id: 1, issue_desc: 'Màn hình bị sọc ngang sau khi rơi', priority: 'CAO',
      category_id: null, approved_by: null, accessories: ['SAC'] }, tiepNhan);
  assert.equal(created, true);
  const t = (await pool.query('SELECT * FROM ticket WHERE ticket_id = $1', [ticket.ticket_id])).rows[0];
  assert.match(t.ticket_code, /^BH-\d{6}\/\d{4}$/);
  assert.equal(t.status, 'MOI');
  assert.equal(t.is_warranty, true);
  assert.equal(t.acc_sac, true);
  const cach = t.due_date - t.received_at;                 // CAO = 1 ngày làm việc: 24h, hoặc 48h nếu vướng Chủ nhật
  assert.ok(cach === 24 * GIO || cach === 48 * GIO, `hạn cách ${cach / GIO} giờ`);
  assert.notEqual(t.due_date.getDay(), 0, 'hạn cam kết không được rơi vào Chủ nhật');
  const log = (await pool.query('SELECT * FROM ticket_status_log WHERE ticket_id = $1', [t.ticket_id])).rows;
  assert.equal(log.length, 1);
  assert.equal(log[0].from_status, null);
  assert.equal(log[0].to_status, 'MOI');
  assert.equal(Number(log[0].changed_by), 1);
});

test('TC-09 QT03 xung đột: thiết bị đang có phiếu mở -> 409, KHÔNG thêm bản ghi nào', async () => {
  await insertOpenTicket(pool, { deviceId: 1, status: 'DANG_XU_LY' });
  const truoc = { ticket: await count(pool, 'ticket'), log: await count(pool, 'ticket_status_log') };
  await assert.rejects(
    ticketService.createTicket({ customer_id: 1, device_id: 1, issue_desc: 'Máy không lên nguồn nữa', accessories: [] }, tiepNhan),
    (e) => e.status === 409 && e.code === 'THIET_BI_DANG_CO_PHIEU_MO');
  assert.deepEqual({ ticket: await count(pool, 'ticket'), log: await count(pool, 'ticket_status_log') }, truoc);
});

test('TC-10 tái lập: chạy migrate + seed lần thứ hai -> thoát mã 0, số dòng các bảng danh mục không đổi', async () => {
  const bang = ['schema_migrations', 'service_center', 'issue_category', 'technician', 'employee'];
  const dem = async () => Object.fromEntries(await Promise.all(bang.map(async (b) => [b, await count(pool, b)])));
  const truoc = await dem();
  const m = chay('migrate.js');
  const s = chay('seed.js');
  assert.equal(m.code, 0, m.out);
  assert.equal(s.code, 0, s.out);
  assert.deepEqual(await dem(), truoc);
});