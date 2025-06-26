import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 border-gray-200',
        success: 'border-success-200 bg-success-50 text-success-900 [&>svg]:text-success-600',
        danger: 'border-danger-200 bg-danger-50 text-danger-900 [&>svg]:text-danger-600',
        warning: 'border-warning-200 bg-warning-50 text-warning-900 [&>svg]:text-warning-600',
        info: 'border-primary-200 bg-primary-50 text-primary-900 [&>svg]:text-primary-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };