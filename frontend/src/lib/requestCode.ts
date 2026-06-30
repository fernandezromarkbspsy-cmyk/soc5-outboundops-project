import type { TruckRequest } from '../types';

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

export function formatRequestCode(request: Pick<TruckRequest, 'request_code' | 'request_timestamp' | 'created_at'>, count = 1) {
  if (request.request_code) return request.request_code;

  const date = new Date(request.request_timestamp || request.created_at);
  const stamp = Number.isNaN(date.getTime())
    ? '000000'
    : `${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}${String(date.getFullYear()).slice(-2)}`;

  return `${stamp}-req#${count}soc5`;
}
