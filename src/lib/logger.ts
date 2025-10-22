/**
 * Centralized Logger Service
 * Provides consistent logging with environment-aware behavior
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "success";

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      timestamp: true,
      ...options,
    };
  }

  private format(level: LogLevel, args: any[]): any[] {
    const parts: any[] = [];

    // Timestamp
    if (this.options.timestamp) {
      parts.push(`[${new Date().toLocaleTimeString()}]`);
    }

    // Level icon
    const icons: Record<LogLevel, string> = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      success: "✅",
    };
    parts.push(icons[level]);

    // Prefix
    if (this.options.prefix) {
      parts.push(`[${this.options.prefix}]`);
    }

    return [...parts, ...args];
  }

  debug(...args: any[]): void {
    if (this.isDev) {
      console.log(...this.format("debug", args));
    }
  }

  info(...args: any[]): void {
    if (this.isDev) {
      console.log(...this.format("info", args));
    }
  }

  warn(...args: any[]): void {
    console.warn(...this.format("warn", args));
  }

  error(...args: any[]): void {
    console.error(...this.format("error", args));
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  success(...args: any[]): void {
    if (this.isDev) {
      console.log(...this.format("success", args));
    }
  }

  // Create child logger with prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix,
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Pre-configured loggers for different modules
export const dbLogger = logger.child("DB");
export const syncLogger = logger.child("Sync");
export const authLogger = logger.child("Auth");
export const statsLogger = logger.child("Stats");
