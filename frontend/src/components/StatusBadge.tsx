import type { Status } from '../types';
export function StatusBadge({status}:{status:Status}) {return <span className={`status status--${status.toLowerCase()}`}>{status.replaceAll('_',' ')}</span>}
