import * as React from 'react';
import { cn } from '@/lib/utils';

const Tabs = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { value?: string; onValueChange?: (value: string) => void }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement, {
            value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { value?: string; onValueChange?: (value: string) => void }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  React.ElementRef<'button'>,
  React.ComponentPropsWithoutRef<'button'> & { value?: string; onValueChange?: (value: string) => void }
>(({ className, value: triggerValue, onClick, ...props }, ref) => {
  const contextValue = (props as Record<string, unknown>)?.value;
  const contextOnChange = (props as Record<string, unknown>)?.onValueChange as ((value: string) => void) | undefined;
  const isActive = contextValue === triggerValue;
  
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-500 hover:text-slate-900',
        className
      )}
      onClick={(e) => {
        if (contextOnChange && triggerValue) {
          contextOnChange(triggerValue);
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { value?: string }
>(({ className, value: contentValue, ...props }, ref) => {
  const contextValue = (props as Record<string, unknown>)?.value;
  const isActive = contextValue === contentValue;
  
  if (!isActive) return null;
  
  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
