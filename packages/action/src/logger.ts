import * as core from "@actions/core";
import yaml from "js-yaml";
import type { LoggerLevel } from "@covector/types";

function extractMessage(args: unknown[]): { msg: string; renderAsYAML?: Record<string, any> } {
  const first = args[0];
  if (first != null && typeof first === "object" && !Array.isArray(first) && !(first instanceof Error)) {
    const obj = first as Record<string, unknown>;
    const msg = typeof obj.msg === "string" ? obj.msg : typeof args[1] === "string" ? args[1] as string : "";
    const renderAsYAML = obj.renderAsYAML as Record<string, any> | undefined;
    return { msg, renderAsYAML };
  }
  return { msg: String(first ?? "") };
}

function formatLine(msg: string, level: LoggerLevel, renderAsYAML?: Record<string, any>): string {
  const levelPrefix = level === "error" || level === "fatal" ? `[${level}]` : "";
  const yamlSuffix = renderAsYAML ? `\n    ${yaml.dump(renderAsYAML).replace(/\n/gm, "\n    ")}` : "";
  return `${levelPrefix}${msg ? ` ${msg}` : ""}${yamlSuffix}`;
}

function actionLog(level: LoggerLevel, args: unknown[]) {
  const { msg, renderAsYAML } = extractMessage(args);
  const line = formatLine(msg, level, renderAsYAML);

  if (renderAsYAML) core.startGroup(msg);
  switch (level) {
    case "fatal":
      core.error(line);
    case "error":
      core.warning(line);
      break;
    case "warn":
      core.notice(line);
      break;
    case "debug":
      core.debug(line);
      break;
    default:
      core.info(line);
      break;
  }
  if (renderAsYAML) core.endGroup();
}

export const actionAround = {
  *info(args: unknown[], _next: any) {
    actionLog("info", args);
  },
  *error(args: unknown[], _next: any) {
    actionLog("error", args);
  },
  *warn(args: unknown[], _next: any) {
    actionLog("warn", args);
  },
  *debug(args: unknown[], _next: any) {
    actionLog("debug", args);
  },
  *fatal(args: unknown[], _next: any) {
    actionLog("fatal", args);
  },
  *stdout(args: unknown[], _next: any) {
    actionLog("info", args);
  },
  *stderr(args: unknown[], _next: any) {
    actionLog("error", args);
  },
};
