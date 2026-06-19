export interface ActivityLog {
  id: number
  timestamp: string
  nisn: string
  nis: string
  found: boolean
  ip: string
}

export const activityLogs: ActivityLog[] = []
let logId = 1

export function addLog(nisn: string, nis: string, found: boolean, ip: string) {
  activityLogs.push({
    id: logId++,
    timestamp: new Date().toISOString(),
    nisn,
    nis,
    found,
    ip,
  })
  // keep only last 1000 logs
  if (activityLogs.length > 1000) activityLogs.splice(0, activityLogs.length - 1000)
}
