import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
        success: 'border-transparent bg-success-100 text-success-800 hover:bg-success-200',
        danger: 'border-transparent bg-danger-100 text-danger-800 hover:bg-danger-200',
        warning: 'border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200',
        outline: 'text-gray-700 border-gray-300 hover:bg-gray-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };