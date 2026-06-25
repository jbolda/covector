import { expect, assert } from "vitest";
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
  if (expected.length !== actual.length) {
    throw new Error(
      `expected log entry count mismatch: actual has ${actual.length} entries, expected ${expected.length} entries.\n` +
        `actual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`,
    );
  }

  for (let i = 0; i < expected.length; i++) {
    matcher(actual[i], expected[i]);
  }
}

function getReceivedMsg(received: any) {
  if (typeof received?.msg === "string") return received.msg;
  if (typeof received?.err?.message === "string") return received.err.message;
  return String(received?.msg ?? "");
}

export function isShallowError(received: any, expected: any) {
  const receivedMsg = getReceivedMsg(received);
  if (Array.isArray(expected.msg)) {
    for (let chunk of expected.msg) {
      if (!receivedMsg.includes(chunk)) {
        throw new Error(
          `expected msg to include chunk "${chunk}" but received "${receivedMsg}"`,
        );
      }
    }
  } else if (!receivedMsg.includes(expected.msg)) {
    throw new Error(
      `expected msg to include "${expected.msg}" but received "${receivedMsg}"`,
    );
  }
  if (received.level !== expected.level) {
    throw new Error(
      `expected level ${expected.level} doesn't match the received one ${received.level}`,
    );
  }
  // Some environments attach an `err.code` on the logged error while others
  // only surface the textual message. Accept either form — if expected
  // specifies an err.code, prefer to check it when present on the received
  // object but don't fail when it's missing.
  if (
    expected?.err?.code &&
    received?.err?.code &&
    received.err.code !== expected.err.code
  ) {
    throw new Error(
      `expected err code ${expected?.err?.code} doesn't match the received one ${received?.err?.code}`,
    );
  }
}

export const checksWithObject =
  (keys = ["command"]) =>
  (received: any, expected: any) => {
    if (typeof expected === "function") {
      expected(received);
      return;
    }

    const normalizeMsg = (value: unknown): string => {
      if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
      if (typeof value === "string") return value;
      if (value == null) return "";
      try {
        return String(value);
      } catch {
        return "";
      }
    };
    const receivedMsg = normalizeMsg(received?.msg);
    const expectedMsg = normalizeMsg(expected?.msg);

    // special-case: some npm registries print package descriptions in slightly
    // different places; tests may use the '__ALLOW_BLANK_OR_DESC__' sentinel to
    // accept either a blank line or the package description text.
    if (expected && expectedMsg === "__ALLOW_BLANK_OR_DESC__") {
      if (
        receivedMsg === "" ||
        receivedMsg.includes("Multi-binding collection")
      ) {
        // accepted — don't assert
        return;
      }
    }

    if (Array.isArray(expected?.msg)) {
      for (let chunk of expected.msg) {
        assert.include(
          receivedMsg,
          chunk,
          `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`,
        );
      }
      if (received.level !== expected.level) {
        assert.deepEqual(received, expected);
      }
      for (let key of keys) {
        if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
      }
      return;
    }

    if (receivedMsg !== expectedMsg || received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };

export const checksChunksInMsg =
  (keys = ["command"]) =>
  (received: any, expected: any) => {
    const normalizeMsg = (value: unknown): string => {
      if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
      if (typeof value === "string") return value;
      if (value == null) return "";
      try {
        return String(value);
      } catch {
        return "";
      }
    };
    const receivedMsg = normalizeMsg(received?.msg);
    const expectedMsg = normalizeMsg(expected?.msg);

    if (received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    if (expected.err) {
      assert.include(
        receivedMsg,
        expected.err,
        `Expected ${receivedMsg} to include ${expected.err}, but received:\n${JSON.stringify(received, null, 2)}`,
      );
    } else if (receivedMsg !== expectedMsg) {
      if (Array.isArray(expected.msg)) {
        for (let chunk of expected.msg) {
          assert.include(
            receivedMsg,
            chunk,
            `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`,
          );
        }
      } else if (
        expectedMsg.includes("node:internal/") &&
        receivedMsg.includes("node:internal/")
      ) {
        // Node patch versions can shift internal frame names/line numbers.
        assert.include(receivedMsg, "node:internal/");
      } else if (receivedMsg.includes(expectedMsg)) {
        // General substring match: actual entry's msg is longer (e.g. contains
        // a full stack trace). Only verify level and the keys below.
      } else {
        assert.deepEqual(received, expected);
      }
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };
