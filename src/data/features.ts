import { Sparkles, Bot, Repeat, MessageCircle, Trash2, Bell, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Feature {
  id: string
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  iconColor: string
}

export const features: Feature[] = [
  {
    id: 'auto-lottery',
    title: '自动抽奖',
    description: '自动监视指定 UID、TAG、专栏的动态，智能识别抽奖信息并自动转发参与，支持官方与非官方抽奖。',
    icon: Sparkles,
    gradient: 'from-pink-500/20 to-rose-500/5',
    iconColor: 'text-lottery-pink',
  },
  {
    id: 'ai-judge',
    title: 'AI 智能判断',
    description: '集成 DeepSeek/Qwen 大模型，智能分析动态内容，判断是否为有效抽奖并提取参与条件，过滤过期抽奖。',
    icon: Bot,
    gradient: 'from-purple-500/20 to-indigo-500/5',
    iconColor: 'text-purple-400',
  },
  {
    id: 'auto-relay',
    title: '自动转发',
    description: '自动转发抽奖动态，支持转发语变量模板、@指定用户、关键词过滤、屏蔽词检测，防重复转发。',
    icon: Repeat,
    gradient: 'from-amber-500/20 to-yellow-500/5',
    iconColor: 'text-lottery-gold',
  },
  {
    id: 'auto-chat',
    title: '智能评论',
    description: '内置 40+ 条随机评论语，支持 AI 生成评论内容、抄热评功能，让评论更真实自然。',
    icon: MessageCircle,
    gradient: 'from-cyan-500/20 to-blue-500/5',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'auto-clear',
    title: '自动清理',
    description: '定时清理已过期的转发动态和临时关注的 UP 主，支持白名单、快速取关、按粉丝数过滤等功能。',
    icon: Trash2,
    gradient: 'from-emerald-500/20 to-green-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'win-notice',
    title: '中奖通知',
    description: '支持 Server酱、微信、Telegram、钉钉、企业微信、邮件等 15+ 种推送渠道，不错过任何中奖消息。',
    icon: Bell,
    gradient: 'from-orange-500/20 to-red-500/5',
    iconColor: 'text-orange-400',
  },
  {
    id: 'multi-account',
    title: '多账号支持',
    description: '支持多账号同时运行，各账号独立配置，按顺序执行防止封禁，支持代理 IP 设置。',
    icon: Users,
    gradient: 'from-violet-500/20 to-purple-500/5',
    iconColor: 'text-violet-400',
  },
  {
    id: 'safe-mode',
    title: '安全防护',
    description: '随机动态发送、转发间隔控制、偷塔模式、屏蔽词过滤等多重安全机制，降低封号风险。',
    icon: ShieldCheck,
    gradient: 'from-teal-500/20 to-cyan-500/5',
    iconColor: 'text-teal-400',
  },
]

export interface FlowStep {
  step: number
  title: string
  description: string
  icon: LucideIcon
}

export const flowSteps: FlowStep[] = [
  {
    step: 1,
    title: '检索动态',
    description: '从指定的 UID、TAG、专栏关键词中检索最新动态，获取抽奖信息。',
    icon: Sparkles,
  },
  {
    step: 2,
    title: '智能过滤',
    description: '通过关键词、AI 判断、粉丝数、动态类型等多维度过滤，识别有效抽奖。',
    icon: ShieldCheck,
  },
  {
    step: 3,
    title: '自动参与',
    description: '自动转发抽奖动态、发表评论、关注 UP 主、参与预约抽奖。',
    icon: Repeat,
  },
  {
    step: 4,
    title: '清理通知',
    description: '清理过期动态与关注，监听私信中奖消息并推送通知。',
    icon: Bell,
  },
]

export interface StatItem {
  label: string
  value: string
  suffix: string
}

export const stats: StatItem[] = [
  { label: '支持推送渠道', value: '15', suffix: '+' },
  { label: '随机评论语', value: '40', suffix: '+' },
  { label: '配置项', value: '50', suffix: '+' },
  { label: 'Docker 一键部署', value: '1', suffix: '步' },
]
