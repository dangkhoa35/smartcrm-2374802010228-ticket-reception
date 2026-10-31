import { request } from './client';

export const authApi = {
  // EP11: ném ApiError 401 SAI_THONG_TIN_DANG_NHAP, 429 TAI_KHOAN_TAM_KHOA hoặc 400 kèm fields
  login: async (payload) => (await request('/api/auth/login', { method: 'POST', body: payload })).data,
  // EP12: ném ApiError 400 kèm fields, 403 MA_DANG_KY_SAI / DANG_KY_VAI_TRO_BI_KHOA, 409 TEN_DANG_NHAP_DA_TON_TAI
  register: async (payload) => (await request('/api/auth/register', { method: 'POST', body: payload })).data,
  // EP13: danh sách trung tâm cho ô chọn ở trang đăng ký
  centers: async () => (await request('/api/auth/centers')).data,
};
