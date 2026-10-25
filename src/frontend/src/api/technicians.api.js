import { request } from './client';

export const techniciansApi = {
  // EP10: kỹ thuật viên đang hoạt động của trung tâm, để chọn khi phân công
  list: async () => (await request('/api/technicians')).data,
};
