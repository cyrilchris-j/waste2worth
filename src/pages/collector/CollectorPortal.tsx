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
    <div className="min-h-screen bg-[#f7f4ed]">
      <TopBar
        online={online}
        pending={pending}
        syncing={syncing}
        onSync={sync}
        onLogout={logout}
        onNavigate={(s) => enter(s)}
      />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
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
    <header className="border-b border-[#dfe8e0] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#14231d] text-[#dff4e6]">
            <Leaf size={20} />
          </span>
          <span>
            <strong className="block text-xl leading-none font-bold text-gray-900">
              waste<span className="text-[#1f6f52]">2</span>worth
            </strong>
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">collector portal</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            title={online ? 'Online' : 'Offline'}
            className={`hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold sm:flex ${
              online ? 'bg-[#dff4e6] text-[#1f6f52]' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {online ? <Wifi size={14} /> : <CloudOff size={14} />}
            {online ? 'ONLINE' : 'OFFLINE'}
          </button>
          {pending > 0 && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'SYNCING' : `${pending} PENDING`}
            </button>
          )}
          <button
            title="Collector profile"
            onClick={() => onNavigate('profile')}
            className="rounded-lg p-2 text-[#1f6f52] hover:bg-[#dff4e6]"
          >
            <UserRound size={21} />
          </button>
          <button
            title="Sign out"
            onClick={onLogout}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <LogOut size={19} />
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
  const stats = [
    { label: 'Total lots', value: lots.length, color: 'bg-[#1f6f52]' },
    { label: 'Draft lots', value: lots.filter((l) => l.status === 'DRAFT').length, color: 'bg-slate-700' },
    { label: 'Listed lots', value: lots.filter((l) => l.status === 'LISTED').length, color: 'bg-[#bc5b32]' },
    { label: 'Accepted', value: lots.filter((l) => l.status === 'ACCEPTED').length, color: 'bg-blue-700' },
    { label: 'Completed', value: lots.filter((l) => l.status === 'COMPLETED').length, color: 'bg-emerald-700' },
    { label: 'Pending sync', value: pending, color: 'bg-amber-600' },
  ];

  return (
    <>
      <section className="rounded-2xl bg-[#dff4e6] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">
          Good morning, {profile?.fullName?.split(' ')[0] || 'collector'}
        </p>
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl text-gray-900">
              Make every kilo count.
            </h1>
            <p className="mt-2 max-w-lg text-sm sm:text-base text-slate-600">
              Declare, document and track your materials from collection to responsible recycling.
            </p>
          </div>
          <button
            onClick={() => onNavigate('add')}
            className="flex items-center gap-2 rounded-xl bg-[#1f6f52] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#15533c] transition-colors"
          >
            <Plus size={19} /> Add e-waste
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm" key={stat.label}>
            <span className={`mb-4 block h-1.5 w-8 rounded-full ${stat.color}`} />
            <strong className="block text-2xl font-bold text-gray-900">{stat.value}</strong>
            <span className="mt-1 block text-xs text-slate-500">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Your workspace</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Keep the chain visible.</h2>
            </div>
            <Package className="text-[#1f6f52]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Action icon={Plus} title="Add e-waste" text="Create a material lot" onClick={() => onNavigate('add')} />
            <Action icon={Package} title="My lots" text="Review your declarations" onClick={() => onNavigate('lots')} />
            <Action icon={ShieldCheck} title="Safety" text="Handle materials well" onClick={() => onNavigate('safety')} />
          </div>
        </div>

        <div className="rounded-2xl bg-[#14231d] p-5 text-white sm:p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#dff4e6] font-bold">Earnings summary</p>
          <strong className="mt-4 block text-3xl sm:text-4xl font-bold">
            ₹{(profile?.earnings || 0).toLocaleString('en-IN')}
          </strong>
          <p className="mt-2 text-xs text-emerald-100/70">Settlements from completed lots</p>
          <button
            onClick={() => onNavigate('profile')}
            className="mt-6 flex items-center gap-2 text-xs font-bold text-[#dff4e6] hover:underline"
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
      className="rounded-xl border border-gray-200 p-4 text-left hover:border-[#1f6f52] hover:bg-[#dff4e6]/30 transition-all"
    >
      <Icon size={20} className="text-[#1f6f52]" />
      <strong className="mt-3 block text-sm font-bold text-gray-900">{title}</strong>
      <span className="mt-1 block text-xs text-slate-500">{text}</span>
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
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#1f6f52]">
        <ChevronLeft size={17} /> Back to dashboard
      </button>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">New material lot</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{titles[step]}</h1>
        </div>
        <span className="text-sm font-bold text-slate-500">{progress}</span>
      </div>
      <div className="mb-7 flex gap-1">
        {titles.map((_, index) => (
          <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#1f6f52]' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200/70 bg-white p-5 sm:p-8 shadow-sm">
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
          <p className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <CircleAlert size={17} /> {error}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row">
          {step > 0 ? (
            <button
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
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
            <span className="flex items-center gap-2 text-xs text-amber-800 font-medium">
              <CloudOff size={15} /> Saved locally while offline
            </span>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {step > 0 && (
              <button
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => saveLot('DRAFT')}
              >
                Save draft
              </button>
            )}
            <button
              disabled={saving}
              className="flex items-center justify-center gap-1 rounded-xl bg-[#1f6f52] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#15533c] transition-colors"
              onClick={next}
            >
              {saving ? 'Saving...' : step === 5 ? 'List this lot' : 'Continue'}
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryStep({ value, onChange }: { value: Category | EWasteCategory | ''; onChange: (value: Category) => void }) {
  return (
    <div>
      <p className="mb-5 text-sm text-slate-600">Choose the closest material category. You can add detail in the next steps.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`rounded-xl border p-4 text-left transition-all ${
              value === category ? 'border-[#1f6f52] bg-[#dff4e6] text-[#1f6f52]' : 'border-gray-200 bg-white hover:border-[#1f6f52]'
            }`}
          >
            <Package size={20} />
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
      <p className="text-sm text-slate-600">Structured condition data helps downstream partners assess material accurately.</p>
      <div>
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Working condition *</span>
        <div className="grid grid-cols-3 gap-2">
          {(['WORKING', 'NOT_WORKING', 'UNKNOWN'] as const).map((item) => (
            <button
              key={item}
              onClick={() => set({ working: item })}
              className={`rounded-lg border p-3 text-xs font-bold ${
                value.working === item ? 'border-[#1f6f52] bg-[#dff4e6] text-[#1f6f52]' : 'border-gray-200'
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
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm cursor-pointer" key={key}>
            <input
              type="checkbox"
              checked={Boolean(value[key])}
              onChange={(event) => set({ [key]: event.target.checked })}
              className="h-4 w-4 accent-[#1f6f52]"
            />
            {label}
          </label>
        ))}
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Battery condition</span>
        <select
          className="w-full rounded-xl border border-gray-200 p-3 text-sm"
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
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Missing components</span>
        <textarea
          className="w-full rounded-xl border border-gray-200 p-3 text-sm"
          rows={2}
          value={value.missingComponents || ''}
          onChange={(event) => set({ missingComponents: event.target.value })}
          placeholder="Charger, casing, battery..."
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Other defects</span>
        <textarea
          className="w-full rounded-xl border border-gray-200 p-3 text-sm"
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
      <p className="text-sm text-slate-600">List what is physically present. Separate items with commas where useful.</p>
      {([
        ['present', 'Components present *', 'Motherboard, casing, copper wire...'],
        ['missing', 'Components missing', 'Power adapter, screws...'],
        ['reusable', 'Reusable components', 'RAM, display, motor...'],
        ['hazardous', 'Hazardous components', 'Lithium battery, mercury switch...'],
      ] as const).map(([key, label, placeholder]) => (
        <label className="block" key={key}>
          <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">{label}</span>
          <textarea
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
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
      <p className="text-sm text-slate-600">Use an estimate if a scale is not available. You can update a draft later.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Quantity *</span>
          <input
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
            type="number"
            min="1"
            step="1"
            value={draft.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Weight (kg) *</span>
          <input
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
            type="number"
            min="0.01"
            step="0.01"
            value={draft.estimatedWeight}
            onChange={(event) => onChange({ estimatedWeight: event.target.value })}
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Unit</span>
          <select
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
            value={draft.unit}
            onChange={(event) => onChange({ unit: event.target.value as 'kg' | 'units' })}
          >
            <option value="kg">Kilograms</option>
            <option value="units">Units</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Collection location *</span>
        <input
          className="w-full rounded-xl border border-gray-200 p-3 text-sm"
          required
          value={draft.location}
          onChange={(event) => onChange({ location: event.target.value })}
          placeholder="City, area or pickup point"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Notes</span>
        <textarea
          className="w-full rounded-xl border border-gray-200 p-3 text-sm"
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
      <p className="text-sm text-slate-600">
        Capture the actual item. Original evidence is stored as a Storage reference, not inside the lot document.
      </p>
      <label className="mt-6 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1f6f52] bg-[#dff4e6]/30 p-5 text-center">
        <input
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => onAdd(event.target.files?.[0])}
        />
        <Camera className="text-[#1f6f52]" />
        <strong className="mt-3 text-sm font-semibold">{saving ? 'Processing image...' : 'Take a photo or choose one'}</strong>
        <span className="mt-1 text-xs text-slate-500">JPG, PNG · up to 8 MB</span>
      </label>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {evidence.map((item) => (
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white" key={item.id}>
            {item.dataUrl ? (
              <img src={item.dataUrl} alt={item.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center bg-gray-100">
                <FileImage className="text-[#1f6f52]" />
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-xs font-medium">{item.name}</span>
              <button title="Remove evidence" onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500">
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
      <div className="rounded-xl bg-[#dff4e6] p-4">
        <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">Your declaration</p>
        <p className="mt-1 text-sm text-slate-700">
          You set the asking price. The platform will preserve it for later fair-value guidance and negotiation.
        </p>
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2 block">Asking price (₹) *</span>
        <input
          className="w-full rounded-xl border border-gray-200 p-3 text-2xl font-bold"
          type="number"
          min="0"
          step="1"
          value={draft.askingPrice}
          onChange={(event) => onChange({ askingPrice: event.target.value })}
          placeholder="0"
        />
      </label>
      <p className="text-xs text-slate-500">A zero asking price is valid. Your lot will still be reviewed through the platform process.</p>
    </div>
  );
}

function Lots({ lots, onBack, onOpen }: { lots: Lot[]; onBack: () => void; onOpen: (lot: Lot) => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#1f6f52]">
        <ChevronLeft size={17} /> Back to dashboard
      </button>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">Material records</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">My lots</h1>
        </div>
        <span className="text-sm text-slate-500 font-semibold">{lots.length} total</span>
      </div>
      <div className="mt-6 space-y-3">
        {lots.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <Package className="mx-auto text-[#1f6f52]" />
            <h2 className="mt-4 text-xl font-bold text-gray-800">No lots yet</h2>
            <p className="mt-2 text-sm text-slate-500">Your saved declarations will appear here.</p>
          </div>
        ) : (
          lots.map((lot) => (
            <button
              onClick={() => onOpen(lot)}
              className="flex w-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-[#1f6f52] sm:flex-row sm:items-center sm:justify-between shadow-sm transition-all"
              key={lot.lotId}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base text-gray-900 font-bold">{lot.category}</strong>
                  <Status status={lot.status} syncStatus={lot.syncStatus} />
                </div>
                <span className="mt-1.5 block text-xs text-slate-500">
                  {lot.lotId} · {new Date(lot.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <span>
                  <b>{lot.estimatedWeight}</b> kg
                </span>
                <span>
                  <b>₹{lot.askingPrice.toLocaleString('en-IN')}</b>
                </span>
                <ChevronRight className="text-[#1f6f52]" size={18} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Status({ status, syncStatus }: { status: Lot['status']; syncStatus?: SyncStatus }) {
  const tone =
    status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'LISTED'
      ? 'bg-[#dff4e6] text-[#1f6f52]'
      : 'bg-slate-100 text-slate-700';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone}`}>
      {syncStatus === 'PENDING_SYNC' ? 'PENDING SYNC' : status}
    </span>
  );
}

function LotDetail({ lot, onBack }: { lot: Lot; onBack: () => void }) {
  const conditionObj = typeof lot.conditionAssessment === 'object' ? lot.conditionAssessment : null;
  const componentsObj = typeof lot.components === 'object' && !Array.isArray(lot.components) ? lot.components : null;

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#1f6f52]">
        <ChevronLeft size={17} /> Back to lots
      </button>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">Lot detail</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{lot.category}</h1>
          <p className="mt-1 break-all text-xs text-slate-500">{lot.lotId}</p>
        </div>
        <Status status={lot.status} syncStatus={lot.syncStatus} />
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Declaration</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Info label="Quantity" value={`${lot.quantity} ${lot.unit}`} />
            <Info label="Weight" value={`${lot.estimatedWeight} kg`} />
            <Info label="Asking price" value={`₹${lot.askingPrice.toLocaleString('en-IN')}`} />
            <Info label="Location" value={lot.location || 'Not supplied'} />
          </div>
          <div className="mt-7 border-t border-gray-100 pt-5">
            <Info
              label="Working condition"
              value={conditionObj?.working ? conditionObj.working.replace('_', ' ') : String(lot.conditionAssessment || 'Unknown')}
            />
            <p className="mt-4 text-sm text-slate-600">
              Components present: {componentsObj?.present || 'Not supplied'}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Reusable: {componentsObj?.reusable || 'Not supplied'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Evidence</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {lot.evidence && Array.isArray(lot.evidence) ? (
              lot.evidence.map((item, idx) => {
                if (typeof item === 'string') {
                  return <img className="aspect-square rounded-lg object-cover" src={item} alt={`evidence-${idx}`} key={idx} />;
                }
                const ev = item as any;
                const srcUrl = ev.dataUrl || ev.url || ev.downloadUrl;
                const label = ev.name || ev.fileName || 'Evidence document';
                return srcUrl ? (
                  <img className="aspect-square rounded-lg object-cover" src={srcUrl} alt={label} key={ev.id || ev.evidenceId || idx} />
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-lg bg-[#dff4e6] p-3 text-xs text-[#1f6f52] font-semibold"
                    key={ev.id || ev.evidenceId || idx}
                  >
                    <FileImage size={18} />
                    {label}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400">No evidence attached.</p>
            )}
          </div>
          <div className="mt-7 border-t border-gray-100 pt-5 text-xs text-slate-500">
            <p>Created {new Date(lot.createdAt).toLocaleString()}</p>
            <p className="mt-1">Last updated {new Date(lot.updatedAt).toLocaleString()}</p>
            <p className="mt-2 text-slate-400">Timeline will be extended as partners update this lot.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">{label}</span>
      <strong className="mt-1 block text-sm font-bold text-gray-900">{value}</strong>
    </div>
  );
}

function Profile({ profile, lots, onBack }: { profile: CollectorProfile | null; lots: Lot[]; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#1f6f52]">
        <ChevronLeft size={17} /> Back to dashboard
      </button>
      <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">Collector profile</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Your record</h1>
      <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-gray-100 pb-7 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#dff4e6] text-[#1f6f52]">
            <UserRound size={30} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {profile?.collectorType} · {String(profile?.status)}
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Info label="Phone" value={profile?.phone || 'Not supplied'} />
          <Info label="Email" value={profile?.email || 'Not supplied'} />
          <Info label="Location" value={profile?.location || 'Not supplied'} />
          <Info label="Organization" value={profile?.organization || 'Independent'} />
          <Info label="Registered" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'} />
          <Info label="Total lots" value={String(lots.length)} />
          <Info label="Completed lots" value={String(lots.filter((lot) => lot.status === 'COMPLETED').length)} />
          <Info label="Earnings" value={`₹${(profile?.earnings || 0).toLocaleString('en-IN')}`} />
        </div>
      </div>
    </div>
  );
}

function Safety({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-[#1f6f52]">
        <ChevronLeft size={17} /> Back to dashboard
      </button>
      <p className="text-xs uppercase tracking-wider text-[#1f6f52] font-bold">Safety guidance</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Handle with care.</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {[
          ['Separate batteries', 'Store lithium batteries away from heat, moisture and metal objects. Do not puncture or crush them.'],
          ['Protect yourself', 'Use gloves and eye protection when dismantling devices. Wash hands after handling material.'],
          ['Keep evidence honest', 'Photograph the actual material in good light. Never mix evidence from different lots.'],
          ['Contain hazards', 'Keep leaking, swollen or damaged batteries isolated and flag them in the declaration.'],
        ].map(([title, text]) => (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" key={title}>
            <ShieldCheck className="text-[#1f6f52]" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
