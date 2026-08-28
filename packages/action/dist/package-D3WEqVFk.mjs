//#region ../covector/package.json
var name = "covector";
var version = "0.13.1";
var license = "Apache-2.0";
var homepage = "https://github.com/jbolda/covector#readme";
var author = "Jacob Bolda <me@jacobbolda.com> (https://www.jacobbolda.com/)";
var repository = {
	"type": "git",
	"url": "https://github.com/jbolda/covector.git"
};
var engines = { "node": ">=20.12" };
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
	"@clack/prompts": "^1.6.0",
	"@covector/apply": "0.11.1",
	"@covector/assemble": "0.13.1",
	"@covector/changelog": "0.13.1",
	"@covector/command": "0.9.1",
	"@covector/files": "0.9.1",
	"@effectionx/context-api": "^0.6.0",
	"effection": "^4.1.0",
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
