import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { adminSetVerificationStatus } from '../../services/recyclerService';
import { VerificationBadge, LoadingSpinner, ErrorMessage, Button } from '../../components/ui';
import type { RecyclerProfile, VerificationStatus } from '../../types';
import toast from 'react-hot-toast';

const NEXT_STATUS: Partial<Record<VerificationStatus, VerificationStatus[]>> = {
  PENDING:      ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'REJECTED'],
  VERIFIED:     ['REJECTED'],
  REJECTED:     ['UNDER_REVIEW'],
};

export default function AdminVerification() {
  const { userProfile } = useAuth();
  const [profiles, setProfiles] = useState<RecyclerProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [notes, setNotes]       = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  // Load all recycler profiles — always called unconditionally
  useEffect(() => {
    // Access denied — skip loading
    if (userProfile?.role !== 'ADMIN') { setLoading(false); return; }

    getDocs(query(collection(db, 'recyclerProfiles'), orderBy('createdAt', 'desc')))
      .then((snap) => setProfiles(snap.docs.map((d) => ({ ...d.data() } as RecyclerProfile))))
      .catch(() => setError('Failed to load recycler profiles'))
      .finally(() => setLoading(false));
  }, [userProfile]);

  // Hard-check: only admin role — rendered AFTER hooks
  if (userProfile?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <p className="text-3xl">🚫</p>
          <p className="font-bold text-gray-800">Access Denied</p>
          <p className="text-sm text-gray-500">This page is restricted to platform administrators.</p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = async (profile: RecyclerProfile, newStatus: VerificationStatus) => {
    setUpdating(profile.recyclerId);
    try {
      await adminSetVerificationStatus(
        profile.recyclerId,
        newStatus,
        notes[profile.recyclerId] ?? '',
        userProfile!.userId
      );
      setProfiles((prev) =>
        prev.map((p) => p.recyclerId === profile.recyclerId ? { ...p, verificationStatus: newStatus } : p)
      );
      toast.success(`${profile.companyName} → ${newStatus}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      {/* Admin header */}
      <header className="bg-gray-900 text-white px-4 pt-8 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-xl font-bold">Admin — Recycler Verification</h1>
            <p className="text-gray-400 text-sm">Platform administration panel</p>
          </div>
        </div>
        <div className="mt-3 bg-amber-900/40 border border-amber-700 rounded-xl p-3">
          <p className="text-xs text-amber-300">
            <strong>MVP Notice:</strong> Verification is simulated manually here. This is not integrated
            with any government or regulatory API. Exercise due diligence before verifying recyclers.
          </p>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4">
        {loading && <LoadingSpinner label="Loading profiles…" />}
        {!loading && error && <ErrorMessage message={error} />}
        {!loading && !error && profiles.length === 0 && (
          <div className="text-center py-12 text-gray-400">No recycler profiles found</div>
        )}

        {profiles.map((profile) => (
          <div key={profile.recyclerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* Identity */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900">{profile.companyName}</h3>
                <p className="text-sm text-gray-500">{profile.facilityName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{profile.city}, {profile.state}</p>
              </div>
              <VerificationBadge status={profile.verificationStatus} />
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              {[
                { label: 'Auth Body',   value: profile.authorizationBody },
                { label: 'Auth No.',    value: profile.authorizationNumber },
                { label: 'Reg. No.',    value: profile.registrationNumber },
                { label: 'Valid Until', value: profile.authorizationValidUntil },
                { label: 'Email',       value: profile.email },
                { label: 'Phone',       value: profile.phone },
                { label: 'Capacity',    value: `${profile.processingCapacityKgPerMonth} kg/month` },
                { label: 'Categories',  value: profile.acceptedCategories?.join(', ') || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className="text-gray-800 text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Review Notes (shown to recycler on rejection)
              </label>
              <textarea
                rows={2}
                value={notes[profile.recyclerId] ?? profile.verificationNotes ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [profile.recyclerId]: e.target.value }))}
                placeholder="Enter verification notes…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {(NEXT_STATUS[profile.verificationStatus] ?? []).map((nextStatus) => (
                <Button
                  key={nextStatus}
                  size="sm"
                  variant={nextStatus === 'VERIFIED' ? 'primary' : nextStatus === 'REJECTED' ? 'danger' : 'secondary'}
                  loading={updating === profile.recyclerId}
                  onClick={() => handleUpdateStatus(profile, nextStatus)}
                >
                  → {nextStatus}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
