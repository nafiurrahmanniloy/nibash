/**
 * logger.ts — tiny leveled structured logger (ARCHITECTURE.md §4: "structured
 * logging, no console.log in request paths"). Emits a single JSON line per event so
 * logs are greppable and parseable. Request/service code calls `logger.*`, never
 * `console.*`.
 *
 * Level is controlled by LOG_LEVEL (debug|info|warn|error); defaults to info in
 * production and debug otherwise. Below-threshold levels are dropped cheaply.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveThreshold(): number {
  const raw = (process.env.LOG_LEVEL ?? '').toLowerCase();
  if (raw in LEVEL_ORDER) return LEVEL_ORDER[raw as LogLevel];
  return process.env.NODE_ENV === 'production'
    ? LEVEL_ORDER.info
    : LEVEL_ORDER.debug;
}

const threshold = resolveThreshold();

export type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_ORDER[level] < threshold) return;
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  });
  // The single sanctioned console sink for the app.
  // eslint-disable-next-line no-console
  (level === 'error' || level === 'warn' ? console.error : console.log)(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};

export type Logger = typeof logger;
