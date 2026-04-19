import { useEffect } from 'react'
import { STORE_AREAS } from '../types'
import type { StoreArea } from '../types'

interface Props {
  current: StoreArea
  onSelect: (area: StoreArea) => void
  onClose: () => void
}

export default function AreaPicker({ current, onSelect, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="area-picker-overlay" onClick={onClose}>
      <div className="area-picker" onClick={e => e.stopPropagation()}>
        <div className="area-picker__title">Choose store area</div>
        {STORE_AREAS.map(area => (
          <button
            key={area}
            className={`area-picker__option${area === current ? ' area-picker__option--active' : ''}`}
            onClick={() => onSelect(area)}
          >
            {area}
            {area === current && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
