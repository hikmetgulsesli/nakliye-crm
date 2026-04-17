import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-3">
        {breadcrumbs.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <Icon name="chevron_right" size="sm" className="text-slate-400 dark:text-slate-500" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-primary dark:hover:text-primary-300 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
