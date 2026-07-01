//#region ../covector/package.json
var name = "covector";
var version = "0.12.5";
var license = "Apache-2.0";
var homepage = "https://github.com/jbolda/covector#readme";
var author = "Jacob Bolda <me@jacobbolda.com> (https://www.jacobbolda.com/)";
var repository = {
	"type": "git",
	"url": "https://github.com/jbolda/covector.git"
};
var engines = { "node": ">=18" };
var type = "module";
var exports = {
	"development": "./src/index.ts",
	"import": {
		"types": "./dist/index.d.mts",
		"default": "./dist/index.mjs"
	}
};
var bin = { "covector": "./bin/covector.mjs" };
var files = ["bin", "dist"];
var scripts = {
	"build": "tsdown",
	"prepublishOnly": "tsdown",
	"test": "vitest"
};
var dependencies = {
	"@clack/prompts": "^0.10.0",
	"@covector/apply": "0.10.0",
	"@covector/assemble": "0.12.0",
	"@covector/changelog": "0.12.0",
	"@covector/command": "0.8.0",
	"@covector/files": "0.8.0",
	"@effectionx/context-api": "^0.6.0",
	"effection": "^4.0.3",
	"tinyglobby": "0.2.17",
	"yaml": "^2.9.0",
	"yargs": "^17.7.2"
};
var devDependencies = {
	"@covector/types": "0.0.0",
	"@types/inquirer": "^8.2.6",
	"@types/yargs": "^17.0.33"
};
var package_default = {
	name,
	version,
	license,
	homepage,
	author,
	repository,
	engines,
	type,
	exports,
	bin,
	files,
	scripts,
	dependencies,
	devDependencies
};
//#endregion
export { author, bin, package_default as default, dependencies, devDependencies, engines, exports, files, homepage, license, name, repository, scripts, type, version };
