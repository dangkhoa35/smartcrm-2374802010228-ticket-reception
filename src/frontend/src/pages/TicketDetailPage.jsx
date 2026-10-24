import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ticketsApi } from '../api/tickets.api';
import { useSession } from '../auth/SessionContext';
import { useTicket } from '../hooks/useTickets';
import { DataState } from '../components/DataState';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import {
  ACCESSORY_LABEL, CATEGORY_LABEL, NEXT_STATUS, STATUS_LABEL, label,
} from '../utils/labels';
import { dueState, formatDateTime } from '../utils/format';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { state } = useLocation(); // lời nhắn thành công sau khi tạo phiếu
  const { session } = useSession();
  const { data, loading, error, reload } = useTicket(id);

  return (
    <section>
      <p><Link to="/tickets">◀ Về danh sách phiếu bảo hành</Link></p>
      {state?.created && (
        <div className="alert alert-success" role="status">
          Đã tạo phiếu bảo hành <strong>{state.created.ticket_code}</strong>. Hạn cam kết:{' '}
          <strong>{formatDateTime(state.created.due_date)}</strong> (hệ thống tự tính, không nhập tay).
        </div>
      )}
      <DataState loading={loading} error={error} data={data} onRetry={reload}
        empty={{ message: 'Không tìm thấy phiếu bảo hành này.' }}>
        {(t) => <TicketBody t={t} role={session.role} onChanged={reload} />}
      </DataState>
    </section>
  );
}

function TicketBody({ t, role, onChanged }) {
  const due = dueState(t);
  return (
    <>
      <h1>Chi tiết phiếu bảo hành</h1>
      <p className="ticket-head">
        <strong>{t.ticket_code}</strong> <StatusBadge status={t.status} />
      </p>
      <div className="card grid-2">
        <Info k="Khách hàng" v={t.customer_name} />
        <Info k="Số điện thoại" v={t.customer_phone} />
        <Info k="Thiết bị" v={`${t.product_name} · ${t.serial_no}`} />
        <Info k="Nhóm sự cố" v={t.category_name ? label(CATEGORY_LABEL, t.category_name) : 'Chưa phân loại'} />
        <Info k="Mô tả lỗi" v={t.issue_desc} wide />
        <Info k="Mức ưu tiên" v={<PriorityBadge priority={t.priority} />} />
        <Info k="Phụ kiện kèm theo" v={t.accessories.length ? t.accessories.map((a) => label(ACCESSORY_LABEL, a)).join(', ') : 'Không'} />
        <Info k="Ngày tiếp nhận" v={formatDateTime(t.received_at)} />
        <Info k="Hạn cam kết" v={<>{formatDateTime(t.due_date)} {due.text && <span className={`due-${due.kind}`}>({due.text})</span>}</>} />
        <Info k="Bảo hành" v={t.is_warranty ? 'Còn bảo hành' : 'Hết bảo hành (đã được Quản lý phê duyệt)'} />
        <Info k="Kỹ thuật viên" v={t.technician_id ?? 'Chưa phân công'} />
        <Info k="Ngày đóng phiếu" v={formatDateTime(t.closed_at)} />
      </div>
      <StatusForm t={t} role={role} onChanged={onChanged} />
    </>
  );
}

const Info = ({ k, v, wide }) => (
  <div className={wide ? 'info wide' : 'info'}><span className="muted">{k}</span><div>{v}</div></div>
);

function StatusForm({ t, role, onChanged }) {
  const options = NEXT_STATUS[t.status] ?? [];
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');

  if (role !== 'KY_THUAT_VIEN') {
    return <p className="muted">Chỉ Kỹ thuật viên được chuyển trạng thái phiếu. Đổi vai trò ở góc trên bên phải để thử.</p>;
  }
  if (options.length === 0) {
    return <p className="muted">Phiếu đang ở trạng thái cuối, không chuyển tiếp được.</p>;
  }

  async function submit(e) {
    e.preventDefault();
    if (!to) { setErr({ message: 'Vui lòng chọn trạng thái mới.' }); return; }
    setBusy(true); setErr(null); setOk('');
    try {
      await ticketsApi.changeStatus(t.ticket_id, to, note.trim());
      setOk(`Đã chuyển phiếu sang "${label(STATUS_LABEL, to)}".`);
      setTo(''); setNote('');
      onChanged();
    } catch (ex) {
      setErr(ex); // 422 vòng đời / 409 xung đột: máy chủ đã viết sẵn câu cho người dùng
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card form inline-form">
      <h2>Chuyển trạng thái phiếu</h2>
      <label>Trạng thái mới
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">— Chọn —</option>
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label>Ghi chú
        <input value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} placeholder="Tùy chọn" />
      </label>
      <button type="submit" className="primary" disabled={busy}>{busy ? 'Đang cập nhật…' : 'Cập nhật'}</button>
      <p className="muted">Chỉ chuyển theo đúng vòng đời; không quay lại trạng thái trước.</p>
      {err && <p className="alert alert-error" role="alert">{err.message}</p>}
      {ok && <p className="alert alert-success" role="status">{ok}</p>}
    </form>
  );
}
