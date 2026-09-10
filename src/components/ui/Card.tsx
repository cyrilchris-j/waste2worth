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
  md:   'p-4',
  lg:   'p-6',
};

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const base = [
    'bg-white rounded-2xl shadow-sm border border-gray-100',
    paddingClasses[padding],
    onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '',
    className,
  ].join(' ');

  return onClick
    ? <div className={base} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>{children}</div>
    : <div className={base}>{children}</div>;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function Divider() {
  return <hr className="border-gray-100 my-4" />;
}
