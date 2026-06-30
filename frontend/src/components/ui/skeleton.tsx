import * as React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('block animate-pulse rounded-md bg-slate-200', className)} {...props} />;
}
