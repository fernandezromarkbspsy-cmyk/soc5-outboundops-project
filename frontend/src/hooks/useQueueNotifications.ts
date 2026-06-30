import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { primeAlertSound, startAlertSound, stopAlertSound } from '../lib/alertSound';
import { api } from '../lib/api';
import type { Page, Status, TruckRequest, User } from '../types';

export type QueueSnapshot = {
  status: Status | null;
  rows: TruckRequest[];
  alerts: TruckRequest[];
  count: number;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
  acknowledge: (id: string) => void;
};

export function useQueueNotifications(user: User): QueueSnapshot {
  const status: Status | null = user.role === 'fte_ops' ? 'PENDING' : user.role === 'fte_mm' ? 'APPROVED' : user.role === 'doc_officer' || user.role === 'dock_officer' ? 'FOR_DOCKING' : null;
  const soundSource = status ? `queue-${status}` : null;
  const knownIds = useRef<Set<string> | null>(null);
  const [alertingIds, setAlertingIds] = useState<Set<string>>(() => new Set());
  const query = useQuery({
    queryKey: ['requests', 'notification-queue', status],
    queryFn: () => api<Page<TruckRequest>>(`/requests?status=${status}&per_page=100&sort=created_at&direction=desc`),
    enabled: status !== null,
    refetchInterval: status ? 5_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!status) return;
    primeAlertSound();
  }, [status]);

  useEffect(() => {
    if (!query.data) return;
    const current = new Set(query.data.data.map(request => request.id));
    if (knownIds.current === null) {
      knownIds.current = current;
      return;
    }
    const newIds = query.data.data.filter(request => !knownIds.current?.has(request.id)).map(request => request.id);
    knownIds.current = new Set([...knownIds.current, ...current]);
    if (newIds.length) setAlertingIds(ids => new Set([...ids, ...newIds]));
  }, [query.data]);

  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const alerts = useMemo(() => rows.filter(request => alertingIds.has(request.id)), [alertingIds, rows]);

  useEffect(() => {
    if (!soundSource) return;
    const activeIds = new Set(rows.map(request => request.id));
    setAlertingIds(ids => {
      const next = [...ids].filter(id => activeIds.has(id));
      return next.length === ids.size ? ids : new Set(next);
    });
  }, [rows, soundSource]);

  useEffect(() => {
    if (!soundSource) return;
    if (alertingIds.size > 0) startAlertSound(soundSource);
    else stopAlertSound(soundSource);
    return () => stopAlertSound(soundSource);
  }, [alertingIds, soundSource]);

  return {
    status,
    rows,
    alerts,
    count: query.data?.total ?? 0,
    isPending: status !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    acknowledge: id => setAlertingIds(current => new Set([...current].filter(alertId => alertId !== id))),
  };
}
