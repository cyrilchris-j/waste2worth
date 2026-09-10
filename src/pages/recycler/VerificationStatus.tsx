import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import type { VerificationStatus as VS } from '../../types';

const STATUS_CONFIG: Record<VS, {
  icon: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  nextStep: string | null;
}> = {
  PENDING: {
    icon: '⏳',
    title: 'Registration Submitted',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Your registration has been received and is awaiting review by our platform team.',
    nextStep: 'You will be notified once your profile moves to review. This typically takes 1–2 business days.',
  },
  UNDER_REVIEW: {
    icon: '🔍',
    title: 'Under Review',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Our team is currently reviewing your authorization details and processing capabilities.',
    nextStep: 'No action needed. You will be notified of the outcome.',
  },
  VERIFIED: {
    icon: '✅',
    title: 'Verified Recycler',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Your facility has been verified on the Waste2Worth platform. You can now browse and accept e-waste lots.',
    nextStep: null,
  },
  REJECTED: {
    icon: '❌',
    title: 'Verification Rejected',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Your verification was not approved. Please review the notes below and contact support if needed.',
    nextStep: 'Contact support@waste2worth.in with your registration details to appeal or re-submit.',
  },
};

export default function VerificationStatus() {
  const { recyclerProfile, userProfile } = useAuth();
  const navigate = useNavigate();
  const status: VS = ((recyclerProfile?.verificationStatus as VS) ?? (userProfile?.verificationStatus as VS) ?? 'PENDING');
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['PENDING'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-brand-700 text-white px-4 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recycler/dashboard')} className="text-brand-200 text-xl" aria-label="Back">←</button>
          <div>
            <h1 className="text-xl font-bold">Verification Status</h1>
            <p className="text-brand-200 text-sm">Waste2Worth Recycler Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        {/* Status Card */}
        <div className={`rounded-2xl border p-6 ${config.bgColor} ${config.borderColor} text-center space-y-3`}>
          <div className="text-5xl">{config.icon}</div>
          <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
          <p className={`text-sm ${config.color} opacity-90`}>{config.description}</p>
        </div>

        {/* MVP Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-800">
            <strong>ℹ️ MVP Notice:</strong> Verification is performed manually by the platform team
            for this prototype. This is not integrated with any government regulatory API.
            Verified status is required to browse and accept e-waste lots.
          </p>
        </div>

        {/* Profile summary */}
        {recyclerProfile && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Profile</h3>
            {[
              { label: 'Company',    value: recyclerProfile.companyName },
              { label: 'Facility',   value: recyclerProfile.facilityName },
              { label: 'Auth Body',  value: recyclerProfile.authorizationBody },
              { label: 'Auth No.',   value: recyclerProfile.authorizationNumber },
              { label: 'Valid Until',value: recyclerProfile.authorizationValidUntil },
            ].map(({ label, value }) => (
              <div key={label} className="info-row">
                <span className="info-label">{label}</span>
                <span className="info-value">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Verification notes if rejected */}
        {status === 'REJECTED' && recyclerProfile?.verificationNotes && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-800 mb-1">Rejection Notes</p>
            <p className="text-sm text-red-700">{recyclerProfile.verificationNotes}</p>
          </div>
        )}

        {/* Next step */}
        {config.nextStep && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-1">Next Step</p>
            <p className="text-sm text-gray-600">{config.nextStep}</p>
          </div>
        )}

        {/* CTA */}
        {status === 'VERIFIED' && (
          <Button fullWidth onClick={() => navigate('/recycler/dashboard')}>
            Go to Dashboard →
          </Button>
        )}

        <Button variant="outline" fullWidth onClick={() => navigate('/recycler/profile')}>
          View My Profile
        </Button>
      </main>
    </div>
  );
}
