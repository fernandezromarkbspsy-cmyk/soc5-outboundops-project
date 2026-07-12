import { useEffect, useMemo, useState } from 'react';

type UseProgressiveRowsOptions = {
  chunkSize?: number;
  stepSize?: number;
};

export function useProgressiveRows<T>(rows: T[], options: UseProgressiveRowsOptions = {}) {
  const chunkSize = options.chunkSize ?? 30;
  const stepSize = options.stepSize ?? chunkSize;
  const [visibleCount, setVisibleCount] = useState(() => Math.min(chunkSize, rows.length));

  useEffect(() => {
    setVisibleCount(Math.min(chunkSize, rows.length));
  }, [chunkSize, rows]);

  useEffect(() => {
    if (visibleCount >= rows.length) return;
    let frame = 0;
    const stream = () => {
      setVisibleCount(current => {
        const next = Math.min(rows.length, current + stepSize);
        if (next < rows.length) frame = window.requestAnimationFrame(stream);
        return next;
      });
    };
    frame = window.requestAnimationFrame(stream);
    return () => window.cancelAnimationFrame(frame);
  }, [rows.length, stepSize, visibleCount]);

  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);
  return {
    rows: visibleRows,
    isStreaming: visibleCount < rows.length,
    remaining: Math.max(0, rows.length - visibleCount),
  };
}
