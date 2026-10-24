const AppError = require('../utils/AppError');
const customerRepo = require('../repositories/customer.repository');
const deviceRepo = require('../repositories/device.repository');
const { toCustomerView, toDeviceView } = require('../contracts/customer.contract');

// EP1 – US1: tra cứu khách hàng theo số điện thoại (đã chuẩn hóa ở lớp API)
async function lookupByPhone(phone, actor) {
  const row = await customerRepo.findByPhone(phone);
  if (!row) {
    throw new AppError(404, 'KHONG_TIM_THAY', 'Chưa có khách hàng với số điện thoại này');
  }
  return toCustomerView(row, actor);
}

// EP2 – US3: tạo khách hàng mới nếu số điện thoại chưa tồn tại
async function createCustomer(input, actor) {
  const dup = async () => new AppError(409, 'SDT_DA_TON_TAI', 'Số điện thoại này đã có hồ sơ khách hàng');
  if (await customerRepo.findByPhone(input.phone)) throw await dup();
  try {
    const row = await customerRepo.create({
      fullName: input.full_name, phone: input.phone,
      email: input.email || null, address: input.address || null,
    });
    return toCustomerView(row, actor);
  } catch (e) {
    // Hai yêu cầu đồng thời cùng số điện thoại: CSDL chặn bằng UNIQUE, quy về cùng mã lỗi nghiệp vụ
    if (e.code === '23505') throw await dup();
    throw e;
  }
}

// EP3 – US1: danh sách thiết bị của khách hàng (khách chưa có thiết bị -> [])
async function listDevices(customerId) {
  const customer = await customerRepo.findById(customerId);
  if (!customer) throw new AppError(404, 'KHONG_TIM_THAY', 'Không tìm thấy khách hàng');
  const rows = await deviceRepo.listByCustomer(customerId);
  return rows.map(toDeviceView);
}

module.exports = { lookupByPhone, createCustomer, listDevices };
