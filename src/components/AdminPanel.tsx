import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { VerificationStatus, type RecyclerProfile } from '../types/domain'

export function AdminPanel({ recyclers }: { recyclers: RecyclerProfile[] }) {
  const [items, setItems] = useState(recyclers)
  const update = (id: string, status: VerificationStatus) =>
    setItems(current => current.map(item => (item.recyclerId === id ? { ...item, verificationStatus: status } : item)))

  return (
    <section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">PLATFORM ADMIN</div>
          <h2>Verification desk</h2>
        </div>
        <span className="admin-badge">
          <ShieldCheck size={15} /> Simulation
        </span>
      </div>
      <div className="admin-table">
        {items.map(item => (
          <div className="admin-row" key={item.recyclerId}>
            <div>
              <strong>{item.facility || item.facilityName || item.companyName || 'Recycling Facility'}</strong>
              <span>
                {item.location || `${item.city || ''}, ${item.state || ''}`} ·{' '}
                {(item.acceptedMaterials || (item.acceptedCategories as string[]) || []).join(', ')}
              </span>
            </div>
            <select
              value={item.verificationStatus}
              onChange={event => update(item.recyclerId, event.target.value as VerificationStatus)}
            >
              <option>{VerificationStatus.PENDING}</option>
              <option>{VerificationStatus.UNDER_REVIEW}</option>
              <option>{VerificationStatus.VERIFIED}</option>
              <option>{VerificationStatus.REJECTED}</option>
            </select>
          </div>
        ))}
      </div>
    </section>
  )
}
