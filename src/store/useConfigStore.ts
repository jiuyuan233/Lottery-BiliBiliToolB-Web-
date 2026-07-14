import { create } from 'zustand'

export type LotteryModel = '00' | '10' | '01' | '11'

export interface LotteryConfig {
  UIDs: string
  TAGs: string
  Articles: string
  model: LotteryModel
  chatmodel: LotteryModel
  key_words: string
  blockword: string
  blacklist: string
  minfollower: number
  max_create_time: number
  wait: number
  lottery_loop_wait: number
  enable_ai_judge: boolean
  enable_ai_comments: boolean
  disable_reserve_lottery: boolean
  sneaktower: boolean
  create_dy: boolean
  is_copy_chat: boolean
  clear_enable: boolean
  clear_max_day: number
  clear_remove_dynamic: boolean
  clear_remove_attention: boolean
  check_if_duplicated: number
}

const defaultConfig: LotteryConfig = {
  UIDs: '',
  TAGs: '抽奖,转发抽奖',
  Articles: '抽奖合集',
  model: '11',
  chatmodel: '01',
  key_words: '[抽奖送揪]|福利\n[转关评粉]|参与',
  blockword: '脚本,抽奖号,钓鱼',
  blacklist: '',
  minfollower: 1000,
  max_create_time: 60,
  wait: 30000,
  lottery_loop_wait: 0,
  enable_ai_judge: true,
  enable_ai_comments: true,
  disable_reserve_lottery: false,
  sneaktower: true,
  create_dy: false,
  is_copy_chat: false,
  clear_enable: true,
  clear_max_day: 30,
  clear_remove_dynamic: true,
  clear_remove_attention: true,
  check_if_duplicated: 1,
}

interface ConfigStore {
  config: LotteryConfig
  update: <K extends keyof LotteryConfig>(key: K, value: LotteryConfig[K]) => void
  reset: () => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: defaultConfig,
  update: (key, value) =>
    set((state) => ({
      config: { ...state.config, [key]: value },
    })),
  reset: () => set({ config: defaultConfig }),
}))
