import { NextRequest, NextResponse } from 'next/server'
import { studentsStore } from '@/lib/store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  const { kode } = await params
  const student = studentsStore.find(s => s.nis.toUpperCase() === kode.toUpperCase())
  if (!student) {
    return NextResponse.json({ valid: false })
  }
  return NextResponse.json({
    valid: true,
    student: {
      name: student.name,
      nis: student.nis,
      nisn: student.nisn,
      status: student.status,
      kelas: student.kelas,
    },
  })
}
