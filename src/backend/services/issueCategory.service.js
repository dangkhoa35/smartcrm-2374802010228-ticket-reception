const categoryRepo = require('../repositories/issueCategory.repository');

// Danh mục nhóm sự cố đang dùng, cho ô chọn trên giao diện.
async function list() {
  const rows = await categoryRepo.listActive();
  return rows.map((r) => ({
    category_id: r.category_id,
    category_name: r.category_name,
    default_priority: r.default_priority,
  }));
}

module.exports = { list };
