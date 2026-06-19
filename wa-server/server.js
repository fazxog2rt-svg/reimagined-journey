const express = require('express')
const cors = require('cors')
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const QRCode = require('qrcode')
const pino = require('pino')

const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.API_KEY || 'wa-bot-secret-2026'

app.use(cors({ origin: '*' }))
app.use(express.json())

// Auth middleware
function auth(req, res, next) {
  const key = req.headers['x-api-key']
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// State
let sock = null
let qrDataUrl = null
let status = 'disconnected' // disconnected | connecting | qr_ready | connected
let connectedPhone = null
let reconnectTimer = null

const logger = pino({ level: 'silent' })

async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()

  status = 'connecting'
  qrDataUrl = null

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['Graduation Bot', 'Chrome', '1.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    retryRequestDelayMs: 250,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      status = 'qr_ready'
      qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 })
      console.log('[WA Bot] QR code ready — scan with WhatsApp')
    }

    if (connection === 'open') {
      status = 'connected'
      qrDataUrl = null
      connectedPhone = sock.user?.id?.split(':')[0] || null
      console.log(`[WA Bot] Connected as ${connectedPhone}`)
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      connectedPhone = null

      if (reason === DisconnectReason.loggedOut) {
        status = 'disconnected'
        sock = null
        console.log('[WA Bot] Logged out')
      } else if (reason === DisconnectReason.connectionReplaced) {
        status = 'disconnected'
        sock = null
        console.log('[WA Bot] Connection replaced by another session')
      } else {
        status = 'connecting'
        console.log('[WA Bot] Connection closed, reconnecting in 5s...')
        reconnectTimer = setTimeout(startSocket, 5000)
      }
    }
  })
}

// Routes

// GET /status - public info about connection status
app.get('/status', auth, (req, res) => {
  res.json({
    status,
    phone: connectedPhone,
    hasQR: !!qrDataUrl,
  })
})

// GET /qr - get current QR code image as data URL
app.get('/qr', auth, (req, res) => {
  if (!qrDataUrl) {
    return res.status(404).json({ error: status === 'connected' ? 'Already connected' : 'QR not ready yet' })
  }
  res.json({ qr: qrDataUrl })
})

// POST /connect - start WA connection
app.post('/connect', auth, async (req, res) => {
  if (status === 'connected') return res.json({ message: 'Already connected', status })
  if (status === 'connecting' || status === 'qr_ready') return res.json({ message: 'Already connecting', status })

  try {
    await startSocket()
    res.json({ message: 'Connecting...', status: 'connecting' })
  } catch (err) {
    status = 'disconnected'
    res.status(500).json({ error: err.message })
  }
})

// POST /disconnect - disconnect and clear session
app.post('/disconnect', auth, async (req, res) => {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (sock) {
    try { await sock.logout() } catch {}
    sock = null
  }
  status = 'disconnected'
  qrDataUrl = null
  connectedPhone = null

  // Clear auth files
  const fs = require('fs')
  const path = require('path')
  const authDir = './auth_info'
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true })
  }

  res.json({ message: 'Disconnected and session cleared' })
})

// POST /send - send WhatsApp message
// Body: { phone: "628xxx", message: "Hello" }
app.post('/send', auth, async (req, res) => {
  if (status !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  const { phone, message } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })

  // Normalize phone number
  let jid = String(phone).replace(/\D/g, '')
  if (jid.startsWith('0')) jid = '62' + jid.slice(1)
  if (!jid.startsWith('62')) jid = '62' + jid
  jid = jid + '@s.whatsapp.net'

  try {
    await sock.sendMessage(jid, { text: message })
    res.json({ success: true, to: jid })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /send-bulk - send WA to multiple recipients
// Body: { recipients: [{ phone, message }] }
app.post('/send-bulk', auth, async (req, res) => {
  if (status !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  const { recipients } = req.body
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients array required' })
  }

  const results = []
  for (const { phone, message } of recipients) {
    let jid = String(phone).replace(/\D/g, '')
    if (jid.startsWith('0')) jid = '62' + jid.slice(1)
    if (!jid.startsWith('62')) jid = '62' + jid
    jid = jid + '@s.whatsapp.net'

    try {
      await sock.sendMessage(jid, { text: message })
      results.push({ phone, success: true })
      // Delay 1.5s between messages to avoid spam detection
      await new Promise(r => setTimeout(r, 1500))
    } catch (err) {
      results.push({ phone, success: false, error: err.message })
    }
  }

  res.json({ results })
})

app.listen(PORT, () => {
  console.log(`[WA Bot] Server running on port ${PORT}`)
  console.log(`[WA Bot] API Key: ${API_KEY}`)
})
