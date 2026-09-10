import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoading } from './components/ui';

// ─── Auth ─────────────────────────────────────
const Login = lazy(() => import('./pages/auth/Login'));

// ─── Collector ────────────────────────────────
const CollectorPortal = lazy(() => import('./pages/collector/CollectorPortal'));

// ─── Recycler ────────────────────────────────
const RecyclerRegister     = lazy(() => import('./pages/recycler/RecyclerRegister'));
const VerificationStatus   = lazy(() => import('./pages/recycler/VerificationStatus'));
const RecyclerDashboard    = lazy(() => import('./pages/recycler/RecyclerDashboard'));
const RecyclerProfile      = lazy(() => import('./pages/recycler/RecyclerProfile'));
const AvailableLots        = lazy(() => import('./pages/recycler/AvailableLots'));
const LotDetail            = lazy(() => import('./pages/recycler/LotDetail'));
const AcceptLot            = lazy(() => import('./pages/recycler/AcceptLot'));
const MyTransactions       = lazy(() => import('./pages/recycler/MyTransactions'));
const TransactionDetail    = lazy(() => import('./pages/recycler/TransactionDetail'));
const ProcessingReportList = lazy(() => import('./pages/recycler/ProcessingReportList'));
const ProcessingReport     = lazy(() => import('./pages/recycler/ProcessingReport'));

// ─── Admin & Platform Intelligence ────────────
const AdminVerification    = lazy(() => import('./pages/admin/AdminVerification'));
const PlatformControlRoom  = lazy(() => import('./pages/platform/PlatformControlRoom'));

// ─── Public QR Trace ──────────────────────────
const TracePage = lazy(() => import('./pages/TracePage').then(m => ({ default: m.TracePage })));

// ─── 404 Not Found ────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50">
      <span className="text-5xl">🔍</span>
      <h1 className="text-2xl font-bold text-gray-800">Page Not Found</h1>
      <p className="text-gray-500">This page doesn't exist or you don't have access.</p>
      <div className="flex gap-3 mt-2">
        <a href="/login" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors">
          Go to Sign In
        </a>
        <a href="/trace/LOT-2026-001" className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
          View Demo Trace
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/"                  element={<Navigate to="/login" replace />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/recycler/register" element={<RecyclerRegister />} />
        <Route path="/trace/:lotId"      element={<TracePage />} />

        {/* Collector Routes */}
        <Route path="/collector" element={<Navigate to="/collector/dashboard" replace />} />
        <Route path="/collector/dashboard" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/add" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/lots" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/lots/:lotId" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/profile" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/safety" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />
        <Route path="/collector/*" element={
          <ProtectedRoute requiredRole="COLLECTOR"><CollectorPortal /></ProtectedRoute>
        } />

        {/* Recycler Routes */}
        <Route path="/recycler/verification-status" element={
          <ProtectedRoute requiredRole="RECYCLER"><VerificationStatus /></ProtectedRoute>
        } />
        <Route path="/recycler/dashboard" element={
          <ProtectedRoute requiredRole="RECYCLER"><RecyclerDashboard /></ProtectedRoute>
        } />
        <Route path="/recycler/profile" element={
          <ProtectedRoute requiredRole="RECYCLER"><RecyclerProfile /></ProtectedRoute>
        } />
        <Route path="/recycler/lots" element={
          <ProtectedRoute requiredRole="RECYCLER"><AvailableLots /></ProtectedRoute>
        } />
        <Route path="/recycler/lots/:lotId" element={
          <ProtectedRoute requiredRole="RECYCLER"><LotDetail /></ProtectedRoute>
        } />
        <Route path="/recycler/lots/:lotId/accept" element={
          <ProtectedRoute requiredRole="RECYCLER"><AcceptLot /></ProtectedRoute>
        } />
        <Route path="/recycler/transactions" element={
          <ProtectedRoute requiredRole="RECYCLER"><MyTransactions /></ProtectedRoute>
        } />
        <Route path="/recycler/transactions/:transactionId" element={
          <ProtectedRoute requiredRole="RECYCLER"><TransactionDetail /></ProtectedRoute>
        } />
        <Route path="/recycler/transactions/:id" element={
          <ProtectedRoute requiredRole="RECYCLER"><TransactionDetail /></ProtectedRoute>
        } />
        <Route path="/recycler/reports" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReportList /></ProtectedRoute>
        } />
        <Route path="/recycler/reports/new/:transactionId" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReport /></ProtectedRoute>
        } />
        <Route path="/recycler/reports/:reportId" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReport /></ProtectedRoute>
        } />
        <Route path="/recycler/*" element={<Navigate to="/recycler/dashboard" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/verification" replace />} />
        <Route path="/admin/verification" element={
          <ProtectedRoute requiredRole="ADMIN"><AdminVerification /></ProtectedRoute>
        } />
        <Route path="/admin/intelligence" element={
          <ProtectedRoute requiredRole="ADMIN"><PlatformControlRoom /></ProtectedRoute>
        } />
        <Route path="/admin/*" element={<Navigate to="/admin/verification" replace />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
