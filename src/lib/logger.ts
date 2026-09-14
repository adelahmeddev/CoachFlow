type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string | number
    [key: string]: unknown
  }
}

function formatError(err: unknown) {
  if (!err) return undefined
  if (err instanceof Error) {
    const errorObj: LogEntry["error"] = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
    // Include extra properties (e.g. pg error code, status)
    for (const key of Object.keys(err)) {
      if (!(key in errorObj)) {
        errorObj[key] = (err as unknown as Record<string, unknown>)[key]
      }
    }
    return errorObj
  }
  return {
    name: "NonErrorObject",
    message: typeof err === "object" ? JSON.stringify(err) : String(err),
  }
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown) {
  const isProd = process.env.NODE_ENV === "production"
  const timestamp = new Date().toISOString()
  const errorFormatted = formatError(err)

  if (isProd) {
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
      ...(errorFormatted ? { error: errorFormatted } : {}),
    }
    const line = JSON.stringify(entry)
    if (level === "error") {
      process.stderr.write(line + "\n")
    } else {
      process.stdout.write(line + "\n")
    }
  } else {
    // Development readable format
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    const details = context ? ` ${JSON.stringify(context)}` : ""
    if (level === "error") {
      console.error(`${prefix} ${message}${details}`, err ?? "")
    } else if (level === "warn") {
      console.warn(`${prefix} ${message}${details}`)
    } else if (level === "debug") {
      console.debug(`${prefix} ${message}${details}`)
    } else {
      console.log(`${prefix} ${message}${details}`)
    }
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    emit("debug", message, context)
  },
  info(message: string, context?: Record<string, unknown>) {
    emit("info", message, context)
  },
  warn(message: string, context?: Record<string, unknown>) {
    emit("warn", message, context)
  },
  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    emit("error", message, context, err)
  },
}
