'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const SecurityGuard = dynamic(() => import('./SecurityGuard'), { ssr: false })

export default function SecurityGuardWrapper() {
  const pathname = usePathname()
  // Skip protection for admin panel
  if (pathname?.startsWith('/admin')) return null
  return <SecurityGuard />
}
