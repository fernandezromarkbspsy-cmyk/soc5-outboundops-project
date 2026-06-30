import * as React from 'react';
import { cn } from '../../lib/utils';

export function DialogLayer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm', className)} {...props} />;
}

export function DialogPanel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl', className)} {...props} />;
}
