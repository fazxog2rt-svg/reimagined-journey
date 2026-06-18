import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { students as initialStudents, Student } from '@/lib/students'

let studentsData: Student[] = [...initialStudents]

async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ students: studentsData })
}

export async function POST(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const newStudent: Student = {
    id: Math.max(...studentsData.map(s => s.id), 0) + 1,
    name: body.name,
    nisn: body.nisn,
    nis: body.nis,
    status: 'LULUS',
  }
  studentsData.push(newStudent)
  return NextResponse.json({ student: newStudent }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const index = studentsData.findIndex(s => s.id === body.id)
  if (index === -1) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  studentsData[index] = { ...studentsData[index], ...body }
  return NextResponse.json({ student: studentsData[index] })
}

export async function DELETE(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  studentsData = studentsData.filter(s => s.id !== id)
  return NextResponse.json({ success: true })
}
