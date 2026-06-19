import { CheckCircle, XCircle, GraduationCap } from 'lucide-react'

interface VerifyResult {
  valid: boolean
  student?: {
    name: string
    nis: string
    nisn: string
    status: string
    kelas?: string
  }
}

async function getVerification(kode: string): Promise<VerifyResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/verify/${encodeURIComponent(kode)}`, {
      cache: 'no-store',
    })
    return res.json()
  } catch {
    return { valid: false }
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ kode: string }>
}) {
  const { kode } = await params
  const result = await getVerification(kode)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-black text-slate-800">Verifikasi Sertifikat</h1>
          <p className="text-slate-500 text-sm mt-1">Kode: <span className="font-mono font-bold text-blue-600">{kode}</span></p>
        </div>

        {result.valid && result.student ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-700">Sertifikat Valid</p>
                <p className="text-sm text-emerald-600">Dokumen ini asli dan terverifikasi</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ['Nama Lengkap', result.student.name],
                ['NISN', result.student.nisn],
                ['NIS', result.student.nis],
                ['Kelas', result.student.kelas || '-'],
                ['Status', result.student.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className={`font-bold text-sm ${
                    label === 'Status'
                      ? result.student!.status === 'LULUS'
                        ? 'text-emerald-600'
                        : result.student!.status === 'Proses Susulan'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      : 'text-slate-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Tahun Ajaran 2025/2026</p>
              <p className="text-xs text-slate-400 mt-1">Sistem Pengumuman Kelulusan Kelas XII</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-700">Sertifikat Tidak Valid</p>
                <p className="text-sm text-red-600">Kode verifikasi tidak ditemukan</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Pastikan kode yang dimasukkan benar. Kode verifikasi adalah NIS siswa.
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-blue-600 hover:underline">Kembali ke Halaman Utama</a>
        </div>
      </div>
    </div>
  )
}
