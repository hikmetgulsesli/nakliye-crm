import { cn } from '@/utils/cn';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="flex gap-6 -mb-px" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={cn(
                'pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                isActive
                  ? 'text-primary border-primary'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
