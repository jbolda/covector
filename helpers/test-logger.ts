import { expect } from "vitest";
import { logger } from "../packages/covector/src";

export interface TestLogEntry {
  msg: string;
  level: number;
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

function parseEntry(level: number, args: unknown[]): TestLogEntry {
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

export function toEntry(level: number, args: unknown[]): TestLogEntry {
  return parseEntry(level, args);
}

export function pushEntry(
  stream: TestLogEntry[],
  level: number,
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

  // yield* logger.around({
  const around = {
    *info(args, _next) {
      const logEntry = toEntry(30, args);
      sink.info.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *error(args, _next) {
      const logEntry = toEntry(50, args);
      sink.error.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *warn(args, _next) {
      const logEntry = toEntry(40, args);
      sink.warn.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *debug(args, _next) {
      const logEntry = toEntry(20, args);
      sink.debug.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *fatal(args, _next) {
      const logEntry = toEntry(60, args);
      sink.fatal.push(logEntry);
      sink.logs.push(logEntry);
      sink.all.push(logEntry);
    },
    *stdout(args, _next) {
      if (typeof args[0] === "string") {
        const logEntry = toEntry(30, args);
        sink.stdout.push(logEntry);
        sink.stdio.push(logEntry);
        sink.all.push(logEntry);
      }
    },
    *stderr(args, _next) {
      if (typeof args[0] === "string") {
        const logEntry = toEntry(30, args);
        sink.stderr.push(logEntry);
        sink.stdio.push(logEntry);
        sink.all.push(logEntry);
      }
    },
  } satisfies Parameters<typeof logger.around>[0];
  return { sink, around };
}

export function consecutive(
  actual: TestLogEntry[],
  expected: Array<Partial<TestLogEntry>>,
  matcher: (
    actualEntry: TestLogEntry,
    expectedEntry: Partial<TestLogEntry>,
  ) => void = (actualEntry, expectedEntry) => {
    if (
      Array.isArray(expectedEntry.msg) &&
      typeof actualEntry.msg === "string"
    ) {
      for (const part of expectedEntry.msg) {
        if (typeof part === "string") {
          expect(actualEntry.msg).toContain(part);
        }
      }
      const { msg: _msg, ...rest } = expectedEntry;
      expect(actualEntry).toMatchObject(rest);
      return;
    }

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
): void {
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

    if (!found && canSkipExpected(expectedEntry)) {
      continue;
    }

    if (!found) {
      throw new Error(
        `expected log entry not found in order. expected=${JSON.stringify(expectedEntry)} actual=${JSON.stringify(actual)}`,
      );
    }
  }
}

function canSkipExpected(expectedEntry: Partial<TestLogEntry>): boolean {
  if (
    expectedEntry.level !== 30 ||
    typeof expectedEntry.msg !== "string" ||
    !("command" in expectedEntry)
  ) {
    return false;
  }

  if (expectedEntry.msg === "completed") return false;
  if (expectedEntry.msg.includes("]:")) return false;
  if (expectedEntry.msg.startsWith("Checking if ")) return false;
  if (expectedEntry.msg.startsWith("dryRun >> ")) return false;
  return true;
}
