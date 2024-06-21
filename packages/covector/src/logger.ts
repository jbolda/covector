import build from "pino-abstract-transport";
import yaml from "js-yaml";

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
    source.on("data", function (log) {
      const level = `${logLevel[log.level as keyof typeof logLevel].toLowerCase()}`;
      const covectorStep = log?.step ? ` ${log.step} :: ` : "";
      const msg = log?.msg ? ` ${log.msg}` : "";
      const renderAsYAML = log?.renderAsYAML
        ? `\n    ${yaml.dump(log.renderAsYAML).replace(/\n/gm, "\n    ")}`
        : "";

      console.log(`[${level}]${covectorStep}${msg}${renderAsYAML}`);
    });
  });
}
