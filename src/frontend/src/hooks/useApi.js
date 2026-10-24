import { useCallback, useEffect, useState } from 'react';

// Chạy một hàm bất đồng bộ và quản lý ba trạng thái: đang tải · có dữ liệu · có lỗi.
// `deps` đổi thì tải lại; `reload()` để nút "Thử lại".
export function useApi(fetcher, deps) {
  const [state, setState] = useState({ result: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let huy = false; // tránh cập nhật sau khi component đã tháo hoặc có yêu cầu mới hơn
    setState({ result: null, loading: true, error: null });
    fetcher()
      .then((result) => { if (!huy) setState({ result, loading: false, error: null }); })
      .catch((error) => { if (!huy) setState({ result: null, loading: false, error }); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
