export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  showTimestamp: boolean
  showLevel: boolean
  isDevelopment: boolean
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: any
} 