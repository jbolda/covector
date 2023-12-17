const { TomlDocument: TomlDocumentInner } = require("./pkg/covector_toml");

function proxyPropGet(target, prop) {
  return new Proxy(target.get(prop), {
    get(t, innerProp) {
      const ret = Reflect.get(...arguments);
      return ret ? ret : proxyPropGet(target, prop + "." + innerProp);
    },
    set(t, innerProp, newValue) {
      return target.set(prop + "." + innerProp, newValue);
    },
  });
}

class TomlDocument {
  inner;

  constructor(toml) {
    this.inner = new TomlDocumentInner(toml);

    return new Proxy(this, {
      get(target, prop) {
        const ret = Reflect.get(...arguments);
        return ret ? ret : proxyPropGet(target, prop);
      },
    });
  }

  set(key, value) {
    return this.inner.set(key, value);
  }

  get(key) {
    return this.inner.get(key);
  }

  toString() {
    return this.inner.toString();
  }

  toObject() {
    return this.inner.toObject();
  }
}

module.exports = { TomlDocument };
