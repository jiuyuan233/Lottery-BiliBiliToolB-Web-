import { useState, useEffect, useCallback } from 'react'
import { QrCode, RefreshCw, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { fetchQrCode, pollQrCode, type QrPollResult } from '../utils/api'

export default function QrLoginPage() {
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [qrKey, setQrKey] = useState<string | null>(null)
  const [status, setStatus] = useState<QrPollResult['status']>('waiting')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(180)

  const getQrCode = useCallback(async () => {
    try {
      setLoading(true)
      setStatus('waiting')
      setMessage('')
      const data = await fetchQrCode()
      setQrImage(data.qrImage)
      setQrKey(data.qrcode_key)
      setCountdown(180)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || '获取二维码失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getQrCode()
  }, [getQrCode])

  useEffect(() => {
    if (!qrKey || status === 'success' || status === 'expired') return

    let timer: ReturnType<typeof setInterval>
    let countdownTimer: ReturnType<typeof setInterval>

    timer = setInterval(async () => {
      try {
        const result = await pollQrCode(qrKey)
        setStatus(result.status)
        setMessage(result.message)
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message)
      }
    }, 2000)

    countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          clearInterval(countdownTimer)
          setStatus('expired')
          setMessage('二维码已过期')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      clearInterval(countdownTimer)
    }
  }, [qrKey, status])

  const statusConfig = {
    waiting: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    scanned: { icon: QrCode, color: 'text-lottery-gold', bg: 'bg-lottery-gold/20' },
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    expired: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lottery-pink to-lottery-rose mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">B站扫码登录</h1>
          <p className="text-gray-400">使用哔哩哔哩客户端扫码，自动更新 Cookie</p>
        </div>

        <div className="glass-card p-8 border-lottery-pink/20">
          <div className="flex flex-col items-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${statusConfig[status].bg} mb-6`}>
              <StatusIcon className={`w-7 h-7 ${statusConfig[status].color}`} />
            </div>

            {status === 'success' ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">登录成功！</div>
                <div className="text-gray-400 mb-6">Cookie 已自动更新到 env.js</div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity"
                >
                  返回首页
                </button>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="w-40 h-40 rounded-xl bg-lottery-dark/50 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-lottery-pink animate-spin" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-40 h-40 rounded-xl bg-white p-2 shadow-lg">
                      <img src={qrImage || ''} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-lottery-dark/80 px-3 py-1 rounded-full text-xs text-gray-400">
                      {countdown}s 后过期
                    </div>
                  </div>
                )}

                <div className="mt-12 text-center">
                  <div className={`text-lg font-medium ${statusConfig[status].color} mb-2`}>
                    {message || '请使用哔哩哔哩 APP 扫码'}
                  </div>
                  <button
                    onClick={getQrCode}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-lottery-border text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    刷新二维码
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">
            扫码登录后，Cookie 会自动保存到 env.js 文件中
          </p>
          <button
            onClick={() => window.location.href = '/login/sms'}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            使用手机验证码登录
          </button>
        </div>
      </div>
    </div>
  )
}