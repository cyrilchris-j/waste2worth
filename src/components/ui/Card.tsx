import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4 sm:p-5',
  lg:   'p-6',
};

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const base = [
    'bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-200',
    paddingClasses[padding],
    onClick ? 'cursor-pointer hover:border-gray-200 hover:shadow active:scale-[0.99]' : '',
    className,
  ].join(' ');

  return onClick
    ? <div className={base} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>{children}</div>
    : <div className={base}>{children}</div>;
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className} padding="md">
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-2">
          <div>
            {title && <h3 className="font-bold text-gray-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  subtext,
  variant = 'default',
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
  variant?: 'default' | 'brand' | 'accent' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const badgeColors = {
    default: 'bg-gray-50 text-gray-700',
    brand:   'bg-brand-50 text-brand-700 border border-brand-100',
    accent:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    danger:  'bg-red-50 text-red-700 border border-red-100',
  };

  return (
    <Card
      onClick={onClick}
      className={`flex flex-col justify-between ${onClick ? 'hover:border-brand-300' : ''}`}
      padding="md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        {Icon && (
          <span className={`p-2 rounded-xl flex items-center justify-center ${badgeColors[variant]}`}>
            {Icon}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        {subtext && <p className="text-xs text-gray-500 mt-1 font-medium">{subtext}</p>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider() {
  return <hr className="border-gray-100 my-4" />;
}
