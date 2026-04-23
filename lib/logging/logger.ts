import { inspect } from "node:util"

const supportsColor =
  typeof process !== "undefined" &&
  Boolean(process.stdout?.isTTY) &&
  process.env.NO_COLOR !== "1" &&
  process.env.TERM !== "dumb"

const codes = supportsColor
  ? {
      reset: "\x1b[0m",
      dim: "\x1b[2m",
      gray: "\x1b[90m",
      cyan: "\x1b[36m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      magenta: "\x1b[35m",
    }
  : {
      reset: "",
      dim: "",
      gray: "",
      cyan: "",
      yellow: "",
      red: "",
      green: "",
      magenta: "",
    }

type Level = "debug" | "info" | "warn" | "error" | "success"

const levelColors: Record<Level, string> = {
  debug: codes.gray,
  info: codes.cyan,
  warn: codes.yellow,
  error: codes.red,
  success: codes.green,
}

const levelLabels: Record<Level, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
  success: "OK ",
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19)
}

function formatArg(value: unknown): string {
  if (typeof value === "string") return value
  return inspect(value, { depth: 4, colors: supportsColor, breakLength: 120 })
}

function emit(level: Level, tag: string, args: unknown[]): void {
  const ts = `${codes.dim}${timestamp()}${codes.reset}`
  const lvl = `${levelColors[level]}${levelLabels[level]}${codes.reset}`
  const tagPrefix = `${codes.magenta}${tag.padEnd(6).slice(0, 6)}${codes.reset}`
  const body = args.map(formatArg).join(" ")
  const line = `${ts} ${lvl} ${tagPrefix} ${body}\n`
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout
  stream.write(line)
}

export const logger = {
  debug: (tag: string, ...args: unknown[]) => emit("debug", tag, args),
  info: (tag: string, ...args: unknown[]) => emit("info", tag, args),
  warn: (tag: string, ...args: unknown[]) => emit("warn", tag, args),
  error: (tag: string, ...args: unknown[]) => emit("error", tag, args),
  success: (tag: string, ...args: unknown[]) => emit("success", tag, args),
}
