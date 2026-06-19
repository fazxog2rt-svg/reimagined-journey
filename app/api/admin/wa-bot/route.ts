import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { siteSettings } from '@/lib/settings'

async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return verifyToken(authHeader.slice(7))
}

function getBaileysHeaders() {
  return { 'Content-Type': 'application/json', 'x-api-key': siteSettings.waBotApiKey }
}

function getBaileysUrl(path: string) {
  const base = siteSettings.waBotServerUrl.replace(/\/$/, '')
  return `${base}${path}`
}

export async function GET(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!siteSettings.waBotServerUrl) {
    return NextResponse.json({ status: 'no_server', message: 'URL server WA Bot belum dikonfigurasi' })
  }

  try {
    const res = await fetch(getBaileysUrl('/status'), { headers: getBaileysHeaders(), signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'error', message: 'Tidak dapat terhubung ke server WA Bot' })
  }
}

export async function POST(req: NextRequest) {
  const payload = await checkAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!siteSettings.waBotServerUrl) {
    return NextResponse.json({ error: 'URL server WA Bot belum dikonfigurasi' }, { status: 400 })
  }

  const body = await req.json()
  const { action } = body

  if (action === 'connect') {
    try {
      const res = await fetch(getBaileysUrl('/connect'), {
        method: 'POST',
        headers: getBaileysHeaders(),
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()
      // Poll QR after a moment
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: 'Gagal menghubungi server WA Bot' }, { status: 502 })
    }
  }

  if (action === 'qr') {
    try {
      const res = await fetch(getBaileysUrl('/qr'), { headers: getBaileysHeaders(), signal: AbortSignal.timeout(5000) })
      if (!res.ok) return NextResponse.json({ error: 'QR belum tersedia' }, { status: 404 })
      const data = await res.json()
      return NextResponse.json({ status: 'qr_ready', qr: data.qr })
    } catch {
      return NextResponse.json({ error: 'Gagal mengambil QR' }, { status: 502 })
    }
  }

  if (action === 'disconnect') {
    try {
      const res = await fetch(getBaileysUrl('/disconnect'), {
        method: 'POST',
        headers: getBaileysHeaders(),
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: 'Gagal menghubungi server WA Bot' }, { status: 502 })
    }
  }

  if (action === 'send') {
    const { phone, message } = body
    try {
      const res = await fetch(getBaileysUrl('/send'), {
        method: 'POST',
        headers: getBaileysHeaders(),
        body: JSON.stringify({ phone, message }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.ok ? 200 : res.status })
    } catch {
      return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 502 })
    }
  }

  if (action === 'send-bulk') {
    const { recipients } = body
    try {
      const res = await fetch(getBaileysUrl('/send-bulk'), {
        method: 'POST',
        headers: getBaileysHeaders(),
        body: JSON.stringify({ recipients }),
        signal: AbortSignal.timeout(300000),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.ok ? 200 : res.status })
    } catch {
      return NextResponse.json({ error: 'Gagal mengirim pesan massal' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
}
