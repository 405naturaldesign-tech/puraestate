/**
 * Logger Utility
 * Centralized logging for the application
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.level = options.level || (process.env.LOG_LEVEL || 'info');
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;

    // Ensure log directory exists
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    this._log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    this._log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    this._log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message, data = {}) {
    this._log('error', message, data);
  }

  /**
   * Internal logging method
   */
  _log(level, message, data) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      namespace: this.namespace,
      message,
      ...data
    };

    // Console output
    if (this.enableConsole) {
      const output = `[${timestamp}] [${this.namespace}] ${level.toUpperCase()}: ${message}`;
      const color = this._getColorCode(level);

      if (data && Object.keys(data).length > 0) {
        console[level === 'error' ? 'error' : 'log'](
          `${color}${output}\x1b[0m`,
          JSON.stringify(data, null, 2)
        );
      } else {
        console[level === 'error' ? 'error' : 'log'](`${color}${output}\x1b[0m`);
      }
    }

    // File output
    if (this.enableFile) {
      this._writeToFile(JSON.stringify(logEntry));
    }
  }

  /**
   * Get color code for console output
   */
  _getColorCode(level) {
    const colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m'    // Red
    };
    return colors[level] || '';
  }

  /**
   * Write to log file
   */
  _writeToFile(entry) {
    try {
      fs.appendFileSync(this.logFile, entry + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

module.exports = Logger;
