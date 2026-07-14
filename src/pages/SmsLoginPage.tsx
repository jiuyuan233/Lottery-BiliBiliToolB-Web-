import { useState, useEffect, useCallback, useRef } from 'react'
import { Phone, MessageSquare, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { fetchCountries, fetchCaptcha, sendSmsCode, loginWithSms, type CountryInfo, type SmsLoginResult } from '../utils/api'

type Step = 'input' | 'captcha' | 'verify' | 'success' | 'error'

export default function SmsLoginPage() {
  const [step, setStep] = useState<Step>('input')
  const [countries, setCountries] = useState<CountryInfo[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>({ id: 1, cname: '中国大陆', country_id: '86' })
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaGT, setCaptchaGT] = useState('')
  const [captchaChallenge, setCaptchaChallenge] = useState('')
  const [loading, setLoading] = useState(false)
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const geetestRef = useRef<any>(null)

  useEffect(() => {
    fetchCountries().then(data => {
      if (data.code === 0) {
        setCountries(data.data.common)
      }
    }).catch(() => {
      setCountries([{ id: 1, cname: '中国大陆', country_id: '86' }])
    })
  }, [])

  const loadCaptcha = useCallback(async () => {
    try {
      const data = await fetchCaptcha()
      if (data.code === 0) {
        setCaptchaToken(data.data.token)
        setCaptchaGT(data.data.geetest.gt)
        setCaptchaChallenge(data.data.geetest.challenge)
        loadGeetest({
          gt: data.data.geetest.gt,
          challenge: data.data.geetest.challenge,
          success: 1
        })
      } else {
        setMessage('获取验证码失败')
        setStep('error')
      }
    } catch (err: any) {
      setMessage(err.message || '获取验证码失败')
      setStep('error')
    }
  }, [])

  const loadGeetest = (captchaData: { gt: string; challenge: string; success: number }) => {
    const script = document.createElement('script')
    script.src = 'https://static.geetest.com/static/tools/gt.js'
    script.onload = () => {
      const initGeetest = (window as any).initGeetest
      if (initGeetest && captchaContainerRef.current) {
        geetestRef.current = initGeetest({
          gt: captchaData.gt,
          challenge: captchaData.challenge,
          product: 'bind',
          offline: !captchaData.success,
        }, (captcha: any) => {
          captcha.onSuccess(() => {
            const validate = captcha.getValidate()
            if (validate) {
              handleCaptchaSuccess(validate)
            }
          })
          captcha.onError(() => {
            setMessage('验证码验证失败，请重试')
            captcha.reset()
          })
          captcha.onClose(() => {
            setStep('input')
          })
          captcha.bind(captchaContainerRef.current)
        })
      }
    }
    document.body.appendChild(script)
  }

  const handleCaptchaSuccess = async (validate: { validate: string; seccode: string; challenge: string }) => {
    setLoading(true)
    try {
      const result = await sendSmsCode({
        cid: selectedCountry.id,
        tel: phone,
        token: captchaToken,
        challenge: validate.challenge,
        validate: validate.validate,
        seccode: validate.seccode
      })
      if (result.code === 0) {
        setCaptchaKey(result.data?.captcha_key || '')
        setCountdown(60)
        setStep('verify')
        setMessage('验证码已发送')
      } else {
        setMessage(result.message || '发送验证码失败')
        setStep('error')
      }
    } catch (err: any) {
      setMessage(err.message || '发送验证码失败')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  const handleSendCode = () => {
    if (!phone) {
      setMessage('请输入手机号')
      return
    }
    setStep('captcha')
    loadCaptcha()
  }

  const handleResendCode = () => {
    if (countdown > 0) return
    setStep('captcha')
    loadCaptcha()
  }

  const handleLogin = async () => {
    if (!code || code.length < 4) {
      setMessage('请输入正确的验证码')
      return
    }
    setLoading(true)
    try {
      const result = await loginWithSms({
        cid: selectedCountry.id,
        tel: phone,
        code,
        captcha_key: captchaKey
      })
      if (result.success) {
        setStep('success')
        setMessage('登录成功！Cookie 已自动更新')
      } else {
        setMessage(result.message || '登录失败')
        setStep('error')
      }
    } catch (err: any) {
      setMessage(err.message || '登录失败')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setPhone('')
    setCode('')
    setMessage('')
    setCaptchaKey('')
    setCountdown(0)
    if (geetestRef.current) {
      geetestRef.current = null
    }
  }

  const renderInputStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">手机号</label>
        <div className="flex items-center gap-2">
          <select
            value={selectedCountry.id}
            onChange={e => setSelectedCountry(countries.find(c => c.id === Number(e.target.value)) || selectedCountry)}
            className="px-3 py-3 rounded-lg bg-lottery-dark/50 border border-lottery-border text-white text-sm focus:outline-none focus:border-lottery-pink/50"
          >
            {countries.map(c => (
              <option key={c.id} value={c.id}>
                {c.cname} (+{c.country_id})
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
            placeholder="请输入手机号"
            className="flex-1 px-4 py-3 rounded-lg bg-lottery-dark/50 border border-lottery-border text-white placeholder-gray-500 focus:outline-none focus:border-lottery-pink/50"
          />
        </div>
      </div>

      <button
        onClick={handleSendCode}
        disabled={!phone || loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Phone className="w-5 h-5" />
        获取验证码
        {loading && <RefreshCw className="w-5 h-5 animate-spin" />}
      </button>
    </div>
  )

  const renderCaptchaStep = () => (
    <div className="space-y-4">
      <div className="text-center text-gray-400 mb-4">
        请完成人机验证以发送验证码
      </div>
      <div ref={captchaContainerRef} className="bg-white rounded-lg p-2" />
      {loading && (
        <div className="flex justify-center">
          <RefreshCw className="w-6 h-6 text-lottery-pink animate-spin" />
        </div>
      )}
    </div>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">验证码</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入验证码"
            className="flex-1 px-4 py-3 rounded-lg bg-lottery-dark/50 border border-lottery-border text-white placeholder-gray-500 focus:outline-none focus:border-lottery-pink/50"
          />
          <button
            onClick={handleResendCode}
            disabled={countdown > 0}
            className="px-4 py-3 rounded-lg border border-lottery-border text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown}s` : '重发'}
          </button>
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={!code || code.length < 4 || loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageSquare className="w-5 h-5" />
        确认登录
        {loading && <RefreshCw className="w-5 h-5 animate-spin" />}
      </button>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">登录成功！</h2>
        <p className="text-gray-400">Cookie 已自动更新到 env.js</p>
      </div>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity"
      >
        返回首页
      </button>
    </div>
  )

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">操作失败</h2>
        <p className="text-gray-400">{message}</p>
      </div>
      <button
        onClick={handleReset}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity"
      >
        重新尝试
      </button>
    </div>
  )

  const stepConfig = {
    input: { icon: Phone, title: '手机验证码登录', subtitle: '输入手机号获取验证码' },
    captcha: { icon: RefreshCw, title: '人机验证', subtitle: '完成验证以获取验证码' },
    verify: { icon: MessageSquare, title: '验证登录', subtitle: '输入验证码完成登录' },
    success: { icon: CheckCircle2, title: '', subtitle: '' },
    error: { icon: AlertCircle, title: '', subtitle: '' },
  }

  const StepIcon = stepConfig[step].icon

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {(step !== 'success' && step !== 'error') && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lottery-pink to-lottery-rose mb-4">
              <StepIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{stepConfig[step].title}</h1>
            <p className="text-gray-400">{stepConfig[step].subtitle}</p>
          </div>
        )}

        <div className="glass-card p-8 border-lottery-pink/20">
          {step === 'input' && renderInputStep()}
          {step === 'captcha' && renderCaptchaStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>

        {(step !== 'success' && step !== 'error') && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              使用扫码登录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}