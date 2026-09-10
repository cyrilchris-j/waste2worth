import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactionById } from '../../services/transactionService';
import { getProcessingReportByTransaction, createProcessingReport, uploadProcessingEvidence, appendEvidenceToReport } from '../../services/processingReportService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Button, Input, Textarea, Select, LoadingSpinner, ErrorMessage } from '../../components/ui';
import { PROCESSING_CAPABILITIES, RECOVERED_MATERIALS } from '../../types';
import type { Transaction, ProcessingReport as PR, RecoveredMaterialEntry, Evidence } from '../../types';
import toast from 'react-hot-toast';

interface RecoveredRow {
  material: string;
  quantityKg: string;
}

export default function ProcessingReport() {
  const { transactionId, reportId } = useParams<{ transactionId?: string; reportId?: string }>();
  const { recyclerProfile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [txn, setTxn]       = useState<Transaction | null>(null);
  const [existingReport, setExistingReport] = useState<PR | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<Evidence[]>([]);

  // Form state
  const [form, setForm] = useState({
    receivedWeightKg:  '',
    processedWeightKg: '',
    residualWeightKg:  '',
    processingMethod:  '',
    processingDate:    new Date().toISOString().split('T')[0],
    notes:             '',
  });
  const [recoveredRows, setRecoveredRows] = useState<RecoveredRow[]>([{ material: '', quantityKg: '' }]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    const load = async () => {
      try {
        if (transactionId) {
          const t = await getTransactionById(transactionId);
          if (!t || t.recyclerId !== recyclerProfile?.recyclerId) { setError('Transaction not found or access denied'); return; }
          setTxn(t);
          const r = await getProcessingReportByTransaction(transactionId);
          if (r) setExistingReport(r);
        } else if (reportId) {
          // View existing report by reportId — find by querying
          toast('Viewing existing report');
        }
      } catch { setError('Failed to load data'); }
      finally { setLoading(false); }
    };
    load();
  }, [transactionId, reportId, recyclerProfile]);

  const addRecoveredRow = () =>
    setRecoveredRows((r) => [...r, { material: '', quantityKg: '' }]);

  const setRecoveredRow = (i: number, field: keyof RecoveredRow, value: string) =>
    setRecoveredRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const removeRecoveredRow = (i: number) =>
    setRecoveredRows((rows) => rows.filter((_, idx) => idx !== i));

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !txn || !firebaseUser) return;
    setUploadingEvidence(true);
    try {
      const newEvidence: Evidence[] = [];
      for (const file of Array.from(e.target.files)) {
        const ev = await uploadProcessingEvidence(
          file, txn.lotId, txn.transactionId, 'PENDING_REPORT_ID', firebaseUser.uid, 'PROCESSING'
        );
        newEvidence.push(ev);
      }
      setPendingEvidence((prev) => [...prev, ...newEvidence]);
      toast.success(`${newEvidence.length} file(s) uploaded`);
    } catch { toast.error('Evidence upload failed'); }
    finally { setUploadingEvidence(false); }
  };

  const validate = (): boolean => {
    if (!form.receivedWeightKg || Number(form.receivedWeightKg) <= 0)   { toast.error('Enter received weight'); return false; }
    if (!form.processedWeightKg || Number(form.processedWeightKg) <= 0) { toast.error('Enter processed weight'); return false; }
    if (!form.processingMethod)   { toast.error('Select processing method'); return false; }
    if (!form.processingDate)     { toast.error('Enter processing date'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !txn || !recyclerProfile) return;
    setSubmitting(true);

    const recoveredMaterials: RecoveredMaterialEntry[] = recoveredRows
      .filter((r) => r.material && Number(r.quantityKg) > 0)
      .map((r) => ({ material: r.material as RecoveredMaterialEntry['material'], quantityKg: Number(r.quantityKg) }));

    try {
      const reportId = await createProcessingReport({
        transactionId: txn.transactionId,
        lotId: txn.lotId,
        recyclerId: recyclerProfile.recyclerId,
        receivedWeightKg:  Number(form.receivedWeightKg),
        processedWeightKg: Number(form.processedWeightKg),
        residualWeightKg:  Number(form.residualWeightKg) || 0,
        processingMethod:  form.processingMethod as PR['processingMethod'],
        processingDate:    form.processingDate,
        recoveredMaterials,
        notes: form.notes,
      });

      if (pendingEvidence.length > 0) {
        await appendEvidenceToReport(reportId, pendingEvidence);
      }

      toast.success('Processing report submitted!');
      navigate(`/recycler/transactions/${txn.transactionId}`);
    } catch { toast.error('Failed to submit report'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <RecyclerLayout title="Processing Report" backPath="/recycler/reports"><LoadingSpinner /></RecyclerLayout>;
  if (error)   return <RecyclerLayout title="Processing Report" backPath="/recycler/reports"><ErrorMessage message={error} /></RecyclerLayout>;

  if (existingReport) {
    return (
      <RecyclerLayout title="Processing Report" backPath="/recycler/reports">
        <div className="page-container">
          <div className="section-card bg-green-50 border-green-200 space-y-3">
            <p className="text-xl font-bold text-green-800">✅ Report Submitted</p>
            <p className="text-xs font-mono text-gray-500">{existingReport.processingReportId}</p>
          </div>
          <div className="section-card space-y-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Report Summary</h3>
            {[
              { label: 'Lot ID',            value: existingReport.lotId },
              { label: 'Transaction ID',    value: existingReport.transactionId },
              { label: 'Received Weight',   value: `${existingReport.receivedWeightKg} kg` },
              { label: 'Processed Weight',  value: `${existingReport.processedWeightKg} kg` },
              { label: 'Residual Weight',   value: `${existingReport.residualWeightKg} kg` },
              { label: 'Processing Method', value: existingReport.processingMethod },
              { label: 'Processing Date',   value: existingReport.processingDate },
              { label: 'Status',            value: existingReport.status },
              { label: 'Notes',             value: existingReport.notes || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="info-row">
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
          {existingReport.recoveredMaterials?.length > 0 && (
            <div className="section-card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recovered Materials</h3>
              {existingReport.recoveredMaterials.map((rm, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{rm.material}</span>
                  <span className="info-value">{rm.quantityKg} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </RecyclerLayout>
    );
  }

  return (
    <RecyclerLayout title="Processing Report" backPath={txn ? `/recycler/transactions/${txn.transactionId}` : '/recycler/reports'}>
      <div className="page-container">
        {/* Header */}
        <div className="section-card">
          <p className="text-sm font-semibold text-gray-700">Submit Processing Report</p>
          {txn && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Transaction: <span className="font-mono">{txn.transactionId}</span></p>
              <p className="text-xs text-gray-500">Lot: <span className="font-mono">{txn.lotId}</span></p>
            </div>
          )}
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700">This report establishes the chain of custody for the processed e-waste. All fields should accurately reflect actual processing.</p>
          </div>
        </div>

        {/* Weights */}
        <div className="section-card space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Weight Record</h3>
          <Input label="Received weight (kg)" id="pr-received" type="number" min="0.1" step="0.1"
            value={form.receivedWeightKg} onChange={set('receivedWeightKg')} required placeholder="e.g. 11.2" />
          <Input label="Processed weight (kg)" id="pr-processed" type="number" min="0.1" step="0.1"
            value={form.processedWeightKg} onChange={set('processedWeightKg')} required placeholder="e.g. 11.0" />
          <Input label="Residual / reject weight (kg)" id="pr-residual" type="number" min="0" step="0.1"
            value={form.residualWeightKg} onChange={set('residualWeightKg')} placeholder="e.g. 0.2" />
        </div>

        {/* Processing method */}
        <div className="section-card space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Processing Details</h3>
          <Select
            label="Processing method"
            id="pr-method"
            value={form.processingMethod}
            onChange={set('processingMethod')}
            options={PROCESSING_CAPABILITIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select method…"
            required
          />
          <Input label="Processing date" id="pr-date" type="date"
            value={form.processingDate} onChange={set('processingDate')} required />
          <Textarea label="Notes" id="pr-notes"
            value={form.notes} onChange={set('notes')} placeholder="Any additional processing notes…" />
        </div>

        {/* Recovered materials */}
        <div className="section-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Recovered Materials</h3>
            <button onClick={addRecoveredRow} className="text-xs text-brand-700 font-semibold px-3 py-1 bg-brand-50 rounded-xl">+ Add</button>
          </div>

          {recoveredRows.map((row, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  id={`rm-material-${i}`}
                  label={i === 0 ? 'Material' : undefined}
                  value={row.material}
                  onChange={(e) => setRecoveredRow(i, 'material', e.target.value)}
                  options={RECOVERED_MATERIALS.map((m) => ({ value: m, label: m }))}
                  placeholder="Select…"
                />
              </div>
              <div className="w-24">
                <Input
                  id={`rm-qty-${i}`}
                  label={i === 0 ? 'kg' : undefined}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.quantityKg}
                  onChange={(e) => setRecoveredRow(i, 'quantityKg', e.target.value)}
                  placeholder="kg"
                />
              </div>
              {recoveredRows.length > 1 && (
                <button onClick={() => removeRecoveredRow(i)} className="text-red-400 pb-3 text-lg shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Evidence upload */}
        <div className="section-card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Processing Evidence</h3>
          <p className="text-xs text-gray-500">Upload photos of the processing facility, processed materials, or output evidence.</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleEvidenceUpload}
          />
          <Button
            variant="outline"
            fullWidth
            onClick={() => fileRef.current?.click()}
            loading={uploadingEvidence}
          >
            📷 Upload Evidence Photos
          </Button>

          {pendingEvidence.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pendingEvidence.map((ev) => (
                <div key={ev.evidenceId} className="aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={ev.url} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pb-6">
          <Button fullWidth size="lg" loading={submitting} onClick={handleSubmit}>
            Submit Processing Report
          </Button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Relationship: {txn?.lotId} → {txn?.transactionId} → Report
          </p>
        </div>
      </div>
    </RecyclerLayout>
  );
}
