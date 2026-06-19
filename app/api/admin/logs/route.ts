import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { activityLogs } from '@/lib/activity-log'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(auth.slice(7))
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ logs: [...activityLogs].reverse().slice(0, 200) })
}
