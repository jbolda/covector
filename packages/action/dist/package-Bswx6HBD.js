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
var type = "module";
var exports = {
	development: "./src/index.ts",
	"import": {
		types: "./dist/index.d.ts",
		"default": "./dist/index.js"
	}
};
var bin = {
	covector: "./bin/covector.mjs"
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
	pino: "^9.1.0",
	"pino-abstract-transport": "^1.2.0",
	"strip-ansi": "6.0.1",
	yargs: "^17.7.2"
};
var devDependencies = {
	"@covector/types": "0.0.0",
	"@octokit/webhooks-definitions": "^3.67.3",
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
	type: type,
	exports: exports,
	bin: bin,
	files: files,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	volta: volta
};

export { author, bin, _package as default, dependencies, devDependencies, engines, exports, files, homepage, license, name, repository, scripts, type, version, volta };
//# sourceMappingURL=package-Bswx6HBD.js.map
