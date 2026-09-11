import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { createRecyclerProfile } from '../../services/recyclerService';
import { Button, Input, Textarea } from '../../components/ui';
import { E_WASTE_CATEGORIES, PROCESSING_CAPABILITIES } from '../../types';
import type { EWasteCategory, ProcessingCapability } from '../../types';
import toast from 'react-hot-toast';
import { User, Building2, FileCheck, Settings, ShieldCheck, ArrowLeft, type LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────
// STEP types
// ─────────────────────────────────────────────

type Step = 'account' | 'facility' | 'authorization' | 'capabilities' | 'terms';

interface FormData {
  // Account
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;

  // Facility
  companyName: string;
  facilityName: string;
  contactPerson: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  // Authorization (MVP simulation)
  registrationNumber: string;
  authorizationBody: string;
  authorizationNumber: string;
  authorizationValidUntil: string;
  authorizationDocumentRef: string;

  // Capabilities
  acceptedCategories: EWasteCategory[];
  processingCapabilities: ProcessingCapability[];
  processingCapacityKgPerMonth: string;

  // Terms
  recyclerTerms: boolean;
  platformTerms: boolean;
}

const STEPS: { id: Step; label: string; icon: LucideIcon }[] = [
  { id: 'account',       label: 'Account',       icon: User },
  { id: 'facility',      label: 'Facility',      icon: Building2 },
  { id: 'authorization', label: 'Authorization', icon: FileCheck },
  { id: 'capabilities',  label: 'Capabilities',  icon: Settings },
  { id: 'terms',         label: 'Terms',         icon: ShieldCheck },
];

export default function RecyclerRegister() {
  const navigate = useNavigate();
  const [step, setStep]     = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    companyName: '', facilityName: '', contactPerson: '', address: '', city: '', state: '', pincode: '',
    registrationNumber: '', authorizationBody: '', authorizationNumber: '',
    authorizationValidUntil: '', authorizationDocumentRef: '',
    acceptedCategories: [], processingCapabilities: [], processingCapacityKgPerMonth: '',
    recyclerTerms: false, platformTerms: false,
  });

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleCategory = (cat: EWasteCategory) =>
    setForm((f) => ({
      ...f,
      acceptedCategories: f.acceptedCategories.includes(cat)
        ? f.acceptedCategories.filter((c) => c !== cat)
        : [...f.acceptedCategories, cat],
    }));

  const toggleCapability = (cap: ProcessingCapability) =>
    setForm((f) => ({
      ...f,
      processingCapabilities: f.processingCapabilities.includes(cap)
        ? f.processingCapabilities.filter((c) => c !== cap)
        : [...f.processingCapabilities, cap],
    }));

  // ─── Validation per step ───────────────────

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (step === 'account') {
      if (!form.name.trim())           e.name = 'Name is required';
      if (!form.email.trim())          e.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
      if (form.password.length < 8)    e.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!/^\d{10}$/.test(form.phone))  e.phone = 'Enter a valid 10-digit phone number';
    }

    if (step === 'facility') {
      if (!form.companyName.trim())  e.companyName  = 'Company name is required';
      if (!form.facilityName.trim()) e.facilityName = 'Facility name is required';
      if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required';
      if (!form.address.trim())      e.address  = 'Address is required';
      if (!form.city.trim())         e.city     = 'City is required';
      if (!form.state.trim())        e.state    = 'State is required';
      if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    }

    if (step === 'authorization') {
      if (!form.registrationNumber.trim())  e.registrationNumber = 'Registration number is required';
      if (!form.authorizationBody.trim())   e.authorizationBody  = 'Authorization body is required';
      if (!form.authorizationNumber.trim()) e.authorizationNumber = 'Authorization number is required';
      if (!form.authorizationValidUntil)    e.authorizationValidUntil = 'Validity date is required';
    }

    if (step === 'capabilities') {
      if (form.acceptedCategories.length === 0)   e.acceptedCategories = 'Select at least one category';
      if (form.processingCapabilities.length === 0) e.processingCapabilities = 'Select at least one capability';
      const cap = Number(form.processingCapacityKgPerMonth);
      if (!form.processingCapacityKgPerMonth || cap <= 0) e.processingCapacityKgPerMonth = 'Enter a valid capacity (kg/month)';
    }

    if (step === 'terms') {
      if (!form.recyclerTerms)  e.recyclerTerms  = 'You must accept the Recycler Terms & Conditions';
      if (!form.platformTerms)  e.platformTerms   = 'You must accept the Platform Terms';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const user = await registerUser(form.email.trim(), form.password, form.name.trim(), 'RECYCLER');

      await createRecyclerProfile(user.uid, {
        companyName:         form.companyName.trim(),
        facilityName:        form.facilityName.trim(),
        contactPerson:       form.contactPerson.trim(),
        email:               form.email.trim(),
        phone:               form.phone.trim(),
        address:             form.address.trim(),
        city:                form.city.trim(),
        state:               form.state.trim(),
        pincode:             form.pincode.trim(),
        registrationNumber:  form.registrationNumber.trim(),
        authorizationBody:   form.authorizationBody.trim(),
        authorizationNumber: form.authorizationNumber.trim(),
        authorizationValidUntil: form.authorizationValidUntil,
        authorizationDocumentRef: form.authorizationDocumentRef.trim(),
        acceptedCategories:  form.acceptedCategories,
        processingCapabilities: form.processingCapabilities,
        processingCapacityKgPerMonth: Number(form.processingCapacityKgPerMonth),
        termsAccepted:        true,
        termsAcceptedAt:      null,
        platformTermsAccepted: true,
      });

      toast.success('Registration submitted! Your profile is under review.');
      navigate('/recycler/verification-status');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg.includes('email-already-in-use')
        ? 'An account with this email already exists'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const isLast  = stepIdx === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-brand-700 text-white px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/login" className="text-brand-200 hover:text-white transition-colors" aria-label="Back">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Recycler Registration</h1>
            <p className="text-brand-200 text-sm">Step {stepIdx + 1} of {STEPS.length}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={[
                'flex-1 h-1.5 rounded-full transition-colors',
                i <= stepIdx ? 'bg-white' : 'bg-brand-500',
              ].join(' ')}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        {/* ─── STEP: Account ─── */}
        {step === 'account' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <User size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Account Details</h2>
            </div>
            <Input label="Full name" id="reg-name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Your full name" required />
            <Input label="Email address" id="reg-email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@company.com" required />
            <Input label="Phone number" id="reg-phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="10-digit mobile number" required />
            <Input label="Password" id="reg-password" type="password" value={form.password} onChange={set('password')} error={errors.password} hint="Minimum 8 characters" required />
            <Input label="Confirm password" id="reg-confirm-password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} required />
          </div>
        )}

        {/* ─── STEP: Facility ─── */}
        {step === 'facility' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <Building2 size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Facility Details</h2>
            </div>
            <Input label="Company / Organization name" id="reg-company" value={form.companyName} onChange={set('companyName')} error={errors.companyName} required />
            <Input label="Facility name" id="reg-facility" value={form.facilityName} onChange={set('facilityName')} error={errors.facilityName} placeholder="E.g. Chennai Recycling Plant" required />
            <Input label="Contact person" id="reg-contact" value={form.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} required />
            <Textarea label="Facility address" id="reg-address" value={form.address} onChange={set('address')} error={errors.address} placeholder="Full street address" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" id="reg-city" value={form.city} onChange={set('city')} error={errors.city} required />
              <Input label="Pincode" id="reg-pincode" value={form.pincode} onChange={set('pincode')} error={errors.pincode} placeholder="6 digits" required />
            </div>
            <Input label="State" id="reg-state" value={form.state} onChange={set('state')} error={errors.state} required />
          </div>
        )}

        {/* ─── STEP: Authorization ─── */}
        {step === 'authorization' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <FileCheck size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Authorization Details</h2>
              <p className="text-xs text-gray-500 mt-1">
                Your authorization/registration information will be reviewed by our platform team.
                This is an MVP simulation — not integrated with a government API.
              </p>
            </div>
            <Input label="Business/GST registration number" id="reg-reg-num" value={form.registrationNumber} onChange={set('registrationNumber')} error={errors.registrationNumber} required />
            <Input label="Authorization body" id="reg-auth-body" value={form.authorizationBody} onChange={set('authorizationBody')} error={errors.authorizationBody} placeholder="e.g. State PCB, CPCB" required />
            <Input label="Authorization / CHWM number" id="reg-auth-num" value={form.authorizationNumber} onChange={set('authorizationNumber')} error={errors.authorizationNumber} required />
            <Input label="Authorization valid until" id="reg-auth-valid" type="date" value={form.authorizationValidUntil} onChange={set('authorizationValidUntil')} error={errors.authorizationValidUntil} required />
            <Input label="Authorization document reference (URL / file name)" id="reg-auth-doc" value={form.authorizationDocumentRef} onChange={set('authorizationDocumentRef')} placeholder="Optional — URL or reference" />
          </div>
        )}

        {/* ─── STEP: Capabilities ─── */}
        {step === 'capabilities' && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <Settings size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Processing Capabilities</h2>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Accepted E-Waste Categories <span className="text-red-500">*</span></p>
              {errors.acceptedCategories && <p className="text-xs text-red-600 mb-2">{errors.acceptedCategories}</p>}
              <div className="grid grid-cols-2 gap-2">
                {E_WASTE_CATEGORIES.map((cat) => (
                  <label key={cat} className={[
                    'flex items-center gap-2 p-2.5 rounded-xl border text-sm cursor-pointer',
                    form.acceptedCategories.includes(cat)
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-gray-200 text-gray-700',
                  ].join(' ')}>
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={form.acceptedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span className="leading-tight">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Processing Capabilities <span className="text-red-500">*</span></p>
              {errors.processingCapabilities && <p className="text-xs text-red-600 mb-2">{errors.processingCapabilities}</p>}
              <div className="space-y-2">
                {PROCESSING_CAPABILITIES.map((cap) => (
                  <label key={cap} className={[
                    'flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer',
                    form.processingCapabilities.includes(cap)
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-gray-200 text-gray-700',
                  ].join(' ')}>
                    <input
                      type="checkbox"
                      className="accent-brand-600 shrink-0"
                      checked={form.processingCapabilities.includes(cap)}
                      onChange={() => toggleCapability(cap)}
                    />
                    {cap}
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Processing capacity (kg / month)"
              id="reg-capacity"
              type="number"
              min="1"
              value={form.processingCapacityKgPerMonth}
              onChange={set('processingCapacityKgPerMonth')}
              error={errors.processingCapacityKgPerMonth}
              placeholder="e.g. 500"
              required
            />
          </div>
        )}

        {/* ─── STEP: Terms ─── */}
        {step === 'terms' && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Terms & Conditions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please read and accept all terms before registering.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Verification of your authorization details is performed by
                the platform team for this MVP. This is not integrated with any government or
                regulatory API. Do not submit false information.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  field: 'recyclerTerms' as const,
                  label: 'I accept the Recycler Terms & Conditions, including my obligation to process e-waste responsibly, maintain authorization, and submit accurate processing reports.',
                },
                {
                  field: 'platformTerms' as const,
                  label: 'I accept the Waste2Worth Platform Terms of Service and Privacy Policy.',
                },
              ].map(({ field, label }) => (
                <label
                  key={field}
                  className={[
                    'flex gap-3 p-4 rounded-xl border cursor-pointer',
                    form[field] ? 'border-brand-400 bg-brand-50' : 'border-gray-200 bg-white',
                    errors[field] ? 'border-red-400' : '',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="accent-brand-600 mt-0.5 shrink-0 w-5 h-5"
                    checked={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {(errors.recyclerTerms || errors.platformTerms) && (
              <p className="text-xs text-red-600">You must accept all terms to continue.</p>
            )}
          </div>
        )}
      </main>

      {/* Navigation buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
        {stepIdx > 0 && (
          <Button variant="outline" onClick={prevStep} className="flex-1">
            ← Back
          </Button>
        )}
        {!isLast ? (
          <Button onClick={nextStep} className="flex-1">
            Continue →
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Submit Registration
          </Button>
        )}
      </div>

      <div className="text-center py-4">
        <Link to="/login" className="text-sm text-gray-500 hover:underline">
          Already registered? Sign in
        </Link>
      </div>
    </div>
  );
}
