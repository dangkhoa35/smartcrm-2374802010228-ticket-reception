import { request } from './client';

export const ticketsApi = {
  // EP5: trả { data: [...], paging: {...} } để giữ thông tin phân trang
  list: ({ status, open, page = 1, size = 20 } = {}) => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) q.set('status', status);
    if (open) q.set('open', 'true'); // chỉ phiếu chưa đóng (A1)
    return request(`/api/tickets?${q}`);
  },
  // EP7
  detail: async (id) => (await request(`/api/tickets/${id}`)).data,
  // EP4 – Idempotency-Key: gửi lại cùng khóa thì không tạo phiếu thứ hai (UC2-9a)
  create: async (payload, idempotencyKey) =>
    (await request('/api/tickets', {
      method: 'POST', body: payload, headers: { 'Idempotency-Key': idempotencyKey },
    })).data,
  // EP6
  changeStatus: async (id, toStatus, note, technicianId) =>
    (await request(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      body: { to_status: toStatus, ...(note ? { note } : {}), ...(technicianId ? { technician_id: Number(technicianId) } : {}) },
    })).data,
};
