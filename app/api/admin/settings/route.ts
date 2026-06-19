import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { siteSettings } from '@/lib/settings'

export async function GET() {
  return NextResponse.json({ settings: siteSettings })
}

export async function PUT(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(auth.slice(7))
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.announcementDate !== undefined) siteSettings.announcementDate = body.announcementDate
  if (body.announcementActive !== undefined) siteSettings.announcementActive = body.announcementActive
  if (body.schoolName !== undefined) siteSettings.schoolName = String(body.schoolName).slice(0, 200)
  if (body.principalName !== undefined) siteSettings.principalName = String(body.principalName).slice(0, 200)
  if (body.principalNip !== undefined) siteSettings.principalNip = String(body.principalNip).slice(0, 50)
  if (body.logoUrl !== undefined) siteSettings.logoUrl = String(body.logoUrl).slice(0, 500)
  if (body.primaryColor !== undefined) siteSettings.primaryColor = String(body.primaryColor).slice(0, 20)
  if (body.accessStartTime !== undefined) siteSettings.accessStartTime = String(body.accessStartTime).slice(0, 10)
  if (body.accessEndTime !== undefined) siteSettings.accessEndTime = String(body.accessEndTime).slice(0, 10)
  if (body.accessTimeEnabled !== undefined) siteSettings.accessTimeEnabled = Boolean(body.accessTimeEnabled)
  if (body.waBotEnabled !== undefined) siteSettings.waBotEnabled = Boolean(body.waBotEnabled)
  if (body.waPhoneNumber !== undefined) siteSettings.waPhoneNumber = String(body.waPhoneNumber).slice(0, 20)
  return NextResponse.json({ settings: siteSettings })
}
