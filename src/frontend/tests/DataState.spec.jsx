import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState } from '../src/components/DataState';
import { ApiError } from '../src/api/client';

describe('DataState – ba trạng thái', () => {
  it('đang tải: hiện khung chờ, không để màn trắng', () => {
    render(<DataState loading data={null}>{() => <p>x</p>}</DataState>);
    expect(screen.getByText(/Đang tải dữ liệu/)).toBeInTheDocument();
  });

  it('lỗi mất kết nối: hiện câu người dùng đọc được và nút Thử lại gọi lại', async () => {
    const onRetry = vi.fn();
    const err = new ApiError(0, 'KHONG_KET_NOI', 'Không kết nối được tới hệ thống.');
    render(<DataState error={err} onRetry={onRetry}>{() => null}</DataState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được tới hệ thống.');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('lỗi 403: không có nút Thử lại vì thử lại không giải quyết được', () => {
    const err = new ApiError(403, 'KHONG_DU_QUYEN', 'Bạn không có quyền.');
    render(<DataState error={err} onRetry={() => {}}>{() => null}</DataState>);
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

  it('rỗng: hiện lời giải thích kèm hành động, không phải bảng trắng', () => {
    render(<DataState data={[]} empty={{ message: 'Không có phiếu nào khớp bộ lọc.', action: <button>Xóa bộ lọc</button> }}>{() => null}</DataState>);
    expect(screen.getByText('Không có phiếu nào khớp bộ lọc.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xóa bộ lọc' })).toBeInTheDocument();
  });

  it('có dữ liệu: gọi children với dữ liệu', () => {
    render(<DataState data={['A']}>{(rows) => <p>{rows[0]}</p>}</DataState>);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
