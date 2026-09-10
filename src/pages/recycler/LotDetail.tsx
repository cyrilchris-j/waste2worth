import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getLotById } from '../../services/lotService';
import { transactionExistsForLot } from '../../services/transactionService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Button, LotStatusBadge, LoadingSpinner, ErrorMessage } from '../../components/ui';
import type { Lot } from '../../types';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function LotDetail() {
  const { lotId } = useParams<{ lotId: string }>();
  const { recyclerProfile } = useAuth();
  const navigate = useNavigate();

  const [lot, setLot]                   = useState<Lot | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [evidenceViewed, setEvidenceViewed]   = useState(false);
  const [selectedImage, setSelectedImage]     = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) return;
    Promise.all([
      getLotById(lotId),
      transactionExistsForLot(lotId),
    ])
      .then(([l, exists]) => {
        setLot(l);
        setAlreadyAccepted(exists);
      })
      .catch(() => setError('Failed to load lot details.'))
      .finally(() => setLoading(false));
  }, [lotId]);

  const isCompatible = recyclerProfile?.acceptedCategories.includes(lot?.category ?? '' as never);
  const canAccept = lot?.status === 'LISTED' && !alreadyAccepted && isCompatible;

  if (loading) return <RecyclerLayout title="Lot Detail" backPath="/recycler/lots"><LoadingSpinner /></RecyclerLayout>;
  if (error || !lot) return <RecyclerLayout title="Lot Detail" backPath="/recycler/lots"><ErrorMessage message={error || 'Lot not found'} /></RecyclerLayout>;

  return (
    <RecyclerLayout title={`Lot ${lot.lotId}`} backPath="/recycler/lots">
      <div className="page-container">
        {/* Status + ID */}
        <div className="section-card flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">{lot.lotId}</p>
            <h2 className="text-lg font-bold text-gray-900">{lot.category}</h2>
          </div>
          <LotStatusBadge status={lot.status} />
        </div>

        {/* Already accepted banner */}
        {alreadyAccepted && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-blue-800">✓ You have already accepted this lot</p>
            <button onClick={() => navigate('/recycler/transactions')} className="text-xs text-brand-700 underline mt-1">View in My Transactions →</button>
          </div>
        )}

        {/* Incompatible warning */}
        {!isCompatible && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <p className="text-sm text-orange-800">⚠ This category is not in your accepted materials list. Update your profile to accept it.</p>
          </div>
        )}

        {/* Item details */}
        <div className="section-card space-y-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Material Details</h3>
          {[
            { label: 'Category',        value: lot.category },
            { label: 'Brand',           value: lot.brand || '—' },
            { label: 'Model',           value: lot.model || '—' },
            { label: 'Condition',       value: lot.condition },
            { label: 'Quantity',        value: `${lot.quantity} unit${lot.quantity !== 1 ? 's' : ''}` },
            { label: 'Est. Weight',     value: `${lot.estimatedWeightKg} kg` },
            { label: 'Components',      value: lot.componentNotes || 'No notes' },
            { label: 'Location',        value: `${lot.city}, ${lot.state}` },
          ].map(({ label, value }) => (
            <div key={label} className="info-row">
              <span className="info-label">{label}</span>
              <span className="info-value">{value}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="section-card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Pricing</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Asking Price</p>
              <p className="text-2xl font-bold text-brand-700">{formatCurrency(lot.askingPrice)}</p>
            </div>
            {lot.priceStatus !== 'NO_REFERENCE' && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Platform Reference</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(lot.platformReferenceMin)} – {formatCurrency(lot.platformReferenceMax)}
                </p>
                <p className={`text-xs mt-0.5 ${lot.priceStatus === 'WITHIN_RANGE' ? 'text-green-600' : 'text-orange-600'}`}>
                  {lot.priceStatus === 'WITHIN_RANGE' ? '✓ Within range' : lot.priceStatus === 'ABOVE_RANGE' ? '⚠ Above range' : '⚠ Below range'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence / Photos */}
        <div className="section-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Evidence & Photos</h3>
            <span className="text-xs text-gray-500">{lot.evidence?.length ?? 0} file{(lot.evidence?.length ?? 0) !== 1 ? 's' : ''}</span>
          </div>

          {(!lot.evidence || lot.evidence.length === 0) ? (
            <p className="text-sm text-gray-400 italic">No evidence uploaded by collector.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {lot.evidence.map((ev) => (
                  <button
                    key={ev.evidenceId}
                    onClick={() => { setSelectedImage(ev.url); setEvidenceViewed(true); }}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-brand-400 transition-colors"
                  >
                    <img
                      src={ev.url}
                      alt={ev.type}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>

              {!evidenceViewed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-800">⚠ Please review the evidence photos before accepting this lot.</p>
                </div>
              )}
              {evidenceViewed && (
                <p className="text-xs text-green-600">✓ Evidence reviewed</p>
              )}
            </>
          )}
        </div>

        {/* Safety notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-red-800">⚠ Safety & Compliance</p>
          <p className="text-xs text-red-700">
            Ensure your facility is authorized to handle this category of e-waste.
            Batteries, CRTs, and PCBs require special handling. Comply with applicable pollution control board requirements.
          </p>
        </div>

        {/* Accept button */}
        {canAccept && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 -mx-4">
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate(`/recycler/lots/${lot.lotId}/accept`)}
            >
              Review Terms & Accept Lot
            </Button>
            <p className="text-center text-xs text-gray-400 mt-2">
              You must review and accept all terms before the transaction is created.
            </p>
          </div>
        )}

        {lot.status !== 'LISTED' && !alreadyAccepted && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-sm text-gray-600">This lot is no longer available ({lot.status}).</p>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Evidence" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}
    </RecyclerLayout>
  );
}
