import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoading } from './components/ui';

// ─── Auth ─────────────────────────────────────
const Login = lazy(() => import('./pages/auth/Login'));

// ─── Recycler ────────────────────────────────
const RecyclerRegister       = lazy(() => import('./pages/recycler/RecyclerRegister'));
const VerificationStatus     = lazy(() => import('./pages/recycler/VerificationStatus'));
const RecyclerDashboard      = lazy(() => import('./pages/recycler/RecyclerDashboard'));
const RecyclerProfile        = lazy(() => import('./pages/recycler/RecyclerProfile'));
const AvailableLots          = lazy(() => import('./pages/recycler/AvailableLots'));
const LotDetail              = lazy(() => import('./pages/recycler/LotDetail'));
const AcceptLot              = lazy(() => import('./pages/recycler/AcceptLot'));
const MyTransactions         = lazy(() => import('./pages/recycler/MyTransactions'));
const TransactionDetail      = lazy(() => import('./pages/recycler/TransactionDetail'));
const ProcessingReportList   = lazy(() => import('./pages/recycler/ProcessingReportList'));
const ProcessingReport       = lazy(() => import('./pages/recycler/ProcessingReport'));

// ─── Admin ───────────────────────────────────
const AdminVerification      = lazy(() => import('./pages/admin/AdminVerification'));

// ─── 404 ─────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl">🔍</span>
      <h1 className="text-2xl font-bold text-gray-800">Page Not Found</h1>
      <p className="text-gray-500">This page doesn't exist or you don't have access.</p>
      <a href="/login" className="mt-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm">
        Go to Login
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public */}
        <Route path="/login"             element={<Login />} />
        <Route path="/recycler/register" element={<RecyclerRegister />} />
        <Route path="/"                  element={<Navigate to="/login" replace />} />

        {/* Recycler — verification status accessible after login even if pending */}
        <Route path="/recycler/verification-status" element={
          <ProtectedRoute requiredRole="RECYCLER"><VerificationStatus /></ProtectedRoute>
        } />

        {/* Recycler — requires VERIFIED status enforced inside each page */}
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
        <Route path="/recycler/reports" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReportList /></ProtectedRoute>
        } />
        <Route path="/recycler/reports/new/:transactionId" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReport /></ProtectedRoute>
        } />
        <Route path="/recycler/reports/:reportId" element={
          <ProtectedRoute requiredRole="RECYCLER"><ProcessingReport /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/verification" element={
          <ProtectedRoute requiredRole="ADMIN"><AdminVerification /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
