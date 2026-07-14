export interface ContainerStatus {
  exists: boolean
  running: boolean
  status?: string
  startedAt?: string
  finishedAt?: string
  exitCode?: number
}

export type ContainerName = 'start' | 'check' | 'clear' | 'account' | 'login'

export const containerLabels: Record<ContainerName, { name: string; desc: string; color: string }> = {
  start: { name: '自动抽奖', desc: '主进程，持续运行参与抽奖', color: 'pink' },
  check: { name: '中奖检查', desc: '检查私信中奖通知', color: 'amber' },
  clear: { name: '清理任务', desc: '清理过期动态和关注', color: 'emerald' },
  account: { name: '账号信息', desc: '查看当前账号状态', color: 'cyan' },
  login: { name: '登录测试', desc: '测试 Cookie 是否有效', color: 'purple' },
}

export async function fetchStatus(): Promise<Record<ContainerName, ContainerStatus>> {
  const res = await fetch('/api/status')
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export async function fetchConfig(file: 'env.js' | 'my_config.js'): Promise<{ content: string }> {
  const res = await fetch(`/api/config/${file}`)
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

export async function saveConfig(file: 'env.js' | 'my_config.js', content: string) {
  const res = await fetch(`/api/config/${file}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to save config')
  return res.json()
}

export async function containerAction(name: ContainerName, action: 'start' | 'stop' | 'restart' | 'remove' | 'cleanStart') {
  const res = await fetch(`/api/container/${action}/${name}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to ${action} container`)
  }
  return res.json()
}

export interface WatchdogConfig {
  enabled: boolean
  interval: number
  containers: Record<string, boolean>
}

export async function fetchWatchdog(): Promise<WatchdogConfig> {
  const res = await fetch('/api/watchdog')
  if (!res.ok) throw new Error('Failed to fetch watchdog config')
  return res.json()
}

export async function saveWatchdog(config: Partial<WatchdogConfig>): Promise<{ success: boolean; config: WatchdogConfig }> {
  const res = await fetch('/api/watchdog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error('Failed to save watchdog config')
  return res.json()
}

export interface ScheduleConfig {
  enabled: boolean
  startTime: string
  stopTime: string
  containers: Record<string, boolean>
  days: number[]
  inRange?: boolean
  nextStart?: string | null
  nextStop?: string | null
}

export async function fetchSchedule(): Promise<ScheduleConfig> {
  const res = await fetch('/api/schedule')
  if (!res.ok) throw new Error('Failed to fetch schedule config')
  return res.json()
}

export async function saveSchedule(config: Partial<ScheduleConfig>): Promise<{ success: boolean; config: ScheduleConfig }> {
  const res = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error('Failed to save schedule config')
  return res.json()
}

export interface QrCodeResult {
  qrcode_key: string
  qrImage: string
  url: string
}

export interface QrPollResult {
  status: 'waiting' | 'scanned' | 'success' | 'expired' | 'error'
  message: string
  cookie?: string
  cookies?: Record<string, string>
  updated?: boolean
}

export async function fetchQrCode(): Promise<QrCodeResult> {
  const res = await fetch('/api/qrcode')
  if (!res.ok) throw new Error('Failed to fetch QR code')
  return res.json()
}

export async function pollQrCode(key: string): Promise<QrPollResult> {
  const res = await fetch(`/api/qrcode/poll/${key}`)
  if (!res.ok) throw new Error('Failed to poll QR code status')
  return res.json()
}

export interface CountryInfo {
  id: number
  cname: string
  country_id: string
}

export interface CountriesResult {
  code: number
  data: {
    common: CountryInfo[]
    others: CountryInfo[]
  }
}

export interface CaptchaResult {
  code: number
  data: {
    type: string
    token: string
    geetest: {
      challenge: string
      gt: string
    }
    tencent: {
      appid: string
    }
  }
}

export interface SmsSendResult {
  code: number
  message: string
  data: {
    captcha_key?: string
  }
}

export interface SmsLoginResult {
  success: boolean
  message: string
  cookie?: string
  cookies?: Record<string, string>
  updated?: boolean
  code?: number
}

export async function fetchCountries(): Promise<CountriesResult> {
  const res = await fetch('/api/sms/countries')
  if (!res.ok) throw new Error('Failed to fetch countries')
  return res.json()
}

export async function fetchCaptcha(): Promise<CaptchaResult> {
  const res = await fetch('/api/sms/captcha')
  if (!res.ok) throw new Error('Failed to fetch captcha')
  return res.json()
}

export async function sendSmsCode(data: { cid: number; tel: string; token: string; challenge: string; validate: string; seccode?: string }): Promise<SmsSendResult> {
  const res = await fetch('/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to send SMS')
  return res.json()
}

export async function loginWithSms(data: { cid: number; tel: string; code: string; captcha_key?: string }): Promise<SmsLoginResult> {
  const res = await fetch('/api/sms/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to login')
  return res.json()
}

export async function fetchLogs(name: ContainerName, lines = 200): Promise<{ logs: string }> {
  const res = await fetch(`/api/logs/${name}?lines=${lines}`)
  if (!res.ok) throw new Error('Failed to fetch logs')
  return res.json()
}

export function streamLogs(name: ContainerName, onLog: (data: string, type: string) => void): () => void {
  const es = new EventSource(`/api/logs/stream/${name}`)
  es.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'close') {
        es.close()
      } else {
        onLog(msg.data, msg.type)
      }
    } catch {
      onLog(event.data, 'stdout')
    }
  }
  es.onerror = () => {
    es.close()
  }
  return () => es.close()
}

export async function removeAllContainers() {
  const res = await fetch('/api/remove-all', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to remove all')
  return res.json()
}
