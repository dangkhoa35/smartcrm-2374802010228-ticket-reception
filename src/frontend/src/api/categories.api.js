import { request } from './client';

export const categoriesApi = {
  // EP8
  list: async () => (await request('/api/issue-categories')).data,
};
