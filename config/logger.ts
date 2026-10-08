import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import stripAnsi from 'strip-ansi';

// ---------- COMMON FIELDS FORMAT (for all transports) ----------
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true })
);

// ---------- CUSTOM PRINTF FORMAT (without color) ----------
const fileFormat = winston.format.printf(({ timestamp, level, message, event, status, ...meta }) => {
  // event = e.g. "TEST START", "TEST FAILED", "SUMMARY"
  const evt = (event || '').toString().padEnd(12, '');
  const lvl = level.toUpperCase().padEnd(5, '');
  let msg = message ?? '';

  if (status) msg += ` | Status: ${status}`;
  const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  if(evt.trim() === '') {
    return `[${timestamp}][${lvl}] - ${msg}${metaStr}`;
  }
  return `[${timestamp}][${lvl}][${evt}] - ${msg}${metaStr}`;
});

// ---------- PRETTY CONSOLE FORMAT (colored, human-readable) ----------
const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize({ all: true }),
  fileFormat
);

// ---------- ROTATING FILE (machine-readable, no colors) ----------
const fileTransport = new DailyRotateFile({
  dirname: 'logs',              // logs directory
  filename: 'info-%DATE%.log',  // e.g. info-2025-12-08.log
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,          // compress old logs
  maxSize: '10m',               // 10 MB per file
  maxFiles: '14d',              // keep 14 days
  level: 'debug',               // Capture all log levels including debug
  auditFile: 'logs/info-audit.json',  //to track log files for rotation
  format: winston.format.combine(
    baseFormat,
    winston.format.uncolorize(), // ❌ Remove ANSI color codes
    fileFormat
  ),
});

// ---------- CONSOLE TRANSPORT (pretty, with colors) ----------
const consoleTransport = new winston.transports.Console({
  level: 'debug',               // Capture all log levels including debug
  format: consoleFormat,
  stderrLevels: ['error', 'warn'],  // Send errors/warnings to stderr
});

// ---------- LOGGER INSTANCE ----------
const logger = winston.createLogger({
  level: 'debug',               // Set to debug to capture all levels
  // Note: base format is applied per-transport above
  transports: [fileTransport, consoleTransport],
});

// Preserve original console methods to avoid recursion
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// ---- Redirect console → logger ----
const cleanArgs = (args: unknown[]) => args.map(arg => 
  typeof arg === 'string' ? stripAnsi(arg) : arg
);

const formatArgs = (args: unknown[]) => {
  const cleaned = cleanArgs(args);
  return cleaned.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
};

console.log = (...args: unknown[]) => {
  const msg = formatArgs(args);
  logger.info(msg);
};

console.info = (...args: unknown[]) => {
  const msg = formatArgs(args);
  logger.info(msg);
};

console.warn = (...args: unknown[]) => {
  const msg = formatArgs(args);
  logger.warn(msg);
};

console.error = (...args: unknown[]) => {
  const msg = formatArgs(args);
  logger.error(msg);
};

console.debug = (...args: unknown[]) => {
  const msg = formatArgs(args);
  logger.debug(msg);
};

// ---- Ensure logger output also appears on original console in development ----
if (process.env.NODE_ENV !== 'production') {
  logger.on('data', (log) => {
    originalConsole.log(log.message);
  });
}

export default logger;
export { originalConsole, formatArgs };
