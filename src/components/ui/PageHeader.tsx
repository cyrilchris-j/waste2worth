import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={12} className="text-gray-400" />}
          {item.path ? (
            <Link to={item.path} className="hover:text-brand-700 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  backTo?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  onBack,
  backTo,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-2">
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 mt-0.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          {backTo && (
            <Link
              to={backTo}
              className="p-1.5 mt-0.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
