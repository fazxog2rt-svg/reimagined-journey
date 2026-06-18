import { NextRequest, NextResponse } from 'next/server'
import { signToken, checkAdminCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!checkAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
  }
  const token = await signToken({ username, role: 'admin' })
  return NextResponse.json({ token })
}
