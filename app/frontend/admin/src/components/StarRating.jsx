import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

const StarRating = ({ rating, maxRating = 5, size = 'default', className, showValue = false }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const containerClasses = {
    sm: 'gap-0.5',
    default: 'gap-1',
    lg: 'gap-1',
    xl: 'gap-1.5',
  };

  return (
    <div className={cn('flex items-center', containerClasses[size], className)}>
      <div className={cn('flex items-center', containerClasses[size])}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          
          return (
            <Star
              key={index}
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled
                  ? 'text-warning-400 fill-warning-400'
                  : 'text-gray-300 fill-gray-300'
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRating;