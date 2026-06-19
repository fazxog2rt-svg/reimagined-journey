import { NextRequest, NextResponse } from 'next/server'
import { studentsStore } from '@/lib/store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nis: string }> }
) {
  const { nis } = await params
  const student = studentsStore.find(s => s.nis.toUpperCase() === nis.toUpperCase())
  if (!student) {
    return NextResponse.redirect(new URL('/', _req.url))
  }
  return NextResponse.redirect(
    new URL(`/result?nisn=${encodeURIComponent(student.nisn)}&nis=${encodeURIComponent(student.nis)}`, _req.url)
  )
}
