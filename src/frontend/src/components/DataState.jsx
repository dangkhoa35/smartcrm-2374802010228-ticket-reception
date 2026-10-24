// Xử lý ĐỦ BA TRẠNG THÁI cho mọi chỗ hiển thị dữ liệu từ API: đang tải · rỗng · lỗi.
// Viết một lần, dùng cho mọi màn hình.
export function DataState({ loading, error, data, empty, onRetry, children }) {
  if (loading) {
    return (
      <div className="skeleton" role="status" aria-live="polite">
        <div className="skeleton-row" /><div className="skeleton-row short" />
        <div className="skeleton-row" /><div className="skeleton-row short" />
        <p>Đang tải dữ liệu…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        <strong>Không tải được dữ liệu</strong>
        <p>{error.message}</p>
        {error.retryable && onRetry && <button type="button" onClick={onRetry}>Thử lại</button>}
      </div>
    );
  }
  const isEmpty = data == null || (Array.isArray(data) && data.length === 0);
  if (isEmpty) {
    return (
      <div className="empty-state">
        <p>{empty?.message ?? 'Chưa có dữ liệu nào.'}</p>
        {empty?.action}
      </div>
    );
  }
  return children(data);
}
