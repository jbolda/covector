/* tslint:disable */
/* eslint-disable */
/**
*/
export class TomlDocument {
  free(): void;
/**
* @param {string} toml - Toml document as a JS String.
*/
  constructor(toml: string);
/**
* @param {string} toml - Toml document as a JS String.
*/
  static parse(toml: string): TomlDocument;
/**
* Set a `key` to `value`.
*
* @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
* @param {string} value - The new value of the key.
*/
  set(key: string, value: any): any;
/**
* Get the value of a `key`.
*
* @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
* @returns {*} The value of the key.
*/
  get(key: string): any;
/**
* Returns a JS String representation of this toml document.
* @returns {string}
*/
  toString(): string;
/**
* Returns a JS Object representation of this toml document.
* @returns {any}
*/
  toObject(): any;
}
