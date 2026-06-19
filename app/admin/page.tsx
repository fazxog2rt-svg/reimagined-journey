'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Users, Plus, Search, Edit2, Trash2, Download, X, Check, Activity, Settings, Upload, Send, Phone, MessageSquare, BarChart2, Copy, Link } from 'lucide-react'

const VENUE = 'The Grand Livina'
const VENUE_LOCATION = 'Cibubur, Jawa Timur'
const EVENT_DATE = 'Kamis, 25 Juni 2026'
const EVENT_TIME = '08.00 WIB'

interface Student {
  id: number
  name: string
  nisn: string
  nis: string
  status: 'LULUS' | 'TIDAK LULUS' | 'Proses Susulan'
  kelas?: string
  keterangan?: string
  phone?: string
}

interface EditingStudent {
  id: number
  name: string
  nisn: string
  nis: string
  status: 'LULUS' | 'TIDAK LULUS' | 'Proses Susulan'
  kelas: string
  keterangan: string
  phone: string
}

interface ActivityLog {
  id: number
  timestamp: string
  nisn: string
  nis: string
  found: boolean
  ip: string
}

interface SiteSettings {
  announcementDate: string
  announcementActive: boolean
  schoolName: string
  principalName: string
  principalNip: string
  logoUrl: string
  primaryColor: string
  accessStartTime: string
  accessEndTime: string
  accessTimeEnabled: boolean
  waBotEnabled: boolean
  waPhoneNumber: string
  waBotServerUrl: string
  waBotApiKey: string
}

interface WaBotState {
  status: 'disconnected' | 'qr' | 'qr_ready' | 'connected' | 'connecting' | 'no_server' | 'error'
  qr?: string
  phone?: string
}

type Tab = 'students' | 'logs' | 'settings' | 'undangan' | 'wabot' | 'analitik'
type StatusFilter = 'Semua' | 'LULUS' | 'TIDAK LULUS' | 'Proses Susulan'

