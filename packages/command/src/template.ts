const reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
const reEscape = /<%-([\s\S]+?)%>/g;
const reEvaluate = /<%([\s\S]+?)%>/g;
const reInterpolate = /<%=([\s\S]+?)%>/g;
const reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
const reNoMatch = /($^)/;
const reEmptyStringLeading = /\b__p \+= '';/g;
const reEmptyStringMiddle = /\b(__p \+=) '' \+/g;
const reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
const reUnescapedString = /['\n\r\u2028\u2029\\]/g;

/** Used to escape characters for inclusion in compiled string literals. */
const stringEscapes = {
  "\\": "\\",
  "'": "'",
  "\n": "n",
  "\r": "r",
  "\u2028": "u2028",
  "\u2029": "u2029",
};

const templateSettings = {
  // Used to detect `data` property values to be HTML-escaped.
  escape: reEscape,
  // Used to detect code to be evaluated.
  evaluate: reEvaluate,
  // Used to detect `data` property values to inject.
  interpolate: reInterpolate,
  // Used to reference the data object in the template text.
  variable: "",
};

export function template(string: string, options = {}) {
  // Based on loadash's `_.template` implementation, a soft fork with the useful bits.
  const settings = templateSettings;

  //   string = toString(string);
  options = Object.assign({}, options, settings);

  var isEscaping,
    isEvaluating,
    index = 0,
    interpolate = reInterpolate,
    source = "__p += '";

  // Compile the regexp to match each delimiter.
  var reDelimiters = RegExp(
    reEscape.source +
      "|" +
      interpolate.source +
      "|" +
      (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source +
      "|" +
      reNoMatch.source +
      "|$",
    "g"
  );

  string.replace(
    reDelimiters,
    function (
      match,
      escapeValue,
      interpolateValue,
      esTemplateValue,
      evaluateValue,
      offset
    ) {
      interpolateValue || (interpolateValue = esTemplateValue);

      // Escape characters that can't be included in string literals.
      source += string
        .slice(index, offset)
        .replace(
          reUnescapedString,
          (chr) => "\\" + stringEscapes[chr as keyof typeof stringEscapes]
        );

      // Replace delimiters with snippets.
      if (escapeValue) {
        isEscaping = true;
        source += "' +\n__e(" + escapeValue + ") +\n'";
      }
      if (evaluateValue) {
        isEvaluating = true;
        source += "';\n" + evaluateValue + ";\n__p += '";
      }
      if (interpolateValue) {
        source +=
          "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
      }
      index = offset + match.length;
      return match;
    }
  );

  source += "';\n";

  // If `variable` is not specified wrap a with-statement around the generated
  // code to add the data object to the top of the scope chain.
  const variable = "variable" in options && (options.variable as string);
  if (!variable) {
    source = "with (obj) {\n" + source + "\n}\n";
  }
  // Throw an error if a forbidden character was found in `variable`, to prevent
  // potential command injection attacks.
  else if (reForbiddenIdentifierChars.test(variable)) {
    throw new Error("Invalid `variable` option passed into string `template`");
  }

  // Cleanup code by stripping empty strings.
  source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source)
    .replace(reEmptyStringMiddle, "$1")
    .replace(reEmptyStringTrailing, "$1;");

  // Frame code as the function body.
  source =
    "function(" +
    (variable || "obj") +
    ") {\n" +
    (variable ? "" : "obj || (obj = {});\n") +
    "var __t, __p = ''" +
    (isEscaping ? ", __e = _.escape" : "") +
    (isEvaluating
      ? ", __j = Array.prototype.join;\n" +
        "function print() { __p += __j.call(arguments, '') }\n"
      : ";\n") +
    source +
    "return __p\n}";

  return Function("return " + source).apply(undefined);
}
