import type { Operation, Scope } from "effection";
import { createContext, useScope } from "effection";
import yaml from "js-yaml";
import type {
  Logger,
  LoggerAttribute,
  LoggerBindings,
  LoggerBucket,
  LoggerEntry,
  LoggerLevel,
} from "@covector/types";
import { createApi } from "@effectionx/context-api";

const numericLevelByLabel: Record<LoggerLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function normalizeMessage(
  message: string | unknown | Error | LoggerBindings,
): LoggerBindings {
  if (typeof message === "string") {
    return { msg: message };
  }

  if (message instanceof Error) {
    const error = message as Error;
    return {
      msg: error.message,
      //   name: error.name,
      //   stack: error.stack,
    };
  }

  const bindings = { ...(message as LoggerBindings) };
  const msg = typeof bindings.msg === "string" ? bindings.msg : "";
  return { msg, ...bindings };
}

function formatConsoleLine(entry: LoggerEntry): string {
  const level = entry.levelLabel.toLowerCase();
  const covectorStep = entry?.step ? ` ${entry.step} :: ` : "";
  const command = entry?.command ? ` ${entry.command}` : "";
  const msg = entry?.msg ? ` ${entry.msg}` : "";
  const renderAsYAML = entry?.renderAsYAML
    ? `\n    ${yaml.dump(entry.renderAsYAML).replace(/\n/gm, "\n    ")}`
    : "";

  if (entry.bucket === "stdout") {
    return `[stdout]${command}${msg}${renderAsYAML}`;
  }

  if (entry.bucket === "stderr") {
    return `[stderr]${command}${msg}${renderAsYAML}`;
  }

  return `[${level}]${command}${covectorStep}${msg}${renderAsYAML}`;
}

const AttributesContext = createContext<LoggerAttribute>(
  "@covector/attributes",
  {
    name: "anonymous",
  },
);

// matches upcoming effection v4.1 API
export function* useAttributes(
  attrs: Partial<LoggerAttribute>,
): Operation<void> {
  let scope = yield* useScope();

  let current = scope.hasOwn(AttributesContext)
    ? scope.expect(AttributesContext)
    : AttributesContext.defaultValue!;

  scope.set(AttributesContext, { ...current, ...attrs });
}

export function getAttributes(scope: Scope) {
  if (scope.hasOwn(AttributesContext)) {
    return scope.expect(AttributesContext);
  }
  return AttributesContext.defaultValue as LoggerAttribute;
}

function* emit(
  levelLabel: LoggerLevel,
  message: string | unknown | LoggerBindings,
  bucket: LoggerBucket = "default",
): Operation<void> {
  const scope = yield* useScope();
  const attrs = getAttributes(scope);

  const normalized = normalizeMessage(message);
  const entry: LoggerEntry = {
    command: attrs.name,
    ...normalized,
    bucket,
    levelLabel,
    level: numericLevelByLabel[levelLabel],
    msg: normalized.msg,
  };

  const line = formatConsoleLine(entry);
  if (entry.bucket === "stderr" || entry.levelLabel === "error") {
    console.error(line);
  } else if (entry.levelLabel === "warn") {
    console.warn(line);
  } else if (entry.levelLabel === "debug") {
    console.debug(line);
  } else {
    console.log(line);
  }
}

export const logger = createApi("@covector/logging", {
  *info(message: string | unknown | LoggerBindings) {
    yield* emit("info", message);
  },
  *error(message: string | unknown | LoggerBindings) {
    yield* emit("error", message);
  },
  *warn(message: string | unknown | LoggerBindings) {
    yield* emit("warn", message);
  },
  *debug(message: string | unknown | LoggerBindings) {
    yield* emit("debug", message);
  },
  *fatal(message: string | unknown | LoggerBindings) {
    yield* emit("fatal", message);
  },
  *stdout(message: string) {
    yield* emit("info", message, "stdout");
  },
  *stderr(message: string) {
    yield* emit("error", message, "stderr");
  },
} satisfies Logger);
