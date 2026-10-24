import { request } from './client';

export const customersApi = {
  // EP1: ném ApiError 404 KHONG_TIM_THAY khi chưa có khách
  findByPhone: async (phone) =>
    (await request(`/api/customers?phone=${encodeURIComponent(phone)}`)).data,
  // EP2: ném ApiError 409 SDT_DA_TON_TAI khi số đã có hồ sơ
  create: async (payload) =>
    (await request('/api/customers', { method: 'POST', body: payload })).data,
  // EP3
  devices: async (customerId) =>
    (await request(`/api/customers/${customerId}/devices`)).data,
};
