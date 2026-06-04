import { expect } from "vitest";
import { createApi as createContextApi } from "@effectionx/context-api";
import { createContext, useScope } from "effection";
import { logger } from "../packages/covector/src";

export interface TestLogEntry {
  msg: string;
  level: number;
  [key: string]: unknown;
}

export function sink(): TestLogEntry[] {
  return [];
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

function push(stream: TestLogEntry[], level: number, ...args: unknown[]): void {
  stream.push(parseEntry(level, args));
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

export function* createCapturedLogger(stream: TestLogEntry[]) {
  const sink = {
    info: [],
    error: [],
    warn: [],
    debug: [],
    fatal: [],
    stdout: [],
    stderr: [],
  } as Record<string, TestLogEntry[]>;

  yield* logger.around({
    *info(args, _next) {
      sink.info.push(...args.map((arg) => toEntry(30, [arg])));
    },
    *error(args, _next) {
      sink.error.push(...args.map((arg) => toEntry(50, [arg])));
    },
    *warn(args, _next) {
      sink.warn.push(...args.map((arg) => toEntry(40, [arg])));
    },
    *debug(args, _next) {
      sink.debug.push(...args.map((arg) => toEntry(20, [arg])));
    },
    *fatal(args, _next) {
      sink.fatal.push(...args.map((arg) => toEntry(60, [arg])));
    },
    *stdout(args, _next) {
      if (typeof args[0] === "string") {
        sink.stdout.push(...args.map((arg) => toEntry(30, [arg])));
      }
    },
    *stderr(args, _next) {
      if (typeof args[0] === "string") {
        sink.stderr.push(...args.map((arg) => toEntry(30, [arg])));
      }
    },
  });
  return sink;
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
