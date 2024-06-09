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

export default async function (opts) {
  return build(async function (source) {
    for await (let log of source) {
      console.dir(log);
      const level = `${logLevel[log.level].toUpperCase()}`;
      const command = log?.command ? `:${log.command}` : "";
      const covectorModule = log?.module ? `:${log.module}` : "";
      const msg = log?.msg ? `:: ${log.msg}` : "";
      const renderAsYAML = log?.renderAsYAML
        ? `\n    ${yaml.dump(log.renderAsYAML).replace(/\n/gm, "\n    ")}`
        : "";

      console.log(
        `${level}|${log.name}${command}${covectorModule} ${msg}${renderAsYAML}`
      );
    }
  });
}
