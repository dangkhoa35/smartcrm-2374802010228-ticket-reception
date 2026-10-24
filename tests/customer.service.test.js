// Kiểm tra logic service khi thay repository bằng bản giả (không cần CSDL).
const test = require('node:test');
const assert = require('node:assert/strict');
const customerRepo = require('../src/backend/repositories/customer.repository');
const deviceRepo = require('../src/backend/repositories/device.repository');
const svc = require('../src/backend/services/customer.service');

const TIEP_NHAN = { role: 'NHAN_VIEN_TIEP_NHAN' };
const KHACH = { customer_id: 1, full_name: 'An', phone: '0901234567', email: null, address: null };

test('EP1: chưa có khách -> 404 KHONG_TIM_THAY', async () => {
  customerRepo.findByPhone = async () => null;
  await assert.rejects(svc.lookupByPhone('0901234567', TIEP_NHAN), { status: 404, code: 'KHONG_TIM_THAY' });
});

test('EP2: trùng số điện thoại -> 409 SDT_DA_TON_TAI, không gọi create', async () => {
  let created = false;
  customerRepo.findByPhone = async () => KHACH;
  customerRepo.create = async () => { created = true; return KHACH; };
  await assert.rejects(svc.createCustomer({ full_name: 'An', phone: '0901234567' }, TIEP_NHAN),
    { status: 409, code: 'SDT_DA_TON_TAI' });
  assert.equal(created, false);
});

test('EP2: hai yêu cầu đồng thời, CSDL báo 23505 -> quy về 409 SDT_DA_TON_TAI', async () => {
  customerRepo.findByPhone = async () => null;
  customerRepo.create = async () => { throw Object.assign(new Error('dup'), { code: '23505' }); };
  await assert.rejects(svc.createCustomer({ full_name: 'An', phone: '0901234567' }, TIEP_NHAN),
    { status: 409, code: 'SDT_DA_TON_TAI' });
});

test('EP3: khách không tồn tại -> 404; khách chưa có thiết bị -> mảng rỗng', async () => {
  customerRepo.findById = async () => null;
  await assert.rejects(svc.listDevices(99), { status: 404 });
  customerRepo.findById = async () => KHACH;
  deviceRepo.listByCustomer = async () => [];
  assert.deepEqual(await svc.listDevices(1), []);
});
