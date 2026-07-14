import { features } from '../../data/features'

export default function FeatureCards() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lottery-pink/10 border border-lottery-pink/20 mb-4">
            <span className="text-xs font-medium text-lottery-pink">FEATURES</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide mb-4">
            <span className="gradient-text">核心功能</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            从动态检索到中奖通知，全流程自动化，让抽奖变得轻松高效
          </p>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.id}
                className="group relative glass-card p-6 hover:border-lottery-pink/30 transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
              >
                {/* 渐变背景 */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  {/* 图标 */}
                  <div className="w-12 h-12 rounded-xl bg-lottery-dark/50 border border-lottery-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-lottery-pink/30 transition-all">
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  {/* 标题 */}
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>

                  {/* 描述 */}
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>

                {/* 悬停光效 */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-lottery-pink/50 to-transparent" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
