import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRecyclerTransactions } from '../../services/transactionService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { TransactionStatusBadge, LoadingSpinner, EmptyState, ErrorMessage } from '../../components/ui';
import { ArrowLeftRight, FileText, ChevronRight } from 'lucide-react';
import type { Transaction, TransactionStatus } from '../../types';

const STATUS_FILTERS: Array<{ value: TransactionStatus | 'ALL'; label: string }> = [
  { value: 'ALL',             label: 'All' },
  { value: 'CREATED',        label: 'New' },
  { value: 'PAID',           label: 'Paid' },
  { value: 'RECEIVED',       label: 'Received' },
  { value: 'PROCESSING',     label: 'Processing' },
  { value: 'REPORT_PENDING', label: 'Report Due' },
  { value: 'COMPLETED',      label: 'Completed' },
];

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function MyTransactions() {
  const { recyclerProfile } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filter, setFilter]             = useState<TransactionStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!recyclerProfile) {
      setLoading(false);
      return;
    }
    getRecyclerTransactions(recyclerProfile.recyclerId)
      .then((txns) => setTransactions(txns.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))))
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [recyclerProfile]);

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter((t) => t.status === filter);

  return (
    <RecyclerLayout title="My Transactions">
      <div className="page-container">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border',
                filter === value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>

        {loading && <LoadingSpinner label="Loading transactions…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState icon={<ArrowLeftRight size={40} className="text-gray-400" />} title="No transactions" message="Accepted lots will appear here as transactions." />
        )}

        {!loading && !error && filtered.map((txn) => (
          <button
            key={txn.transactionId}
            onClick={() => navigate(`/recycler/transactions/${txn.transactionId}`)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-gray-400">{txn.transactionId}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">Lot: {txn.lotId}</p>
              </div>
              <TransactionStatusBadge status={txn.status} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-bold text-brand-700">{formatCurrency(txn.totalAmount ?? txn.agreedPrice ?? txn.amount ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Payment</p>
                <p className={`text-xs font-semibold ${txn.paymentStatus === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {txn.paymentStatus}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>

            {txn.status === 'REPORT_PENDING' && (
              <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                <FileText size={13} className="text-amber-600" />
                <span>Processing report required</span>
              </p>
            )}
          </button>
        ))}
      </div>
    </RecyclerLayout>
  );
}
