import { Gift, Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-lottery-border bg-lottery-panel/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lottery-pink to-lottery-gold flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg gradient-text">LOTTERY AUTO</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              B站自动抽奖工具 · 基于 shanmite/lottery_auto Docker 版本
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">功能特性</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>自动转发抽奖动态</li>
              <li>AI 智能判断与评论</li>
              <li>多账号与代理支持</li>
              <li>15+ 推送渠道</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">相关链接</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>shanmite/lottery_auto</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-lottery-pink" />
                <span>开源免费 · 仅供学习</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-lottery-border text-center text-xs text-gray-600">
          <p>本项目仅供学习交流使用，请勿用于商业用途。使用本工具产生的任何后果由使用者自行承担。</p>
        </div>
      </div>
    </footer>
  )
}
