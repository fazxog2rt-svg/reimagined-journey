import { NextRequest, NextResponse } from 'next/server'
import { studentsStore } from '@/lib/store'
import { addLog } from '@/lib/activity-log'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const info = rateLimitMap.get(ip)
  if (!info || now > info.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 })
    return true
  }
  if (info.count >= 10) return false
  info.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 })
  }

  let body: { nisn?: string; nis?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Request tidak valid' }, { status: 400 }) }

  const { nisn, nis } = body
  if (!nisn || !nis) return NextResponse.json({ error: 'NISN dan NIS diperlukan' }, { status: 400 })

  const sanitizedNisn = String(nisn).replace(/\D/g, '').slice(0, 20)
  const sanitizedNis = String(nis).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()

  const student = studentsStore.find(s => s.nisn === sanitizedNisn && s.nis === sanitizedNis)
  addLog(sanitizedNisn, sanitizedNis, !!student, ip)

  if (!student) {
    return NextResponse.json({ error: 'Data tidak ditemukan. Periksa kembali NISN dan NIS Anda.' }, { status: 404 })
  }

  return NextResponse.json({ student })
}
