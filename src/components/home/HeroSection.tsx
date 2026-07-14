import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Gift, Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* 动态背景 */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 noise-bg" />
      
      {/* 光斑 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-lottery-pink/20 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-lottery-gold/15 blur-[120px] animate-pulse-slow animation-delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse-slow animation-delay-500" />

      {/* 浮动装饰元素 */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="w-12 h-12 rounded-xl border border-lottery-pink/30 bg-lottery-pink/5 backdrop-blur-sm flex items-center justify-center">
          <Gift className="w-5 h-5 text-lottery-pink/60" />
        </div>
      </div>
      <div className="absolute bottom-32 right-10 animate-float animation-delay-500">
        <div className="w-12 h-12 rounded-xl border border-lottery-gold/30 bg-lottery-gold/5 backdrop-blur-sm flex items-center justify-center">
          <Zap className="w-5 h-5 text-lottery-gold/60" />
        </div>
      </div>
      <div className="absolute top-1/3 right-20 animate-float animation-delay-700">
        <div className="w-10 h-10 rounded-xl border border-purple-400/30 bg-purple-400/5 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400/60" />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* 标签 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lottery-card/60 border border-lottery-border backdrop-blur-sm mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-400">Docker 一键部署 · 开源免费</span>
        </div>

        {/* 主标题 */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wider mb-6 animate-fade-up animation-delay-100">
          <span className="gradient-text text-shadow-glow">LOTTERY</span>
          <br />
          <span className="text-white">AUTO</span>
        </h1>

        {/* 副标题 */}
        <p className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto animate-fade-up animation-delay-200">
          B站自动抽奖工具
        </p>
        <p className="text-sm sm:text-base text-gray-500 mb-10 max-w-2xl mx-auto animate-fade-up animation-delay-300 leading-relaxed">
          自动监视动态 · 智能识别抽奖 · 自动转发评论 · AI 辅助判断 · 多账号支持 · 中奖消息推送
        </p>

        {/* 按钮组 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animation-delay-500">
          <Link
            to="/quickstart"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium text-sm hover:scale-105 transition-transform shadow-lg shadow-lottery-pink/30"
          >
            <Zap className="w-4 h-4" />
            快速开始
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/config"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-lottery-card/60 border border-lottery-border backdrop-blur-sm text-gray-300 font-medium text-sm hover:bg-lottery-card hover:border-lottery-pink/50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            配置预览
          </Link>
        </div>

        {/* 底部滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <div className="w-6 h-10 rounded-full border-2 border-lottery-border flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-lottery-pink/60" />
          </div>
        </div>
      </div>
    </section>
  )
}
