'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Download, ArrowLeft, CheckCircle, Share2, Copy, Award, Printer, Image, X, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

interface Student {
  id: number
  name: string
  nisn: string
  nis: string
  status: 'LULUS' | 'TIDAK LULUS'
  keterangan?: string
}

const QUOTES = [
  'Selamat atas keberhasilan yang telah diraih. Semoga ilmu yang didapat menjadi bekal untuk masa depan yang lebih baik.',
  'Ilmu adalah cahaya yang tak pernah padam. Teruslah belajar dan jadilah cahaya bagi sekitarmu.',
  'Hari ini adalah awal dari perjalanan baru yang penuh kemungkinan. Jadikan setiap langkah bermakna.',
  'Semoga langkahmu selalu diiringi berkah, setiap impianmu terwujud, dan setiap usahamu berbuah hasil terbaik.',
  'Kelulusan bukan akhir dari belajar, melainkan awal dari babak baru yang lebih menantang dan penuh peluang.',
  'Setiap tetes keringat perjuanganmu kini berbuah manis. Terus berjuang dan raih mimpi setinggi langit!',
  'Tidak ada kesuksesan yang datang tanpa usaha. Kamu telah membuktikannya. Selamat dan tetap semangat!',
  'Wisuda bukan garis finish, melainkan garis start menuju kehidupan nyata. Berikan yang terbaik!',
  'Dengan ilmu yang kamu miliki, dunia menanti kontribusimu. Jadilah generasi penerus yang membanggakan.',
  'Doa orang tua, kerja keras, dan tekadmu telah mengantarkanmu ke sini. Teruskan perjalananmu dengan penuh keyakinan.',
]

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.6)
    })
  } catch { /* ignore */ }
}

