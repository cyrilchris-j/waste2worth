import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getLotById } from '../../services/lotService';
import { transactionExistsForLot, createTransaction } from '../../services/transactionService';
import { updateLotStatus } from '../../services/lotService';
import { updatePublicTrace } from '../../services/publicTraceService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Button, LoadingSpinner, ErrorMessage } from '../../components/ui';
import type { Lot } from '../../types';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const TERMS = [
  { id: 'reviewed_description',   label: 'I have reviewed the complete material description and declared condition.' },
  { id: 'reviewed_evidence',      label: 'I have reviewed the uploaded evidence and photos.' },
  { id: 'facility_authorized',    label: 'I confirm that my facility is authorized to receive and process this category of e-waste.' },
  { id: 'accept_transaction',     label: 'I accept the transaction terms, including the agreed asking price.' },
  { id: 'recycler_tnc',           label: 'I agree to the Recycler Terms & Conditions on the Waste2Worth platform.' },
  { id: 'submit_report',          label: 'I agree to submit a processing/recycling report through the platform after material is processed.' },
] as const;

type TermId = (typeof TERMS)[number]['id'];

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function AcceptLot() {
  const { lotId } = useParams<{ lotId: string }>();
  const { recyclerProfile } = useAuth();
  const navigate = useNavigate();

  const [lot, setLot]         = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [accepted, setAccepted] = useState<Record<TermId, boolean>>({
    reviewed_description: false,
    reviewed_evidence:    false,
    facility_authorized:  false,
    accept_transaction:   false,
    recycler_tnc:         false,
    submit_report:        false,
  });

  useEffect(() => {
    if (!lotId) return;
    Promise.all([
      getLotById(lotId),
      transactionExistsForLot(lotId),
    ]).then(([l, exists]) => {
      if (!l) { setError('Lot not found'); return; }
      if (exists) { setError('ALREADY_ACCEPTED'); return; }
      if (l.status !== 'LISTED') { setError(`This lot is no longer available (status: ${l.status})`); return; }
      setLot(l);
    }).catch(() => setError('Failed to load lot')).finally(() => setLoading(false));
  }, [lotId]);

  const allAccepted = Object.values(accepted).every(Boolean);

  const toggle = (id: TermId) =>
    setAccepted((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAccept = async () => {
    if (!lot || !recyclerProfile) return;
    if (!allAccepted) { toast.error('Please accept all terms before continuing.'); return; }

    setSubmitting(true);
    try {
      // Double-check duplicate
      const exists = await transactionExistsForLot(lot.lotId);
      if (exists) {
        toast.error('This lot has already been accepted by another recycler.');
        navigate('/recycler/transactions');
        return;
      }

      const transactionId = await createTransaction({
        lotId:        lot.lotId,
        collectorId:  lot.collectorId,
        recyclerId:   recyclerProfile.recyclerId,
        offerId:      null,
        agreedPrice:  lot.askingPrice,
        deliveryCost: 0,
        handoverAddress: `${lot.city}, ${lot.state}`,
      });

      // Update lot status LISTED → ACCEPTED
      await updateLotStatus(lot.lotId, 'ACCEPTED');

      // Update public trace projection (FIX 3)
      await updatePublicTrace(lot.lotId, {
        status: 'ACCEPTED',
        transactionReference: transactionId,
        timeline: [
          { status: 'LOT_CREATED', label: 'Material declared by Collector', timestamp: lot.createdAt },
          { status: 'LOT_LISTED', label: 'Listed on Waste2Worth Marketplace', timestamp: lot.createdAt },
          { status: 'LOT_ACCEPTED', label: 'Accepted by Authorized Recycler', timestamp: new Date().toISOString() },
        ],
        publicMilestones: ['Declaration verified', 'Accepted by Recycler', 'Trade contract active'],
      });

      toast.success('Lot accepted! Transaction created.');
      navigate(`/recycler/transactions/${transactionId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept lot');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <RecyclerLayout title="Accept Lot" backPath={`/recycler/lots/${lotId}`}><LoadingSpinner /></RecyclerLayout>;

  if (error === 'ALREADY_ACCEPTED') {
    return (
      <RecyclerLayout title="Accept Lot" backPath={`/recycler/lots/${lotId}`}>
        <div className="page-container">
          <div className="section-card text-center space-y-3">
            <CheckCircle2 size={44} className="text-emerald-600 mx-auto" />
            <p className="font-semibold text-gray-800">Already Accepted</p>
            <p className="text-sm text-gray-500">A transaction already exists for this lot.</p>
            <Button onClick={() => navigate('/recycler/transactions')}>View My Transactions</Button>
          </div>
        </div>
      </RecyclerLayout>
    );
  }

  if (error || !lot) {
    return (
      <RecyclerLayout title="Accept Lot" backPath={`/recycler/lots/${lotId}`}>
        <ErrorMessage message={error || 'Lot not found'} onRetry={() => window.location.reload()} />
      </RecyclerLayout>
    );
  }

  const platformFee = Math.round(lot.askingPrice * 0.02);
  const total = lot.askingPrice + platformFee;

  return (
    <RecyclerLayout title="Accept Lot" backPath={`/recycler/lots/${lotId}`}>
      <div className="page-container">
        {/* Lot summary */}
        <div className="section-card space-y-2">
          <p className="text-xs text-gray-400 font-mono">{lot.lotId}</p>
          <h2 className="text-lg font-bold text-gray-900">{lot.category}</h2>
          {lot.brand && <p className="text-sm text-gray-500">{lot.brand} {lot.model}</p>}
          <div className="flex gap-2 pt-1">
            <span className="chip">{lot.estimatedWeightKg ?? lot.estimatedWeight ?? 0} kg</span>
            <span className="chip">{lot.quantity ?? 1} unit{lot.quantity !== 1 ? 's' : ''}</span>
            <span className="chip">{lot.city}</span>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="section-card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Financial Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="info-row">
              <span className="info-label">Material Asking Price</span>
              <span className="info-value font-semibold">{formatCurrency(lot.askingPrice)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Platform Fee (2% simulated)</span>
              <span className="info-value text-gray-500">{formatCurrency(platformFee)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
              <span>Total Commitment</span>
              <span className="text-brand-700">{formatCurrency(total)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Payment is simulated in this MVP. Escrow terms apply upon payment.</p>
        </div>

        {/* Compliance declarations */}
        <div className="section-card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Recycler Declarations</h3>
          <p className="text-xs text-gray-500">You must agree to all conditions below before proceeding.</p>

          <div className="space-y-3 pt-1">
            {TERMS.map(({ id, label }) => (
              <label key={id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(accepted[id])}
                  onChange={() => toggle(id)}
                  className="mt-0.5 shrink-0 w-5 h-5 accent-brand-600"
                />
                <span className="text-sm text-gray-700 leading-snug">{label}</span>
              </label>
            ))}
          </div>

          {!allAccepted && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-1.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                All {TERMS.length} boxes must be checked before you can accept.
                {Object.values(accepted).filter(Boolean).length}/{TERMS.length} accepted.
              </span>
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="space-y-3 pb-6">
          <Button
            fullWidth
            size="lg"
            disabled={!allAccepted}
            loading={submitting}
            onClick={handleAccept}
          >
            {allAccepted ? 'Confirm & Create Transaction' : `Accept All Terms First (${Object.values(accepted).filter(Boolean).length}/${TERMS.length})`}
          </Button>
          <p className="text-center text-xs text-gray-400">
            By confirming, a transaction will be created with the lot ID {lot.lotId}.
            Your identity and timestamp are recorded.
          </p>
        </div>
      </div>
    </RecyclerLayout>
  );
}
