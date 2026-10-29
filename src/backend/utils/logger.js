// Log JSON ghi ra STDOUT (xem bằng `docker compose logs api`). Mỗi dòng là một sự kiện.
// Mỗi dòng có: thoi_diem (ISO), muc, thong_diep + ngữ cảnh (requestId, id đối tượng...).
// Nguyên tắc: ghi ID thay vì ghi dữ liệu cá nhân; trường nhạy cảm bị che thành '***'.
const { randomUUID } = require('crypto');

const MUC = { debug: 10, info: 20, warn: 30, error: 40 };
const mucToiThieu = () => MUC[process.env.LOG_LEVEL] ?? MUC.info;

// Tên trường (không phân biệt hoa thường, khớp một phần) bị che khỏi log
const TRUONG_CHE = ['password', 'mat_khau', 'token', 'jwt', 'authorization', 'secret',
  'database_url', 'connection', 'cvv', 'so_the',
  'phone', 'so_dien_thoai', 'sodienthoai', 'email', 'dia_chi', 'address'];

function che(v, doSau = 0) {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Error) {
    return { loai: v.name, thong_diep: v.message, ma: v.code, stack: v.stack };
  }
  if (doSau > 5) return '[qua sâu]';
  const out = Array.isArray(v) ? [] : {};
  for (const [k, val] of Object.entries(v)) {
    out[k] = TRUONG_CHE.some((t) => k.toLowerCase().includes(t)) ? '***' : che(val, doSau + 1);
  }
  return out;
}

function ghi(muc, thongDiep, ngucanh = {}) {
  if (MUC[muc] < mucToiThieu()) return;
  const { err, ...conLai } = ngucanh;
  const dong = { thoi_diem: new Date().toISOString(), muc, thong_diep: thongDiep, ...che(conLai) };
  if (err) dong.loi = che(err);
  process.stdout.write(JSON.stringify(dong) + '\n');
}

const logger = {
  debug: (m, c) => ghi('debug', m, c),
  info: (m, c) => ghi('info', m, c),
  warn: (m, c) => ghi('warn', m, c),
  error: (m, c) => ghi('error', m, c),
};

// Gán requestId cho mỗi yêu cầu để lần theo một yêu cầu qua nhiều dòng log.
// requestId cũng là "mã tra cứu" hiện cho người dùng khi gặp lỗi 5xx.
function ganRequestId(req, res, next) {
  const tuClient = req.get('x-request-id');
  req.requestId = tuClient && /^[\w-]{1,64}$/.test(tuClient) ? tuClient : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  if (req.path === '/health') return next();   // healthcheck 10 giây/lần sẽ làm ngập log
  const t0 = Date.now();
  res.on('finish', () => logger.info('yêu cầu hoàn tất', {
    requestId: req.requestId,
    phuong_thuc: req.method,
    duong_dan: req.originalUrl.split('?')[0],                        // req.path KHÔNG có query string (query có thể chứa SĐT)
    ma_trang_thai: res.statusCode,
    thoi_gian_ms: Date.now() - t0,
    vai_tro: req.actor?.role,
    nhan_vien_id: req.actor?.employeeId,
  }));
  next();
}

module.exports = { logger, ganRequestId, che };
