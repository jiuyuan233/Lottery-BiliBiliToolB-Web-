import { stats } from '../../data/features'

export default function StatsPanel() {
  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="glass-card p-6 text-center hover:border-lottery-pink/30 transition-all animate-fade-up"
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="font-display text-4xl sm:text-5xl gradient-text mb-2">
                {stat.value}
                <span className="text-2xl text-lottery-gold">{stat.suffix}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
