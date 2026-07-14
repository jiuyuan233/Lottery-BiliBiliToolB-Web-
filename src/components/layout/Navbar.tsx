import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, Gift, LayoutDashboard, Settings, FileText, Terminal, QrCode, Phone, ExternalLink } from 'lucide-react'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/config', label: '配置编辑', icon: Settings },
  { path: '/logs', label: '日志查看', icon: Terminal },
  { path: '/quickstart', label: '使用说明', icon: FileText },
  { path: '/login', label: '扫码登录', icon: QrCode },
  { path: '/login/sms', label: '验证码登录', icon: Phone },
  { path: '/bili-tool', label: 'BiliTool', icon: ExternalLink },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-lottery-dark/90 backdrop-blur-xl border-b border-lottery-border' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lottery-pink to-lottery-gold flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-lg tracking-wider gradient-text leading-none">LOTTERY</div>
              <div className="text-[10px] text-gray-500 tracking-widest">CONTROL PANEL</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-lottery-pink/10 text-lottery-pink'
                      : 'text-gray-400 hover:text-white hover:bg-lottery-card'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-lottery-pink/10 text-lottery-pink'
                      : 'text-gray-400 hover:text-white hover:bg-lottery-card'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
