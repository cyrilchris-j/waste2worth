import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Card, VerificationBadge, LoadingSpinner, EmptyState } from '../../components/ui';
import { getListedLots } from '../../services/lotService';
import { getRecyclerTransactions } from '../../services/transactionService';
import { getProcessingReportsByRecycler } from '../../services/processingReportService';
import type { Transaction } from '../../types';

interface DashboardStats {
  availableLots: number;
  activeTransactions: number;
  pendingReports: number;
  completedTransactions: number;
}

export default function RecyclerDashboard() {
  const { recyclerProfile, userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isVerified = recyclerProfile?.verificationStatus === 'VERIFIED';

  useEffect(() => {
    if (!recyclerProfile) return;
    const recyclerId = recyclerProfile.recyclerId;

    Promise.all([
      getListedLots(recyclerProfile.acceptedCategories),
      getRecyclerTransactions(recyclerId),
      getProcessingReportsByRecycler(recyclerId),
    ])
      .then(([lots, txns, reports]) => {
        const active = (txns as Transaction[]).filter(
          (t) => !['COMPLETED', 'CANCELLED'].includes(t.status)
        ).length;
        const completed = (txns as Transaction[]).filter((t) => t.status === 'COMPLETED').length;
        const pending = reports.filter((r) => r.status !== 'COMPLETED').length;
        setStats({ availableLots: lots.length, activeTransactions: active, pendingReports: pending, completedTransactions: completed });
      })
      .catch(() => setStats({ availableLots: 0, activeTransactions: 0, pendingReports: 0, completedTransactions: 0 }))
      .finally(() => setLoading(false));
  }, [recyclerProfile]);

  if (loading) {
    return (
      <RecyclerLayout title="Dashboard">
        <LoadingSpinner label="Loading dashboard…" />
      </RecyclerLayout>
    );
  }

  return (
    <RecyclerLayout title="Dashboard">
      <div className="page-container">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
          <p className="text-brand-100 text-xs mb-1">Welcome back</p>
          <h2 className="text-lg font-bold">{recyclerProfile?.companyName ?? userProfile?.name}</h2>
          <p className="text-brand-200 text-sm mt-0.5">{recyclerProfile?.facilityName}</p>
          <div className="mt-3">
            {recyclerProfile && <VerificationBadge status={recyclerProfile.verificationStatus} />}
          </div>
        </div>

        {/* Verification gate */}
        {!isVerified && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/recycler/verification-status')}
          >
            <p className="text-sm font-semibold text-amber-800">⚠️ Verification Pending</p>
            <p className="text-xs text-amber-700 mt-1">
              Your profile is awaiting verification. You will be able to browse and accept lots once verified.
            </p>
            <p className="text-xs text-brand-700 mt-2 font-medium">View status →</p>
          </div>
        )}

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm">
              <p className="text-2xl font-bold text-brand-700">{stats.availableLots}</p>
              <p className="text-xs text-gray-500 mt-0.5">Available Lots</p>
            </Card>
            <Card padding="sm">
              <p className="text-2xl font-bold text-blue-600">{stats.activeTransactions}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active Transactions</p>
            </Card>
            <Card padding="sm">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending Reports</p>
            </Card>
            <Card padding="sm">
              <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </Card>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-1">Quick Actions</h3>

          {[
            { icon: '📦', label: 'Browse Available Lots', sub: 'Find compatible e-waste to accept', path: '/recycler/lots', disabled: !isVerified },
            { icon: '🔄', label: 'My Transactions',       sub: 'Track active and past transactions', path: '/recycler/transactions', disabled: false },
            { icon: '📋', label: 'Processing Reports',    sub: 'Submit and view recycling reports',   path: '/recycler/reports',       disabled: false },
            { icon: '👤', label: 'My Profile',            sub: 'View and update facility details',    path: '/recycler/profile',        disabled: false },
            { icon: '🔍', label: 'Verification Status',   sub: 'Check authorization review status',   path: '/recycler/verification-status', disabled: false },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={[
                'w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left',
                'active:scale-[0.98] transition-transform',
                item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-brand-200',
              ].join(' ')}
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.sub}</p>
              </div>
              <span className="ml-auto text-gray-300 text-lg shrink-0">›</span>
            </button>
          ))}
        </div>

        {stats && stats.availableLots === 0 && isVerified && (
          <EmptyState icon="📭" title="No compatible lots right now" message="New lots will appear here when collectors list e-waste matching your accepted categories." />
        )}
      </div>
    </RecyclerLayout>
  );
}
