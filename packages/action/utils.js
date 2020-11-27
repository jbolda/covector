const commandText = (pkg) => {
  const { precommand, command, postcommand } = pkg;
  let text = "";

  if (typeof precommand !== "boolean") {
    text = `${text}${precommand}\n`;
  }

  if (typeof command !== "boolean") {
    text = `${text}${command}\n`;
  }

  if (typeof postcommand !== "boolean") {
    text = `${text}${postcommand}\n`;
  }

  return text === "" ? "Publish complete." : text;
};

const packageListToArray = (list) => {
  if (list === "") {
    return [];
  } else {
    return list.split(",");
  }
};

module.exports = { commandText, packageListToArray };
