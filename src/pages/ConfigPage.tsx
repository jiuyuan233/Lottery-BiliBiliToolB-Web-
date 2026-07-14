import { useState, useEffect } from 'react'
import { Save, RotateCcw, FileCode, Settings2, AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import { fetchConfig, saveConfig } from '../utils/api'

type ConfigFile = 'env.js' | 'my_config.js'

export default function ConfigPage() {
  const [activeFile, setActiveFile] = useState<ConfigFile>('my_config.js')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [confirmReload, setConfirmReload] = useState(false)

  const loadConfig = async (file: ConfigFile) => {
    setLoading(true)
    try {
      const data = await fetchConfig(file)
      setContent(data.content)
      setOriginalContent(data.content)
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || '加载配置失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig(activeFile)
  }, [activeFile])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveConfig(activeFile, content)
      setOriginalContent(content)
      showToast('success', '配置保存成功，已自动备份')
    } catch (err: any) {
      showToast('error', err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirmReload) {
      setConfirmReload(true)
      setTimeout(() => setConfirmReload(false), 3000)
      return
    }
    setContent(originalContent)
    setConfirmReload(false)
    showToast('success', '已恢复为保存时的内容')
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeFile
    a.click()
    URL.revokeObjectURL(url)
  }

  const isModified = content !== originalContent
  const lineCount = content.split('\n').length

  const fileInfo: Record<ConfigFile, { desc: string; icon: typeof FileCode; color: string }> = {
    'my_config.js': {
      desc: '抽奖参数配置：监视对象、关键词、时间间隔、AI 设置等',
      icon: Settings2,
      color: 'text-lottery-pink',
    },
    'env.js': {
      desc: '环境配置：Cookie、推送渠道、AI Key、多账号等',
      icon: FileCode,
      color: 'text-lottery-gold',
    },
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl gradient-text mb-1">配置编辑</h1>
            <p className="text-sm text-gray-500">在线编辑抽奖工具配置文件，保存即生效</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-white hover:border-lottery-pink/30 transition-all"
            >
              <Download className="w-4 h-4" />
              下载
            </button>
            <button
              onClick={handleReset}
              disabled={!isModified}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lottery-card border border-lottery-border text-sm text-gray-300 hover:text-white hover:border-lottery-pink/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`w-4 h-4 ${confirmReload ? 'animate-spin' : ''}`} />
              {confirmReload ? '再次点击确认' : '重置'}
            </button>
            <button
              onClick={handleSave}
              disabled={!isModified || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-lottery-pink to-lottery-rose text-sm text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 文件切换 */}
        <div className="flex gap-2 mb-4">
          {(['my_config.js', 'env.js'] as ConfigFile[]).map(file => {
            const info = fileInfo[file]
            const Icon = info.icon
            const active = activeFile === file
            return (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-all ${
                  active
                    ? 'bg-lottery-card border border-lottery-pink/30'
                    : 'bg-lottery-dark/50 border border-lottery-border hover:border-lottery-pink/20'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? info.color : 'text-gray-500'}`} />
                <div>
                  <div className={`text-sm font-mono font-medium ${active ? 'text-white' : 'text-gray-400'}`}>
                    {file}
                  </div>
                  <div className="text-xs text-gray-600 hidden sm:block">{info.desc}</div>
                </div>
                {active && isModified && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-lottery-pink animate-pulse" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 警告提示 */}
        <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/80 leading-relaxed">
            修改配置后需要重启对应容器才能生效。保存时会自动创建 .bak 备份文件，可在目录下找回历史配置。
          </div>
        </div>

        {/* 编辑器 */}
        <div className="glass-card overflow-hidden">
          {/* 编辑器头部 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-lottery-border bg-lottery-dark/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-gray-500 ml-2">{activeFile}</span>
            </div>
            <div className="text-xs text-gray-600">
              {lineCount} 行 · {content.length} 字符
              {isModified && <span className="text-lottery-pink ml-2">● 未保存</span>}
            </div>
          </div>

          {/* 代码编辑区 */}
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-lottery-pink border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="relative">
              <div className="flex">
                {/* 行号 */}
                <div className="flex-shrink-0 py-4 pl-4 pr-2 text-right text-xs font-mono text-gray-600 select-none bg-lottery-dark/30 border-r border-lottery-border">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                </div>
                {/* 编辑区 */}
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full h-[600px] p-4 bg-transparent font-mono text-sm text-gray-300 leading-6 resize-none focus:outline-none"
                  style={{ tabSize: 4 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-fade-up ${
            toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  )
}
