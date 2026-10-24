import { PRIORITY_LABEL, STATUS_LABEL, label } from '../utils/labels';

export const StatusBadge = ({ status }) => (
  <span className={`badge status-${status}`}>{label(STATUS_LABEL, status)}</span>
);
export const PriorityBadge = ({ priority }) => (
  <span className={`badge prio-${priority}`}>{label(PRIORITY_LABEL, priority)}</span>
);
