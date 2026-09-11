import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  loginUser,
  getUserProfile,
  loginOrCreateDemoUser,
  registerCollector,
  registerRecycler,
} from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SUPPORTED_LANGUAGES, t, type Language } from '../../locales/translations';
import toast from 'react-hot-toast';
import { Recycle, Package, Shield, UserPlus, LogIn } from 'lucide-react';
import type { User, CollectorProfile, RecyclerProfile } from '../../types';

type AuthMode = 'login' | 'signup_collector' | 'signup_recycler';

export default function Login() {
  const [mode, setMode]         = useState<AuthMode>('login');
  const [loading, setLoading]   = useState(false);
  const { role, userProfile, setDemoUser, logout, refreshProfile } = useAuth();
  const navigate                = useNavigate();

  useEffect(() => {
    if (role === 'COLLECTOR') {
      navigate('/collector/dashboard', { replace: true });
    } else if (role === 'RECYCLER') {
      navigate('/recycler/dashboard', { replace: true });
    } else if (role === 'ADMIN') {
      navigate('/admin/verification', { replace: true });
    }
  }, [role, navigate]);

  // Login form state
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Collector registration state
  const [colName, setColName]         = useState('');
  const [colEmail, setColEmail]       = useState('');
  const [colPhone, setColPhone]       = useState('');
  const [colPassword, setColPassword] = useState('');
  const [colConfirm, setColConfirm]   = useState('');
  const [colCity, setColCity]         = useState('');
  const [colAddress, setColAddress]   = useState('');
  const [colLang, setColLang]         = useState<Language>('en');

  // Recycler registration state
  const [recOrgName, setRecOrgName]       = useState('');
  const [recContact, setRecContact]       = useState('');
  const [recEmail, setRecEmail]           = useState('');
  const [recPhone, setRecPhone]           = useState('');
  const [recPassword, setRecPassword]     = useState('');
  const [recConfirm, setRecConfirm]       = useState('');
  const [recCity, setRecCity]             = useState('');
  const [recCpcb, setRecCpcb]             = useState('');
  const [recCapacity, setRecCapacity]     = useState('5000');
  const [recCategories, setRecCategories] = useState<string[]>([
    'Laptop',
    'Mobile Phone',
    'PCB',
    'BATTERY',
  ]);
  const [recLang, setRecLang]             = useState<Language>('en');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const cred = await loginUser(loginEmail.trim(), loginPassword);
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

  const handleCollectorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim() || !colEmail.trim() || !colPassword) {
      toast.error('Please complete required fields');
      return;
    }
    if (colPassword !== colConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (colPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerCollector({
        name: colName.trim(),
        email: colEmail.trim(),
        phone: colPhone.trim(),
        password: colPassword,
        city: colCity.trim(),
        address: colAddress.trim(),
        preferredLanguage: colLang,
      });

      toast.success('Collector account created successfully!');
      navigate('/collector/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg.includes('email-already-in-use') ? 'Email is already registered' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecyclerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recOrgName.trim() || !recContact.trim() || !recEmail.trim() || !recPassword) {
      toast.error('Please complete required fields');
      return;
    }
    if (recPassword !== recConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (recPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerRecycler({
        orgName: recOrgName.trim(),
        contactPerson: recContact.trim(),
        email: recEmail.trim(),
        phone: recPhone.trim(),
        password: recPassword,
        city: recCity.trim(),
        cpcbRegistrationNo: recCpcb.trim(),
        dailyCapacityKg: Number(recCapacity) || 1000,
        acceptedCategories: recCategories,
        preferredLanguage: recLang,
      });

      toast.success('Registration submitted. Your recycler verification is pending admin approval.');
      navigate('/recycler/verification-status');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg.includes('email-already-in-use') ? 'Email is already registered' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (cat: string) => {
    setRecCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fallbackLocalDemo = (demoRole: 'COLLECTOR' | 'RECYCLER' | 'ADMIN') => {
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
      toast.success('Offline demo: Logged in as Ashok (Collector)');
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
        acceptedCategories: ['PCB', 'BATTERY', 'DISPLAY', 'CABLE', 'MIXED', 'Laptop', 'LAPTOP'],
        verificationStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDemoUser(recyclerUser, undefined, recProfile);
      toast.success('Offline demo: Logged in as Cyril (Recycler)');
      navigate('/recycler/dashboard');
    } else {
      const adminUser: User = {
        userId: 'admin-prasanna-demo',
        role: 'ADMIN',
        name: 'Prasanna (Platform Admin)',
        displayName: 'Prasanna (Platform Admin)',
        email: 'admin@platform.local',
        createdAt: new Date().toISOString(),
      };
      setDemoUser(adminUser);
      toast.success('Offline demo: Logged in as Prasanna (Admin)');
      navigate('/admin/verification');
    }
  };

  const handleDemoLogin = async (demoRole: 'COLLECTOR' | 'RECYCLER' | 'ADMIN') => {
    setLoading(true);
    try {
      const fbUser = await loginOrCreateDemoUser(demoRole);
      await refreshProfile();
      toast.success(`Connected to Firebase as ${fbUser.displayName || demoRole}`);
      if (demoRole === 'COLLECTOR') navigate('/collector/dashboard');
      else if (demoRole === 'RECYCLER') navigate('/recycler/dashboard');
      else navigate('/admin/verification');
    } catch (err) {
      console.warn('Firebase Auth demo login unavailable or offline, using fallback:', err);
      fallbackLocalDemo(demoRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 via-brand-900 to-slate-950 flex flex-col items-center justify-center p-4 relative">
      {/* Top Bar with Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-lg my-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-3 shadow-xl">
            <Recycle size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('appName')}</h1>
          <p className="text-brand-200 text-xs sm:text-sm mt-1">{t('platformSubtitle')}</p>
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
                {t('logout')}
              </Button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Top Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              id="tab-login"
              onClick={() => setMode('login')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                mode === 'login'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn size={14} />
              <span>{t('login')}</span>
            </button>
            <button
              type="button"
              id="tab-signup-collector"
              onClick={() => setMode('signup_collector')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                mode === 'signup_collector'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={14} />
              <span>Collector</span>
            </button>
            <button
              type="button"
              id="tab-signup-recycler"
              onClick={() => setMode('signup_recycler')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                mode === 'signup_recycler'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Recycle size={14} />
              <span>Recycler</span>
            </button>
          </div>

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('login')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Sign in to access your e-waste workspace</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  id="login-email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  id="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <Button type="submit" fullWidth loading={loading}>
                  {t('login')}
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
                    id="demo-collector-btn"
                    onClick={() => handleDemoLogin('COLLECTOR')}
                    className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                    aria-label="Login as Collector demo persona"
                  >
                    <Package size={18} className="text-brand-600" />
                    <span>Collector</span>
                  </button>
                  <button
                    type="button"
                    id="demo-recycler-btn"
                    onClick={() => handleDemoLogin('RECYCLER')}
                    className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                    aria-label="Login as Recycler demo persona"
                  >
                    <Recycle size={18} className="text-brand-600" />
                    <span>Recycler</span>
                  </button>
                  <button
                    type="button"
                    id="demo-admin-btn"
                    onClick={() => handleDemoLogin('ADMIN')}
                    className="py-3 px-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 rounded-xl border border-gray-200 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] min-h-[44px]"
                    aria-label="Login as Admin demo persona"
                  >
                    <Shield size={18} className="text-brand-600" />
                    <span>Admin</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 text-center italic mt-1">
                  Admin accounts are provisioned separately.
                </p>
              </div>

              {/* Registration Callout */}
              <div className="border-t border-gray-100 pt-3 text-center space-y-2">
                <p className="text-xs text-gray-600">
                  New user?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup_collector')}
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Sign up as Collector
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup_recycler')}
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Sign up as Recycler
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Public QR Trace:{' '}
                  <Link to="/trace/LOT-2026-001" className="text-brand-700 hover:underline">
                    View sample lot
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* MODE 2: COLLECTOR SIGN UP (PHASE 2) */}
          {mode === 'signup_collector' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign up as Collector</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aggregate and monetize e-waste with direct fair-market connections
                </p>
              </div>

              <form onSubmit={handleCollectorSignup} className="space-y-3.5">
                <Input
                  label="Full Name *"
                  id="col-name"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="e.g. Ashok Kumar"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email Address *"
                    type="email"
                    id="col-email"
                    value={colEmail}
                    onChange={(e) => setColEmail(e.target.value)}
                    placeholder="collector@example.com"
                    autoComplete="email"
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    id="col-phone"
                    value={colPhone}
                    onChange={(e) => setColPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Password *"
                    type="password"
                    id="col-password"
                    value={colPassword}
                    onChange={(e) => setColPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Confirm Password *"
                    type="password"
                    id="col-confirm"
                    value={colConfirm}
                    onChange={(e) => setColConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="City / Location *"
                    id="col-city"
                    value={colCity}
                    onChange={(e) => setColCity(e.target.value)}
                    placeholder="e.g. Ambattur, Chennai"
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Preferred Language
                    </label>
                    <select
                      value={colLang}
                      onChange={(e) => setColLang(e.target.value as Language)}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-500"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.label})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Address (Optional)"
                  id="col-address"
                  value={colAddress}
                  onChange={(e) => setColAddress(e.target.value)}
                  placeholder="Street / Warehouse address"
                />

                <Button type="submit" fullWidth loading={loading} className="mt-2">
                  <UserPlus size={16} className="mr-1.5" />
                  Create Collector Account
                </Button>
              </form>

              <div className="border-t border-gray-100 pt-3 text-center">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* MODE 3: RECYCLER SIGN UP (PHASE 3) */}
          {mode === 'signup_recycler' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign up as Recycler</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Register your authorized facility for verified e-waste sourcing
                </p>
              </div>

              <form onSubmit={handleRecyclerSignup} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Organization / Facility Name *"
                    id="rec-org"
                    value={recOrgName}
                    onChange={(e) => setRecOrgName(e.target.value)}
                    placeholder="e.g. EcoMetal Circular Solutions"
                    required
                  />
                  <Input
                    label="Contact Person *"
                    id="rec-contact"
                    value={recContact}
                    onChange={(e) => setRecContact(e.target.value)}
                    placeholder="e.g. Cyril Chris"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Official Email *"
                    type="email"
                    id="rec-email"
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                    placeholder="contact@facility.com"
                    autoComplete="email"
                    required
                  />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    id="rec-phone"
                    value={recPhone}
                    onChange={(e) => setRecPhone(e.target.value)}
                    placeholder="+91 91234 56789"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Password *"
                    type="password"
                    id="rec-password"
                    value={recPassword}
                    onChange={(e) => setRecPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Confirm Password *"
                    type="password"
                    id="rec-confirm"
                    value={recConfirm}
                    onChange={(e) => setRecConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="City / Location *"
                    id="rec-city"
                    value={recCity}
                    onChange={(e) => setRecCity(e.target.value)}
                    placeholder="e.g. Sriperumbudur, TN"
                    required
                  />
                  <Input
                    label="CPCB / SPCB Reg. Number"
                    id="rec-cpcb"
                    value={recCpcb}
                    onChange={(e) => setRecCpcb(e.target.value)}
                    placeholder="e.g. TNPCB/E-WASTE/2024/0981"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Monthly Capacity (kg)"
                    type="number"
                    id="rec-capacity"
                    value={recCapacity}
                    onChange={(e) => setRecCapacity(e.target.value)}
                    placeholder="5000"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Preferred Language
                    </label>
                    <select
                      value={recLang}
                      onChange={(e) => setRecLang(e.target.value as Language)}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-500"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.label})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Accepted Categories
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Laptop', 'Mobile Phone', 'Battery', 'PCB', 'Cables', 'Display'].map((cat) => {
                      const selected = recCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            selected
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <p className="font-semibold mb-0.5">Verification Note:</p>
                  New recyclers enter <strong>PENDING_VERIFICATION</strong> status until reviewed and verified by platform administration.
                </div>

                <Button type="submit" fullWidth loading={loading} className="mt-2">
                  <Recycle size={16} className="mr-1.5" />
                  Submit Recycler Application
                </Button>
              </form>

              <div className="border-t border-gray-100 pt-3 text-center">
                <p className="text-xs text-gray-600">
                  Looking for the multi-step facility onboarding?{' '}
                  <Link to="/recycler/register" className="text-brand-700 font-semibold hover:underline">
                    Detailed registration
                  </Link>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          Formal E-Waste Aggregation & Verification Platform
        </p>
      </div>
    </div>
  );
}
