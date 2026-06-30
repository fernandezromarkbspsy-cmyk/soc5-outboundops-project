import * as React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export function Alert({ className, variant = 'info', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }) {
  return <div className={cn('rounded-lg border px-4 py-3 text-sm font-medium', variants[variant], className)} {...props} />;
}
