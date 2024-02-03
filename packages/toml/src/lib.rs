use std::str::FromStr;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(v: &str);
}

type Result<T> = std::result::Result<T, JsValue>;

#[wasm_bindgen]
pub struct TomlDocument {
    toml: toml_edit::Document,
}

#[wasm_bindgen]
impl TomlDocument {
    /// @param {string} toml - Toml document as a JS String.
    #[wasm_bindgen(skip_jsdoc, constructor)]
    pub fn new(toml: &str) -> Result<TomlDocument> {
        Ok(Self {
            toml: toml_edit::Document::from_str(toml).map_err(|e| JsError::new(&e.to_string()))?,
        })
    }

    /// @param {string} toml - Toml document as a JS String.
    #[wasm_bindgen(skip_jsdoc)]
    pub fn parse(toml: &str) -> Result<TomlDocument> {
        Self::new(toml)
    }

    /// Set a `key` to `value`.
    ///
    /// @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
    /// @param {string} value - The new value of the key.
    #[wasm_bindgen(skip_jsdoc)]
    pub fn set(&mut self, key: &str, value: JsValue) -> Result<JsValue> {
        let mut path = key.split('.');
        let key = path.next().unwrap_or(key);
        let mut key = self
            .toml
            .get_mut(key)
            .ok_or_else(|| JsError::new(&format!("Couldn't find key: {key}")))?;
        for k in path {
            key = key
                .get_mut(k)
                .ok_or_else(|| JsError::new(&format!("Couldn't find key: {k}")))?;
        }
        *key = toml_edit::Item::Value(js_value_to_toml(&value)?);
        Ok(true.into())
    }

    /// Get the value of a `key`.
    ///
    /// @param {string} key - The key to set, can also be a nested key i.e `package.details.name`
    /// @returns {*} The value of the key.
    #[wasm_bindgen(skip_jsdoc)]
    pub fn get(&mut self, key: &str) -> JsValue {
        let mut path = key.split('.');
        let key = path.next().unwrap_or(key);
        let mut key = self.toml.get(key);
        for k in path {
            key = key.and_then(|key| key.get(k));
        }
        key.map(item_to_js).unwrap_or(JsValue::UNDEFINED)
    }

    /// Returns a JS String representation of this toml document.
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.toml.to_string()
    }

    /// Returns a JS Object representation of this toml document.
    #[wasm_bindgen(js_name = toObject)]
    pub fn to_object(&self) -> JsValue {
        item_to_js(self.toml.as_item())
    }
}

fn item_to_js(i: &toml_edit::Item) -> JsValue {
    match i {
        toml_edit::Item::None => JsValue::NULL,
        toml_edit::Item::Value(v) => value_to_js(v),
        toml_edit::Item::Table(t) => table_to_js(t),
        toml_edit::Item::ArrayOfTables(a) => a
            .into_iter()
            .map(table_to_js)
            .collect::<js_sys::Array>()
            .into(),
    }
}

fn value_to_js(v: &toml_edit::Value) -> JsValue {
    match v {
        toml_edit::Value::String(s) => JsValue::from_str(s.value()),
        toml_edit::Value::Integer(i) => JsValue::from(*i.value()),
        toml_edit::Value::Float(f) => JsValue::from_f64(*f.value()),
        toml_edit::Value::Boolean(b) => JsValue::from_bool(*b.value()),
        toml_edit::Value::Array(a) => a
            .into_iter()
            .map(value_to_js)
            .collect::<js_sys::Array>()
            .into(),
        toml_edit::Value::Datetime(d) => {
            js_sys::Date::new(&JsValue::from_str(&d.value().to_string())).into()
        }
        toml_edit::Value::InlineTable(t) => inline_table_to_js(t),
    }
}

fn table_to_js(t: &toml_edit::Table) -> JsValue {
    let obj = js_sys::Object::new();
    for (k, v) in t.into_iter() {
        let k = JsValue::from_str(k);
        let v = item_to_js(v);
        let _ = js_sys::Reflect::set(&obj, &k, &v);
    }
    obj.into()
}

fn inline_table_to_js(t: &toml_edit::InlineTable) -> JsValue {
    let obj = js_sys::Object::new();
    for (k, v) in t.into_iter() {
        let k = JsValue::from_str(k);
        let v = value_to_js(v);
        let _ = js_sys::Reflect::set(&obj, &k, &v);
    }
    obj.into()
}

fn js_value_to_toml(v: &JsValue) -> Result<toml_edit::Value> {
    let value: toml_edit::Value = if let Some(string) = v.as_string() {
        string.into()
    } else if let Some(number) = v.as_f64() {
        number.into()
    } else if let Some(bool) = v.as_bool() {
        bool.into()
    } else if v.is_array() {
        let mut vec = Vec::new();
        for v in js_sys::try_iter(v)?
            .ok_or_else(|| JsError::new("value is not iterable?"))?
            .into_iter()
        {
            let v = v?;
            vec.push(js_value_to_toml(&v)?);
        }
        toml_edit::Value::Array(toml_edit::Array::from_iter(vec))
    } else if v.is_object() {
        let mut table = toml_edit::InlineTable::new();
        let object: &js_sys::Object = v.dyn_ref().unwrap();
        for arr in js_sys::Object::entries(object).iter() {
            let arr: &js_sys::Array = arr.dyn_ref().unwrap();
            let k = arr.get(0);
            let v = arr.get(1);
            let k = js_value_to_toml(&k)?;
            let v = js_value_to_toml(&v)?;
            table.insert(
                k.as_str()
                    .ok_or_else(|| JsError::new("failed to convert JsValue into str"))?,
                v,
            );
        }

        toml_edit::Value::InlineTable(table)
    } else if v.is_null() {
        return Err(JsError::new("toml doesn't support null").into());
    } else if v.is_undefined() {
        return Err(JsError::new("toml doesn't support undefined").into());
    } else {
        return Err(
            JsError::new(&format!("Unsupported toml data type: {:?}", v.js_typeof())).into(),
        );
    };

    Ok(value)
}
