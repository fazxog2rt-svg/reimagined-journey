'use client'

import { useEffect, useState } from 'react'

export default function SecurityGuard() {
  const [devtoolsOpen, setDevtoolsOpen] = useState(false)

  useEffect(() => {
    // Block right-click
    const blockCtxMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', blockCtxMenu)

    // Block keyboard shortcuts
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) { e.preventDefault(); return }
      // Ctrl+U (view source)
      if (e.ctrlKey && ['U', 'u'].includes(e.key)) { e.preventDefault(); return }
      // Ctrl+S (save page)
      if (e.ctrlKey && ['S', 's'].includes(e.key)) { e.preventDefault(); return }
    }
    document.addEventListener('keydown', blockKeys)

    // DevTools detection via size difference
    const THRESHOLD = 160
    const detect = () => {
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      setDevtoolsOpen(widthDiff > THRESHOLD || heightDiff > THRESHOLD)
    }
    const interval = setInterval(detect, 1000)

    // Clear console periodically
    const clearConsole = setInterval(() => {
      console.clear()
      console.log('%c⛔ STOP!', 'color:red;font-size:48px;font-weight:bold')
      console.log('%cHalaman ini dilindungi. Memodifikasi hasil kelulusan adalah tindakan tidak jujur.', 'color:#DC2626;font-size:14px')
    }, 3000)

    return () => {
      document.removeEventListener('contextmenu', blockCtxMenu)
      document.removeEventListener('keydown', blockKeys)
      clearInterval(interval)
      clearInterval(clearConsole)
    }
  }, [])

  if (!devtoolsOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="text-center p-8 max-w-sm">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-black text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-300 text-sm mb-4">
          Developer Tools terdeteksi. Halaman diblokir untuk melindungi integritas data kelulusan.
        </p>
        <p className="text-slate-500 text-xs">Tutup Developer Tools untuk melanjutkan.</p>
      </div>
    </div>
  )
}
