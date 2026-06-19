'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, GraduationCap, Users, Trophy, Shield, Search, Star, MessageCircle, Send, Clock } from 'lucide-react'

interface Message {
  id: number
  name: string
  message: string
  timestamp: string
}

interface Settings {
  announcementDate: string
  announcementActive: boolean
  schoolName: string
  principalName: string
  principalNip: string
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false })

  useEffect(() => {
    const calc = () => {
      const now = Date.now()
      const target = new Date(targetDate).getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        passed: false,
      })
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

export default function HomePage() {
  const [nisn, setNisn] = useState('')
  const [nis, setNis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [settings, setSettings] = useState<Settings>({
    announcementDate: '2026-06-19T08:00:00',
    announcementActive: true,
    schoolName: 'SMA Negeri 1',
    principalName: 'Drs. Budi Santoso, M.Pd.',
    principalNip: '196801011990031002',
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [announcementDate, setAnnouncementDate] = useState('2026-06-19T08:00:00')

  const [messages, setMessages] = useState<Message[]>([])
  const [msgName, setMsgName] = useState('')
  const [msgText, setMsgText] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState(false)
  const [msgError, setMsgError] = useState('')

  const countdown = useCountdown(announcementDate)

  useEffect(() => {
    const stored = localStorage.getItem('announcementDate')
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setSettings(d.settings)
          setAnnouncementDate(stored || d.settings.announcementDate)
        }
        setSettingsLoaded(true)
      })
      .catch(() => {
        if (stored) setAnnouncementDate(stored)
        setSettingsLoaded(true)
      })
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch {}
  }

  const isAnnouncementOpen = settings.announcementActive && countdown.passed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAnnouncementOpen) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, nis }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
      } else {
        router.push(`/result?nisn=${encodeURIComponent(nisn)}&nis=${encodeURIComponent(nis)}`)
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgLoading(true)
    setMsgError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, message: msgText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsgError(data.error || 'Gagal mengirim pesan')
      } else {
        setMsgName('')
        setMsgText('')
        setMsgSuccess(true)
        fetchMessages()
        setTimeout(() => setMsgSuccess(false), 3000)
      }
    } catch {
      setMsgError('Terjadi kesalahan jaringan')
    } finally {
      setMsgLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300 dark:bg-emerald-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-lg text-slate-800 dark:text-slate-100">Kelulusan 2026</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full glassmorphism hover:scale-110 transition-transform"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </motion.button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Tahun Ajaran 2025/2026
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-slate-800 dark:text-slate-100">Selamat</span>{' '}
            <span className="shimmer-text">Wisudawan!</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Sistem Pengumuman Kelulusan Kelas XII Tahun 2026.
            Masukkan NISN dan NIS Anda untuk melihat hasil kelulusan.
          </p>
        </motion.div>

        {/* Countdown Timer */}
        {settingsLoaded && !countdown.passed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-sm">Pengumuman akan dibuka dalam</span>
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {[
                  { value: countdown.days, label: 'Hari' },
                  { value: countdown.hours, label: 'Jam' },
                  { value: countdown.minutes, label: 'Menit' },
                  { value: countdown.seconds, label: 'Detik' },
                ].map((unit, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
                      <span className="text-xl sm:text-2xl font-black text-white leading-none">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span className="text-blue-200 text-xs font-medium mt-0.5">{unit.label}</span>
                    </div>
                    {i < 3 && <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12"
        >
          {[
            { icon: Users, label: 'Total Siswa', value: '100' },
            { icon: Trophy, label: 'Lulus', value: '100' },
            { icon: GraduationCap, label: 'Kelulusan', value: '100%' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="glassmorphism rounded-2xl p-4 text-center shadow-lg"
            >
              <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Check Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cek Kelulusan</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Masukkan data Anda</p>
              </div>
            </div>

            {settingsLoaded && !isAnnouncementOpen ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">⏳</div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-1">Pengumuman Belum Dibuka</h3>
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Silakan tunggu hingga tanggal pengumuman resmi dibuka.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    NISN (Nomor Induk Siswa Nasional)
                  </label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={e => setNisn(e.target.value)}
                    placeholder="Contoh: 1000000001"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    NIS (Nomor Induk Siswa)
                  </label>
                  <input
                    type="text"
                    value={nis}
                    onChange={e => setNis(e.target.value)}
                    placeholder="Contoh: XII001"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memeriksa...
                    </span>
                  ) : 'Cek Kelulusan Saya'}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16"
        >
          {[
            { icon: Shield, title: 'Aman & Terpercaya', desc: 'Data siswa dilindungi dengan enkripsi dan rate limiting untuk keamanan optimal.' },
            { icon: Trophy, title: 'Hasil Instan', desc: 'Dapatkan hasil kelulusan secara langsung dengan tampilan yang informatif.' },
            { icon: GraduationCap, title: 'Sertifikat Digital', desc: 'Download sertifikat kelulusan dalam format PDF dengan QR code verifikasi.' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pesan Wisuda */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              Pesan Wisuda
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Sampaikan Selamatmu</h2>
            <p className="text-slate-500 dark:text-slate-400">Kirim pesan semangat untuk para wisudawan 2026</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Anda</label>
                <input
                  type="text"
                  value={msgName}
                  onChange={e => setMsgName(e.target.value)}
                  placeholder="Nama pengirim..."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pesan <span className="text-slate-400 font-normal">({msgText.length}/500)</span>
                </label>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Tulis pesan selamat atau motivasi..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm resize-none"
                  required
                />
              </div>
              {msgError && <p className="text-red-500 text-sm">{msgError}</p>}
              {msgSuccess && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  Pesan terkirim! Terima kasih.
                </motion.p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={msgLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {msgLoading ? 'Mengirim...' : 'Kirim Pesan'}
              </motion.button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{msg.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
                        {new Date(msg.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Belum ada pesan. Jadilah yang pertama mengirim pesan!
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 text-center py-8 text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800">
        <p>Sistem Pengumuman Kelulusan Kelas XII 2026</p>
        <p className="mt-1">Hak Cipta &copy; {new Date().getFullYear()} - Semua Hak Dilindungi</p>
      </footer>
    </div>
  )
}
