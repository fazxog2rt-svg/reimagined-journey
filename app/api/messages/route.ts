import { NextRequest, NextResponse } from 'next/server'

interface Message {
  id: number
  name: string
  message: string
  timestamp: string
}

// In-memory messages
const messages: Message[] = [
  { id: 1, name: 'Alumni 2025', message: 'Selamat untuk adik-adik kelas! Masa depan cerah menanti kalian. Tetap semangat!', timestamp: new Date().toISOString() },
  { id: 2, name: 'Wali Kelas XII A', message: 'Bangga sekali dengan pencapaian kalian semua. Jadilah generasi yang membawa perubahan positif!', timestamp: new Date().toISOString() },
]
let nextId = 3

const ipRateLimit = new Map<string, { count: number; resetTime: number }>()

export async function GET() {
  return NextResponse.json({ messages: messages.slice(-20).reverse() })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const rl = ipRateLimit.get(ip)
  if (rl && now < rl.resetTime && rl.count >= 3) {
    return NextResponse.json({ error: 'Terlalu banyak pesan. Coba lagi nanti.' }, { status: 429 })
  }
  if (!rl || now >= rl.resetTime) {
    ipRateLimit.set(ip, { count: 1, resetTime: now + 60000 })
  } else {
    rl.count++
  }

  const body = await req.json()
  const { name, message } = body
  if (!name || !message) {
    return NextResponse.json({ error: 'Nama dan pesan diperlukan' }, { status: 400 })
  }
  if (message.length > 500) {
    return NextResponse.json({ error: 'Pesan maksimal 500 karakter' }, { status: 400 })
  }

  const newMsg: Message = {
    id: nextId++,
    name: String(name).slice(0, 100),
    message: String(message).slice(0, 500),
    timestamp: new Date().toISOString(),
  }
  messages.push(newMsg)
  if (messages.length > 500) messages.splice(0, messages.length - 500)

  return NextResponse.json({ message: newMsg }, { status: 201 })
}
