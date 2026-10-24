import { ticketsApi } from '../api/tickets.api';
import { useApi } from './useApi';

export function useTickets({ status, page, size }) {
  const { result, loading, error, reload } = useApi(
    () => ticketsApi.list({ status, page, size }), [status, page, size]);
  return { data: result?.data ?? null, paging: result?.paging ?? null, loading, error, reload };
}

export function useTicket(id) {
  const { result, loading, error, reload } = useApi(() => ticketsApi.detail(id), [id]);
  return { data: result, loading, error, reload };
}
