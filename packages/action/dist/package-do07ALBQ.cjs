'use strict';

var name = "covector";
var version = "0.12.4";
var license = "Apache-2.0";
var homepage = "https://github.com/jbolda/covector#readme";
var author = "Jacob Bolda <me@jacobbolda.com> (https://www.jacobbolda.com/)";
var repository = {
	type: "git",
	url: "https://github.com/jbolda/covector.git"
};
var engines = {
	node: ">=18"
};
var main = "dist/index.js";
var types = "dist/index.d.ts";
var exports$1 = {
	development: "./src/index.ts",
	"default": "./dist/index.js"
};
var bin = {
	covector: "./bin/covector.js"
};
var files = [
	"bin",
	"dist"
];
var scripts = {
	build: "tsc -b",
	clean: "rimraf dist tsconfig.tsbuildinfo node_modules",
	prepublishOnly: "tsc -b",
	test: "vitest"
};
var dependencies = {
	"@clack/prompts": "^0.10.0",
	"@covector/apply": "0.10.0",
	"@covector/assemble": "0.12.0",
	"@covector/changelog": "0.12.0",
	"@covector/command": "0.8.0",
	"@covector/files": "0.8.0",
	effection: "4.0.0-alpha.4",
	globby: "^11.1.0",
	"js-yaml": "^4.1.0",
	lodash: "^4.17.21",
	pino: "^9.1.0",
	"pino-abstract-transport": "^1.2.0",
	"strip-ansi": "6.0.1",
	yargs: "^17.7.2"
};
var devDependencies = {
	"@covector/types": "0.0.0",
	"@types/inquirer": "^8.2.6",
	"@types/yargs": "^17.0.33",
	fixturez: "^1.1.0"
};
var volta = {
	"extends": "../../package.json"
};
var _package = {
	name: name,
	version: version,
	license: license,
	homepage: homepage,
	author: author,
	repository: repository,
	engines: engines,
	main: main,
	types: types,
	exports: exports$1,
	bin: bin,
	files: files,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	volta: volta
};

exports.author = author;
exports.bin = bin;
exports.default = _package;
exports.dependencies = dependencies;
exports.devDependencies = devDependencies;
exports.engines = engines;
exports.exports = exports$1;
exports.files = files;
exports.homepage = homepage;
exports.license = license;
exports.main = main;
exports.name = name;
exports.repository = repository;
exports.scripts = scripts;
exports.types = types;
exports.version = version;
exports.volta = volta;
