// Lỗi theo trường (từ `fields` của API), hiện ngay cạnh ô nhập.
export const FieldError = ({ message }) =>
  message ? <span className="field-error" role="alert">{message}</span> : null;
