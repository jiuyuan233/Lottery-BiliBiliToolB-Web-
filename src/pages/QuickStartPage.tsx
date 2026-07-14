import { useState } from 'react'
import { Check, Copy, Terminal, Package, Rocket, FileCode } from 'lucide-react'

interface Step {
  num: number
  title: string
  description: string
  icon: typeof Terminal
  commands: { label: string; code: string }[]
}

const steps: Step[] = [
  {
    num: 1,
    title: '准备配置文件',
    description: '创建 env.js 和 my_config.js 配置文件，填写 B 站 Cookie 和抽奖参数',
    icon: FileCode,
    commands: [
      {
        label: '创建目录并下载模板',
        code: `mkdir -p ~/lottery && cd ~/lottery

# 下载配置模板
docker run --rm shanmite/lottery_auto_docker \\
  cat /lottery/env.js > env.js

docker run --rm shanmite/lottery_auto_docker \\
  cat /lottery/my_config.js > my_config.js`,
      },
    ],
  },
  {
    num: 2,
    title: '编辑配置',
    description: '编辑 env.js 填入 Cookie，编辑 my_config.js 调整抽奖参数',
    icon: Package,
    commands: [
      {
        label: '编辑配置文件',
        code: `# 编辑环境配置（填入 COOKIE）
vim env.js

# 编辑抽奖配置
vim my_config.js

# Cookie 获取方式：
# 1. 登录 B站 (bilibili.com)
# 2. F12 打开控制台 → Application → Cookies
# 3. 复制 SESSDATA, bili_jct, DedeUserID`,
      },
    ],
  },
  {
    num: 3,
    title: '启动容器',
    description: '使用 Docker 启动抽奖工具容器，开始自动抽奖',
    icon: Rocket,
    commands: [
      {
        label: '启动抽奖',
        code: `docker run -d \\
  --name lottery-start \\
  -v $(pwd)/env.js:/lottery/env.js \\
  -v $(pwd)/my_config.js:/lottery/my_config.js \\
  --network host \\
  shanmite/lottery_auto_docker \\
  start

# 查看日志
docker logs -f lottery-start

# 停止
docker stop lottery-start

# 其他命令
# check  - 检查中奖私信
# clear  - 清理动态和关注
# account- 查看账号信息`,
      },
    ],
  },
]

const faqs = [
  {
    q: '如何获取 B站 Cookie？',
    a: '登录 bilibili.com 后，按 F12 打开开发者工具 → Application → Cookies，复制 SESSDATA、bili_jct 和 DedeUserID 的值。',
  },
  {
    q: '如何配置多账号？',
    a: '在 env.js 中将 ENABLE_MULTIPLE_ACCOUNT 设为 true，然后在 multiple_account_parm 数组中依次填写各账号信息。',
  },
  {
    q: '支持哪些推送渠道？',
    a: '支持 Server酱、微信（企业微信/推送加）、Telegram、钉钉、飞书、Bark、PushDeer、QQ（Qmsg）、邮件（SMTP）等 15+ 种推送方式。',
  },
  {
    q: 'AI 功能如何配置？',
    a: '在 env.js 中填写 AI_API_KEY，在 my_config.js 的 ai_judge_parm 和 ai_comments_parm 中填写 API 地址和模型参数。支持 DeepSeek、Qwen 等 OpenAI 兼容接口。',
  },
  {
    q: '偷塔模式是什么？',
    a: '偷塔模式指在临近开奖时才参与抽奖，减少动态曝光时间，降低被开奖机过滤的概率。',
  },
]

export default function QuickStartPage() {
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIdx(id)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lottery-gold/10 border border-lottery-gold/20 mb-4">
            <span className="text-xs font-medium text-lottery-gold">QUICK START</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide mb-4">
            <span className="gradient-text-gold">快速开始</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            三步部署，Docker 一键启动，开始你的自动抽奖之旅
          </p>
        </div>

        {/* 步骤 */}
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="glass-card p-6 animate-fade-up"
                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lottery-pink to-lottery-rose flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-2xl gradient-text">{step.num}</span>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{step.description}</p>

                    {step.commands.map((cmd, cmdIdx) => {
                      const id = `${step.num}-${cmdIdx}`
                      return (
                        <div key={cmdIdx} className="relative mb-3">
                          <div className="text-xs text-gray-600 mb-1.5">{cmd.label}</div>
                          <pre className="code-block text-xs leading-relaxed whitespace-pre-wrap">
                            <code>{cmd.code}</code>
                          </pre>
                          <button
                            onClick={() => handleCopy(cmd.code, id)}
                            className="absolute top-8 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-lottery-card/80 border border-lottery-border text-xs text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all backdrop-blur-sm"
                          >
                            {copiedIdx === id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                复制
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Docker 一键命令 */}
        <div className="glass-card p-6 mt-8 border-lottery-gold/30">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-lottery-gold" />
            <h3 className="text-lg font-semibold text-white">Docker Compose 方式</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">使用 docker-compose.yml 一键管理</p>
          <div className="relative">
            <pre className="code-block text-xs leading-relaxed">
{`# docker-compose.yml
version: '3.8'
services:
  lottery:
    image: shanmite/lottery_auto_docker
    container_name: lottery-start
    volumes:
      - ./env.js:/lottery/env.js
      - ./my_config.js:/lottery/my_config.js
    network_mode: host
    command: start
    restart: unless-stopped

# 启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down`}
            </pre>
            <button
              onClick={() => handleCopy(`version: '3.8'\nservices:\n  lottery:\n    image: shanmite/lottery_auto_docker\n    container_name: lottery-start\n    volumes:\n      - ./env.js:/lottery/env.js\n      - ./my_config.js:/lottery/my_config.js\n    network_mode: host\n    command: start\n    restart: unless-stopped`, 'compose')}
              className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-lottery-card/80 border border-lottery-border text-xs text-gray-400 hover:text-white hover:border-lottery-pink/30 transition-all backdrop-blur-sm"
            >
              {copiedIdx === 'compose' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  复制
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h3 className="font-display text-2xl gradient-text mb-6 text-center">常见问题</h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card p-5 hover:border-lottery-pink/20 transition-all animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
              >
                <h4 className="text-sm font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