function generatePhotoFrame(student: Student): string {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 600
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 600, 600)
  bg.addColorStop(0, '#0F172A')
  bg.addColorStop(1, '#1E3A5F')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 600, 600)

  // Border frame
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 === 0 ? '#2563EB' : '#10B981'
    ctx.lineWidth = 3 - i * 0.5
    ctx.strokeRect(10 + i * 8, 10 + i * 8, 580 - i * 16, 580 - i * 16)
  }

  // Corner decorations
  const corners = [[30, 30], [570, 30], [30, 570], [570, 570]]
  corners.forEach(([x, y]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 20)
    g.addColorStop(0, '#10B981')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()
  })

  // Avatar circle
  const grad = ctx.createRadialGradient(300, 195, 0, 300, 195, 80)
  grad.addColorStop(0, '#3B82F6')
  grad.addColorStop(1, '#1d4ed8')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(300, 195, 80, 0, Math.PI * 2)
  ctx.fill()

  // Initials
  const initials = student.name.split(' ').slice(0, 2).map(n => n[0]).join('')
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 52px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, 300, 195)

  // LULUS badge
  const badge = ctx.createLinearGradient(200, 295, 400, 325)
  badge.addColorStop(0, '#10B981')
  badge.addColorStop(1, '#059669')
  ctx.fillStyle = badge
  ctx.beginPath()
  ctx.roundRect(200, 293, 200, 34, 8)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 18px Arial'
  ctx.fillText('✓ DINYATAKAN LULUS', 300, 313)

  // Name
  ctx.fillStyle = '#F8FAFC'
  ctx.font = 'bold 26px Arial'
  ctx.textBaseline = 'middle'
  const displayName = student.name.length > 24 ? student.name.substring(0, 24) + '…' : student.name
  ctx.fillText(displayName, 300, 370)

  // Details
  ctx.fillStyle = '#94A3B8'
  ctx.font = '15px Arial'
  ctx.fillText(`NISN: ${student.nisn}  •  NIS: ${student.nis}`, 300, 405)

  // Year
  ctx.fillStyle = '#64748B'
  ctx.font = '13px Arial'
  ctx.fillText('Tahun Ajaran 2025/2026', 300, 432)

  // Bottom decoration
  const line = ctx.createLinearGradient(80, 470, 520, 470)
  line.addColorStop(0, 'transparent')
  line.addColorStop(0.5, '#2563EB')
  line.addColorStop(1, 'transparent')
  ctx.strokeStyle = line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 470)
  ctx.lineTo(520, 470)
  ctx.stroke()

  ctx.fillStyle = '#475569'
  ctx.font = '12px Arial'
  ctx.fillText('Sistem Pengumuman Kelulusan Kelas XII 2026', 300, 500)

  // Stars
  ctx.fillStyle = '#F59E0B'
  ctx.font = '18px Arial'
  ctx.fillText('★ ★ ★ ★ ★', 300, 535)

  return canvas.toDataURL('image/png')
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [quote, setQuote] = useState('')
  const [toast, setToast] = useState('')
  const [showFrameModal, setShowFrameModal] = useState(false)
  const [frameDataUrl, setFrameDataUrl] = useState('')
  const confettiDone = useRef(false)

  const nisn = searchParams.get('nisn') || ''
  const nis = searchParams.get('nis') || ''

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const triggerConfetti = useCallback(async () => {
    if (confettiDone.current) return
    confettiDone.current = true
    try {
      const confetti = (await import('canvas-confetti')).default
      const end = Date.now() + 4000
      const colors = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors }), 200)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!nisn || !nis) { router.push('/'); return }
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])

    fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn, nis }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.student) {
          setStudent(data.student)
          if (data.student.status === 'LULUS') {
            triggerConfetti()
            playSuccessSound()
          }
          import('qrcode').then(({ default: QRCode }) => {
            QRCode.toDataURL(JSON.stringify({ nama: data.student.name, nisn: data.student.nisn, nis: data.student.nis, status: 'LULUS', tahun: '2025/2026' }), { width: 180, margin: 1 })
              .then(url => setQrDataUrl(url))
              .catch(() => {})
          })
        } else {
          setError(data.error || 'Data tidak ditemukan')
        }
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false))
  }, [nisn, nis, router, triggerConfetti])

  const shareWhatsApp = () => {
    if (!student) return
    const url = window.location.href
    const text = `Alhamdulillah! 🎓 ${student.name} dinyatakan *LULUS* Tahun Ajaran 2025/2026!\n\nCek hasil kelulusan di: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link berhasil disalin!'))
  }

  const downloadPDF = async () => {
    if (!student) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ format: 'a4', unit: 'mm' })
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, 210, 42, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('SURAT KETERANGAN KELULUSAN', 105, 16, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Tahun Ajaran 2025/2026', 105, 26, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.text('Yang bertanda tangan di bawah ini menyatakan bahwa:', 20, 58)
      const fields = [['Nama Lengkap', student.name], ['NISN', student.nisn], ['NIS', student.nis], ['Status', 'LULUS'], ['Tahun Ajaran', '2025/2026']]
      let y = 72
      fields.forEach(([l, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l, 30, y)
        doc.setFont('helvetica', 'normal'); doc.text(`: ${v}`, 80, y); y += 12
      })
      doc.setFillColor(16, 185, 129)
      doc.roundedRect(30, y + 4, 150, 16, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      doc.text('DINYATAKAN LULUS', 105, y + 15, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10)
      doc.text(`"${quote}"`, 105, y + 36, { align: 'center', maxWidth: 160 })
      if (qrDataUrl) { doc.addImage(qrDataUrl, 'PNG', 20, y + 58, 32, 32); doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text('Scan untuk verifikasi', 22, y + 93) }
      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      doc.text(`Jakarta, ${dateStr}`, 150, y + 68); doc.text('Kepala Sekolah,', 150, y + 76); doc.text('_________________', 148, y + 92)
      doc.save(`Surat_Kelulusan_${student.name.replace(/\s+/g, '_')}.pdf`)
    } catch (e) { console.error(e) }
  }

  const downloadSertifikat = async () => {
    if (!student) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' })
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 210, 'F')
      for (let i = 0; i < 4; i++) { doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.5); doc.rect(6 + i * 6, 6 + i * 6, 285 - i * 12, 198 - i * 12) }
      doc.setTextColor(37, 99, 235); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text('SERTIFIKAT KELULUSAN', 148, 34, { align: 'center' })
      doc.setFontSize(7); doc.setTextColor(16, 185, 129); doc.text('CERTIFICATE OF GRADUATION', 148, 42, { align: 'center' })
      doc.setTextColor(200, 200, 200); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text('Diberikan kepada:', 148, 60, { align: 'center' })
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
      doc.text(student.name.toUpperCase(), 148, 76, { align: 'center' })
      doc.setTextColor(200, 200, 200); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text(`NISN: ${student.nisn}  |  NIS: ${student.nis}`, 148, 90, { align: 'center' })
      doc.text('Telah menyelesaikan pendidikan dan dinyatakan', 148, 103, { align: 'center' })
      doc.setFillColor(37, 99, 235); doc.roundedRect(103, 108, 90, 16, 2, 2, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
      doc.text('L U L U S', 148, 119, { align: 'center' })
      doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
      doc.text('Tahun Ajaran 2025/2026', 148, 132, { align: 'center' })
      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.text(`Jakarta, ${dateStr}`, 148, 144, { align: 'center' })
      doc.text('Kepala Sekolah', 80, 160); doc.text('_________________', 70, 173)
      doc.text('Wali Kelas', 198, 160); doc.text('_________________', 190, 173)
      if (qrDataUrl) { doc.addImage(qrDataUrl, 'PNG', 130, 154, 36, 36); doc.setFontSize(6); doc.setTextColor(100, 100, 100); doc.text('Scan untuk verifikasi', 133, 192) }
      doc.save(`Sertifikat_${student.name.replace(/\s+/g, '_')}.pdf`)
    } catch (e) { console.error(e) }
  }

  const openPhotoFrame = () => {
    if (!student) return
    const url = generatePhotoFrame(student)
    setFrameDataUrl(url)
    setShowFrameModal(true)
  }

  const downloadFrame = () => {
    if (!frameDataUrl || !student) return
    const a = document.createElement('a')
    a.href = frameDataUrl
    a.download = `Frame_${student.name.replace(/\s+/g, '_')}.png`
    a.click()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Data Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)' }}>
          Coba Lagi
        </button>
      </div>
    </div>
  )

  if (!student) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-xl flex items-center gap-2 whitespace-nowrap">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none" style={{ opacity: 0.04 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="absolute font-black text-2xl whitespace-nowrap text-slate-900 dark:text-white"
            style={{ top: `${(i % 3) * 33 + 5}%`, left: `${Math.floor(i / 3) * 33}%`, transform: 'rotate(-30deg)' }}>
            {student.name} • LULUS 2026
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Hasil Kelulusan</span>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:scale-105 transition-transform">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring' }}
          className="rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-glow">

          {/* Header */}
          <div className="relative p-8 text-center text-white overflow-hidden"
            style={{ background: student.status === 'LULUS' ? 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)' : 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
              className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              {student.status === 'LULUS'
                ? <CheckCircle className="w-12 h-12 text-white" />
                : <span className="text-5xl">⚠️</span>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              {student.status === 'LULUS' ? (
                <>
                  <p className="text-lg font-bold mb-1">✅ SELAMAT!</p>
                  <h1 className="text-3xl font-black tracking-wide">ANDA DINYATAKAN</h1>
                  <h2 className="text-5xl font-black tracking-widest mt-1" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>LULUS</h2>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold mb-1">⚠️ PERHATIAN</p>
                  <h1 className="text-3xl font-black tracking-wide">ANDA DINYATAKAN</h1>
                  <h2 className="text-4xl font-black tracking-widest mt-1" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>BELUM LULUS</h2>
                </>
              )}
              <p className="text-white/80 text-sm mt-2">Tahun Ajaran 2025/2026</p>
            </motion.div>
          </div>

          <div className="p-6 md:p-8">
            {/* Student info */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3 mb-6">
              {[['Nama Lengkap', student.name, false, true], ['NISN', student.nisn, true, false], ['NIS', student.nis, true, false]].map(([l, v, mono, bold]) => (
                <div key={String(l)} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{String(l)}</span>
                  <span className={`font-bold ${mono ? 'font-mono text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {String(v)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                  student.status === 'LULUS'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                }`}>
                  {student.status}
                </span>
              </div>
              {student.status === 'TIDAK LULUS' && student.keterangan && (
                <div className="py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Keterangan</span>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 font-medium">
                    ⚠️ {student.keterangan}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Info box for TIDAK LULUS */}
            {student.status === 'TIDAK LULUS' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300 mb-6">
                <p className="font-bold mb-1">📋 Langkah Selanjutnya:</p>
                <p>Segera hubungi guru pembimbing atau wali kelas Anda untuk menyelesaikan kewajiban yang belum terpenuhi. Setelah semua persyaratan terpenuhi, kelulusan dapat diproses kembali.</p>
              </motion.div>
            )}

            {/* Quote - only for LULUS */}
            {student.status === 'LULUS' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-slate-600 dark:text-slate-300 text-sm italic text-center mb-6 border border-blue-100 dark:border-blue-900">
                &ldquo;{quote}&rdquo;
              </motion.div>
            )}

            {/* QR Code - only for LULUS */}
            {student.status === 'LULUS' && qrDataUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col items-center mb-6">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-md inline-block">
                  <img src={qrDataUrl} alt="QR Verifikasi" className="w-28 h-28" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Scan QR untuk verifikasi keaslian dokumen</p>
              </motion.div>
            )}

            {/* Share & action buttons - only for LULUS */}
            {student.status === 'LULUS' && (
              <>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={shareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </button>
                  <button onClick={copyLink}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5">
                    <Copy className="w-4 h-4" /> Salin Link
                  </button>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="space-y-3">
                  <button onClick={downloadPDF}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
                    <Download className="w-5 h-5" /> Download Surat Kelulusan (PDF)
                  </button>
                  <button onClick={downloadSertifikat}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                    <Award className="w-5 h-5" /> Download Sertifikat (PDF)
                  </button>
                  <button onClick={openPhotoFrame}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                    <Image className="w-5 h-5" /> Buat Photo Frame Wisuda
                  </button>
                  <button onClick={() => window.print()}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5">
                    <Printer className="w-5 h-5" /> Cetak Halaman
                  </button>
                </motion.div>
              </>
            )}

            <div className="text-center mt-6">
              <button onClick={() => router.push('/')} className="text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 mx-auto">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Photo Frame Modal */}
      <AnimatePresence>
        {showFrameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg dark:text-white">Photo Frame Wisuda</h3>
                <button onClick={() => setShowFrameModal(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              {frameDataUrl && <img src={frameDataUrl} alt="Photo Frame" className="w-full rounded-2xl mb-4 shadow-lg" />}
              <button onClick={downloadFrame}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                <Download className="w-5 h-5" /> Download Frame (PNG)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
