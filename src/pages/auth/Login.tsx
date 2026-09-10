import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, getUserProfile } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { Recycle, Package, Shield } from 'lucide-react';
import type { User, CollectorProfile, RecyclerProfile } from '../../types';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { role, userProfile, setDemoUser, logout } = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const cred = await loginUser(email.trim(), password);
      const user = await getUserProfile(cred.user.uid);
      toast.success('Welcome back!');
      if (user?.role === 'COLLECTOR') navigate('/collector/dashboard');
      else if (user?.role === 'ADMIN') navigate('/admin/verification');
      else navigate('/recycler/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password');
      } else {
        toast.error('Login failed. Please check credentials or use Demo Login below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: 'COLLECTOR' | 'RECYCLER' | 'ADMIN') => {
    if (demoRole === 'COLLECTOR') {
      const collectorUser: User = {
        userId: 'collector-ashok-demo',
        role: 'COLLECTOR',
        name: 'Ashok Kumar',
        displayName: 'Ashok Kumar',
        email: 'ashok@collector.local',
        phone: '+91 98765 43210',
        createdAt: new Date().toISOString(),
      };
      const colProfile: CollectorProfile = {
        collectorId: 'collector-ashok-demo',
        fullName: 'Ashok Kumar',
        displayName: 'Ashok Kumar',
        phone: '+91 98765 43210',
        email: 'ashok@collector.local',
        location: 'Ambattur Industrial Estate, Chennai',
        collectorType: 'Independent Scrap Aggregator',
        termsAccepted: true,
        participationTermsAccepted: true,
        status: 'VERIFIED',
        createdAt: new Date().toISOString(),
        totalLots: 4,
        completedLots: 2,
        earnings: 12500,
      };
      setDemoUser(collectorUser, colProfile);
      toast.success('Logged in as Ashok (Collector)');
      navigate('/collector/dashboard');
    } else if (demoRole === 'RECYCLER') {
      const recyclerUser: User = {
        userId: 'recycler-cyril-demo',
        role: 'RECYCLER',
        name: 'Cyril EcoMetal Corp',
        displayName: 'Cyril EcoMetal Corp',
        email: 'cyril@recycler.local',
        phone: '+91 91234 56789',
        verificationStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
      };
      const recProfile: RecyclerProfile = {
        recyclerId: 'recycler-cyril-demo',
        facilityName: 'EcoMetal Circular Solutions',
        contactPerson: 'Cyril Chris',
        email: 'cyril@recycler.local',
        phone: '+91 91234 56789',
        address: 'SIPCOT Industrial Park, Sriperumbudur',
        state: 'Tamil Nadu',
        pincode: '602105',
        cpcbRegistrationNo: 'TNPCB/E-WASTE/2024/0981',
        cpcbValidityDate: '2028-12-31',
        dailyCapacityKg: 5000,
        acceptedCategories: ['PCB', 'BATTERY', 'DISPLAY', 'CABLE', 'MIXED'],
        verificationStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDemoUser(recyclerUser, undefined, recProfile);
      toast.success('Logged in as Cyril (Verified Recycler)');
      navigate('/recycler/dashboard');
    } else if (demoRole === 'ADMIN') {
      const adminUser: User = {
        userId: 'admin-prasanna-demo',
        role: 'ADMIN',
        name: 'Prasanna (Platform Admin)',
        displayName: 'Prasanna',
        email: 'prasanna@platform.local',
        phone: '+91 99999 88888',
        createdAt: new Date().toISOString(),
      };
      setDemoUser(adminUser);
      toast.success('Logged in as Prasanna (Admin)');
      navigate('/admin/verification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-3 shadow-lg">
            <Recycle size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white">Waste2Worth</h1>
          <p className="text-brand-200 text-sm mt-1">E-Waste Recycling & Traceability Platform</p>
        </div>

        {/* Active Session Indicator */}
        {role && (
          <div className="mb-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg border border-white/20 text-left">
            <p className="text-xs text-gray-500 font-medium">Currently active</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {userProfile?.name || 'User'} <span className="text-xs text-brand-700 font-semibold">({role})</span>
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                fullWidth
                onClick={() => {
                  if (role === 'COLLECTOR') navigate('/collector/dashboard');
                  else if (role === 'RECYCLER') navigate('/recycler/dashboard');
                  else if (role === 'ADMIN') navigate('/admin/verification');
                }}
              >
                Go to Dashboard
              </Button>
              <Button size="sm" variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
              Quick Demo Persona Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('COLLECTOR')}
                className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                aria-label="Login as Collector demo persona"
              >
                <Package size={18} className="text-brand-600" />
                <span>Collector</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('RECYCLER')}
                className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                aria-label="Login as Recycler demo persona"
              >
                <Recycle size={18} className="text-brand-600" />
                <span>Recycler</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                aria-label="Login as Admin demo persona"
              >
                <Shield size={18} className="text-brand-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 text-center space-y-2">
            <p className="text-xs text-gray-600">
              New recycler?{' '}
              <Link to="/recycler/register" className="text-brand-700 font-semibold hover:underline">
                Register facility
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Public QR Trace:{' '}
              <Link to="/trace/LOT-2026-001" className="text-brand-700 hover:underline">
                View sample lot
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          Formal E-Waste Aggregation & Verification Platform
        </p>
      </div>
    </div>
  );
}
