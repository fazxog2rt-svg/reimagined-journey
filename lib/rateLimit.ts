const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const record = requests.get(ip)

  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}
