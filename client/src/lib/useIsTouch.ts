import { useState, useEffect } from 'react'

const query = '(pointer: coarse)'

export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isTouch
}
