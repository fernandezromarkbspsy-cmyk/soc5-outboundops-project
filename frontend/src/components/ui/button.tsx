import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        default: 'bg-slate-950 text-white hover:bg-slate-800',
        primary: 'bg-blue-700 text-white hover:bg-blue-800',
        secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        success: 'bg-emerald-700 text-white hover:bg-emerald-800',
        warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950',
        icon: 'size-10 border border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-950',
      },
      size: {
        sm: 'min-h-8 rounded-md px-2.5 py-1.5 text-xs',
        md: 'min-h-10',
        lg: 'min-h-11 px-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
