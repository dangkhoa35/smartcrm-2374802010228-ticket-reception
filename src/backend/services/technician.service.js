const technicianRepo = require('../repositories/technician.repository');

// EP10 – danh sách kỹ thuật viên của trung tâm người thao tác (để phân công phiếu)
async function listForCenter(actor) {
  const rows = await technicianRepo.listActiveByCenter(actor.centerId);
  return rows.map((r) => ({
    technician_id: r.technician_id,
    technician_code: r.technician_code,
    full_name: r.full_name,
    level: r.level,
  }));
}

module.exports = { listForCenter };
