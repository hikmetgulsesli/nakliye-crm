import * as React from 'react';
import { cn } from '@/lib/utils';

// LabelProps extends HTML label attributes for type safety and documentation
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Additional custom props can be added here
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };
