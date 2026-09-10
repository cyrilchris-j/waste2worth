import type { VerificationStatus, LotStatus, TransactionStatus, ProcessingReportStatus } from '../../types';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange' | 'purple';

const variantClasses: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-800 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  red:    'bg-red-100 text-red-800 border border-red-200',
  blue:   'bg-blue-100 text-blue-800 border border-blue-200',
  gray:   'bg-gray-100 text-gray-700 border border-gray-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      variantClasses[variant],
    ].join(' ')}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// STATUS BADGES (typed helpers with safe fallbacks)
// ─────────────────────────────────────────────

export function VerificationBadge({ status }: { status: VerificationStatus | string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING:      { label: 'Pending Review',  variant: 'yellow' },
    UNDER_REVIEW: { label: 'Under Review',    variant: 'blue'   },
    VERIFIED:     { label: '✓ Verified',      variant: 'green'  },
    REJECTED:     { label: 'Rejected',        variant: 'red'    },
  };
  const item = map[status] || { label: String(status), variant: 'gray' };
  return <Badge label={item.label} variant={item.variant} size="md" />;
}

export function LotStatusBadge({ status }: { status: LotStatus | string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    DRAFT:            { label: 'Draft',            variant: 'gray'   },
    LISTED:           { label: 'Available',        variant: 'green'  },
    MATCHED:          { label: 'Matched',          variant: 'blue'   },
    ACCEPTED:         { label: 'Accepted',         variant: 'blue'   },
    PAYMENT_PENDING:  { label: 'Payment Pending',  variant: 'yellow' },
    PAID:             { label: 'Paid',             variant: 'green'  },
    HANDOVER_PENDING: { label: 'Handover Pending', variant: 'orange' },
    HANDED_OVER:      { label: 'Handed Over',      variant: 'orange' },
    RECEIVED:         { label: 'Received',         variant: 'blue'   },
    PROCESSING:       { label: 'Processing',       variant: 'purple' },
    REPORT_PENDING:   { label: 'Report Pending',   variant: 'yellow' },
    COMPLETED:        { label: '✓ Completed',      variant: 'green'  },
    CANCELLED:        { label: 'Cancelled',        variant: 'red'    },
    REJECTED:         { label: 'Rejected',         variant: 'red'    },
    DISPUTED:         { label: 'Disputed',         variant: 'red'    },
  };
  const item = map[status] || { label: String(status), variant: 'gray' };
  return <Badge label={item.label} variant={item.variant} />;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus | string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    CREATED:          { label: 'Created',          variant: 'blue'   },
    PAYMENT_PENDING:  { label: 'Payment Pending',  variant: 'yellow' },
    PAID:             { label: 'Paid',             variant: 'green'  },
    HANDOVER_PENDING: { label: 'Handover Pending', variant: 'orange' },
    HANDED_OVER:      { label: 'Handed Over',      variant: 'orange' },
    RECEIVED:         { label: 'Received',         variant: 'blue'   },
    PROCESSING:       { label: 'Processing',       variant: 'purple' },
    REPORT_PENDING:   { label: 'Report Pending',   variant: 'yellow' },
    COMPLETED:        { label: '✓ Completed',      variant: 'green'  },
    CANCELLED:        { label: 'Cancelled',        variant: 'red'    },
    DISPUTED:         { label: 'Disputed',         variant: 'red'    },
  };
  const item = map[status] || { label: String(status), variant: 'gray' };
  return <Badge label={item.label} variant={item.variant} />;
}

export function ReportStatusBadge({ status }: { status: ProcessingReportStatus | string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    DRAFT:          { label: 'Draft',          variant: 'gray'   },
    SUBMITTED:      { label: 'Submitted',      variant: 'blue'   },
    REPORT_PENDING: { label: 'Report Pending', variant: 'yellow' },
    PROCESSING:     { label: 'Processing',     variant: 'blue'   },
    VERIFIED:       { label: '✓ Verified',     variant: 'green'  },
    COMPLETED:      { label: '✓ Completed',    variant: 'green'  },
    REJECTED:       { label: 'Rejected',       variant: 'red'    },
  };
  const item = map[status] || { label: String(status), variant: 'gray' };
  return <Badge label={item.label} variant={item.variant} />;
}
