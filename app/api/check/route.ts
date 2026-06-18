import { NextRequest, NextResponse } from 'next/server'
import { students } from '@/lib/students'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getRateLimitInfo(ip: string) {
  const now = Date.now()
  const info = rateLimitMap.get(ip)
  if (!info || now > info.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 })
    return { allowed: true }
  }
  if (info.count >= 5) {
    return { allowed: false }
  }
  info.count++
  return { allowed: true }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rateInfo = getRateLimitInfo(ip)
  if (!rateInfo.allowed) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 })
  }
  
  const { nisn, nis } = await req.json()
  if (!nisn || !nis) {
    return NextResponse.json({ error: 'NISN dan NIS diperlukan' }, { status: 400 })
  }
  
  const student = students.find(s => s.nisn === nisn && s.nis === nis)
  if (!student) {
    return NextResponse.json({ error: 'Data tidak ditemukan. Periksa kembali NISN dan NIS Anda.' }, { status: 404 })
  }
  
  return NextResponse.json({ student })
}
