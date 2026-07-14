import { flowSteps } from '../../data/features'

export default function FlowTimeline() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-600/5 blur-[100px]" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lottery-gold/10 border border-lottery-gold/20 mb-4">
            <span className="text-xs font-medium text-lottery-gold">WORKFLOW</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide mb-4">
            <span className="gradient-text-gold">运行流程</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            四步自动化流程，从检索到通知，全自动运行
          </p>
        </div>

        {/* 时间线 */}
        <div className="relative">
          {/* 连接线 */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lottery-border to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
            {flowSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className="relative flex flex-col items-center text-center animate-fade-up"
                  style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                >
                  {/* 数字徽章 */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-lottery-card to-lottery-dark border border-lottery-border flex items-center justify-center group hover:border-lottery-pink/50 transition-all hover:scale-105">
                      <Icon className="w-8 h-8 text-lottery-pink" />
                    </div>
                    {/* 步骤编号 */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-lottery-pink to-lottery-gold flex items-center justify-center text-xs font-bold text-white">
                      {step.step}
                    </div>
                    {/* 光环 */}
                    <div className="absolute inset-0 rounded-2xl bg-lottery-pink/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* 内容 */}
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.description}</p>

                  {/* 箭头 */}
                  {idx < flowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-2 text-lottery-border">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
