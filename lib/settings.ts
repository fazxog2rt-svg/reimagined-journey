export interface SiteSettings {
  announcementDate: string
  announcementActive: boolean
  schoolName: string
  principalName: string
  principalNip: string
  logoUrl: string
  primaryColor: string
  accessStartTime: string
  accessEndTime: string
  accessTimeEnabled: boolean
  waBotEnabled: boolean
  waPhoneNumber: string
}

export const siteSettings: SiteSettings = {
  announcementDate: '2026-06-19T08:00:00',
  announcementActive: true,
  schoolName: 'SMA Negeri 1',
  principalName: 'Drs. Budi Santoso, M.Pd.',
  principalNip: '196801011990031002',
  logoUrl: '',
  primaryColor: '#2563EB',
  accessStartTime: '08:00',
  accessEndTime: '23:59',
  accessTimeEnabled: false,
  waBotEnabled: false,
  waPhoneNumber: '',
}
