const { pool } = require('../db/pool');

// Câu SELECT dùng chung: nối khách hàng, thiết bị, nhóm sự cố để hiển thị danh sách/chi tiết.
const SELECT_JOINED = `
  SELECT t.*, c.full_name AS customer_name, c.phone AS customer_phone,
         d.product_name, d.serial_no, ic.category_name,
         tech.full_name AS technician_name
  FROM ticket t
  JOIN customer c ON c.customer_id = t.customer_id
  JOIN device d   ON d.device_id   = t.device_id
  LEFT JOIN issue_category ic ON ic.category_id = t.category_id
  LEFT JOIN technician tech   ON tech.technician_id = t.technician_id`;

async function findByIdempotencyKey(key) {
  const { rows } = await pool.query('SELECT * FROM ticket WHERE idempotency_key = $1', [key]);
  return rows[0] || null;
}

async function findOpenByDevice(deviceId) {
  const { rows } = await pool.query(
    `SELECT * FROM ticket WHERE device_id = $1 AND status NOT IN ('DA_DONG', 'DA_HUY')`,
    [deviceId]
  );
  return rows[0] || null;
}

async function findById(ticketId, centerId) {
  const { rows } = await pool.query(
    `${SELECT_JOINED} WHERE t.ticket_id = $1 AND t.center_id = $2 AND t.is_active = TRUE`,
    [ticketId, centerId]
  );
  return rows[0] || null;
}

// Lọc + sắp xếp + phân trang ngay trong SQL, dựa vào idx_ticket_center_status_due (NFR1).
// `open` = true: loại phiếu đã đóng (DA_DONG, DA_HUY) để trả lời "hôm nay xử lý phiếu nào trước?" (A1).
async function list({ centerId, status, open, page, size }) {
  const where = ['t.center_id = $1', 't.is_active = TRUE'];
  const params = [centerId];
  if (status) {
    params.push(status);
    where.push(`t.status = $${params.length}`);
  }
  if (open) where.push(`t.status NOT IN ('DA_DONG', 'DA_HUY')`);
  const whereSql = where.join(' AND ');

  const total = (
    await pool.query(`SELECT count(*)::int AS n FROM ticket t WHERE ${whereSql}`, params)
  ).rows[0].n;

  params.push(size, (page - 1) * size);
  const { rows } = await pool.query(
    `${SELECT_JOINED}
     WHERE ${whereSql}
     ORDER BY t.due_date ASC, t.ticket_id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

// Ghi phiếu + dòng đầu của ticket_status_log trong MỘT giao dịch (NFR3).
async function createWithInitialLog(t, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const seq = await client.query(`SELECT nextval('ticket_code_seq') AS n`);
    const code = `BH-${String(seq.rows[0].n).padStart(6, '0')}/${t.receivedAt.getFullYear()}`;

    const { rows } = await client.query(
      `INSERT INTO ticket (ticket_code, customer_id, device_id, category_id, center_id,
                           issue_desc, priority, status, received_at, due_date,
                           is_warranty, approved_by,
                           acc_sac, acc_tai_nghe, acc_hop, acc_khac, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'MOI',$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [code, t.customerId, t.deviceId, t.categoryId, t.centerId,
       t.issueDesc, t.priority, t.receivedAt, t.dueDate,
       t.isWarranty, t.approvedBy,
       t.accessories.sac, t.accessories.tai_nghe, t.accessories.hop, t.accessories.khac,
       t.idempotencyKey]
    );
    const ticket = rows[0];

    await client.query(
      `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, 'MOI', $2, 'Tiếp nhận phiếu')`,
      [ticket.ticket_id, actorId]
    );
    await client.query('COMMIT');
    return ticket;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Đổi trạng thái + ghi lịch sử trong một giao dịch. Điều kiện "AND status = $3"
// bảo đảm không ghi đè nếu người khác vừa đổi trạng thái (trả null -> service báo 409).
// technicianId: chỉ truyền khi chuyển sang DA_PHAN_CONG (A4); null thì giữ nguyên kỹ thuật viên hiện có.
async function updateStatus({ ticketId, fromStatus, toStatus, closedAt, technicianId = null, actorId, note }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE ticket
          SET status = $2,
              closed_at = COALESCE($4::timestamptz, closed_at),
              technician_id = COALESCE($5::bigint, technician_id)
        WHERE ticket_id = $1 AND status = $3
        RETURNING *`,
      [ticketId, toStatus, fromStatus, closedAt, technicianId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query(
      `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, fromStatus, toStatus, actorId, note || null]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  findByIdempotencyKey, findOpenByDevice, findById, list,
  createWithInitialLog, updateStatus,
};
