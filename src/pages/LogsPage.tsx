import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Square, Download, Trash2, RotateCcw, Terminal } from 'lucide-react'
import type { ContainerName } from '../utils/api'
import { containerLabels, fetchLogs, containerAction } from '../utils/api'

export default function LogsPage() {
  const [searchParams] = useSearchParams()
  const initialContainer = (searchParams.get('container') as ContainerName) || 'start'
  
  const [activeContainer, setActiveContainer] = useState<ContainerName>(initialContainer)
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [lineCount, setLineCount] = useState(200)
  const logEndRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await fetchLogs(activeContainer, lineCount)
      setLogs(data.logs)
    } catch (err: any) {
      setLogs(`[ERROR] ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [activeContainer, lineCount])

  useEffect(() => {
    if (streaming) {
      const es = new EventSource(`/api/logs/stream/${activeContainer}`)
      esRef.current = es
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type !== 'close') {
            setLogs(prev => prev + msg.data)
          }
        } catch {
          setLogs(prev => prev + event.data)
        }
      }
      es.onerror = () => {
        setStreaming(false)
        es.close()
      }
      return () => {
        es.close()
        esRef.current = null
      }
    }
  }, [streaming, activeContainer])

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const handleClear = () => {
    setLogs('')
  }

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeContainer}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      await containerAction(activeContainer, action)
      setTimeout(loadLogs, 2000)
    } catch (err: any) {
      setLogs(prev => prev + `\n[ERROR] ${err.message}\n`)
    }
  }

  const logLines = logs.split('\n').length

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl gradient-text mb-1">日志查看</h1>
            <p className="text-sm text-gray-500">查看各容器的运行日志</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStreaming(!streaming)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                streaming
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-lottery-card border border-lottery-border text-gray-300 hover:text-white'
              }`}
            >
              {streaming ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  实时中
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  实时流
                </>
              )}
            </button>
            <button
              onClick={loadLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-white hover:border-lottery-pink/30 transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-white hover:border-lottery-pink/30 transition-all"
            >
              <Download className="w-4 h-4" />
              下载
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          </div>
        </div>

        {/* 容器选择 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(containerLabels) as ContainerName[]).map(name => {
            const info = containerLabels[name]
            const active = activeContainer === name
            const colorMap: Record<string, string> = {
              pink: 'border-lottery-pink/50 bg-lottery-pink/10 text-lottery-pink',
              amber: 'border-lottery-gold/50 bg-lottery-gold/10 text-lottery-gold',
              emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
              cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
              purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
            }
            return (
              <button
                key={name}
                onClick={() => {
                  setActiveContainer(name)
                  setStreaming(false)
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  active
                    ? colorMap[info.color]
                    : 'bg-lottery-dark/50 border-lottery-border text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                {info.name}
              </button>
            )
          })}
        </div>

        {/* 控制条 */}
        <div className="glass-card p-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleContainerAction('start')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-colors"
            >
              <Play className="w-3 h-3" />
              启动
            </button>
            <button
              onClick={() => handleContainerAction('stop')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-3 h-3" />
              停止
            </button>
            <button
              onClick={() => handleContainerAction('restart')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              重启
            </button>
          </div>
          <div className="h-4 w-px bg-lottery-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">显示行数</span>
            <select
              value={lineCount}
              onChange={e => setLineCount(Number(e.target.value))}
              disabled={streaming}
              className="bg-lottery-dark/50 border border-lottery-border rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-lottery-pink/50 disabled:opacity-50"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className="inline-flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 accent-lottery-pink"
              />
              自动滚动
            </label>
            <span className="text-xs text-gray-600">{logLines} 行</span>
          </div>
        </div>

        {/* 日志区域 */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-lottery-border bg-lottery-dark/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-gray-500 ml-2">
                {containerLabels[activeContainer].name} - logs
              </span>
            </div>
            {streaming && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            )}
          </div>
          
          <div className="relative h-[600px] overflow-auto bg-black/40 font-mono text-xs text-gray-300 p-4 leading-5">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-lottery-pink border-t-transparent rounded-full" />
              </div>
            ) : logs ? (
              <pre className="whitespace-pre-wrap break-all">
                {logs.split('\n').map((line, i) => {
                  let colorClass = 'text-gray-300'
                  if (line.includes('ERROR') || line.includes('Error') || line.includes('error')) {
                    colorClass = 'text-red-400'
                  } else if (line.includes('WARN') || line.includes('warn')) {
                    colorClass = 'text-amber-400'
                  } else if (line.includes('INFO') || line.includes('info') || line.includes('成功')) {
                    colorClass = 'text-emerald-400'
                  }
                  return (
                    <div key={i} className={colorClass}>
                      <span className="text-gray-600 select-none mr-3">{String(i + 1).padStart(4, ' ')}</span>
                      {line || ' '}
                    </div>
                  )
                })}
                <div ref={logEndRef} />
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600">
                暂无日志
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
