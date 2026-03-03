// src/utils/logger.ts
import * as SecureStore from 'expo-secure-store';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private level: LogLevel = 'info';

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  debug(message: string, data?: any) {
    const entry = this.formatLog('debug', message, data);
    this.addLog(entry);
    if (['debug', 'info', 'warn', 'error'].includes(this.level)) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    const entry = this.formatLog('info', message, data);
    this.addLog(entry);
    if (['info', 'warn', 'error'].includes(this.level)) {
      console.log(`[INFO] ${message}`, data);
    }
  }

  warn(message: string, data?: any) {
    const entry = this.formatLog('warn', message, data);
    this.addLog(entry);
    if (['warn', 'error'].includes(this.level)) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  error(message: string, error?: any) {
    const entry = this.formatLog('error', message, error);
    this.addLog(entry);
    console.error(`[ERROR] ${message}`, error);
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }
}

const logger = new Logger(process.env.LOG_LEVEL as LogLevel || 'info');

export const setupLogger = () => {
  logger.info('Logger initialized');
};

export default logger;
