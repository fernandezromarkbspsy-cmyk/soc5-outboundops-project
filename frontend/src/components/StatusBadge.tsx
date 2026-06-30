import type { Status } from '../types';
import { Badge, type BadgeProps } from './ui/badge';

const variants: Record<Status, BadgeProps['variant']> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED_BY_MM: 'danger',
  ASSIGNED: 'warning',
  FOR_DOCKING: 'warning',
  DOCKED: 'success',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={`status status--${status.toLowerCase()}`} variant={variants[status]}>{status.replaceAll('_', ' ')}</Badge>;
}
