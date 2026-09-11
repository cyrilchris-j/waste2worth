import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left text-sm text-gray-600 border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </thead>
  );
}

export function TableRow({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/75 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3.5 font-semibold text-gray-600 ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-gray-800 ${className}`}>{children}</td>;
}
