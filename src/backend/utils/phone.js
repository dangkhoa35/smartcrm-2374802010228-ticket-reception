// QT02: số điện thoại chuẩn hóa về 10 chữ số bắt đầu bằng 0.
function normalizePhone(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return /^0\d{9}$/.test(d) ? d : null;
}

// NFR2: che số điện thoại, ví dụ 0901234567 -> 090****567
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

module.exports = { normalizePhone, maskPhone };
