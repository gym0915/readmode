import { useLoggerStore } from '~/store/logger'
import type { LogLevel, LogEntry } from '~/types/logger'

export class Logger {
  private module: string

  constructor(module: string) {
    this.module = module
  }

  private createLogEntry(level: LogLevel, message: string, ...data: any[]): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data: data.length > 0 ? data : undefined
    }
  }

  private log(level: LogLevel, message: string, ...data: any[]) {
    const { config } = useLoggerStore.getState()
    
    if (!config.enabled) return
    if (!config.isDevelopment && level === 'debug') return
    
    const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    if (logLevels.indexOf(level) < logLevels.indexOf(config.level)) return

    const entry = this.createLogEntry(level, message, ...data)
    const prefix = [
      config.showTimestamp ? `[${entry.timestamp}]` : '',
      config.showLevel ? `[${entry.level.toUpperCase()}]` : '',
      `[${entry.module}]`
    ].filter(Boolean).join(' ')

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...(entry.data || []))
        break
      case 'info':
        console.info(prefix, message, ...(entry.data || []))
        break
      case 'warn':
        console.warn(prefix, message, ...(entry.data || []))
        break
      case 'error':
        console.error(prefix, message, ...(entry.data || []))
        break
    }
  }

  debug(message: string, ...data: any[]) {
    this.log('debug', message, ...data)
  }

  info(message: string, ...data: any[]) {
    this.log('info', message, ...data)
  }

  warn(message: string, ...data: any[]) {
    this.log('warn', message, ...data)
  }

  error(message: string, ...data: any[]) {
    this.log('error', message, ...data)
  }
}

// 创建默认导出函数，方便使用
export const createLogger = (module: string) => new Logger(module) 