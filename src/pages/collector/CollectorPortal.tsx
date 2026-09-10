import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudOff,
  FileImage,
  Leaf,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Wifi,
  X,
} from 'lucide-react';
import { auth, firebaseConfigured } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import {
  loadRemoteLots,
  persistLot,
  syncPendingLots,
  uploadEvidence,
} from '../../services/lots';
import {
  emptyComponents,
  emptyCondition,
  categories,
  type AppUser,
  type Category,
  type EWasteCategory,
  type CollectorProfile,
  type ConditionAssessment,
  type Lot,
  type LotComponents,
  type LotDraft,
  type SyncStatus,
} from '../../types';
import {
  Card,
  MetricCard,
  Button,
  LotStatusBadge,
  Badge,
  Alert,
} from '../../components/ui';
import {
  readLots,
  readProfile,
  updateLotSync,
} from '../../services/offline';
import { useAuth } from '../../contexts/AuthContext';

type Screen = 'dashboard' | 'add' | 'lots' | 'profile' | 'safety' | 'detail';
const draftKey = 'waste2worth:collector:draft';
const initialDraft: LotDraft = {
  category: '',
  conditionAssessment: emptyCondition,
  components: emptyComponents,
  quantity: '',
  estimatedWeight: '',
  unit: 'kg',
  askingPrice: '',
  evidence: [],
  location: '',
  notes: '',
};

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function now() {
  return new Date().toISOString();
}
function readDraft(): LotDraft {
  try {
    return JSON.parse(localStorage.getItem(draftKey) || JSON.stringify(initialDraft)) as LotDraft;
  } catch {
    return initialDraft;
  }
}
function saveDraft(draft: LotDraft) {
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

export default function CollectorPortal() {
  const { firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Determine initial screen based on path
  const getScreenFromPath = (): Screen => {
    const path = location.pathname;
    if (path.includes('/collector/add')) return 'add';
    if (path.includes('/collector/lots') && params.lotId) return 'detail';
    if (path.includes('/collector/lots')) return 'lots';
    if (path.includes('/collector/profile')) return 'profile';
    if (path.includes('/collector/safety')) return 'safety';
    return 'dashboard';
  };

  const [screen, setScreen] = useState<Screen>(getScreenFromPath);
  const [lots, setLots] = useState<Lot[]>(readLots);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  // Sync state with path changes
  useEffect(() => {
    setScreen(getScreenFromPath());
  }, [location.pathname, params.lotId]);

  // Load collector profile from storage or AuthContext
  const profile: CollectorProfile | null = readProfile<CollectorProfile>() || {
    collectorId: firebaseUser?.uid || 'collector-local',
    fullName: userProfile?.fullName || userProfile?.displayName || 'Collector',
    phone: userProfile?.phone || '',
    email: firebaseUser?.email || '',
    location: '',
    collectorType: 'Independent collector',
    termsAccepted: true,
    participationTermsAccepted: true,
    status: 'VERIFIED',
    createdAt: now(),
    earnings: 0,
  };

  const userId = firebaseUser?.uid || profile?.collectorId || 'collector-local';

  useEffect(() => {
    const onlineHandler = () => {
      setOnline(true);
      void sync();
    };
    const offlineHandler = () => setOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) reg.unregister();
      });
    }

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  async function sync() {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await syncPendingLots();
      setLots(readLots());
      if (userId && firebaseConfigured) {
        const remote = await loadRemoteLots(userId);
        if (remote.length) {
          const merged = [...readLots(), ...remote].filter(
            (lot, index, all) => all.findIndex((item) => item.lotId === lot.lotId) === index
          );
          setLots(merged);
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  function enter(appScreen: Screen, targetLot?: Lot) {
    setScreen(appScreen);
    if (targetLot) setSelectedLot(targetLot);

    // Synchronize browser URL
    if (appScreen === 'dashboard') navigate('/collector/dashboard');
    else if (appScreen === 'add') navigate('/collector/add');
    else if (appScreen === 'lots') navigate('/collector/lots');
    else if (appScreen === 'profile') navigate('/collector/profile');
    else if (appScreen === 'safety') navigate('/collector/safety');
    else if (appScreen === 'detail' && targetLot) navigate(`/collector/lots/${targetLot.lotId}`);
  }

  async function logout() {
    if (auth) await signOut(auth).catch(() => undefined);
    localStorage.removeItem('waste2worth:user');
    navigate('/login');
  }

  const pending = lots.filter(
    (lot) =>
      lot.syncStatus === 'PENDING_SYNC' ||
      lot.syncStatus === 'SYNCING' ||
      lot.syncStatus === 'SYNC_ERROR'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar
        online={online}
        pending={pending}
        syncing={syncing}
        onSync={sync}
        onLogout={logout}
        onNavigate={(s) => enter(s)}
      />
      <main className="mx-auto max-w-6xl w-full px-4 pb-12 pt-6 sm:px-6 flex-1">
        {screen === 'dashboard' && (
          <Dashboard lots={lots} profile={profile} pending={pending} onNavigate={(s) => enter(s)} />
        )}
        {screen === 'add' && (
          <AddLot
            collectorId={userId}
            online={online}
            onBack={() => enter('dashboard')}
            onSaved={(lot) => {
              setLots(readLots());
              setSelectedLot(lot);
              enter('detail', lot);
            }}
          />
        )}
        {screen === 'lots' && (
          <Lots
            lots={lots}
            onBack={() => enter('dashboard')}
            onOpen={(lot) => {
              setSelectedLot(lot);
              enter('detail', lot);
            }}
          />
        )}
        {screen === 'detail' && selectedLot && (
          <LotDetail lot={selectedLot} onBack={() => enter('lots')} />
        )}
        {screen === 'profile' && (
          <Profile profile={profile} lots={lots} onBack={() => enter('dashboard')} />
        )}
        {screen === 'safety' && <Safety onBack={() => enter('dashboard')} />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTOR SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({
  online,
  pending,
  syncing,
  onSync,
  onLogout,
  onNavigate,
}: {
  online: boolean;
  pending: number;
  syncing: boolean;
  onSync: () => void;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2.5 text-left group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <Leaf size={20} />
          </span>
          <span>
            <strong className="block text-xl leading-none font-bold text-gray-900">
              waste<span className="text-brand-600">2</span>worth
            </strong>
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Collector Portal</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          {online ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-200">
              <Wifi size={14} /> ONLINE
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              <CloudOff size={14} /> OFFLINE
            </span>
          )}
          {pending > 0 && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'SYNCING' : `${pending} PENDING`}
            </button>
          )}
          <button
            title="Collector profile"
            onClick={() => onNavigate('profile')}
            className="rounded-xl p-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            aria-label="Collector profile"
          >
            <UserRound size={20} />
          </button>
          <button
            title="Sign out"
            onClick={onLogout}
            className="rounded-xl p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  lots,
  profile,
  pending,
  onNavigate,
}: {
  lots: Lot[];
  profile: CollectorProfile | null;
  pending: number;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <>
      <div className="bg-gradient-to-r from-brand-600 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wider text-brand-100 font-bold">
          Good morning, {profile?.fullName?.split(' ')[0] || 'Collector'}
        </p>
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl text-white">
              Make every kilo count.
            </h1>
            <p className="mt-2 max-w-lg text-sm sm:text-base text-brand-100">
              Declare, document and track your materials from collection to responsible recycling.
            </p>
          </div>
          <button
            onClick={() => onNavigate('add')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-brand-800 shadow-sm hover:bg-brand-50 active:scale-[0.99] transition-all shrink-0 min-h-[44px]"
          >
            <Plus size={19} /> Add e-waste
          </button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total lots" value={lots.length} icon={<Package size={16} />} variant="brand" />
        <MetricCard label="Draft lots" value={lots.filter((l) => l.status === 'DRAFT').length} variant="default" />
        <MetricCard label="Listed lots" value={lots.filter((l) => l.status === 'LISTED').length} variant="accent" />
        <MetricCard label="Accepted" value={lots.filter((l) => l.status === 'ACCEPTED').length} variant="brand" />
        <MetricCard label="Completed" value={lots.filter((l) => l.status === 'COMPLETED').length} variant="accent" />
        <MetricCard label="Pending sync" value={pending} variant={pending > 0 ? 'warning' : 'default'} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Card padding="lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Your workspace</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Keep the chain visible.</h2>
            </div>
            <Package className="text-brand-600" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Action icon={Plus} title="Add e-waste" text="Create a material lot" onClick={() => onNavigate('add')} />
            <Action icon={Package} title="My lots" text="Review declarations" onClick={() => onNavigate('lots')} />
            <Action icon={ShieldCheck} title="Safety" text="Handle materials well" onClick={() => onNavigate('safety')} />
          </div>
        </Card>

        <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-slate-800 p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-300 font-bold">Earnings summary</p>
            <strong className="mt-4 block text-3xl sm:text-4xl font-bold text-white">
              ₹{(profile?.earnings || 0).toLocaleString('en-IN')}
            </strong>
            <p className="mt-2 text-xs text-gray-300">Settlements from completed lots</p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="mt-6 flex items-center gap-2 text-xs font-bold text-brand-300 hover:text-brand-200 transition-colors"
          >
            View profile <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}

function Action({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof Plus;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gray-200 p-4 text-left hover:border-brand-500 hover:bg-brand-50/40 transition-all group"
    >
      <Icon size={20} className="text-brand-600 group-hover:scale-110 transition-transform" />
      <strong className="mt-3 block text-sm font-bold text-gray-900">{title}</strong>
      <span className="mt-1 block text-xs text-gray-500">{text}</span>
    </button>
  );
}

function AddLot({
  collectorId,
  online,
  onBack,
  onSaved,
}: {
  collectorId: string;
  online: boolean;
  onBack: () => void;
  onSaved: (lot: Lot) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<LotDraft>(readDraft);
  const [lotId] = useState(makeId);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<LotDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    saveDraft(next);
  }

  function validate() {
    if (step === 0 && !draft.category) return 'Choose a category to continue.';
    if (step === 1 && draft.conditionAssessment.working === 'UNKNOWN') return 'Complete the working condition assessment.';
    if (step === 2 && !draft.components.present.trim()) return 'Declare at least one component present.';
    if (step === 3 && (!(Number(draft.quantity) > 0) || !(Number(draft.estimatedWeight) > 0) || !draft.location.trim()))
      return 'Add a location and use quantity and weight greater than zero.';
    if (step === 4 && draft.evidence.length === 0) return 'Add at least one original item photo.';
    if (step === 5 && !(Number(draft.askingPrice) >= 0)) return 'Enter an asking price of zero or more.';
    return '';
  }

  async function saveLot(status: Lot['status']) {
    setSaving(true);
    try {
      const timestamp = now();
      const lot: Lot = {
        lotId,
        clientOperationId: lotId,
        collectorId,
        category: (draft.category || 'Other') as Category,
        conditionAssessment: draft.conditionAssessment,
        components: draft.components,
        quantity: Number(draft.quantity) || 0,
        estimatedWeight: Number(draft.estimatedWeight) || 0,
        unit: draft.unit,
        askingPrice: Number(draft.askingPrice) || 0,
        evidence: draft.evidence,
        location: draft.location,
        status,
        createdAt: timestamp,
        updatedAt: timestamp,
        syncStatus: online ? 'SYNCED' : 'PENDING_SYNC',
        notes: draft.notes,
      };
      await persistLot(lot);
      localStorage.removeItem(draftKey);
      onSaved(lot);
    } catch {
      updateLotSync(lotId, 'SYNC_ERROR');
      setError('The lot was saved locally but could not sync. Your data is preserved.');
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    const issue = validate();
    if (issue) {
      setError(issue);
      return;
    }
    setError('');
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    await saveLot('LISTED');
  }

  async function addFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('That image is larger than 8 MB. Choose a smaller original.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const evidence = await uploadEvidence(collectorId, lotId, file);
      update({ evidence: [...draft.evidence, evidence] });
    } catch {
      setError('Evidence upload failed. Try again when connected.');
    } finally {
      setSaving(false);
    }
  }

  const titles = [
    'Choose material',
    'Assess condition',
    'Declare components',
    'Measure the lot',
    'Add original evidence',
    'Set asking price',
  ];
  const progress = `${step + 1} / ${titles.length}`;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
        <ChevronLeft size={18} /> Back to dashboard
      </button>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">New material lot</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{titles[step]}</h1>
        </div>
        <span className="text-sm font-bold text-gray-500">{progress}</span>
      </div>
      <div className="mb-7 flex gap-1.5">
        {titles.map((_, index) => (
          <span key={index} className={`h-1.5 flex-1 rounded-full transition-all ${index <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <Card padding="lg" className="border-gray-100">
        {step === 0 && <CategoryStep value={draft.category} onChange={(category) => update({ category })} />}
        {step === 1 && (
          <ConditionStep value={draft.conditionAssessment} onChange={(conditionAssessment) => update({ conditionAssessment })} />
        )}
        {step === 2 && (
          <ComponentsStep value={draft.components} onChange={(components) => update({ components })} />
        )}
        {step === 3 && <MeasureStep draft={draft} onChange={update} />}
        {step === 4 && (
          <EvidenceStep
            evidence={draft.evidence}
            saving={saving}
            onAdd={addFile}
            onRemove={(id) => update({ evidence: draft.evidence.filter((item) => item.id !== id) })}
          />
        )}
        {step === 5 && <PriceStep draft={draft} onChange={update} />}

        {error && (
          <div className="mt-6">
            <Alert variant="danger" title={error} />
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
          {step > 0 ? (
            <button
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-all min-h-[44px]"
              onClick={() => {
                setError('');
                setStep(step - 1);
              }}
            >
              <ChevronLeft size={17} /> Previous
            </button>
          ) : (
            <span />
          )}
          {!online && (
            <span className="flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <CloudOff size={14} /> Saved locally while offline
            </span>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {step > 0 && (
              <button
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-all min-h-[44px]"
                onClick={() => saveLot('DRAFT')}
              >
                Save draft
              </button>
            )}
            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 active:bg-brand-800 active:scale-[0.99] transition-all min-h-[44px] shadow-sm disabled:opacity-50"
              onClick={next}
            >
              {saving ? 'Saving...' : step === 5 ? 'List this lot' : 'Continue'}
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CategoryStep({ value, onChange }: { value: Category | EWasteCategory | ''; onChange: (value: Category) => void }) {
  return (
    <div>
      <p className="mb-5 text-sm text-gray-600">Choose the closest material category. You can add detail in the next steps.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              value === category
                ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-sm ring-1 ring-brand-500'
                : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
            }`}
          >
            <Package size={22} className={value === category ? 'text-brand-600' : 'text-gray-400'} />
            <strong className="mt-4 block text-sm font-bold text-gray-900">{category}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConditionStep({
  value,
  onChange,
}: {
  value: ConditionAssessment;
  onChange: (value: ConditionAssessment) => void;
}) {
  const set = (patch: Partial<ConditionAssessment>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">Structured condition data helps downstream partners assess material accurately.</p>
      <div>
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Working condition *</span>
        <div className="grid grid-cols-3 gap-2">
          {(['WORKING', 'NOT_WORKING', 'UNKNOWN'] as const).map((item) => (
            <button
              key={item}
              onClick={() => set({ working: item })}
              className={`rounded-xl border p-3 text-xs font-bold transition-all min-h-[44px] ${
                value.working === item
                  ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ['physicalDamage', 'Physical damage'],
          ['waterDamage', 'Water damage'],
          ['brokenDisplay', 'Broken display'],
        ] as const).map(([key, label]) => (
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors" key={key}>
            <input
              type="checkbox"
              checked={Boolean(value[key])}
              onChange={(event) => set({ [key]: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
            />
            <span className="font-medium text-gray-800">{label}</span>
          </label>
        ))}
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Battery condition</span>
        <select
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          value={value.batteryCondition || 'UNKNOWN'}
          onChange={(event) => set({ batteryCondition: event.target.value })}
        >
          <option value="UNKNOWN">Unknown</option>
          <option value="GOOD">Good</option>
          <option value="DEGRADED">Degraded</option>
          <option value="SWOLLEN">Swollen</option>
          <option value="NOT_APPLICABLE">Not applicable</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Missing components</span>
        <textarea
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          rows={2}
          value={value.missingComponents || ''}
          onChange={(event) => set({ missingComponents: event.target.value })}
          placeholder="Charger, casing, battery..."
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Other defects</span>
        <textarea
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          rows={2}
          value={value.otherDefects || ''}
          onChange={(event) => set({ otherDefects: event.target.value })}
        />
      </label>
    </div>
  );
}

function ComponentsStep({
  value,
  onChange,
}: {
  value: LotComponents;
  onChange: (value: LotComponents) => void;
}) {
  const set = (key: keyof LotComponents, val: string) => onChange({ ...value, [key]: val });
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">List what is physically present. Separate items with commas where useful.</p>
      {([
        ['present', 'Components present *', 'Motherboard, casing, copper wire...'],
        ['missing', 'Components missing', 'Power adapter, screws...'],
        ['reusable', 'Reusable components', 'RAM, display, motor...'],
        ['hazardous', 'Hazardous components', 'Lithium battery, mercury switch...'],
      ] as const).map(([key, label, placeholder]) => (
        <label className="block" key={key}>
          <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">{label}</span>
          <textarea
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            rows={2}
            value={value[key] || ''}
            onChange={(event) => set(key, event.target.value)}
            placeholder={placeholder}
          />
        </label>
      ))}
    </div>
  );
}

function MeasureStep({ draft, onChange }: { draft: LotDraft; onChange: (patch: Partial<LotDraft>) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">Use an estimate if a scale is not available. You can update a draft later.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Quantity *</span>
          <input
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            type="number"
            min="1"
            step="1"
            value={draft.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Weight (kg) *</span>
          <input
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            type="number"
            min="0.01"
            step="0.01"
            value={draft.estimatedWeight}
            onChange={(event) => onChange({ estimatedWeight: event.target.value })}
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Unit</span>
          <select
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            value={draft.unit}
            onChange={(event) => onChange({ unit: event.target.value as 'kg' | 'units' })}
          >
            <option value="kg">Kilograms</option>
            <option value="units">Units</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Collection location *</span>
        <input
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          required
          value={draft.location}
          onChange={(event) => onChange({ location: event.target.value })}
          placeholder="City, area or pickup point"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Notes</span>
        <textarea
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          rows={3}
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </label>
    </div>
  );
}

function EvidenceStep({
  evidence,
  onAdd,
  onRemove,
  saving,
}: {
  evidence: LotDraft['evidence'];
  onAdd: (file?: File) => void;
  onRemove: (id: string) => void;
  saving: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600">
        Capture the actual item. Original evidence is stored as a Storage reference, not inside the lot document.
      </p>
      <label className="mt-6 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-5 text-center hover:border-brand-500 hover:bg-brand-50/70 transition-colors">
        <input
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => onAdd(event.target.files?.[0])}
        />
        <Camera className="text-brand-600" size={28} />
        <strong className="mt-3 text-sm font-semibold text-gray-900">{saving ? 'Processing image...' : 'Take a photo or choose one'}</strong>
        <span className="mt-1 text-xs text-gray-500">JPG, PNG · up to 8 MB</span>
      </label>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {evidence.map((item) => (
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" key={item.id}>
            {item.dataUrl ? (
              <img src={item.dataUrl} alt={item.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center bg-gray-50">
                <FileImage className="text-brand-600" />
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-xs font-medium text-gray-700">{item.name}</span>
              <button title="Remove evidence" onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove image">
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceStep({ draft, onChange }: { draft: LotDraft; onChange: (patch: Partial<LotDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
        <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">Your declaration</p>
        <p className="mt-1 text-sm text-brand-900">
          You set the asking price. The platform will preserve it for later fair-value guidance and negotiation.
        </p>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2 block">Asking price (₹) *</span>
        <input
          className="w-full rounded-xl border border-gray-300 p-3 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          type="number"
          min="0"
          step="1"
          value={draft.askingPrice}
          onChange={(event) => onChange({ askingPrice: event.target.value })}
          placeholder="0"
        />
      </label>
      <p className="text-xs text-gray-500">A zero asking price is valid. Your lot will still be reviewed through the platform process.</p>
    </div>
  );
}

function Lots({ lots, onBack, onOpen }: { lots: Lot[]; onBack: () => void; onOpen: (lot: Lot) => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
        <ChevronLeft size={18} /> Back to dashboard
      </button>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">Material records</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">My lots</h1>
        </div>
        <span className="text-sm text-gray-500 font-semibold">{lots.length} total</span>
      </div>
      <div className="mt-6 space-y-3">
        {lots.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Package className="mx-auto text-brand-600" size={32} />
            <h2 className="mt-4 text-lg font-bold text-gray-900">No lots yet</h2>
            <p className="mt-1 text-sm text-gray-500">Your saved declarations will appear here.</p>
          </Card>
        ) : (
          lots.map((lot) => (
            <Card
              onClick={() => onOpen(lot)}
              padding="md"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
              key={lot.lotId}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base text-gray-900 font-bold">{lot.category}</strong>
                  <LotStatusBadge status={lot.status} />
                  {lot.syncStatus === 'PENDING_SYNC' && (
                    <Badge label="Pending sync" variant="yellow" />
                  )}
                </div>
                <span className="mt-1.5 block text-xs text-gray-500 font-mono">
                  {lot.lotId} · {new Date(lot.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <span className="text-gray-700">
                  <b className="text-gray-900">{lot.estimatedWeight}</b> kg
                </span>
                <span className="text-gray-700">
                  <b className="text-brand-700 font-bold">₹{lot.askingPrice.toLocaleString('en-IN')}</b>
                </span>
                <ChevronRight className="text-gray-400 group-hover:text-brand-600 transition-colors" size={18} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function LotDetail({ lot, onBack }: { lot: Lot; onBack: () => void }) {
  const conditionObj = typeof lot.conditionAssessment === 'object' ? lot.conditionAssessment : null;
  const componentsObj = typeof lot.components === 'object' && !Array.isArray(lot.components) ? lot.components : null;

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
        <ChevronLeft size={18} /> Back to lots
      </button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">Lot detail</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{lot.category}</h1>
          <p className="mt-1 break-all text-xs text-gray-500 font-mono">{lot.lotId}</p>
        </div>
        <div className="flex items-center gap-2">
          <LotStatusBadge status={lot.status} />
          {lot.syncStatus === 'PENDING_SYNC' && (
            <Badge label="Pending sync" variant="yellow" />
          )}
        </div>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card padding="lg">
          <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Declaration</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Info label="Quantity" value={`${lot.quantity} ${lot.unit}`} />
            <Info label="Weight" value={`${lot.estimatedWeight} kg`} />
            <Info label="Asking price" value={`₹${lot.askingPrice.toLocaleString('en-IN')}`} />
            <Info label="Location" value={lot.location || 'Not supplied'} />
          </div>
          <div className="mt-6 border-t border-gray-100 pt-5">
            <Info
              label="Working condition"
              value={conditionObj?.working ? conditionObj.working.replace('_', ' ') : String(lot.conditionAssessment || 'Unknown')}
            />
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Components present:</span> {componentsObj?.present || 'Not supplied'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Reusable:</span> {componentsObj?.reusable || 'Not supplied'}
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Evidence</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {lot.evidence && Array.isArray(lot.evidence) ? (
              lot.evidence.map((item, idx) => {
                if (typeof item === 'string') {
                  return <img className="aspect-square rounded-xl object-cover border border-gray-100" src={item} alt={`evidence-${idx}`} key={idx} />;
                }
                const ev = item as any;
                const srcUrl = ev.dataUrl || ev.url || ev.downloadUrl;
                const label = ev.name || ev.fileName || 'Evidence document';
                return srcUrl ? (
                  <img className="aspect-square rounded-xl object-cover border border-gray-100" src={srcUrl} alt={label} key={ev.id || ev.evidenceId || idx} />
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-700 font-semibold border border-brand-100"
                    key={ev.id || ev.evidenceId || idx}
                  >
                    <FileImage size={18} />
                    {label}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400">No evidence attached.</p>
            )}
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
            <p>Created {new Date(lot.createdAt).toLocaleString()}</p>
            <p>Last updated {new Date(lot.updatedAt).toLocaleString()}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block">{label}</span>
      <strong className="mt-1 block text-sm font-bold text-gray-900">{value}</strong>
    </div>
  );
}

function Profile({ profile, lots, onBack }: { profile: CollectorProfile | null; lots: Lot[]; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
        <ChevronLeft size={18} /> Back to dashboard
      </button>
      <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">Collector profile</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Your record</h1>
      <Card padding="lg" className="mt-6 border-gray-100">
        <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-100">
            <UserRound size={30} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {profile?.collectorType} · <span className="font-semibold text-brand-700">{String(profile?.status)}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Info label="Phone" value={profile?.phone || 'Not supplied'} />
          <Info label="Email" value={profile?.email || 'Not supplied'} />
          <Info label="Location" value={profile?.location || 'Not supplied'} />
          <Info label="Organization" value={profile?.organization || 'Independent'} />
          <Info label="Registered" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'} />
          <Info label="Total lots" value={String(lots.length)} />
          <Info label="Completed lots" value={String(lots.filter((lot) => lot.status === 'COMPLETED').length)} />
          <Info label="Earnings" value={`₹${(profile?.earnings || 0).toLocaleString('en-IN')}`} />
        </div>
      </Card>
    </div>
  );
}

function Safety({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
        <ChevronLeft size={18} /> Back to dashboard
      </button>
      <p className="text-xs uppercase tracking-wider text-brand-700 font-bold">Safety guidance</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Handle with care.</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ['Separate batteries', 'Store lithium batteries away from heat, moisture and metal objects. Do not puncture or crush them.'],
          ['Protect yourself', 'Use gloves and eye protection when dismantling devices. Wash hands after handling material.'],
          ['Keep evidence honest', 'Photograph the actual material in good light. Never mix evidence from different lots.'],
          ['Contain hazards', 'Keep leaking, swollen or damaged batteries isolated and flag them in the declaration.'],
        ].map(([title, text]) => (
          <Card padding="md" key={title}>
            <ShieldCheck className="text-brand-600" size={24} />
            <h2 className="mt-3 text-base font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
