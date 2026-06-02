import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setMobile(mq.matches)
    const fn = (e) => setMobile(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', fn)
      return () => mq.removeEventListener('change', fn)
    } else {
      mq.addListener(fn)
      return () => mq.removeListener(fn)
    }
  }, [breakpoint])

  return mobile
}
