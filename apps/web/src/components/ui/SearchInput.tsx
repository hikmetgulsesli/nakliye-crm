import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon name="search" size="sm" />
        </div>
        <input
          ref={ref}
          type="text"
          placeholder="Ara..."
          className={cn(
            'w-full bg-slate-100 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border-none transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
