import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { studentsStore, addStudent, updateStudent, deleteStudent } from '@/lib/store'
import { Student } from '@/lib/students'

async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ students: studentsStore })
}

export async function POST(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const data: Omit<Student, 'id'> = {
    name: body.name,
    nisn: body.nisn,
    nis: body.nis,
    status: body.status === 'TIDAK LULUS' ? 'TIDAK LULUS' : 'LULUS',
    ...(body.keterangan ? { keterangan: body.keterangan } : {}),
    ...(body.phone ? { phone: body.phone } : {}),
  }
  const newStudent = addStudent(data)
  return NextResponse.json({ student: newStudent }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const updated = updateStudent(body.id, body)
  if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  return NextResponse.json({ student: updated })
}

export async function DELETE(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  deleteStudent(id)
  return NextResponse.json({ success: true })
}
