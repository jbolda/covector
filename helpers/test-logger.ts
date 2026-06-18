import { expect } from "vitest";
import { type Operation, useScope } from "effection";
import { getAttributes, logger } from "../packages/covector/src/logger.ts";
import type { LoggerLevel } from "../packages/types/src/index.ts";

export interface TestLogEntry {
  msg: string;
  level: LoggerLevel;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

function toMessage(message: string | object): string {
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "msg" in message) {
    const value = (message as { msg?: unknown }).msg;
    if (typeof value === "string") return value;
  }
  return JSON.stringify(message);
}

function parseEntry(level: LoggerLevel, args: unknown[]): TestLogEntry {
  const first = args[0];
  const second = args[1];

  if (
    first != null &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    !(first instanceof Error)
  ) {
    const bindings = first as Record<string, unknown>;
    const msg =
      typeof second === "string"
        ? second
        : typeof bindings.msg === "string"
          ? bindings.msg
          : toMessage(bindings as object);
    return {
      ...bindings,
      msg,
      level,
    };
  }

  if (first instanceof Error) {
    return {
      msg: first.stack ?? first.message,
      level,
    };
  }

  if (typeof first === "string") {
    return {
      msg: first,
      level,
    };
  }

  if (first && typeof first === "object") {
    return {
      msg: toMessage(first as object),
      level,
    };
  }

  return {
    msg: String(first ?? ""),
    level,
  };
}

export function toEntry(level: LoggerLevel, args: unknown[]): TestLogEntry {
  return parseEntry(level, args);
}

export function pushEntry(
  stream: TestLogEntry[],
  level: LoggerLevel,
  args: unknown[],
): void {
  stream.push(parseEntry(level, args));
}

export function* createCapturedLogger() {
  let sink = {
    info: [] as TestLogEntry[],
    error: [] as TestLogEntry[],
    warn: [] as TestLogEntry[],
    debug: [] as TestLogEntry[],
    fatal: [] as TestLogEntry[],
    logs: [] as TestLogEntry[],
    all: [] as TestLogEntry[],
    stdout: [] as TestLogEntry[],
    stderr: [] as TestLogEntry[],
    stdio: [] as TestLogEntry[],
  };

  function* withMeta(level: LoggerLevel, args: unknown[]) {
    const scope = yield* useScope();
    const attrs = getAttributes(scope);
    const logEntry = toEntry(level, args);
    if (attrs.name !== "anonymous") {
      logEntry.command = attrs.name;
      logEntry.meta = { ...logEntry.meta, command: attrs.name };
    }
    return logEntry;
  }

  const around = {
    *info(args, _next) {
      const logEntry = yield* withMeta("info", args);
      sink.info.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *error(args, _next) {
      const logEntry = yield* withMeta("error", args);
      sink.error.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *warn(args, _next) {
      const logEntry = yield* withMeta("warn", args);
      sink.warn.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *debug(args, _next) {
      const logEntry = yield* withMeta("debug", args);
      sink.debug.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *fatal(args, _next) {
      const logEntry = yield* withMeta("fatal", args);
      sink.fatal.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *stdout(args, _next) {
      if (typeof args[0] === "string") {
        const logEntry = yield* withMeta("info", args);
        sink.stdout.push(logEntry);
        sink.stdio.push(logEntry);
        sink.all.push(logEntry);
      }
    },
    *stderr(args, _next) {
      if (typeof args[0] === "string") {
        const logEntry = yield* withMeta("error", args);
        sink.stderr.push(logEntry);
        sink.stdio.push(logEntry);
        sink.all.push(logEntry);
      }
    },
  } satisfies Parameters<typeof logger.around>[0];
  return { sink, around };
}

export function* useCapturedLogger() {
  const { sink, around } = yield* createCapturedLogger();
  yield* logger.around(around, { at: "min" });
  return sink;
}

export function* consecutive(
  actual: TestLogEntry[],
  expected: Array<Partial<TestLogEntry>>,
  matcher: (
    actualEntry: TestLogEntry,
    expectedEntry: Partial<TestLogEntry>,
  ) => void = (actualEntry, expectedEntry) => {
    if (
      typeof expectedEntry.msg === "string" &&
      typeof actualEntry.msg === "string"
    ) {
      expect(actualEntry.msg).toContain(expectedEntry.msg);
      const { msg: _msg, ...rest } = expectedEntry;
      expect(actualEntry).toMatchObject(rest);
      return;
    }

    expect(actualEntry).toMatchObject(expectedEntry);
  },
): Operation<void> {
  if (expected.length === 0) return;

  let cursor = 0;
  for (const expectedEntry of expected) {
    let found = false;
    for (let index = cursor; index < actual.length; index++) {
      try {
        matcher(actual[index], expectedEntry);
        cursor = index + 1;
        found = true;
        break;
      } catch {
        // keep scanning forward for this expected entry
      }
    }

    if (!found) {
      throw new Error(
        `expected log entry not found in order. expected=${JSON.stringify(expectedEntry)} actual=${JSON.stringify(actual)}`,
      );
    }
  }
}
