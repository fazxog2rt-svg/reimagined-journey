'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Users, Plus, Search, Edit2, Trash2, Download, X, Check } from 'lucide-react'

interface Student {
  id: number
  name: string
  nisn: string
  nis: string
  status: 'LULUS'
}

interface EditingStudent {
  id: number
  name: string
  nisn: string
  nis: string
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null)
  const [newStudent, setNewStudent] = useState({ name: '', nisn: '', nis: '' })
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchStudents()
    }
  }, [isLoggedIn, token])

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
      if (!res.ok) {
        setLoginError(data.error)
      } else {
        localStorage.setItem('adminToken', data.token)
        setToken(data.token)
        setIsLoggedIn(true)
      }
    } catch {
      setLoginError('Terjadi kesalahan jaringan')
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setStudents(data.students)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newStudent),
    })
    if (res.ok) {
      setNewStudent({ name: '', nisn: '', nis: '' })
      setShowAddForm(false)
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
    if (res.ok) {
      setEditingStudent(null)
      fetchStudents()
    }
  }

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Hapus siswa ini?')) return
    await fetch('/api/admin/students', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    fetchStudents()
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setToken('')
    setIsLoggedIn(false)
    setStudents([])
  }

  const exportCSV = () => {
    const header = 'ID,Nama,NISN,NIS,Status\n'
    const rows = students.map(s => `${s.id},${s.name},${s.nisn},${s.nis},${s.status}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data_siswa_2026.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nisn.includes(searchQuery) ||
    s.nis.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-700"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Sistem Pengumuman Kelulusan 2026</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loginLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">Kelulusan 2026</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Siswa', value: students.length, color: 'bg-blue-500' },
            { label: 'Status Lulus', value: students.filter(s => s.status === 'LULUS').length, color: 'bg-emerald-500' },
            { label: 'Persentase', value: students.length > 0 ? '100%' : '0%', color: 'bg-purple-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className={`w-8 h-8 ${stat.color} rounded-lg mb-3`} />
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NISN, atau NIS..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddStudent}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800"
            >
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Tambah Siswa Baru</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={newStudent.name}
                  onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="NISN"
                  value={newStudent.nisn}
                  onChange={e => setNewStudent(p => ({ ...p, nisn: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="NIS"
                  value={newStudent.nis}
                  onChange={e => setNewStudent(p => ({ ...p, nis: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  <Check className="w-3 h-3" /> Simpan
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm">
                  <X className="w-3 h-3" /> Batal
                </button>
              </div>
            </motion.form>
          )}

          {/* Edit Form */}
          {editingStudent && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleEditStudent}
              className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-4 border border-yellow-200 dark:border-yellow-800"
            >
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Edit Siswa</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent(p => p ? { ...p, name: e.target.value } : p)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editingStudent.nisn}
                  onChange={e => setEditingStudent(p => p ? { ...p, nisn: e.target.value } : p)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editingStudent.nis}
                  onChange={e => setEditingStudent(p => p ? { ...p, nis: e.target.value } : p)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium">
                  <Check className="w-3 h-3" /> Update
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm">
                  <X className="w-3 h-3" /> Batal
                </button>
              </div>
            </motion.form>
          )}

          {/* Table */}
          {loadingStudents ? (
            <div className="text-center py-12 text-slate-500">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">No</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Nama</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">NISN</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">NIS</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-2 text-slate-500">{i + 1}</td>
                      <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300 font-mono text-xs">{s.nisn}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{s.nis}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-full">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingStudent({ id: s.id, name: s.name, nisn: s.nisn, nis: s.nis })}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-slate-400">Tidak ada data ditemukan</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
