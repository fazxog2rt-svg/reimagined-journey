'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, LogIn, LogOut, Users, Plus, Edit2, Trash2, Download, Shield, Search, X, Check, Moon, Sun } from 'lucide-react'

interface Student {
  id: number
  name: string
  nisn: string
  nis: string
  status: string
  kelas?: string
}

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [dark, setDark] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({ name: '', nisn: '', nis: '', kelas: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') { setDark(true); document.documentElement.classList.add('dark') }
    const savedToken = sessionStorage.getItem('adminToken')
    if (savedToken) { setToken(savedToken); fetchStudents(savedToken) }
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark') }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light') }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error); return }
      setToken(data.token)
      sessionStorage.setItem('adminToken', data.token)
      await fetchStudents(data.token)
    } catch {
      setLoginError('Gagal terhubung ke server.')
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchStudents = async (t: string) => {
    try {
      const res = await fetch('/api/admin/students', { headers: { Authorization: `Bearer ${t}` } })
      if (!res.ok) { setToken(''); return }
      const data = await res.json()
      setStudents(data.students || data)
    } catch { setToken('') }
  }

  const handleLogout = () => {
    setToken('')
    sessionStorage.removeItem('adminToken')
    setStudents([])
  }

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (addMode) {
        const res = await fetch('/api/admin/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        })
        if (res.ok) { await fetchStudents(token); setAddMode(false); setForm({ name: '', nisn: '', nis: '', kelas: 'XII' }); showMsg('Siswa berhasil ditambahkan!') }
      } else if (editStudent) {
        const res = await fetch('/api/admin/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...form, id: editStudent.id }),
        })
        if (res.ok) { await fetchStudents(token); setEditStudent(null); showMsg('Data berhasil diperbarui!') }
      }
    } catch { showMsg('Terjadi kesalahan.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { await fetchStudents(token); setDeleteId(null); showMsg('Siswa berhasil dihapus!') }
    } catch { showMsg('Terjadi kesalahan.') }
  }

  const exportCSV = () => {
    const rows = [['No', 'Nama', 'NISN', 'NIS', 'Kelas', 'Status']]
    students.forEach((s, i) => rows.push([String(i + 1), s.name, s.nisn, s.nis, s.kelas || '', s.status]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data_siswa_kelulusan_2026.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn.includes(search) ||
    s.nis.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (s: Student) => {
    setEditStudent(s)
    setAddMode(false)
    setForm({ name: s.name, nisn: s.nisn, nis: s.nis, kelas: s.kelas || '' })
  }

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="absolute top-4 right-4">
          <button onClick={toggleDark} className={`p-2 rounded-xl ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black">Admin Dashboard</h1>
            <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Sistem Pengumuman Kelulusan 2026</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin"
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`} />
            </div>
            {loginError && <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">⚠️ {loginError}</div>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}>
              {loginLoading ? <span className="animate-spin">⟳</span> : <LogIn className="w-5 h-5" />}
              {loginLoading ? 'Masuk...' : 'MASUK'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" /> {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={`sticky top-0 z-40 px-6 py-4 border-b backdrop-blur-md flex items-center justify-between ${dark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">Admin Dashboard</div>
            <div className="text-xs text-blue-600">Kelulusan Kelas XII 2026</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className={`p-2 rounded-xl ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Siswa', value: students.length, icon: Users, color: 'blue' },
            { label: 'Total Lulus', value: students.filter(s => s.status === 'LULUS').length, icon: Check, color: 'emerald' },
            { label: 'Persentase', value: students.length > 0 ? `${Math.round(students.filter(s => s.status === 'LULUS').length / students.length * 100)}%` : '0%', icon: GraduationCap, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className={`p-5 rounded-2xl border shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
              <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table controls */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`px-6 py-4 border-b flex flex-wrap gap-3 items-center justify-between ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
            <h2 className="font-bold">Data Siswa</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari siswa..."
                  className={`pl-9 pr-4 py-2 text-sm rounded-xl border outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`} />
              </div>
              <button onClick={() => { setAddMode(true); setEditStudent(null); setForm({ name: '', nisn: '', nis: '', kelas: '' }) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}>
                <Plus className="w-4 h-4" /> Tambah
              </button>
              <button onClick={exportCSV}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Add/Edit form */}
          <AnimatePresence>
            {(addMode || editStudent) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className={`border-b overflow-hidden ${dark ? 'border-slate-700 bg-slate-750' : 'border-slate-100 bg-blue-50'}`}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">{addMode ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}</h3>
                    <button onClick={() => { setAddMode(false); setEditStudent(null) }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { key: 'name', label: 'Nama Lengkap', placeholder: 'Muhammad Azzam' },
                      { key: 'nisn', label: 'NISN', placeholder: '1000000001' },
                      { key: 'nis', label: 'NIS', placeholder: 'XII001' },
                      { key: 'kelas', label: 'Kelas', placeholder: 'XII IPA 1' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold mb-1">{field.label}</label>
                        <input value={form[field.key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 focus:border-blue-500'}`} />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={dark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                  {['No', 'Nama', 'NISN', 'NIS', 'Kelas', 'Status', 'Aksi'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-t transition-colors ${dark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">{s.nisn}</td>
                    <td className="px-4 py-3 font-mono">{s.nis}</td>
                    <td className="px-4 py-3">{s.kelas}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className={`py-12 text-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tidak ada data siswa ditemukan.
              </div>
            )}
          </div>
          <div className={`px-6 py-3 border-t text-xs ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Menampilkan {filtered.length} dari {students.length} siswa
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className={`p-6 rounded-2xl shadow-2xl max-w-sm w-full ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <h3 className="font-bold text-lg mb-2">Hapus Siswa?</h3>
              <p className={`text-sm mb-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Data siswa akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className={`flex-1 py-2.5 rounded-xl font-medium border ${dark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Batal</button>
                <button onClick={() => handleDelete(deleteId!)} className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700">Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
