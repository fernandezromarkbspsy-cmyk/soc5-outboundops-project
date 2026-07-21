import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { playNotificationSound, unlockNotificationAudio } from '../lib/notifications';
import { smartRefetchInterval, swrQueryOptions } from '../lib/queryPatterns';
import { useUiStore } from '../stores/ui';
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
  const soundEnabled = useUiStore(state => state.soundEnabled);
  const status: Status | null = user.role === 'fte_ops' ? 'PENDING' : user.role === 'fte_mm' ? 'APPROVED' : user.role === 'doc_officer' || user.role === 'dock_officer' ? 'FOR_DOCKING' : null;
  const knownIds = useRef<Set<string> | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(() => new Set());
  const query = useQuery({
    queryKey: ['requests', 'notification-queue', status],
    queryFn: () => api<Page<TruckRequest>>(`/requests?status=${status}&per_page=100&sort=created_at&direction=desc`),
    ...swrQueryOptions,
    enabled: status !== null,
    refetchInterval: status ? smartRefetchInterval('realtime') : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!status) return;
    const unlock = () => unlockNotificationAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [status]);

  useEffect(() => {
    if (!query.data) return;
    const current = new Set(query.data.data.map(request => request.id));
    if (knownIds.current === null) {
      knownIds.current = current;
      return;
    }
    const newCount = query.data.data.filter(request => !knownIds.current?.has(request.id)).length;
    knownIds.current = new Set([...knownIds.current, ...current]);
    if (newCount) playNotificationSound(newCount, soundEnabled);
  }, [query.data, soundEnabled]);

  const rows = query.data?.data ?? [];
  const alerts = useMemo(() => rows.filter(request => !acknowledged.has(request.id)), [acknowledged, rows]);

  return {
    status,
    rows,
    alerts,
    count: query.data?.total ?? query.data?.data.length ?? 0,
    isPending: status !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    acknowledge: id => setAcknowledged(current => new Set([...current, id])),
  };
}
