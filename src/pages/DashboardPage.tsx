import { useState, useEffect, useCallback } from 'react'
import { Play, Square, RotateCcw, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, Shield, Settings, RefreshCcw, Calendar } from 'lucide-react'
import type { ContainerName, ContainerStatus, WatchdogConfig, ScheduleConfig } from '../utils/api'
import { containerLabels, fetchStatus, containerAction, removeAllContainers, fetchWatchdog, saveWatchdog, fetchSchedule, saveSchedule } from '../utils/api'

function StatusBadge({ status }: { status: ContainerStatus }) {
  if (!status.exists) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-700/50 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        未创建
      </div>
    )
  }
  if (status.running) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-xs text-emerald-400">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        运行中
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-xs text-amber-400">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      已停止
    </div>
  )
}

function ContainerCard({
  name,
  status,
  onAction,
  onViewLogs,
  watchEnabled,
  onToggleWatch,
}: {
  name: ContainerName
  status: ContainerStatus
  onAction: (name: ContainerName, action: 'start' | 'stop' | 'restart' | 'remove' | 'cleanStart') => void
  onViewLogs: (name: ContainerName) => void
  watchEnabled?: boolean
  onToggleWatch?: (name: ContainerName, enabled: boolean) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const info = containerLabels[name]
  const colorMap: Record<string, string> = {
    pink: 'from-lottery-pink/20 to-lottery-rose/5 border-lottery-pink/30',
    amber: 'from-lottery-gold/20 to-lottery-amber/5 border-lottery-gold/30',
    emerald: 'from-emerald-500/20 to-green-500/5 border-emerald-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/5 border-cyan-500/30',
    purple: 'from-purple-500/20 to-violet-500/5 border-purple-500/30',
  }
  const btnColorMap: Record<string, string> = {
    pink: 'from-lottery-pink to-lottery-rose',
    amber: 'from-lottery-gold to-lottery-amber text-black',
    emerald: 'from-emerald-500 to-green-500',
    cyan: 'from-cyan-500 to-blue-500',
    purple: 'from-purple-500 to-violet-500',
  }
  const textColorMap: Record<string, string> = {
    pink: 'text-lottery-pink',
    amber: 'text-lottery-gold',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
  }

  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colorMap[info.color]} hover:scale-[1.02] transition-all group`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">{info.name}</h3>
          <p className="text-xs text-gray-500">{info.desc}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status.exists && status.startedAt && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>
            {status.running ? '启动于 ' : '结束于 '}
            {new Date(status.running ? status.startedAt : status.finishedAt || '').toLocaleString('zh-CN')}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!status.running ? (
          <div className="flex-1 relative">
            <div className="flex">
              <button
                onClick={() => onAction(name, 'start')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-l-lg text-xs font-medium text-white bg-gradient-to-r ${btnColorMap[info.color]} hover:opacity-90 transition-opacity`}
              >
                <Play className="w-3.5 h-3.5" />
                启动
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`inline-flex items-center justify-center w-9 px-2 py-2 rounded-r-lg border-l border-white/20 text-white bg-gradient-to-r ${btnColorMap[info.color]} hover:opacity-90 transition-opacity`}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {menuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-lottery-card border border-lottery-border rounded-lg shadow-xl overflow-hidden z-10">
                <button
                  onClick={() => { onAction(name, 'cleanStart'); setMenuOpen(false) }}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-lottery-dark hover:text-white transition-colors text-left"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  清理并重新启动
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onAction(name, 'stop')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            停止
          </button>
        )}
        <button
          onClick={() => onAction(name, 'restart')}
          disabled={!status.exists}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-lottery-dark/50 border border-lottery-border text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="重启"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewLogs(name)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-lottery-dark/50 border border-lottery-border text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all"
          title="查看日志"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round"/>
          </svg>
        </button>
        {onToggleWatch && (
          <button
            onClick={() => onToggleWatch(name, !watchEnabled)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all ${
              watchEnabled
                ? 'bg-lottery-pink/20 border-lottery-pink/40 text-lottery-pink'
                : 'bg-lottery-dark/50 border-lottery-border text-gray-500 hover:text-gray-300'
            }`}
            title={watchEnabled ? '自动重启已开启' : '开启自动重启'}
          >
            <Shield className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onAction(name, 'remove')}
          disabled={!status.exists}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-lottery-dark/50 border border-lottery-border text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="删除容器"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [status, setStatus] = useState<Record<ContainerName, ContainerStatus> | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [watchdog, setWatchdog] = useState<WatchdogConfig | null>(null)
  const [showWatchdogPanel, setShowWatchdogPanel] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null)
  const [showSchedulePanel, setShowSchedulePanel] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchStatus()
      setStatus(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadWatchdog = useCallback(async () => {
    try {
      const data = await fetchWatchdog()
      setWatchdog(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const loadSchedule = useCallback(async () => {
    try {
      const data = await fetchSchedule()
      setSchedule(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    loadWatchdog()
    loadSchedule()
    const interval = setInterval(loadStatus, 5000)
    const scheduleInterval = setInterval(loadSchedule, 30000)
    return () => {
      clearInterval(interval)
      clearInterval(scheduleInterval)
    }
  }, [loadStatus, loadWatchdog, loadSchedule])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAction = async (name: ContainerName, action: 'start' | 'stop' | 'restart' | 'remove' | 'cleanStart') => {
    const key = `${name}-${action}`
    setActionLoading(key)
    try {
      await containerAction(name, action)
      const actionLabel = action === 'start' ? '启动' : action === 'stop' ? '停止' : action === 'restart' ? '重启' : action === 'cleanStart' ? '清理并启动' : '删除'
      showToast('success', `${containerLabels[name].name} ${actionLabel}成功`)
      setTimeout(loadStatus, 1000)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewLogs = (name: ContainerName) => {
    window.location.href = `/logs?container=${name}`
  }

  const handleRemoveAll = async () => {
    if (!confirm('确定要删除所有抽奖相关容器吗？')) return
    try {
      await removeAllContainers()
      showToast('success', '已删除所有容器')
      setTimeout(loadStatus, 1000)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleToggleWatchdog = async () => {
    if (!watchdog) return
    try {
      const res = await saveWatchdog({ enabled: !watchdog.enabled })
      setWatchdog(res.config)
      showToast('success', res.config.enabled ? '看门狗已开启' : '看门狗已关闭')
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleToggleContainerWatch = async (name: ContainerName, enabled: boolean) => {
    try {
      const res = await saveWatchdog({ containers: { [name]: enabled } })
      setWatchdog(res.config)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleIntervalChange = async (interval: number) => {
    try {
      const res = await saveWatchdog({ interval })
      setWatchdog(res.config)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleToggleSchedule = async () => {
    if (!schedule) return
    try {
      const res = await saveSchedule({ enabled: !schedule.enabled })
      setSchedule(res.config)
      showToast('success', res.config.enabled ? '定时计划已开启' : '定时计划已关闭')
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleScheduleTimeChange = async (field: 'startTime' | 'stopTime', value: string) => {
    try {
      const res = await saveSchedule({ [field]: value })
      setSchedule(res.config)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleScheduleContainerToggle = async (name: ContainerName, enabled: boolean) => {
    try {
      const res = await saveSchedule({ containers: { [name]: enabled } })
      setSchedule(res.config)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleScheduleDayToggle = async (day: number, enabled: boolean) => {
    if (!schedule) return
    const newDays = enabled
      ? [...schedule.days, day].sort()
      : schedule.days.filter(d => d !== day)
    try {
      const res = await saveSchedule({ days: newDays })
      setSchedule(res.config)
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const runningCount = status ? Object.values(status).filter(s => s.running).length : 0
  const existsCount = status ? Object.values(status).filter(s => s.exists).length : 0

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl gradient-text mb-1">控制面板</h1>
            <p className="text-sm text-gray-500">管理和监控你的 B 站自动抽奖工具</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSchedulePanel(!showSchedulePanel)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                schedule?.enabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-lottery-card border-lottery-border text-gray-300 hover:text-white hover:border-lottery-pink/30'
              }`}
            >
              <Calendar className="w-4 h-4" />
              定时计划
              {schedule?.enabled && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
            <button
              onClick={() => setShowWatchdogPanel(!showWatchdogPanel)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                watchdog?.enabled
                  ? 'bg-lottery-pink/10 border-lottery-pink/30 text-lottery-pink'
                  : 'bg-lottery-card border-lottery-border text-gray-300 hover:text-white hover:border-lottery-pink/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              看门狗
              {watchdog?.enabled && <div className="w-1.5 h-1.5 rounded-full bg-lottery-pink animate-pulse" />}
            </button>
            <button
              onClick={loadStatus}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-white hover:border-lottery-pink/30 transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button
              onClick={handleRemoveAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              清理全部
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? '-' : runningCount}</div>
                <div className="text-xs text-gray-500">运行中</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? '-' : existsCount - runningCount}</div>
                <div className="text-xs text-gray-500">已停止</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lottery-pink/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-lottery-pink" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? '-' : 5 - existsCount}</div>
                <div className="text-xs text-gray-500">未创建</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 4v16" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-xs text-gray-500">任务总数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 定时计划设置面板 */}
        {showSchedulePanel && schedule && (
          <div className="glass-card p-5 mb-6 border-emerald-500/20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">每日定时计划</h3>
                  <p className="text-xs text-gray-500">指定时间段自动启动和停止容器</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-400">{schedule.enabled ? '已开启' : '已关闭'}</span>
                <div
                  onClick={handleToggleSchedule}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    schedule.enabled ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      schedule.enabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-2">启动时间</label>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={e => handleScheduleTimeChange('startTime', e.target.value)}
                  disabled={!schedule.enabled}
                  className="w-full px-3 py-2 rounded-lg bg-lottery-dark/50 border border-lottery-border text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">停止时间</label>
                <input
                  type="time"
                  value={schedule.stopTime}
                  onChange={e => handleScheduleTimeChange('stopTime', e.target.value)}
                  disabled={!schedule.enabled}
                  className="w-full px-3 py-2 rounded-lg bg-lottery-dark/50 border border-lottery-border text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-2">执行的任务</label>
              <div className="flex flex-wrap gap-2">
                {(['start', 'check', 'clear'] as ContainerName[]).map(name => (
                  <label
                    key={name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                      schedule.containers[name]
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-lottery-dark/50 border-lottery-border text-gray-400'
                    } ${!schedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!schedule.containers[name]}
                      onChange={e => handleScheduleContainerToggle(name, e.target.checked)}
                      disabled={!schedule.enabled}
                      className="w-3 h-3 accent-emerald-500"
                    />
                    {containerLabels[name].name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-2">执行日期</label>
              <div className="flex flex-wrap gap-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handleScheduleDayToggle(i, !schedule.days.includes(i))}
                    disabled={!schedule.enabled}
                    className={`w-9 h-9 rounded-lg text-xs font-medium transition-all border ${
                      schedule.days.includes(i)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-lottery-dark/50 border-lottery-border text-gray-500 hover:text-gray-300'
                    } ${!schedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {schedule.enabled && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-xs text-emerald-300/80 space-y-1">
                  {schedule.inRange ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      当前处于运行时段
                      {schedule.nextStop && (
                        <span className="text-gray-400 ml-2">
                          · 将在 {new Date(schedule.nextStop).toLocaleString('zh-CN')} 停止
                        </span>
                      )}
                    </div>
                  ) : schedule.nextStart ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      下次启动：{new Date(schedule.nextStart).toLocaleString('zh-CN')}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 看门狗设置面板 */}
        {showWatchdogPanel && watchdog && (
          <div className="glass-card p-5 mb-8 border-lottery-pink/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lottery-pink/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-lottery-pink" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">自动重启看门狗</h3>
                  <p className="text-xs text-gray-500">监控容器状态，停止后自动重启</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-400">{watchdog.enabled ? '已开启' : '已关闭'}</span>
                <div
                  onClick={handleToggleWatchdog}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    watchdog.enabled ? 'bg-lottery-pink' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      watchdog.enabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">检查间隔（秒，最小10秒）</label>
                <input
                  type="number"
                  min={10}
                  value={watchdog.interval}
                  onChange={e => handleIntervalChange(Number(e.target.value))}
                  disabled={!watchdog.enabled}
                  className="w-full px-3 py-2 rounded-lg bg-lottery-dark/50 border border-lottery-border text-sm text-white focus:outline-none focus:border-lottery-pink/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">监控的容器</label>
                <div className="flex flex-wrap gap-2">
                  {(['start', 'check', 'clear'] as ContainerName[]).map(name => (
                    <label
                      key={name}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                        watchdog.containers[name]
                          ? 'bg-lottery-pink/10 border-lottery-pink/30 text-lottery-pink'
                          : 'bg-lottery-dark/50 border-lottery-border text-gray-400'
                      } ${!watchdog.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={!!watchdog.containers[name]}
                        onChange={e => handleToggleContainerWatch(name, e.target.checked)}
                        disabled={!watchdog.enabled}
                        className="w-3 h-3 accent-lottery-pink"
                      />
                      {containerLabels[name].name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 容器卡片 */}
        <h2 className="text-lg font-semibold text-white mb-4">任务管理</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-5 bg-lottery-border/50 rounded w-1/3 mb-2" />
                <div className="h-3 bg-lottery-border/30 rounded w-2/3 mb-4" />
                <div className="h-9 bg-lottery-border/30 rounded-lg" />
              </div>
            ))}
          </div>
        ) : status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(containerLabels) as ContainerName[]).map(name => (
              <ContainerCard
                key={name}
                name={name}
                status={status[name]}
                onAction={handleAction}
                onViewLogs={handleViewLogs}
                watchEnabled={watchdog?.containers[name]}
                onToggleWatch={handleToggleContainerWatch}
              />
            ))}
          </div>
        ) : null}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-fade-up ${
            toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  )
}
