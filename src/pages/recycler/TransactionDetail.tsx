import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactionById, updateTransactionStatus, confirmReceipt, advanceTransactionStatus, logAuditEvent } from '../../services/transactionService';
import { getLotById, updateLotStatus } from '../../services/lotService';
import { getProcessingReportByTransaction } from '../../services/processingReportService';
import { updatePublicTraceProjection } from '../../services/publicTraceService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Button, TransactionStatusBadge, LoadingSpinner, ErrorMessage } from '../../components/ui';
import type { Transaction, Lot, ProcessingReport } from '../../types';
import toast from 'react-hot-toast';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  Truck,
  PackageCheck,
  Cpu,
  ClipboardList,
  Award,
  Check,
  type LucideIcon
} from 'lucide-react';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

const TIMELINE: Array<{ status: string; label: string; icon: LucideIcon }> = [
  { status: 'CREATED',          label: 'Transaction Created',  icon: FileText },
  { status: 'PAYMENT_PENDING',  label: 'Payment Pending',      icon: CreditCard },
  { status: 'PAID',             label: 'Payment Confirmed',    icon: CheckCircle2 },
  { status: 'HANDOVER_PENDING', label: 'Handover Scheduled',   icon: Truck },
  { status: 'RECEIVED',         label: 'Material Received',    icon: PackageCheck },
  { status: 'PROCESSING',       label: 'Processing',           icon: Cpu },
  { status: 'REPORT_PENDING',   label: 'Report Pending',       icon: ClipboardList },
  { status: 'COMPLETED',        label: 'Completed',            icon: Award },
];

const STATUS_ORDER = TIMELINE.map((t) => t.status);

