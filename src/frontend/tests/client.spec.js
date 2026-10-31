import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from '../src/api/client';
import { getSession, saveSession } from '../src/auth/session';

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });

beforeEach(() => { localStorage.clear(); saveSession({ token: 'tok.en.abc', role: 'NHAN_VIEN_TIEP_NHAN', employeeId: 3, centerId: 2 }); });
afterEach(() => vi.restoreAllMocks());

describe('lớp gọi API', () => {
  it('gửi token Bearer của phiên (không còn header x-role tự khai) và trả toàn bộ thân phản hồi (giữ paging)', async () => {
    const f = vi.fn().mockResolvedValue(json(200, { data: [1], paging: { total: 1 } }));
    vi.stubGlobal('fetch', f);
    const body = await request('/api/tickets');
    expect(body.paging.total).toBe(1);
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe('http://api.test/api/tickets');
    expect(opts.headers.Authorization).toBe('Bearer tok.en.abc');
    expect(opts.headers['x-role']).toBeUndefined();
  });

  it('mất kết nối: không lộ "Failed to fetch", báo câu cho người dùng và cho phép thử lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = await request('/api/tickets').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('KHONG_KET_NOI');
    expect(err.message).not.toMatch(/Failed to fetch/);
    expect(err.message).toMatch(/Không kết nối được/);
    expect(err.retryable).toBe(true);
  });

  it('lỗi 400: giữ fields theo từng trường, không thử lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(400, {
      error: 'DU_LIEU_KHONG_HOP_LE', message: 'Dữ liệu gửi lên không hợp lệ',
      fields: { issue_desc: 'Mô tả lỗi cần tối thiểu 10 ký tự' },
    })));
    const err = await request('/api/tickets', { method: 'POST', body: {} }).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.fields.issue_desc).toMatch(/tối thiểu 10/);
    expect(err.retryable).toBe(false);
  });

  it('lỗi 500: cho phép thử lại và dùng câu của máy chủ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(500, { error: 'LOI_HE_THONG', message: 'Hệ thống đang gặp sự cố. Mã tra cứu: 7F3A' })));
    const err = await request('/x').catch((e) => e);
    expect(err.retryable).toBe(true);
    expect(err.message).toMatch(/Mã tra cứu/);
  });

  it('401: xóa phiên và phát sự kiện để quay về trang đăng nhập', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, { error: 'CHUA_XAC_THUC', message: 'Phiên không hợp lệ' })));
    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);
    await request('/x').catch(() => {});
    window.removeEventListener('auth:unauthorized', handler);
    expect(getSession()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('chưa đăng nhập: không gửi header Authorization', async () => {
    localStorage.clear();
    const f = vi.fn().mockResolvedValue(json(200, { data: [] }));
    vi.stubGlobal('fetch', f);
    await request('/api/auth/centers');
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('phiên đã quá hạn: getSession trả null và xóa phiên (coi như chưa đăng nhập)', () => {
    saveSession({ token: 't', role: 'QUAN_LY_TRUNG_TAM', employeeId: 1, centerId: 1, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(getSession()).toBeNull();
    expect(localStorage.getItem('smartcrm.session')).toBeNull();
  });
});
