import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProcessingReportsByRecycler } from '../../services/processingReportService';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { ReportStatusBadge, LoadingSpinner, EmptyState, ErrorMessage, Button } from '../../components/ui';
import { FileText } from 'lucide-react';
import type { ProcessingReport } from '../../types';

export default function ProcessingReportList() {
  const { recyclerProfile } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<ProcessingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!recyclerProfile) return;
    getProcessingReportsByRecycler(recyclerProfile.recyclerId)
      .then((r) => setReports(r.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))))
      .catch(() => setError('Failed to load processing reports'))
      .finally(() => setLoading(false));
  }, [recyclerProfile]);

  return (
    <RecyclerLayout title="Processing Reports">
      <div className="page-container">
        {loading && <LoadingSpinner label="Loading reports…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
        {!loading && !error && reports.length === 0 && (
          <EmptyState
            icon={<FileText size={40} className="text-gray-400" />}
            title="No processing reports yet"
            message="Reports are created after you confirm receipt of a lot and process it."
          />
        )}

        {!loading && !error && reports.map((report) => (
          <button
            key={report.processingReportId}
            onClick={() => navigate(`/recycler/transactions/${report.transactionId}`)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 active:scale-[0.98] transition-transform"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-gray-400">{report.processingReportId}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">Lot: {report.lotId}</p>
                <p className="text-xs text-gray-500">TXN: {report.transactionId}</p>
              </div>
              <ReportStatusBadge status={report.status || 'DRAFT'} />
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-base font-bold text-gray-900">{report.receivedWeightKg ?? report.receivedWeight ?? 0}</p>
                <p className="text-xs text-gray-500">Received kg</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-base font-bold text-gray-900">{report.processedWeightKg ?? report.processedWeight ?? 0}</p>
                <p className="text-xs text-gray-500">Processed kg</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-base font-bold text-gray-900">{report.recoveredMaterials?.length ?? 0}</p>
                <p className="text-xs text-gray-500">Materials</p>
              </div>
            </div>

            {/* Method + date */}
            <div className="flex items-center justify-between">
              <span className="chip">{report.processingMethod || report.processingType || 'Standard'}</span>
              <span className="text-xs text-gray-400">{report.processingDate}</span>
            </div>

            {/* Recovered materials */}
            {report.recoveredMaterials?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {report.recoveredMaterials.map((rm: any, i: number) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                    {rm.material || rm.name || 'Material'}: {rm.quantityKg ?? rm.weightKg ?? 0}kg
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-brand-700 font-medium text-right">View transaction →</p>
          </button>
        ))}

        {/* Go to transactions CTA */}
        {reports.length > 0 && (
          <Button variant="outline" fullWidth onClick={() => navigate('/recycler/transactions')}>
            View All Transactions
          </Button>
        )}
      </div>
    </RecyclerLayout>
  );
}
