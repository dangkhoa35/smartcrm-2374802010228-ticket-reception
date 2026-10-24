import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categories.api';
import { customersApi } from '../api/customers.api';
import { ticketsApi } from '../api/tickets.api';
import { useSession } from '../auth/SessionContext';
import { useApi } from '../hooks/useApi';
import { DataState } from '../components/DataState';
import { FieldError } from '../components/FieldError';
import { ACCESSORY_LABEL, CATEGORY_LABEL, PRIORITY_LABEL, label } from '../utils/labels';
import { formatDate, warrantyHint } from '../utils/format';

export default function ReceiveDevicePage() {
  const { session } = useSession();
  const [customer, setCustomer] = useState(null);

  if (session.role !== 'NHAN_VIEN_TIEP_NHAN') {
    return (
      <section>
        <h1>Tạo phiếu bảo hành mới</h1>
        <div className="alert alert-error" role="alert">
          Chỉ Nhân viên tiếp nhận được tạo phiếu bảo hành. Đổi vai trò ở góc trên bên phải.
        </div>
        <Link to="/tickets">◀ Về danh sách phiếu bảo hành</Link>
      </section>
    );
  }

  return (
    <section>
      <p><Link to="/tickets">◀ Về danh sách phiếu bảo hành</Link></p>
      <h1>Tạo phiếu bảo hành mới</h1>
      <CustomerStep customer={customer} onCustomer={setCustomer} />
      {customer && <TicketStep key={customer.customer_id} customer={customer} centerId={session.centerId} />}
    </section>
  );
}

/* ---------- Bước 1: khách hàng (EP1, EP2) ---------- */
function CustomerStep({ customer, onCustomer }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | notfound
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', address: '' });
  const [formErr, setFormErr] = useState(null);

  async function lookup(e) {
    e.preventDefault();
    setStatus('loading'); setErr(null); setInfo('');
    try {
      onCustomer(await customersApi.findByPhone(phone.trim()));
      setStatus('idle');
    } catch (ex) {
      if (ex.code === 'KHONG_TIM_THAY') setStatus('notfound');
      else { setErr(ex); setStatus('idle'); }
    }
  }

  async function createCustomer(e) {
    e.preventDefault();
    setFormErr(null);
    try {
      onCustomer(await customersApi.create({ ...form, phone: phone.trim() }));
      setStatus('idle');
    } catch (ex) {
      if (ex.code === 'SDT_DA_TON_TAI') { // số vừa có người tạo: dùng hồ sơ có sẵn
        try {
          onCustomer(await customersApi.findByPhone(phone.trim()));
          setStatus('idle');
          setInfo('Số điện thoại này vừa có hồ sơ, đã dùng hồ sơ có sẵn.');
          return;
        } catch (ex2) { setFormErr(ex2); return; }
      }
      setFormErr(ex);
    }
  }

  if (customer) {
    return (
      <div className="card">
        <h2>Khách hàng</h2>
        <p><strong>{customer.full_name}</strong> · {customer.phone}{customer.address ? ` · ${customer.address}` : ''}</p>
        {info && <p className="alert alert-success" role="status">{info}</p>}
        <button type="button" onClick={() => { onCustomer(null); setStatus('idle'); setInfo(''); }}>Đổi khách hàng</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Khách hàng</h2>
      <form onSubmit={lookup} className="inline-form">
        <label>Số điện thoại khách hàng
          <input inputMode="tel" value={phone} placeholder="0901 234 567"
            onChange={(e) => { setPhone(e.target.value); setStatus('idle'); }} />
        </label>
        <button type="submit" className="primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Đang tra cứu…' : 'Tra cứu'}
        </button>
      </form>
      {err && (
        <div className="alert alert-error" role="alert">
          <p>{err.fields?.phone ?? err.message}</p>
          {err.retryable && <p className="muted">Số điện thoại đã nhập vẫn được giữ, bấm Tra cứu để thử lại.</p>}
        </div>
      )}
      {status === 'notfound' && (
        <form onSubmit={createCustomer} className="form subcard">
          <p className="alert alert-warn">Số điện thoại này chưa có trong hệ thống. Nhập thông tin để tạo khách hàng mới.</p>
          <label>Họ tên (bắt buộc)
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <FieldError message={formErr?.fields?.full_name} />
          </label>
          <label>Email (tùy chọn)
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FieldError message={formErr?.fields?.email} />
          </label>
          <label>Địa chỉ (tùy chọn)
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <FieldError message={formErr?.fields?.address} />
          </label>
          {formErr && !formErr.fields && <p className="alert alert-error" role="alert">{formErr.message}</p>}
          <FieldError message={formErr?.fields?.phone} />
          <button type="submit" className="primary">Tạo khách hàng</button>
        </form>
      )}
    </div>
  );
}

/* ---------- Bước 2: thiết bị, mô tả, phân loại (EP3, EP8, EP4) ---------- */
function newKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];

