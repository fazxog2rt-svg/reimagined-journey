'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Download, ArrowLeft, CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

interface Student {
  id: number
  name: string
  nisn: string
  nis: string
  status: 'LULUS'
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const confettiDone = useRef(false)

  const nisn = searchParams.get('nisn') || ''
  const nis = searchParams.get('nis') || ''

  useEffect(() => {
    if (!nisn || !nis) {
      router.push('/')
      return
    }

    const fetchStudent = async () => {
      try {
        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nisn, nis }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Data tidak ditemukan')
        } else {
          setStudent(data.student)
          generateQR(data.student)
        }
      } catch {
        setError('Terjadi kesalahan jaringan')
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [nisn, nis, router])

  useEffect(() => {
    if (student && !confettiDone.current) {
      confettiDone.current = true
      launchConfetti()
    }
  }, [student])

  const launchConfetti = async () => {
    if (typeof window === 'undefined') return
    const confetti = (await import('canvas-confetti')).default
    const duration = 5 * 1000
    const end = Date.now() + duration
    const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  const generateQR = async (studentData: Student) => {
    try {
      const QRCode = (await import('qrcode')).default
      const text = JSON.stringify({
        name: studentData.name,
        nisn: studentData.nisn,
        nis: studentData.nis,
        status: studentData.status,
        year: '2026',
        verified: true,
      })
      const url = await QRCode.toDataURL(text, { width: 200, margin: 2, color: { dark: '#1e3a5f', light: '#ffffff' } })
      setQrDataUrl(url)
    } catch {
      // QR generation failed silently
    }
  }

  const downloadPDF = async () => {
    if (!student) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Background gradient simulation
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 60, 'F')

    doc.setFillColor(255, 255, 255)
    doc.rect(0, 60, 210, 237, 'F')

    // Header
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('SERTIFIKAT KELULUSAN', 105, 25, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Kelas XII Tahun Ajaran 2025/2026', 105, 35, { align: 'center' })

    // Decorative line
    doc.setDrawColor(16, 185, 129)
    doc.setLineWidth(2)
    doc.line(30, 45, 180, 45)

    // Status badge
    doc.setFillColor(16, 185, 129)
    doc.roundedRect(75, 65, 60, 18, 5, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('LULUS', 105, 77, { align: 'center' })

    // Student info
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const startY = 100

    const fields = [
      ['Nama Lengkap', student.name],
      ['NISN', student.nisn],
      ['NIS', student.nis],
      ['Status', student.status],
      ['Tahun Lulus', '2026'],
    ]

    fields.forEach(([label, value], i) => {
      const y = startY + i * 18
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 116, 139)
      doc.text(`${label}:`, 30, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(value, 80, y)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(30, y + 4, 180, y + 4)
    })

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 75, 205, 60, 60)
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('Scan QR untuk verifikasi', 105, 270, { align: 'center' })
    }

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text('Dokumen ini diterbitkan secara digital oleh Sistem Pengumuman Kelulusan 2026', 105, 285, { align: 'center' })

    doc.save(`Sertifikat_Kelulusan_${student.name.replace(/\s+/g, '_')}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">X</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-300 dark:bg-blue-800 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-300 dark:bg-emerald-800 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">Selamat!</h1>
          <p className="text-slate-500 dark:text-slate-400">Anda dinyatakan <strong className="text-emerald-600 dark:text-emerald-400">LULUS</strong></p>
        </motion.div>

        {/* Student Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-glow mb-6"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">Sertifikat Kelulusan</p>
                <p className="font-bold text-lg">Kelas XII 2026</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{student.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">DINYATAKAN LULUS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'NISN', value: student.nisn },
                { label: 'NIS', value: student.nis },
                { label: 'Status', value: student.status },
                { label: 'Tahun', value: '2026' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{item.label}</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {qrDataUrl && (
              <div className="text-center border-t border-slate-100 dark:border-slate-700 pt-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">QR Code Verifikasi</p>
                <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl w-32 h-32" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <button
            onClick={downloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Beranda
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
