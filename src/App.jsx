import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard/:role" element={<DashboardPage />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/household" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