export default function TransactionDetail() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { recyclerProfile, userProfile, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [txn, setTxn]       = useState<Transaction | null>(null);
  const [lot, setLot]       = useState<Lot | null>(null);
  const [report, setReport] = useState<ProcessingReport | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [receivedKg, setReceivedKg] = useState('');
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  useEffect(() => {
    if (!transactionId) return;
    getTransactionById(transactionId)
      .then(async (t) => {
        if (!t) { setError('Transaction not found'); return; }
        // Security: recycler can only see their own transactions (or admin)
        const isOwner = t.recyclerId === recyclerProfile?.recyclerId ||
                        t.recyclerId === userProfile?.userId ||
                        t.recyclerId === firebaseUser?.uid ||
                        userProfile?.role === 'ADMIN';
        if (!isOwner) { setError('Access denied'); return; }
        setTxn(t);
        const [l, r] = await Promise.all([
          getLotById(t.lotId),
          getProcessingReportByTransaction(t.transactionId),
        ]);
        setLot(l);
        setReport(r);
      })
      .catch(() => setError('Failed to load transaction'))
      .finally(() => setLoading(false));
  }, [transactionId, recyclerProfile]);

  const handleSimulatePayment = async () => {
    if (!txn || !recyclerProfile) return;
    try {
      await advanceTransactionStatus(txn.transactionId, 'PAID', {
        actorId: recyclerProfile.recyclerId,
        actorRole: 'RECYCLER',
      }, { amount: txn.totalAmount });
      await updateTransactionStatus(txn.transactionId, { paymentStatus: 'CONFIRMED' });
      await updateLotStatus(txn.lotId, 'PAID' as any);
      await updatePublicTraceProjection(txn.lotId, {
        status: 'PAID' as any,
        timeline: [
          {
            status: 'PAID',
            label: 'Payment Confirmed',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      toast.success('Payment simulated as confirmed');
      setTxn((t) => t ? { ...t, status: 'PAID', paymentStatus: 'CONFIRMED' } : t);
    } catch (err) {
      toast.error('Payment simulation failed');
    }
  };

  const handleConfirmReceipt = async () => {
    if (!txn || !receivedKg || !recyclerProfile) { toast.error('Enter received weight'); return; }
    const kg = Number(receivedKg);
    if (kg <= 0) { toast.error('Enter a valid weight'); return; }
    setConfirmingReceipt(true);
    try {
      await confirmReceipt(txn.transactionId, kg, {
        actorId: recyclerProfile.recyclerId,
        actorRole: 'RECYCLER',
      });
      await updateLotStatus(txn.lotId, 'RECEIVED' as any);
      await updatePublicTraceProjection(txn.lotId, {
        status: 'RECEIVED' as any,
        processingStatus: 'RECEIVED',
        recoverySummary: { inputWeightKg: kg },
        timeline: [
          {
            status: 'RECEIVED',
            label: 'Material Received',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      toast.success('Receipt confirmed');
      setTxn((t) => t ? { ...t, status: 'RECEIVED', handoverStatus: 'COMPLETED', receivedWeightKg: kg } : t);
    } catch { toast.error('Failed to confirm receipt'); }
    finally { setConfirmingReceipt(false); }
  };

  const handleStartProcessing = async () => {
    if (!txn || !recyclerProfile) return;
    try {
      await advanceTransactionStatus(txn.transactionId, 'PROCESSING', {
        actorId: recyclerProfile.recyclerId,
        actorRole: 'RECYCLER',
      });
      await updateLotStatus(txn.lotId, 'PROCESSING' as any);
      await updatePublicTraceProjection(txn.lotId, {
        status: 'PROCESSING' as any,
        processingStatus: 'PROCESSING',
        timeline: [
          {
            status: 'PROCESSING',
            label: 'Dismantling & Processing',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      toast.success('Processing started!');
      setTxn((t) => t ? { ...t, status: 'PROCESSING' } : t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start processing');
    }
  };

  if (loading) return <RecyclerLayout title="Transaction" backPath="/recycler/transactions"><LoadingSpinner /></RecyclerLayout>;
  if (error || !txn) return <RecyclerLayout title="Transaction" backPath="/recycler/transactions"><ErrorMessage message={error || 'Not found'} /></RecyclerLayout>;

  const currentStep = STATUS_ORDER.indexOf(txn.status);

  return (
    <RecyclerLayout title={`TXN ${txn.transactionId}`} backPath="/recycler/transactions">
      <div className="page-container">
        {/* Status */}
        <div className="section-card flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-gray-400">{txn.transactionId}</p>
            <p className="text-sm text-gray-500 mt-0.5">Lot: {txn.lotId}</p>
          </div>
          <TransactionStatusBadge status={txn.status} />
        </div>

        {/* Timeline */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Timeline</h3>
          <div className="space-y-3">
            {TIMELINE.map(({ status, label, icon: Icon }, idx) => {
              const done    = idx < currentStep;
              const current = idx === currentStep;
              const future  = idx > currentStep;
              return (
                <div key={status} className="flex items-start gap-3">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                    done    ? 'bg-brand-600 text-white'  : '',
                    current ? 'bg-brand-100 border-2 border-brand-600 text-brand-700' : '',
                    future  ? 'bg-gray-100 text-gray-400' : '',
                  ].join(' ')}>
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-medium ${future ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>
                    {current && <p className="text-xs text-brand-600">Current status</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Material */}
        {lot && (
          <div className="section-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Material</h3>
            {[
              { label: 'Category',     value: String(lot.category) },
              {
                label: 'Condition',
                value: typeof lot.condition === 'string'
                  ? lot.condition
                  : typeof lot.conditionAssessment === 'string'
                    ? lot.conditionAssessment
                    : (lot.conditionAssessment?.working || 'Fair')
              },
              { label: 'Quantity',     value: `${lot.quantity ?? 1} unit${lot.quantity !== 1 ? 's' : ''}` },
              { label: 'Est. Weight',  value: `${lot.estimatedWeightKg ?? lot.estimatedWeight ?? 0} kg` },
            ].map(({ label, value }) => (
              <div key={label} className="info-row">
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Financials */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h3>
          {[
            { label: 'E-Waste Value',     value: formatCurrency(txn.agreedPrice ?? txn.amount ?? 0) },
            { label: 'Delivery / Pickup', value: formatCurrency(txn.deliveryCost ?? 0) },
            { label: 'Platform Fee',      value: formatCurrency(txn.platformFee ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="info-row">
              <span className="info-label">{label}</span>
              <span className="info-value">{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-brand-700">
              {formatCurrency(txn.totalAmount ?? ((txn.agreedPrice ?? txn.amount ?? 0) + (txn.deliveryCost ?? 0) + (txn.platformFee ?? 0)))}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment</span>
            <span className={`info-value text-xs font-semibold ${txn.paymentStatus === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>{txn.paymentStatus}</span>
          </div>
        </div>

        {/* Handover */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Handover & Receipt</h3>
          <div className="info-row"><span className="info-label">Handover Status</span><span className="info-value">{txn.handoverStatus}</span></div>
          <div className="info-row"><span className="info-label">Address</span><span className="info-value">{txn.handoverAddress || '—'}</span></div>
          {txn.receivedWeightKg != null && (
            <div className="info-row"><span className="info-label">Received Weight</span><span className="info-value">{txn.receivedWeightKg} kg</span></div>
          )}
        </div>

        {/* Actions */}

        {/* Simulate payment (hackathon MVP) */}
        {(txn.status === 'CREATED' || txn.status === 'ACCEPTED' || txn.status === 'PAYMENT_PENDING') && txn.paymentStatus !== 'CONFIRMED' && (
          <div className="section-card bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <CreditCard size={16} />
              <span>Payment (Simulated)</span>
            </p>
            <p className="text-xs text-blue-600 mb-3">For the hackathon MVP, payment is simulated. In production, a secure payment gateway would be integrated.</p>
            <Button variant="secondary" fullWidth onClick={handleSimulatePayment}>
              Simulate Payment Confirmation
            </Button>
          </div>
        )}

        {/* Confirm receipt */}
        {txn.status === 'PAID' && (
          <div className="section-card space-y-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <PackageCheck size={16} />
              <span>Confirm Material Receipt</span>
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Actual weight (kg)"
                value={receivedKg}
                onChange={(e) => setReceivedKg(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button onClick={handleConfirmReceipt} loading={confirmingReceipt}>
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Initiate processing if RECEIVED */}
        {txn.status === 'RECEIVED' && (
          <div className="section-card space-y-2">
            <p className="text-sm font-semibold text-gray-800">Initiate Processing</p>
            <p className="text-xs text-gray-500">Begin physical dismantling and material recovery for this received lot.</p>
            <Button fullWidth variant="outline" onClick={handleStartProcessing}>
              <span className="flex items-center justify-center gap-2">
                <Cpu size={18} />
                <span>Start Processing</span>
              </span>
            </Button>
          </div>
        )}

        {/* Submit processing report */}
        {(txn.status === 'RECEIVED' || txn.status === 'PROCESSING') && !report && (
          <Button fullWidth size="lg" onClick={() => navigate(`/recycler/reports/new/${txn.transactionId}`)}>
            <span className="flex items-center justify-center gap-2">
              <FileText size={18} />
              <span>Submit Processing Report</span>
            </span>
          </Button>
        )}

        {report && (
          <div className="section-card bg-green-50 border-green-200">
            <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>Processing Report Submitted</span>
            </p>
            <p className="text-xs text-green-700 mt-1">Report ID: {report.processingReportId}</p>
            <p className="text-xs text-green-700">Status: {report.status}</p>
          </div>
        )}
      </div>
    </RecyclerLayout>
  );
}
