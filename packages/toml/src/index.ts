import { TomlDocument as TomlDocumentInner } from "../pkg/covector_toml";

function proxyPropGet<T extends TomlDocument>(
  target: T,
  prop: string | symbol
): typeof Proxy<T> | undefined {
  if (typeof prop === "symbol") return undefined;

  const propTarget = target.get(prop);

  if (!propTarget) return undefined;

  return new Proxy(propTarget, {
    has(_, innerProp) {
      if (typeof innerProp === "symbol") return false;

      // @ts-expect-error this is valid usage of spread
      const ret = Reflect.get(...arguments);
      return ret ? ret : target.get(prop + "." + innerProp);
    },
    get(_, innerProp) {
      if (typeof innerProp === "symbol") return undefined;

      // @ts-expect-error this is valid usage of spread
      const ret = Reflect.get(...arguments);
      return ret ? ret : proxyPropGet(target, prop + "." + innerProp);
    },
    set(_, innerProp, newValue) {
      if (typeof innerProp === "symbol") return undefined;

      return target.set(prop + "." + innerProp, newValue);
    },
  });
}

export class TomlDocument {
  inner;

  [key: string]: any;

  /**
   * @param {string} toml - Toml document as a JS String.
   */
  constructor(toml: string) {
    this.inner = new TomlDocumentInner(toml);

    return new Proxy(this, {
      has(target, prop) {
        if (typeof prop === "symbol") return false;

        // @ts-expect-error this is valid usage of spread
        const ret = Reflect.get(...arguments);
        return ret ? ret : target.get(prop);
      },
      get(target, prop) {
        // @ts-expect-error this is valid usage of spread
        const ret = Reflect.get(...arguments);
        return ret ? ret : proxyPropGet(target, prop);
      },
    });
  }

  /**
   * @param {string} toml - Toml document as a JS String.
   */
  static parse(toml: string) {
    return new TomlDocument(toml);
  }

  /**
   * @param {TomlDocument} toml - Toml document.
   */
  static stringify(toml: TomlDocument) {
    if (toml instanceof TomlDocument) {
      return toml.toString();
    } else {
      throw new TypeError(
        `Expected: \`TomlDocument\`, Got: \`${typeof toml}\``
      );
    }
  }

  /**
   * Set a `key` to `value`.
   *
   * @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
   * @param {string} value - The new value of the key.
   */
  set(key: string, value: any) {
    return this.inner.set(key, value);
  }

  /**
   * Get the value of a `key`.
   *
   * @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
   * @returns {*} The value of the key.
   */
  get(key: string): any {
    return this.inner.get(key);
  }

  /**
   * Checks if a `key` exists.
   *
   * @param {string} key - The key to check, can also be a nested key i.e `package.details.name`
   * @returns {boolean} Whether the key exists or not.
   */
  has(key: string): boolean {
    return this.inner.has(key);
  }

  /**
   * Returns a JS String representation of this toml document.
   * @returns {string}
   */
  toString(): string {
    return this.inner.toString();
  }

  /**
   * Returns a JS Object representation of this toml document.
   * @returns {any}
   */
  toObject(): any {
    return this.inner.toObject();
  }
}
