import { create } from 'zustand'
import type { LoggerConfig } from '~/types/logger'

interface LoggerState {
  config: LoggerConfig
  setConfig: (config: Partial<LoggerConfig>) => void
}

export const useLoggerStore = create<LoggerState>((set) => ({
  config: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info',
    showTimestamp: true,
    showLevel: true,
    isDevelopment: process.env.NODE_ENV === 'development'
  },
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig }
    }))
})) 