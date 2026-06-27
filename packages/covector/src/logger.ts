import type { Operation, Scope } from "effection";
import { createContext, useScope } from "effection";
import { stringify } from "yaml";
import type {
  Logger,
  LoggerAttribute,
  LoggerBindings,
  LoggerBucket,
  LoggerEntry,
  LoggerLevel,
} from "@covector/types";
import { createApi } from "@effectionx/context-api";

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
    };
  }

  const bindings = { ...(message as LoggerBindings) };
  const msg = typeof bindings.msg === "string" ? bindings.msg : "";
  return { msg, ...bindings };
}

function formatConsoleLine(entry: LoggerEntry): string {
  const level = entry.level.toLowerCase();
  const covectorStep = entry?.step ? ` ${entry.step} :: ` : "";
  const msg = entry?.msg ? ` ${entry.msg}` : "";
  const renderAsYAML = entry?.renderAsYAML
    ? `\n    ${stringify(entry.renderAsYAML).replace(/\n/gm, "\n    ")}`
    : "";

  if (entry.bucket === "stdout") {
    return `[stdout]${msg}${renderAsYAML}`;
  }

  if (entry.bucket === "stderr") {
    return `[stderr]${msg}${renderAsYAML}`;
  }

  return `[${level}]${covectorStep}${msg}${renderAsYAML}`;
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
  return scope.get(AttributesContext) as LoggerAttribute;
}

function* emit(
  level: LoggerLevel,
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
    level,
    msg: normalized.msg,
    meta: { ...normalized.meta, command: attrs.name, step: attrs.step },
  };

  const line = formatConsoleLine(entry);
  if (entry.bucket === "stderr" || entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else if (entry.level === "debug") {
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
