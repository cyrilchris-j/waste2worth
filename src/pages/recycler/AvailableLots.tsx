import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { LoadingSpinner, EmptyState, LotStatusBadge, ErrorMessage } from '../../components/ui';
import { getListedLots } from '../../services/lotService';
import { E_WASTE_CATEGORIES } from '../../types';
import type { Lot, EWasteCategory, OverallCondition } from '../../types';

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'weight_desc';

interface Filters {
  search:    string;
  category:  EWasteCategory | '';
  condition: OverallCondition | '';
  maxPrice:  string;
  minWeight: string;
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function AvailableLots() {
  const { recyclerProfile } = useAuth();
  const navigate = useNavigate();

  const [lots, setLots]       = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sort, setSort]       = useState<SortKey>('newest');
  const [filters, setFilters] = useState<Filters>({
    search: '', category: '', condition: '', maxPrice: '', minWeight: '',
  });

  const isVerified = recyclerProfile?.verificationStatus === 'VERIFIED';

  useEffect(() => {
    if (!recyclerProfile) return;
    getListedLots(recyclerProfile.acceptedCategories)
      .then(setLots)
      .catch(() => setError('Failed to load lots. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [recyclerProfile]);

  const filtered = useMemo(() => {
    let result = [...lots];
    const { search, category, condition, maxPrice, minWeight } = filters;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.lotId.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    if (category) result = result.filter((l) => l.category === category);
    if (condition) result = result.filter((l) => l.condition === condition);
    if (maxPrice)  result = result.filter((l) => l.askingPrice <= Number(maxPrice));
    if (minWeight) result = result.filter((l) => l.estimatedWeightKg >= Number(minWeight));

    result.sort((a, b) => {
      if (sort === 'newest')      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      if (sort === 'price_asc')   return a.askingPrice - b.askingPrice;
      if (sort === 'price_desc')  return b.askingPrice - a.askingPrice;
      if (sort === 'weight_desc') return b.estimatedWeightKg - a.estimatedWeightKg;
      return 0;
    });
    return result;
  }, [lots, filters, sort]);

  const setFilter = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (!isVerified) {
    return (
      <RecyclerLayout title="Available Lots">
        <div className="page-container">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-3xl">🔒</p>
            <p className="font-semibold text-amber-800">Verification Required</p>
            <p className="text-sm text-amber-700">You must be a verified recycler to browse available lots.</p>
            <button
              onClick={() => navigate('/recycler/verification-status')}
              className="text-sm text-brand-700 font-semibold underline"
            >
              Check verification status →
            </button>
          </div>
        </div>
      </RecyclerLayout>
    );
  }

  return (
    <RecyclerLayout title="Available Lots">
      <div className="page-container">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="search"
            placeholder="Search by Lot ID, category, city…"
            value={filters.search}
            onChange={setFilter('search')}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            {
              key: 'category' as const,
              label: 'Category',
              options: [{ value: '', label: 'All Categories' }, ...E_WASTE_CATEGORIES.map((c) => ({ value: c, label: c }))],
            },
            {
              key: 'condition' as const,
              label: 'Condition',
              options: [
                { value: '', label: 'All Conditions' },
                ...(['Working', 'Partially Working', 'Non-Working', 'Damaged', 'For Parts', 'Unknown'] as OverallCondition[])
                  .map((c) => ({ value: c, label: c })),
              ],
            },
          ].map(({ key, options }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={setFilter(key)}
              className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}

          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={setFilter('maxPrice')}
            className="shrink-0 w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="number"
            placeholder="Min kg"
            value={filters.minWeight}
            onChange={setFilter('minWeight')}
            className="shrink-0 w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{filtered.length} lot{filtered.length !== 1 ? 's' : ''}</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-1.5 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="weight_desc">Weight: Heaviest</option>
          </select>
        </div>

        {/* Content */}
        {loading && <LoadingSpinner label="Loading lots…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={() => { setLoading(true); setError(''); }} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState icon="📭" title="No lots found" message="Try adjusting your filters or check back later." />
        )}

        {!loading && !error && filtered.map((lot) => (
          <div
            key={lot.lotId}
            className="lot-card"
            onClick={() => navigate(`/recycler/lots/${lot.lotId}`)}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-mono">{lot.lotId}</p>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{lot.category}</h3>
                {lot.brand && <p className="text-sm text-gray-500">{lot.brand} {lot.model}</p>}
              </div>
              <LotStatusBadge status={lot.status} />
            </div>

            {/* Chips row */}
            <div className="flex flex-wrap gap-2">
              <span className="chip">{lot.condition}</span>
              <span className="chip">{lot.quantity} unit{lot.quantity !== 1 ? 's' : ''}</span>
              <span className="chip">{lot.estimatedWeightKg} kg</span>
              {recyclerProfile?.acceptedCategories.includes(lot.category) && (
                <span className="chip chip-green">✓ Compatible</span>
              )}
            </div>

            {/* Price + location row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-brand-700">{formatCurrency(lot.askingPrice)}</p>
                {lot.priceStatus === 'WITHIN_RANGE' && (
                  <p className="text-xs text-green-600">✓ Within reference range</p>
                )}
                {lot.priceStatus === 'ABOVE_RANGE' && (
                  <p className="text-xs text-orange-600">⚠ Above reference range</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">📍 {lot.city}</p>
                <p className="text-xs text-gray-400">{lot.state}</p>
              </div>
            </div>

            <p className="text-xs text-brand-700 font-medium text-right">View details →</p>
          </div>
        ))}
      </div>
    </RecyclerLayout>
  );
}
