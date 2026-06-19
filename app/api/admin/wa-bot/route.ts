import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

type WaBotStatus = 'disconnected' | 'qr' | 'connected'

interface WaBotState {
  status: WaBotStatus
  qr?: string
  phone?: string
}

// In-memory WhatsApp bot state
let waBotState: WaBotState = { status: 'disconnected' }

async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(waBotState)
}

export async function POST(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'connect') {
    try {
      const QRCode = (await import('qrcode')).default
      const qrText = 'Scan dengan WhatsApp untuk menghubungkan bot'
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 256, margin: 2 })
      waBotState = { status: 'qr', qr: qrDataUrl }
      return NextResponse.json(waBotState)
    } catch {
      return NextResponse.json({ error: 'Gagal membuat QR code' }, { status: 500 })
    }
  }

  if (action === 'disconnect') {
    waBotState = { status: 'disconnected' }
    return NextResponse.json(waBotState)
  }

  if (action === 'simulate_connected') {
    waBotState = { status: 'connected', phone: body.phone || '+62xxx-xxxx-xxxx' }
    return NextResponse.json(waBotState)
  }

  return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
}