const INVITE_MESSAGE = (name: string, schoolName: string) =>
  `Assalamu'alaikum Wr. Wb.\n\nYth. *${name}*\n\nDengan penuh kebahagiaan, kami mengucapkan selamat atas kelulusan Anda dari *${schoolName}* Tahun Ajaran 2025/2026.\n\n📍 *Undangan Wisuda*\n🏨 Venue: *${VENUE}*\n📍 Lokasi: *${VENUE_LOCATION}*\n📅 Tanggal: *${EVENT_DATE}*\n⏰ Waktu: *${EVENT_TIME}* s.d. selesai\n\nHarap hadir tepat waktu dengan mengenakan pakaian resmi. Mohon tunjukkan pesan ini kepada panitia sebagai bukti undangan.\n\nTerima kasih dan sampai jumpa di hari yang bersejarah ini! 🎓\n\nWassalamu'alaikum Wr. Wb.\n\n_${schoolName}_`

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('students')

  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua')
  const [kelasFilter, setKelasFilter] = useState('Semua')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null)
  const [newStudent, setNewStudent] = useState({ name: '', nisn: '', nis: '', status: 'LULUS' as Student['status'], kelas: '', keterangan: '', phone: '' })
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<Student['status']>('LULUS')

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const [settings, setSettings] = useState<SiteSettings>({
    announcementDate: '',
    announcementActive: true,
    schoolName: '',
    principalName: '',
    principalNip: '',
    logoUrl: '',
    primaryColor: '#2563EB',
    accessStartTime: '08:00',
    accessEndTime: '23:59',
    accessTimeEnabled: false,
    waBotEnabled: false,
    waPhoneNumber: '',
    waBotServerUrl: '',
    waBotApiKey: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [waBotState, setWaBotState] = useState<WaBotState>({ status: 'disconnected' })
  const [waBotLoading, setWaBotLoading] = useState(false)
  const [waAutoSend, setWaAutoSend] = useState(false)
  const [waOtpVerify, setWaOtpVerify] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState('')
  const [sentCount, setSentCount] = useState(0)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) { setToken(savedToken); setIsLoggedIn(true) }
  }, [])

  useEffect(() => {
    if (isLoggedIn && token) { fetchStudents(); fetchSettings() }
  }, [isLoggedIn, token])

  useEffect(() => {
    if (isLoggedIn && token && activeTab === 'logs') fetchLogs()
    if (isLoggedIn && token && activeTab === 'wabot') fetchWaBot()
  }, [activeTab, isLoggedIn, token])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('')
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error) }
      else { localStorage.setItem('adminToken', data.token); setToken(data.token); setIsLoggedIn(true) }
    } catch { setLoginError('Terjadi kesalahan jaringan') }
    finally { setLoginLoading(false) }
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setStudents(data.students)
    } finally { setLoadingStudents(false) }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setLogs(data.logs)
    } finally { setLoadingLogs(false) }
  }

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings')
    const data = await res.json()
    if (res.ok) setSettings(data.settings)
  }

  const fetchWaBot = async () => {
    try {
      const res = await fetch('/api/admin/wa-bot', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) {
        // If connecting/qr_ready, also try to fetch the QR image
        if (data.status === 'qr_ready' || data.hasQR) {
          const qrRes = await fetch('/api/admin/wa-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'qr' }),
          })
          if (qrRes.ok) {
            const qrData = await qrRes.json()
            setWaBotState({ ...data, status: 'qr', qr: qrData.qr })
            return
          }
        }
        setWaBotState(data)
      }
    } catch {}
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setDuplicateWarning('')
    const dup = students.find(s => s.nisn === newStudent.nisn)
    if (dup) {
      setDuplicateWarning(`⚠️ NISN ${newStudent.nisn} sudah digunakan oleh ${dup.name}. Lanjutkan?`)
    }
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newStudent),
    })
    if (res.ok) {
      setNewStudent({ name: '', nisn: '', nis: '', status: 'LULUS', kelas: '', keterangan: '', phone: '' })
      setShowAddForm(false)
      setDuplicateWarning('')
      fetchStudents()
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    const res = await fetch('/api/admin/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editingStudent),
    })
    if (res.ok) { setEditingStudent(null); fetchStudents() }
  }

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Hapus siswa ini?')) return
    await fetch('/api/admin/students', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
    fetchStudents()
  }

  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Ubah status ${selectedIds.size} siswa terpilih menjadi "${bulkStatus}"?`)) return
    for (const id of selectedIds) {
      const student = students.find(s => s.id === id)
      if (!student) continue
      await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...student, status: bulkStatus }),
      })
    }
    setSelectedIds(new Set())
    fetchStudents()
  }

  const handleLogout = () => { localStorage.removeItem('adminToken'); setToken(''); setIsLoggedIn(false); setStudents([]) }

  const exportCSV = () => {
    const header = 'ID,Nama,NISN,NIS,Kelas,Status,Keterangan,No HP\n'
    const rows = students.map(s => `${s.id},"${s.name}",${s.nisn},${s.nis},"${s.kelas || ''}",${s.status},"${s.keterangan || ''}","${s.phone || ''}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'data_siswa_2026.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImportStatus('Memproses...')
    const text = await file.text()
    const lines = text.trim().split('\n').slice(1)
    let imported = 0, failed = 0
    for (const line of lines) {
      const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim())
      const [, name, nisn, nis, kelas, status, keterangan, phone] = parts
      if (!name || !nisn || !nis) { failed++; continue }
      const validStatus: Student['status'] = status === 'TIDAK LULUS' ? 'TIDAK LULUS' : status === 'Proses Susulan' ? 'Proses Susulan' : 'LULUS'
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, nisn, nis, kelas: kelas || '', status: validStatus, keterangan: keterangan || '', phone: phone || '' }),
      })
      if (res.ok) imported++; else failed++
    }
    setImportStatus(`Berhasil import ${imported} siswa${failed > 0 ? `, ${failed} gagal` : ''}.`)
    fetchStudents()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) })
      if (res.ok) { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000) }
    } finally { setSavingSettings(false) }
  }

  const sendInviteWA = (student: Student) => {
    const phone = student.phone?.replace(/\D/g, '')
    const msg = INVITE_MESSAGE(student.name, settings.schoolName || 'Sekolah')
    if (phone) {
      window.open(`https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    }
    setSentCount(c => c + 1)
  }

  const sendAllInvites = () => {
    const lulusWithPhone = students.filter(s => s.status === 'LULUS' && s.phone)
    if (lulusWithPhone.length === 0) { alert('Tidak ada siswa LULUS dengan nomor HP yang tersimpan.'); return }
    if (!confirm(`Kirim undangan WhatsApp ke ${lulusWithPhone.length} siswa LULUS?`)) return
    lulusWithPhone.forEach((s, i) => setTimeout(() => sendInviteWA(s), i * 800))
  }

  const handleWaBotConnect = async () => {
    setWaBotLoading(true)
    try {
      const res = await fetch('/api/admin/wa-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'connect' }),
      })
      const data = await res.json()
      if (res.ok) setWaBotState({ ...data, status: data.status === 'connecting' ? 'connecting' : data.status })
      // Start polling for QR / connected status
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        await fetchWaBot()
        const currentState = await fetch('/api/admin/wa-bot', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).catch(() => null)
        if (!currentState) { clearInterval(poll); return }
        if (currentState.status === 'connected' || attempts > 30) clearInterval(poll)
      }, 3000)
    } finally { setWaBotLoading(false) }
  }

  const handleWaBotDisconnect = async () => {
    setWaBotLoading(true)
    try {
      const res = await fetch('/api/admin/wa-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      const data = await res.json()
      if (res.ok) setWaBotState({ status: 'disconnected' })
    } finally { setWaBotLoading(false) }
  }

  const sendViaBot = async (student: Student) => {
    const msg = INVITE_MESSAGE(student.name, settings.schoolName)
    const res = await fetch('/api/admin/wa-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'send', phone: student.phone, message: msg }),
    })
    if (res.ok) setSentCount(c => c + 1)
    else alert('Gagal kirim via bot. Pastikan bot terhubung.')
  }

  const sendAllViaBot = async () => {
    const lulusWithPhone = students.filter(s => s.status === 'LULUS' && s.phone)
    if (lulusWithPhone.length === 0) { alert('Tidak ada siswa LULUS dengan nomor HP.'); return }
    if (!confirm(`Kirim ${lulusWithPhone.length} undangan via WA Bot?`)) return
    const recipients = lulusWithPhone.map(s => ({
      phone: s.phone!,
      message: INVITE_MESSAGE(s.name, settings.schoolName),
    }))
    const res = await fetch('/api/admin/wa-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'send-bulk', recipients }),
    })
    const data = await res.json()
    if (res.ok) {
      const success = data.results?.filter((r: { success: boolean }) => r.success).length || 0
      alert(`Berhasil terkirim: ${success}/${lulusWithPhone.length}`)
      setSentCount(c => c + success)
    } else alert('Gagal kirim bulk. Pastikan bot terhubung.')
  }

  const allKelas = Array.from(new Set(students.map(s => s.kelas).filter(Boolean))).sort() as string[]

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'Semua' || s.status === statusFilter
    const matchKelas = kelasFilter === 'Semua' || s.kelas === kelasFilter
    return matchSearch && matchStatus && matchKelas
  })

  const lulusStudents = students.filter(s => s.status === 'LULUS')
  const tidakLulusStudents = students.filter(s => s.status === 'TIDAK LULUS')
  const prosesSusulanStudents = students.filter(s => s.status === 'Proses Susulan')

  // Analytics data
  const today = new Date().toDateString()
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today)
  const successLogs = logs.filter(l => l.found)
  const successRate = logs.length > 0 ? Math.round((successLogs.length / logs.length) * 100) : 0
  const nisnCounts = logs.reduce<Record<string, number>>((acc, l) => { acc[l.nisn] = (acc[l.nisn] || 0) + 1; return acc }, {})
  const mostCheckedNisn = Object.entries(nisnCounts).sort((a, b) => b[1] - a[1])[0]
  const mostCheckedStudent = mostCheckedNisn ? students.find(s => s.nisn === mostCheckedNisn[0]) : null

  // Hourly breakdown last 24h
  const now = new Date()
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const h = (now.getHours() - 23 + i + 24) % 24
    const count = logs.filter(l => {
      const logDate = new Date(l.timestamp)
      const diffH = (now.getTime() - logDate.getTime()) / 3600000
      return diffH <= 24 && logDate.getHours() === h
    }).length
    return { hour: h, count }
  })
  const maxHourly = Math.max(...hourlyData.map(d => d.count), 1)

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)))
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><Users className="w-7 h-7 text-white" /></div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Sistem Pengumuman Kelulusan 2026</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
            </div>
            {loginError && <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">{loginError}</div>}
            <button type="submit" disabled={loginLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
              {loginLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-xl whitespace-nowrap">
          ✓ {toast}
        </div>
      )}

      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">Kelulusan 2026</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
            <LogOut className="w-4 h-4" /><span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Siswa', value: students.length, color: 'bg-blue-500' },
            { label: 'Lulus', value: lulusStudents.length, color: 'bg-emerald-500' },
            { label: 'Belum Lulus', value: tidakLulusStudents.length, color: 'bg-red-500' },
            { label: 'Proses Susulan', value: prosesSusulanStudents.length, color: 'bg-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className={`w-8 h-8 ${stat.color} rounded-lg mb-3`} />
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-200 dark:bg-slate-800 rounded-xl p-1 w-fit flex-wrap">
          {([
            { id: 'students', label: 'Data Siswa', icon: Users },
            { id: 'undangan', label: 'Undangan Wisuda', icon: Send },
            { id: 'logs', label: 'Log Aktivitas', icon: Activity },
            { id: 'wabot', label: 'WhatsApp Bot', icon: MessageSquare },
            { id: 'analitik', label: 'Analitik', icon: BarChart2 },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Data Siswa */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama, NISN, atau NIS..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Semua">Semua Status</option>
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                  <option value="Proses Susulan">Proses Susulan</option>
                </select>
                <select value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Semua">Semua Kelas</option>
                  {allKelas.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition">
                  <Upload className="w-4 h-4" />Import
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition">
                  <Download className="w-4 h-4" />Export
                </button>
                <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                  <Plus className="w-4 h-4" />Tambah
                </button>
              </div>
            </div>

            {/* Bulk edit bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} terpilih</span>
                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as Student['status'])}
                  className="px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm">
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                  <option value="Proses Susulan">Proses Susulan</option>
                </select>
                <button onClick={handleBulkStatusChange} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  Ubah Status Terpilih
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Batal</button>
              </div>
            )}

            {importStatus && (
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-xl px-4 py-3 text-sm mb-4">{importStatus}</div>
            )}

            {showAddForm && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddStudent}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Tambah Siswa Baru</h3>
                {duplicateWarning && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2 text-sm mb-3">{duplicateWarning}</div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <input type="text" placeholder="Nama lengkap" value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input type="text" placeholder="NISN" value={newStudent.nisn} onChange={e => {
                    const v = e.target.value
                    setNewStudent(p => ({ ...p, nisn: v }))
                    const dup = students.find(s => s.nisn === v)
                    setDuplicateWarning(dup ? `⚠️ NISN ini sudah digunakan oleh: ${dup.name}` : '')
                  }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input type="text" placeholder="NIS" value={newStudent.nis} onChange={e => setNewStudent(p => ({ ...p, nis: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input type="text" placeholder="Kelas (mis. XII IPA 1)" value={newStudent.kelas} onChange={e => setNewStudent(p => ({ ...p, kelas: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="tel" placeholder="No HP (08xxx)" value={newStudent.phone} onChange={e => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={newStudent.status} onChange={e => setNewStudent(p => ({ ...p, status: e.target.value as Student['status'] }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="LULUS">LULUS</option>
                    <option value="TIDAK LULUS">TIDAK LULUS</option>
                    <option value="Proses Susulan">Proses Susulan</option>
                  </select>
                  {(newStudent.status === 'TIDAK LULUS' || newStudent.status === 'Proses Susulan') && (
                    <input type="text" placeholder="Keterangan" value={newStudent.keterangan} onChange={e => setNewStudent(p => ({ ...p, keterangan: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"><Check className="w-3 h-3" />Simpan</button>
                  <button type="button" onClick={() => { setShowAddForm(false); setDuplicateWarning('') }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm"><X className="w-3 h-3" />Batal</button>
                </div>
              </motion.form>
            )}

            {editingStudent && (
              <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleEditStudent}
                className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-4 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Edit Siswa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <input type="text" value={editingStudent.name} onChange={e => setEditingStudent(p => p ? { ...p, name: e.target.value } : p)}
                    placeholder="Nama" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={editingStudent.nisn} onChange={e => setEditingStudent(p => p ? { ...p, nisn: e.target.value } : p)}
                    placeholder="NISN" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={editingStudent.nis} onChange={e => setEditingStudent(p => p ? { ...p, nis: e.target.value } : p)}
                    placeholder="NIS" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={editingStudent.kelas} onChange={e => setEditingStudent(p => p ? { ...p, kelas: e.target.value } : p)}
                    placeholder="Kelas" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="tel" value={editingStudent.phone} onChange={e => setEditingStudent(p => p ? { ...p, phone: e.target.value } : p)}
                    placeholder="No HP (08xxx)" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={editingStudent.status} onChange={e => setEditingStudent(p => p ? { ...p, status: e.target.value as Student['status'] } : p)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    <option value="LULUS">LULUS</option>
                    <option value="TIDAK LULUS">TIDAK LULUS</option>
                    <option value="Proses Susulan">Proses Susulan</option>
                  </select>
                  {(editingStudent.status === 'TIDAK LULUS' || editingStudent.status === 'Proses Susulan') && (
                    <input type="text" value={editingStudent.keterangan} onChange={e => setEditingStudent(p => p ? { ...p, keterangan: e.target.value } : p)}
                      placeholder="Keterangan" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 col-span-2" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium"><Check className="w-3 h-3" />Update</button>
                  <button type="button" onClick={() => setEditingStudent(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm"><X className="w-3 h-3" />Batal</button>
                </div>
              </motion.form>
            )}

            {loadingStudents ? (
              <div className="text-center py-12 text-slate-500">Memuat data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-2 text-left">
                        <input type="checkbox" checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                          onChange={toggleSelectAll} className="rounded" />
                      </th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">No</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Nama</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">NISN</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">NIS</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Kelas</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">No HP</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={s.id} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selectedIds.has(s.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                        <td className="py-3 px-2">
                          <input type="checkbox" checked={selectedIds.has(s.id)}
                            onChange={() => {
                              const next = new Set(selectedIds)
                              if (next.has(s.id)) next.delete(s.id); else next.add(s.id)
                              setSelectedIds(next)
                            }} className="rounded" />
                        </td>
                        <td className="py-3 px-2 text-slate-500">{i + 1}</td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-slate-800 dark:text-slate-100">{s.name}</div>
                          {s.keterangan && <div className="text-xs text-red-500 mt-0.5">⚠️ {s.keterangan}</div>}
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300 font-mono text-xs">{s.nisn}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{s.nis}</td>
                        <td className="py-3 px-2 text-slate-500 text-xs">{s.kelas || '-'}</td>
                        <td className="py-3 px-2 text-slate-500 text-xs font-mono">{s.phone || '-'}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                            s.status === 'LULUS'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : s.status === 'Proses Susulan'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => {
                              const sl = `${window.location.origin}/s/${s.nis}`
                              navigator.clipboard.writeText(sl)
                              showToast('Short link disalin!')
                            }} title={`/s/${s.nis}`}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                              <Link className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingStudent({ id: s.id, name: s.name, nisn: s.nisn, nis: s.nis, status: s.status, kelas: s.kelas || '', keterangan: s.keterangan || '', phone: s.phone || '' })}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                            {s.status === 'LULUS' && (
                              <button onClick={() => sendInviteWA(s)} title="Kirim undangan WA"
                                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition"><Send className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => handleDeleteStudent(s.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && <div className="text-center py-12 text-slate-400">Tidak ada data ditemukan</div>}
              </div>
            )}
          </div>
        )}

        {/* Tab: Undangan Wisuda */}
        {activeTab === 'undangan' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎓</div>
                <div>
                  <h2 className="text-xl font-black mb-1">Wisuda Kelas XII Tahun 2026</h2>
                  <div className="space-y-1 text-white/90 text-sm">
                    <p>🏨 Venue: <strong>{VENUE}</strong></p>
                    <p>📍 Lokasi: <strong>{VENUE_LOCATION}</strong></p>
                    <p>📅 Tanggal: <strong>{EVENT_DATE}</strong></p>
                    <p>⏰ Waktu: <strong>{EVENT_TIME}</strong> s.d. selesai</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Kirim Undangan Massal</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {lulusStudents.filter(s => s.phone).length} dari {lulusStudents.length} siswa LULUS punya nomor HP
                  </p>
                </div>
                <button onClick={sendAllInvites}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                  <Send className="w-4 h-4" /> Kirim Semua via WhatsApp
                </button>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                💡 <strong>Tips:</strong> Isi nomor HP siswa terlebih dahulu di tab &quot;Data Siswa&quot;.
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Daftar Siswa LULUS ({lulusStudents.length} siswa)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">No</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Nama</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">NIS</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">No HP</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Kirim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lulusStudents.map((s, i) => (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="py-3 px-2 text-slate-500">{i + 1}</td>
                        <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{s.nis}</td>
                        <td className="py-3 px-2">
                          {s.phone ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                              <Phone className="w-3 h-3" />{s.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Belum diisi</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <button onClick={() => sendInviteWA(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                            <Send className="w-3 h-3" /> Kirim WA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Preview Pesan Undangan</h3>
              <div className="bg-[#ECE5DD] rounded-2xl p-4">
                <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-sm shadow-sm text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {INVITE_MESSAGE('[Nama Siswa]', settings.schoolName || 'Nama Sekolah')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Log Aktivitas */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Log Aktivitas Pencarian</h2>
              <button onClick={fetchLogs} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Refresh</button>
            </div>
            {loadingLogs ? (
              <div className="text-center py-12 text-slate-500">Memuat log...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Belum ada aktivitas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Waktu</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">NISN</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">NIS</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="py-3 px-2 text-slate-500 text-xs font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-2 font-mono text-xs text-slate-700 dark:text-slate-300">{log.nisn}</td>
                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{log.nis}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${log.found ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {log.found ? 'Ditemukan' : 'Tidak Ditemukan'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 text-xs font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: WhatsApp Bot */}
        {activeTab === 'wabot' && (
          <div className="space-y-6 max-w-2xl">
            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">ℹ️ Tentang WhatsApp Bot</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Bot WA digunakan untuk kirim undangan otomatis dan kode OTP verifikasi. Hubungkan nomor WhatsApp sekolah dengan memindai QR code yang muncul.</p>
            </div>

            {/* Status card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Status Koneksi Bot</h3>
                <span className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full ${
                  waBotState.status === 'connected'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : (waBotState.status === 'qr' || waBotState.status === 'qr_ready')
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : waBotState.status === 'connecting'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    waBotState.status === 'connected' ? 'bg-emerald-500'
                    : (waBotState.status === 'qr' || waBotState.status === 'qr_ready') ? 'bg-amber-500 animate-pulse'
                    : waBotState.status === 'connecting' ? 'bg-blue-500 animate-pulse'
                    : 'bg-slate-400'
                  }`} />
                  {waBotState.status === 'connected' ? 'Terhubung'
                    : (waBotState.status === 'qr' || waBotState.status === 'qr_ready') ? 'Menunggu Scan QR'
                    : waBotState.status === 'connecting' ? 'Menghubungkan...'
                    : waBotState.status === 'no_server' ? 'Server Belum Dikonfigurasi'
                    : 'Tidak Terhubung'}
                </span>
              </div>

              {waBotState.status === 'no_server' && (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">⚙️</div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">URL server WA Bot belum diatur.</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Isi URL server dan API key di tab <strong>Pengaturan</strong> terlebih dahulu.</p>
                </div>
              )}

              {(waBotState.status === 'disconnected' || waBotState.status === 'error') && (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">📱</div>
                  {waBotState.status === 'error' && (
                    <p className="text-red-500 text-sm mb-2">Tidak dapat terhubung ke server WA Bot. Pastikan server berjalan.</p>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Bot belum terhubung. Klik tombol di bawah untuk memulai koneksi.</p>
                  <button onClick={handleWaBotConnect} disabled={waBotLoading}
                    className="px-6 py-3 rounded-xl font-bold text-white disabled:opacity-60 transition"
                    style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                    {waBotLoading ? 'Memproses...' : '📲 Hubungkan WhatsApp'}
                  </button>
                </div>
              )}

              {waBotState.status === 'connecting' && (
                <div className="text-center py-6">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Menghubungkan ke server WhatsApp, QR code akan muncul sebentar lagi...</p>
                  <button onClick={fetchWaBot} className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline">Refresh status</button>
                </div>
              )}

              {(waBotState.status === 'qr' || waBotState.status === 'qr_ready') && waBotState.qr && (
                <div className="text-center py-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Buka WhatsApp &gt; Perangkat Tertaut &gt; Pindai QR code berikut:</p>
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                    <img src={waBotState.qr} alt="QR Code WhatsApp" className="w-56 h-56" />
                  </div>
                  <p className="text-xs text-slate-400 mt-3">QR code berlaku selama 60 detik — perbarui jika kadaluarsa</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button onClick={fetchWaBot} disabled={waBotLoading}
                      className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      Perbarui QR
                    </button>
                    <button onClick={handleWaBotDisconnect} disabled={waBotLoading}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {(waBotState.status === 'qr' || waBotState.status === 'qr_ready') && !waBotState.qr && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Menunggu QR code dari server...</p>
                  <button onClick={fetchWaBot} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Refresh</button>
                </div>
              )}

              {waBotState.status === 'connected' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">Bot Terhubung</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">{waBotState.phone ? `+${waBotState.phone}` : 'Nomor tidak diketahui'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={sendAllViaBot}
                      className="py-2.5 rounded-xl font-medium text-sm text-white transition"
                      style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                      📨 Kirim Semua Undangan
                    </button>
                    <button onClick={handleWaBotDisconnect} disabled={waBotLoading}
                      className="py-2.5 rounded-xl font-medium text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition">
                      {waBotLoading ? 'Memproses...' : '🔌 Putuskan Koneksi'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Pengaturan Bot</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Kirim Undangan Otomatis</p>
                    <p className="text-xs text-slate-400 mt-0.5">Kirim undangan wisuda secara otomatis ke siswa LULUS</p>
                  </div>
                  <button onClick={() => setWaAutoSend(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${waAutoSend ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${waAutoSend ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Verifikasi OTP</p>
                    <p className="text-xs text-slate-400 mt-0.5">Kirim kode OTP untuk verifikasi identitas siswa</p>
                  </div>
                  <button onClick={() => setWaOtpVerify(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${waOtpVerify ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${waOtpVerify ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Analitik */}
        {activeTab === 'analitik' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Pencarian Hari Ini', value: todayLogs.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
                { label: 'Total Pencarian', value: logs.length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
                { label: 'Success Rate', value: `${successRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
                { label: 'Paling Dicari', value: mostCheckedStudent ? mostCheckedStudent.name.split(' ')[0] : '-', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Most checked student detail */}
            {mostCheckedStudent && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Siswa Paling Sering Dicek</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl font-black text-amber-600">
                    {mostCheckedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{mostCheckedStudent.name}</p>
                    <p className="text-sm text-slate-500">NISN: {mostCheckedStudent.nisn} | NIS: {mostCheckedStudent.nis}</p>
                    <p className="text-sm text-amber-600 font-medium">{mostCheckedNisn?.[1] || 0}x dicek</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Pencarian Per Jam (24 Jam Terakhir)</h3>
              <div className="flex items-end gap-1 h-32">
                {hourlyData.map(({ hour, count }) => (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all"
                      style={{ height: `${Math.max((count / maxHourly) * 100, count > 0 ? 4 : 0)}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`${hour}:00 — ${count} pencarian`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{hourlyData[0]?.hour}:00</span>
                <span>{hourlyData[12]?.hour}:00</span>
                <span>{hourlyData[23]?.hour}:00</span>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Distribusi Status Siswa</h3>
              <div className="space-y-3">
                {[
                  { label: 'LULUS', count: lulusStudents.length, color: 'bg-emerald-500', total: students.length },
                  { label: 'TIDAK LULUS', count: tidakLulusStudents.length, color: 'bg-red-500', total: students.length },
                  { label: 'Proses Susulan', count: prosesSusulanStudents.length, color: 'bg-amber-500', total: students.length },
                ].map(({ label, count, color, total }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                      <span className="text-slate-500">{count} siswa ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pengaturan */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-6">Pengaturan Situs</h2>
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Sekolah</label>
                <input type="text" value={settings.schoolName} onChange={e => setSettings(p => ({ ...p, schoolName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Kepala Sekolah</label>
                <input type="text" value={settings.principalName} onChange={e => setSettings(p => ({ ...p, principalName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">NIP Kepala Sekolah</label>
                <input type="text" value={settings.principalNip} onChange={e => setSettings(p => ({ ...p, principalNip: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal &amp; Waktu Pengumuman</label>
                <input type="datetime-local" value={settings.announcementDate.slice(0, 16)} onChange={e => setSettings(p => ({ ...p, announcementDate: e.target.value + ':00' }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSettings(p => ({ ...p, announcementActive: !p.announcementActive }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.announcementActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.announcementActive ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">Pengumuman {settings.announcementActive ? 'Aktif' : 'Tidak Aktif'}</span>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Logo Sekolah</label>
                <input type="url" value={settings.logoUrl} onChange={e => setSettings(p => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {settings.logoUrl && (
                  <div className="mt-2">
                    <img src={settings.logoUrl} alt="Preview Logo" className="h-16 w-auto rounded-lg border border-slate-200 dark:border-slate-600 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
              </div>

              {/* Primary color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warna Utama</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.primaryColor} onChange={e => setSettings(p => ({ ...p, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" />
                  <input type="text" value={settings.primaryColor} onChange={e => setSettings(p => ({ ...p, primaryColor: e.target.value }))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>
              </div>

              {/* Time restriction */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setSettings(p => ({ ...p, accessTimeEnabled: !p.accessTimeEnabled }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.accessTimeEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.accessTimeEnabled ? 'translate-x-6' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Batasi Jam Akses</span>
                </div>
                {settings.accessTimeEnabled && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Jam Mulai</label>
                      <input type="time" value={settings.accessStartTime} onChange={e => setSettings(p => ({ ...p, accessStartTime: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <span className="text-slate-400 mt-4">—</span>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Jam Selesai</label>
                      <input type="time" value={settings.accessEndTime} onChange={e => setSettings(p => ({ ...p, accessEndTime: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* WA bot settings */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">📱 WhatsApp Bot Server</p>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">URL Server Baileys</label>
                  <input type="url" value={settings.waBotServerUrl} onChange={e => setSettings(p => ({ ...p, waBotServerUrl: e.target.value }))}
                    placeholder="http://ip-server-kamu:3001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">API Key Server</label>
                  <input type="text" value={settings.waBotApiKey} onChange={e => setSettings(p => ({ ...p, waBotApiKey: e.target.value }))}
                    placeholder="wa-bot-secret-2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nomor WA Bot (opsional, info saja)</label>
                  <input type="tel" value={settings.waPhoneNumber} onChange={e => setSettings(p => ({ ...p, waPhoneNumber: e.target.value }))}
                    placeholder="628xxxxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Deploy <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">wa-server/</code> di server kamu, lalu isi URL dan API key di sini.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={savingSettings} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:opacity-60">
                  {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
                {settingsSaved && <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1"><Check className="w-4 h-4" />Tersimpan!</span>}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
