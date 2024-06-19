import build from "pino-abstract-transport";
import yaml from "js-yaml";
import * as core from "@actions/core";
import type { LoggerBindings } from "@covector/types";

const logLevel = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

export default function (opts?: never) {
  return build(function (source) {
    source.on("data", function (log: LoggerBindings) {
      const level =
        log.level > 40
          ? `[${logLevel[log.level as keyof typeof logLevel].toLowerCase()}]`
          : "";
      const msg = log?.msg ? ` ${log.msg}` : "";
      const renderAsYAML = log?.renderAsYAML
        ? `\n    ${yaml.dump(log.renderAsYAML).replace(/\n/gm, "\n    ")}`
        : "";

      actionLog(log, `${level}${msg}${renderAsYAML}`);
    });
  });
}

function actionLog(log: LoggerBindings, message: string) {
  if (log.renderAsYAML) core.startGroup(log.msg);
  switch (log.level) {
    case 60:
      core.error(message);
    case 50:
      core.warning(message);
      break;
    case 40:
      core.notice(message);
      break;
    case 20:
    case 10:
      core.debug(message);
      break;
    default:
      core.info(message);
      break;
  }
  if (log.renderAsYAML) core.endGroup();
}
