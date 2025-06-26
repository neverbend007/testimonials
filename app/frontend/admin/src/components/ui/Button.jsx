import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-white text-gray-900 shadow-sm border border-gray-300 hover:bg-gray-50 focus-visible:ring-primary-500',
        success: 'bg-success-600 text-white shadow hover:bg-success-700 focus-visible:ring-success-500',
        danger: 'bg-danger-600 text-white shadow hover:bg-danger-700 focus-visible:ring-danger-500',
        warning: 'bg-warning-500 text-white shadow hover:bg-warning-600 focus-visible:ring-warning-500',
        ghost: 'text-gray-900 hover:bg-gray-100 focus-visible:ring-primary-500',
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 px-6',
        xl: 'h-12 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };