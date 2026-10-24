export function Pagination({ paging, onPage }) {
  const { page, size, total, total_pages: totalPages } = paging;
  return (
    <div className="pagination">
      <span>Trang {page} / {Math.max(totalPages, 1)} · {size} phiếu mỗi trang · Tổng {total} phiếu</span>
      <span>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>◀ Trước</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Sau ▶</button>
      </span>
    </div>
  );
}
