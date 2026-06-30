import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-normal',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
        danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
        info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
        neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
