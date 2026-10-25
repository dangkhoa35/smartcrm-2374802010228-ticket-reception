import { Link, useSearchParams } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useTickets } from '../hooks/useTickets';
import { DataState } from '../components/DataState';
import { Pagination } from '../components/Pagination';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import { CATEGORY_LABEL, STATUSES, STATUS_LABEL, label } from '../utils/labels';
import { dueState, formatDateTime } from '../utils/format';

const SIZE = 20;

export default function TicketListPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  // Mặc định "Đang mở": ẩn phiếu đã đóng/hủy để phiếu cần xử lý nằm ở đầu danh sách (A1).
  // '' = Đang mở · 'ALL' = Tất cả · còn lại = một trạng thái cụ thể.
  const status = params.get('status') || '';
  const apiStatus = status && status !== 'ALL' ? status : undefined;
  const openOnly = status === '';
  const page = Number(params.get('page')) || 1;
  const { data, paging, loading, error, reload } = useTickets({ status: apiStatus, open: openOnly, page, size: SIZE });

  const setFilter = (next) => setParams(next, { replace: true });
  const clearFilter = () => setFilter({});
  const canCreate = session.role === 'NHAN_VIEN_TIEP_NHAN';

  const empty = apiStatus
    ? { message: `Không có phiếu nào ở trạng thái "${label(STATUS_LABEL, status)}".`,
        action: <button type="button" onClick={clearFilter}>Xóa bộ lọc</button> }
    : openOnly
      ? { message: 'Hiện không có phiếu nào đang mở trong trung tâm này.',
          action: <button type="button" onClick={() => setFilter({ status: 'ALL' })}>Xem tất cả phiếu</button> }
    : { message: 'Chưa có phiếu bảo hành nào trong trung tâm này.',
        action: canCreate ? <Link to="/tickets/new" className="button primary">Tạo phiếu bảo hành đầu tiên</Link> : null };

  const overdueCount = data ? data.filter((t) => dueState(t).kind === 'overdue').length : 0;

  return (
    <section>
      <h1>Danh sách phiếu bảo hành</h1>
      <div className="toolbar">
        <label>Trạng thái phiếu{' '}
          <select value={status} onChange={(e) => setFilter(e.target.value ? { status: e.target.value } : {})}>
            <option value="">Đang mở</option>
            <option value="ALL">Tất cả</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        {apiStatus && <button type="button" onClick={clearFilter}>Xóa bộ lọc</button>}
        {canCreate && <Link to="/tickets/new" className="button primary">+ Tạo phiếu bảo hành</Link>}
      </div>

      <DataState loading={loading} error={error} data={data} empty={empty} onRetry={reload}>
        {(rows) => (
          <>
            <p className="muted">
              Sắp theo Hạn cam kết tăng dần: phiếu gần hạn nhất ở trên.{' '}
              {overdueCount > 0
                ? <strong className="text-danger">{overdueCount} phiếu quá hạn trong trang này.</strong>
                : 'Không có phiếu quá hạn trong trang này.'}
            </p>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Mã phiếu</th><th>Khách hàng</th><th>Số điện thoại</th><th>Thiết bị</th>
                  <th>Nhóm sự cố</th><th>Ưu tiên</th><th>Trạng thái</th><th>Hạn cam kết</th>
                </tr></thead>
                <tbody>
                  {rows.map((t) => {
                    const due = dueState(t);
                    return (
                      <tr key={t.ticket_id} className={due.kind === 'overdue' ? 'row-overdue' : due.kind === 'soon' ? 'row-soon' : ''}>
                        <td><Link to={`/tickets/${t.ticket_id}`}>{t.ticket_code}</Link></td>
                        <td>{t.customer_name}</td>
                        <td>{t.customer_phone}</td>
                        <td>{t.product_name}<br /><span className="muted">{t.serial_no}</span></td>
                        <td>{t.category_name ? label(CATEGORY_LABEL, t.category_name) : 'Chưa phân loại'}</td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>{formatDateTime(t.due_date)}
                          {due.text && <><br /><span className={`due-${due.kind}`}>{due.text}</span></>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination paging={paging} onPage={(p) => setFilter({ ...(status ? { status } : {}), page: String(p) })} />
          </>
        )}
      </DataState>
    </section>
  );
}
