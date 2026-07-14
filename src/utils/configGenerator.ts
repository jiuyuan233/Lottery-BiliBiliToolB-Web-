import type { LotteryConfig } from '../store/useConfigStore'

function arr(str: string): string {
  if (!str.trim()) return '[]'
  const items = str.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
  return '[' + items.map(i => `'${i}'`).join(', ') + ']'
}

function modelLabel(m: string): string {
  const map: Record<string, string> = {
    '00': '关闭自动抽奖',
    '10': '只转发官方抽奖',
    '01': '只转发非官方抽奖',
    '11': '都转发',
  }
  return map[m] || m
}

function chatModelLabel(m: string): string {
  const map: Record<string, string> = {
    '00': '关闭自动评论',
    '10': '只评论官抽',
    '01': '只评论非官抽',
    '11': '都评论',
  }
  return map[m] || m
}

export function generateConfigCode(c: LotteryConfig): string {
  const kw = c.key_words.split('\n').filter(Boolean).map(s => `'${s.trim()}'`).join(', ')
  const bw = c.blockword.split(/[,，]/).map(s => `'${s.trim()}'`).filter(s => s !== "''").join(', ')

  return `module.exports = Object.freeze({
    default_config: {
        // 监视的用户UID
        UIDs: ${arr(c.UIDs)},

        // 监视的TAG
        TAGs: ${arr(c.TAGs)},

        // 监视的专栏关键词
        Articles: ${arr(c.Articles)},

        // ${modelLabel(c.model)}
        model: '${c.model}',

        // ${chatModelLabel(c.chatmodel)}
        chatmodel: '${c.chatmodel}',

        // 抽奖关键词(须同时满足)
        key_words: [
            ${kw}
        ],

        // 屏蔽词
        blockword: [${bw}],

        // 黑名单(英文逗号分隔)
        blacklist: '${c.blacklist}',

        // UP主粉丝数限制
        minfollower: ${c.minfollower},

        // 动态创建时间(多少天前)
        max_create_time: ${c.max_create_time},

        // 转发间隔时间(毫秒)
        wait: ${c.wait},

        // 循环等待时间(毫秒)
        lottery_loop_wait: ${c.lottery_loop_wait},

        // 不参与预约抽奖
        disable_reserve_lottery: ${c.disable_reserve_lottery},

        // 偷塔模式(临近开奖时参与)
        sneaktower: ${c.sneaktower},

        // 发送随机动态(防被过滤)
        create_dy: ${c.create_dy},

        // 是否抄热评
        is_copy_chat: ${c.is_copy_chat},

        // 检查重复转发 (-1不检查 0点赞 1检索 2点赞+检索 3点赞+检索)
        check_if_duplicated: ${c.check_if_duplicated},

        // AI 判断抽奖
        ai_judge_parm: ${c.enable_ai_judge ? `{
            url: 'https://api.deepseek.com/chat/completions',
            body: { 'model': 'Qwen/Qwen3-32B', 'enable_thinking': true },
            prompt: '判断动态是否是抽奖动态...'
        }` : "''"},

        // AI 评论
        ai_comments_parm: ${c.enable_ai_comments ? `{
            url: 'https://api.deepseek.com/chat/completions',
            body: { 'model': 'Qwen/Qwen3-32B', 'enable_thinking': true },
            prompt: '生成模拟真实用户的评论...'
        }` : "''"},
    },

    // 清理配置
    clear: {
        // 是否启用清理
        enable: ${c.clear_enable},
        // 清理多少天之前的动态/关注
        clear_max_day: ${c.clear_max_day},
        // 移除动态
        clear_remove_dynamic: ${c.clear_remove_dynamic},
        // 移除关注
        clear_remove_attention: ${c.clear_remove_attention},
    },
})`
}

export function generateEnvCode(c: LotteryConfig): string {
  return `module.exports = Object.freeze({
    account_parm: {
        COOKIE: '你的B站Cookie',
        NOTE: '',
        NUMBER: 1,
        CLEAR: ${c.clear_enable},
        ACCOUNT_UA: 'Mozilla/5.0 ...',

        ENABLE_AI_JUDGE: ${c.enable_ai_judge},
        ENABLE_AI_COMMENTS: ${c.enable_ai_comments},

        ENABLE_MULTIPLE_ACCOUNT: false,
        LOTTERY_LOG_LEVEL: 3,
        NOT_GO_LOTTERY: ''
    },

    push_parm: {
        SCKEY: '',
        SENDKEY: '',
        TG_BOT_TOKEN: '',
        TG_USER_ID: '',
        // ... 更多推送渠道
    },

    ai_parm: {
        AI_API_KEY: '你的API Key',
    }
})`
}