function TicketStep({ customer, centerId }) {
  const navigate = useNavigate();
  const devices = useApi(() => customersApi.devices(customer.customer_id), [customer.customer_id]);
  const categories = useApi(() => categoriesApi.list(), []);
  const idemKey = useRef(newKey()); // giữ nguyên khi gửi lại để không tạo phiếu thứ hai (UC2-9a)

  const [deviceId, setDeviceId] = useState('');
  const [desc, setDesc] = useState('');
  const [accessories, setAccessories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [localErr, setLocalErr] = useState({});

  const toggleAcc = (a) =>
    setAccessories((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    const le = {};
    if (approvedBy.trim() && !/^[1-9]\d*$/.test(approvedBy.trim())) le.approved_by = 'Mã Quản lý phải là số nguyên dương';
    setLocalErr(le);
    if (Object.keys(le).length) return;

    const payload = {
      customer_id: customer.customer_id,
      device_id: deviceId ? Number(deviceId) : undefined,
      issue_desc: desc,
      accessories,
      ...(categoryId ? { category_id: Number(categoryId) } : {}),
      ...(priority ? { priority } : {}),
      ...(approvedBy.trim() ? { approved_by: Number(approvedBy.trim()) } : {}),
    };
    setBusy(true);
    try {
      const ticket = await ticketsApi.create(payload, idemKey.current);
      navigate(`/tickets/${ticket.ticket_id}`, { state: { created: ticket } });
    } catch (ex) {
      setErr(ex);
    } finally {
      setBusy(false);
    }
  }

  const fe = err?.fields ?? {}; // lỗi theo trường từ API
  const catList = categories.result ?? [];
  const chosenCat = catList.find((c) => String(c.category_id) === categoryId);

  return (
    <form onSubmit={submit} className="card form">
      <h2>Thiết bị</h2>
      <DataState loading={devices.loading} error={devices.error} data={devices.result} onRetry={devices.reload}
        empty={{ message: 'Khách hàng này chưa có thiết bị nào trong hệ thống nên chưa thể tạo phiếu.' }}>
        {(list) => {
          const dev = list.find((d) => String(d.device_id) === deviceId);
          const hint = dev ? warrantyHint(dev) : null;
          return (
            <>
              <label>Thiết bị của khách hàng
                <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                  <option value="">— Chọn thiết bị —</option>
                  {list.map((d) => <option key={d.device_id} value={d.device_id}>{d.product_name} · {d.serial_no}</option>)}
                </select>
                <FieldError message={fe.device_id} />
              </label>
              {dev && (
                <p className="muted">
                  Ngày mua: <strong>{formatDate(dev.purchase_date)}</strong> · Bảo hành: <strong>{dev.warranty_months} tháng</strong> ·
                  Tình trạng: <strong className={`warranty-${hint.kind}`}>{hint.text}</strong>
                </p>
              )}
              {hint && hint.kind !== 'valid' && (
                <label>Mã Quản lý trung tâm phê duyệt (cần khi hết bảo hành hoặc thiếu ngày mua)
                  <input inputMode="numeric" value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} />
                  <FieldError message={localErr.approved_by ?? fe.approved_by} />
                </label>
              )}
            </>
          );
        }}
      </DataState>

      <h2>Tình trạng và phân loại</h2>
      <label>Mô tả lỗi (10–2000 ký tự)
        <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Ví dụ: Máy sạc không vào, cắm sạc nhưng không nhận phụ kiện." />
        <FieldError message={fe.issue_desc} />
      </label>

      <fieldset>
        <legend>Phụ kiện kèm theo</legend>
        {Object.keys(ACCESSORY_LABEL).map((a) => (
          <label key={a} className="check">
            <input type="checkbox" checked={accessories.includes(a)} onChange={() => toggleAcc(a)} /> {ACCESSORY_LABEL[a]}
          </label>
        ))}
        <FieldError message={fe.accessories} />
      </fieldset>

      <label>Nhóm sự cố
        <DataState loading={categories.loading} error={categories.error} data={categories.result} onRetry={categories.reload}
          empty={{ message: 'Chưa có danh mục nhóm sự cố.' }}>
          {(list) => (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— Chưa phân loại —</option>
              {list.map((c) => <option key={c.category_id} value={c.category_id}>{label(CATEGORY_LABEL, c.category_name)}</option>)}
            </select>
          )}
        </DataState>
        <FieldError message={fe.category_id} />
      </label>

      <fieldset>
        <legend>Mức ưu tiên</legend>
        <label className="check"><input type="radio" name="priority" checked={priority === ''} onChange={() => setPriority('')} />
          {' '}Tự động{chosenCat ? ` (theo nhóm sự cố: ${PRIORITY_LABEL[chosenCat.default_priority]})` : ' (Trung bình nếu chưa chọn nhóm)'}
        </label>
        {PRIORITIES.map((p) => (
          <label key={p} className="check">
            <input type="radio" name="priority" checked={priority === p} onChange={() => setPriority(p)} /> {PRIORITY_LABEL[p]}
          </label>
        ))}
        <FieldError message={fe.priority} />
      </fieldset>

      <p className="muted">Trung tâm bảo hành: số {centerId} (lấy từ phiên làm việc). Hạn cam kết do hệ thống tự tính khi lưu (QT02).</p>

      {err && !err.fields && (
        <div className="alert alert-error" role="alert">
          <p>{err.message}</p>
          {err.code === 'KHONG_KET_NOI' && <p>Dữ liệu đã nhập vẫn được giữ. Bấm Lưu phiếu bảo hành để thử lại; hệ thống không tạo phiếu trùng.</p>}
        </div>
      )}
      {err?.fields && <p className="alert alert-error" role="alert">{err.message}. Kiểm tra các ô báo lỗi phía trên.</p>}

      <div className="actions">
        <Link to="/tickets" className="button">Hủy</Link>
        <button type="submit" className="primary" disabled={busy || devices.loading}>
          {busy ? 'Đang lưu…' : 'Lưu phiếu bảo hành'}
        </button>
      </div>
    </form>
  );
}
