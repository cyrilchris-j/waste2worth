import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RecyclerLayout } from '../../components/layout/RecyclerLayout';
import { Button, Input, Textarea, VerificationBadge, Card, LoadingSpinner } from '../../components/ui';
import { updateRecyclerProfile } from '../../services/recyclerService';
import { E_WASTE_CATEGORIES, PROCESSING_CAPABILITIES } from '../../types';
import type { EWasteCategory, ProcessingCapability } from '../../types';
import toast from 'react-hot-toast';

export default function RecyclerProfile() {
  const { recyclerProfile, refreshProfile } = useAuth();
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    companyName:     recyclerProfile?.companyName ?? '',
    facilityName:    recyclerProfile?.facilityName ?? '',
    contactPerson:   recyclerProfile?.contactPerson ?? '',
    phone:           recyclerProfile?.phone ?? '',
    address:         recyclerProfile?.address ?? '',
    city:            recyclerProfile?.city ?? '',
    state:           recyclerProfile?.state ?? '',
    pincode:         recyclerProfile?.pincode ?? '',
    processingCapacityKgPerMonth: recyclerProfile?.processingCapacityKgPerMonth?.toString() ?? '',
    acceptedCategories:      recyclerProfile?.acceptedCategories ?? [] as EWasteCategory[],
    processingCapabilities:  recyclerProfile?.processingCapabilities ?? [] as ProcessingCapability[],
  });

  const set = (field: keyof typeof form) =>
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

  const handleSave = async () => {
    if (!recyclerProfile) return;
    if (!form.companyName.trim() || !form.facilityName.trim()) {
      toast.error('Company and facility name are required');
      return;
    }
    setSaving(true);
    try {
      const targetId = recyclerProfile.userId || recyclerProfile.recyclerId || '';
      await updateRecyclerProfile(targetId, {
        companyName:    form.companyName,
        facilityName:  form.facilityName,
        contactPerson: form.contactPerson,
        phone:         form.phone,
        address:       form.address,
        city:          form.city,
        state:         form.state,
        pincode:       form.pincode,
        processingCapacityKgPerMonth: Number(form.processingCapacityKgPerMonth),
        acceptedCategories:     form.acceptedCategories,
        processingCapabilities: form.processingCapabilities,
      });
      await refreshProfile();
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!recyclerProfile) {
    return (
      <RecyclerLayout title="My Profile">
        <div className="page-container">
          <LoadingSpinner label="Loading profile…" />
        </div>
      </RecyclerLayout>
    );
  }

  return (
    <RecyclerLayout title="My Profile">
      <div className="page-container">
        {/* Verification status */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Verification Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {recyclerProfile.verifiedAt ? `Verified on ${recyclerProfile.authorizationValidUntil}` : 'Pending platform review'}
              </p>
            </div>
            <VerificationBadge status={recyclerProfile.verificationStatus} />
          </div>
        </Card>

        {/* Authorization details — read-only */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Authorization Details</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
            <p className="text-xs text-blue-700">Authorization details cannot be edited after submission. Contact support to update.</p>
          </div>
          {[
            { label: 'Auth Body',    value: recyclerProfile.authorizationBody },
            { label: 'Auth Number',  value: recyclerProfile.authorizationNumber },
            { label: 'Reg. Number',  value: recyclerProfile.registrationNumber },
            { label: 'Valid Until',  value: recyclerProfile.authorizationValidUntil },
            { label: 'Doc Ref',      value: recyclerProfile.authorizationDocumentRef || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="info-row">
              <span className="info-label">{label}</span>
              <span className="info-value">{value}</span>
            </div>
          ))}
        </Card>

        {/* Editable facility details */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Facility Details</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-brand-700 font-semibold px-3 py-1 rounded-lg bg-brand-50">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <Input label="Company name" id="prof-company" value={form.companyName} onChange={set('companyName')} required />
              <Input label="Facility name" id="prof-facility" value={form.facilityName} onChange={set('facilityName')} required />
              <Input label="Contact person" id="prof-contact" value={form.contactPerson} onChange={set('contactPerson')} />
              <Input label="Phone" id="prof-phone" value={form.phone} onChange={set('phone')} type="tel" />
              <Textarea label="Address" id="prof-address" value={form.address} onChange={set('address')} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="City" id="prof-city" value={form.city} onChange={set('city')} />
                <Input label="Pincode" id="prof-pincode" value={form.pincode} onChange={set('pincode')} />
              </div>
              <Input label="State" id="prof-state" value={form.state} onChange={set('state')} />
              <Input label="Capacity (kg/month)" id="prof-capacity" type="number" value={form.processingCapacityKgPerMonth} onChange={set('processingCapacityKgPerMonth')} />

              {/* Categories */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Accepted Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {E_WASTE_CATEGORIES.map((cat) => (
                    <label key={cat} className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${form.acceptedCategories.includes(cat) ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={form.acceptedCategories.includes(cat)} onChange={() => toggleCategory(cat)} className="accent-brand-600" />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Processing Capabilities</p>
                <div className="space-y-2">
                  {PROCESSING_CAPABILITIES.map((cap) => (
                    <label key={cap} className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer ${form.processingCapabilities.includes(cap) ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={form.processingCapabilities.includes(cap)} onChange={() => toggleCapability(cap)} className="accent-brand-600 shrink-0" />
                      {cap}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} loading={saving} className="flex-1">Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {[
                { label: 'Company',   value: recyclerProfile.companyName },
                { label: 'Facility',  value: recyclerProfile.facilityName },
                { label: 'Contact',   value: recyclerProfile.contactPerson },
                { label: 'Phone',     value: recyclerProfile.phone },
                { label: 'Address',   value: recyclerProfile.address },
                { label: 'City',      value: `${recyclerProfile.city}, ${recyclerProfile.state} ${recyclerProfile.pincode}` },
                { label: 'Capacity',  value: `${recyclerProfile.processingCapacityKgPerMonth} kg/month` },
              ].map(({ label, value }) => (
                <div key={label} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Accepted categories read-only view */}
        {!editing && (
          <>
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Accepted E-Waste Categories</h3>
              <div className="flex flex-wrap gap-2">
                {(recyclerProfile.acceptedCategories || []).map((cat: any) => (
                  <span key={cat} className="chip chip-green">{cat}</span>
                ))}
                {(!recyclerProfile.acceptedCategories || recyclerProfile.acceptedCategories.length === 0) && (
                  <p className="text-sm text-gray-400">None declared</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Processing Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {(recyclerProfile.processingCapabilities || []).map((cap: any) => (
                  <span key={cap} className="chip">{cap}</span>
                ))}
                {(!recyclerProfile.processingCapabilities || recyclerProfile.processingCapabilities.length === 0) && (
                  <p className="text-sm text-gray-400">None declared</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </RecyclerLayout>
  );
}
