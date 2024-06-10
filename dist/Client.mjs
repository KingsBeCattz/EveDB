import { TypedEmitter } from 'tiny-typed-emitter';
import { get } from 'lodash';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const parseURL = (...paths) => {
  let combinedPath = paths.join("/");
  const [pathPart, ...queryParts] = combinedPath.split("?");
  const sanitizedPath = pathPart.split("/").filter((segment) => segment.length > 0).join("/");
  const queryParams = queryParts.join("&").replace(/\/+$/, "").replaceAll("/&", "&");
  return "http://" + (queryParams ? `${sanitizedPath}?${queryParams}` : sanitizedPath);
};
class DatabaseClient extends TypedEmitter {
  /**
   * Constructor of the class
   * @option url - URL of the EveDB Server
   * @option options - EveDB Client options
   */
  constructor(url, options) {
    super();
    /**
     * Authentication code to allow requests
     * @typedef string
     */
    __publicField(this, "auth");
    /**
     * URL of the EveDB Server
     * @typedef string
     */
    __publicField(this, "url");
    this.url = url;
    this.auth = options.auth;
    if (!this.url.endsWith("/"))
      this.url = url + "/";
  }
  /**
   * Gets all data of the Database
   */
  async getAll() {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    ).then(
      (data) => data.json().then((json) => ({
        client: this,
        code: data.status,
        url: data.url,
        data: json
      }))
    );
    this.emit("getAll", response);
    return response;
  }
  /**
   * Gets all data of the tables
   */
  async getTables() {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    ).then(async (data) => {
      const tables = (await data.json()).tables;
      return {
        client: this,
        code: data.status,
        url: data.url,
        tables: Object.keys(tables),
        data: tables
      };
    });
    this.emit("getTables", response);
    return response;
  }
  /**
   * Gets all data of backups
   */
  async getBackups() {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    ).then(async (data) => {
      const backups = (await data.json()).backups;
      return {
        client: this,
        code: data.status,
        url: data.url,
        backups: Object.keys(backups),
        data: backups
      };
    });
    this.emit("getBackups", response);
    return response;
  }
  async backup(method, id, table) {
    switch (method) {
      case "create": {
        const response = await fetch(
          new Request(parseURL(this.url, "backup/"), {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "auth": this.auth
            },
            method: "POST",
            body: JSON.stringify({ method: "create" })
          })
        );
        if (response.ok) {
          const jsonResponse = await response.json();
          this.emit("backupCreate", jsonResponse);
          return jsonResponse;
        } else {
          const errorResponse = {
            code: response.status,
            message: response.statusText
          };
          this.emit("error", errorResponse);
          return errorResponse;
        }
      }
      case "get": {
        let response = await fetch(
          new Request(
            parseURL(this.url, "backup/", id, table ? `?table=${table}` : ""),
            {
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "auth": this.auth
              },
              method: "GET"
            }
          )
        );
        if (response.ok) {
          const jsonResponse = await response.json();
          this.emit("backupGet", jsonResponse);
          return jsonResponse;
        } else {
          const errorResponse = {
            code: response.status,
            message: response.statusText
          };
          this.emit("error", errorResponse);
          return errorResponse;
        }
      }
      case "restore": {
        if (!id) {
          const errorResponse = {
            code: 400,
            message: "You must give a id to restore"
          };
          this.emit("error", errorResponse);
          return errorResponse;
        }
        const response = await fetch(
          new Request(parseURL(this.url, "backup/", id), {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "auth": this.auth
            },
            method: "POST",
            body: JSON.stringify({ method: "restore", table })
          })
        );
        if (response.ok) {
          const jsonResponse = await response.json();
          this.emit("backupRestore", jsonResponse);
          return jsonResponse;
        } else {
          const errorResponse = {
            code: response.status,
            message: response.statusText
          };
          this.emit("error", errorResponse);
          return errorResponse;
        }
      }
      case "delete": {
        let response = await fetch(
          new Request(
            parseURL(this.url, "backup/", id, table ? `?table=${table}` : ""),
            {
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "auth": this.auth
              },
              method: "DELETE"
            }
          )
        );
        if (response.ok) {
          const jsonResponse = await response.json();
          this.emit("backupDelete", jsonResponse);
          return jsonResponse;
        } else {
          const errorResponse = {
            code: response.status,
            message: response.statusText
          };
          this.emit("error", errorResponse);
          return errorResponse;
        }
      }
    }
  }
  /**
   * Gets the latency with the EveDB Server
   * @returns number
   */
  async ping() {
    const time = Date.now();
    await fetch(
      new Request(parseURL(this.url), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    );
    return Date.now() - time;
  }
  /**
   * Verify if the table exists
   */
  async exists(table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/"), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    );
    if (response.ok) {
      const json = await response.json();
      return !!json.data[table];
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return false;
    }
  }
  /**
   * Verify if the key exists in provided table
   * @option key - Key to check
   * @option table - Table to check
   * @returns boolean
   */
  async has(key, table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    );
    if (response.ok) {
      const json = await response.json();
      if (json.tables)
        return false;
      return !!get(json, key);
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return false;
    }
  }
  /**
   * Sets a value with the provided key on a table
   * @option key - Key to set
   * @option value - Value to set
   * @option table - Table to be setted
   * @returns Set<boolean>
   */
  async set(key, value, table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "POST",
        body: JSON.stringify({ id: key, value })
      })
    );
    if (response.ok) {
      const json = Object.assign(await response.json(), { success: true });
      this.emit("set", json);
      return json;
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return {
        table: null,
        data: null,
        success: false
      };
    }
  }
  /**
   * Gets a table
   * @option table - Table to get
   * @returns TableGet
   */
  async getTable(table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    );
    if (response.ok) {
      const json = await response.json().then((d) => ({ table, data: d, success: true }));
      this.emit("getTable", json);
      return json;
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return {
        table,
        data: null,
        success: false
      };
    }
  }
  /**
   * Gets the value from a key in provided table
   * @option key - Key to get
   * @option table - Table to get
   * @returns Get
   */
  async get(key, table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table, "?id=" + key), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "GET"
      })
    );
    if (response.ok) {
      const json = Object.assign(await response.json(), { success: true });
      this.emit("get", json);
      return json;
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return {
        table,
        id: key,
        value: null,
        success: false
      };
    }
  }
  /**
   * Delete a table
   * @option key - Key to delete
   * @option table - Table to delete
   * @returns Delete
   */
  async deleteTable(table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "DELETE"
      })
    );
    if (response.ok) {
      const json = Object.assign(await response.json());
      this.emit("delete", json);
      return json;
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return {
        table,
        data: null,
        success: false
      };
    }
  }
  /**
   * Delete a key in provided table
   * @option key - Key to delete
   * @option table - Table to delete
   * @returns Delete
   */
  async delete(key, table) {
    const response = await fetch(
      new Request(parseURL(this.url, "table/", table), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "auth": this.auth
        },
        method: "DELETE",
        body: JSON.stringify({ id: key })
      })
    );
    if (response.ok) {
      const json = Object.assign(await response.json());
      this.emit("delete", json);
      return json;
    } else {
      const errorResponse = {
        code: response.status,
        message: response.statusText
      };
      this.emit("error", errorResponse);
      return {
        table,
        data: null,
        success: false
      };
    }
  }
  /**
   * Push a value in the key of the table
   * @option key - Key to push
   * @option value - Value to push
   * @option table - Table to push
   */
  async push(key, value, table) {
    const data = await this.get(key, table);
    const array = data.value || [];
    if (!Array.isArray(array))
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
    array.push(value);
    const setted = await this.set(key, array, table);
    if (setted.success) {
      const pushed = {
        table,
        id: key,
        old: array.slice(0, array.length - 1),
        new: array,
        success: setted.success
      };
      this.emit("push", pushed);
      return pushed;
    } else
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
  }
  /**
   * Removes a value in the key of the table
   * @option key - Key to removes
   * @option value - Value to removes
   * @option table - Table to removes
   */
  async remove(key, value, table) {
    const data = await this.get(key, table);
    const array = data.value || [];
    if (!Array.isArray(array))
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
    const index = array.indexOf(value);
    var v;
    if (index > -1) {
      v = array.splice(index, 1);
    }
    const setted = await this.set(key, array, table);
    if (setted.success) {
      const removed = {
        table,
        id: key,
        old: v ? array.concat(v) : array,
        new: array,
        success: setted.success
      };
      this.emit("remove", removed);
      return removed;
    } else
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
  }
  /**
   * Shifts a value in the key of the table
   * @option key - Key to shift
   * @option table - Table to shift
   */
  async shift(key, table) {
    const data = await this.get(key, table);
    const array = data.value || [];
    if (!Array.isArray(array))
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
    const removed = array.shift();
    const setted = await this.set(key, array, table);
    if (setted.success) {
      const shifted = {
        table,
        id: key,
        old: removed ? [removed].concat(array) : array,
        new: array,
        success: setted.success
      };
      this.emit("shift", shifted);
      return shifted;
    } else
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
  }
  /**
   * Pops a value in the key of the table
   * @option key - Key to pop
   * @option table - Table to pop
   */
  async pop(key, table) {
    const data = await this.get(key, table);
    const array = data.value || [];
    if (!Array.isArray(array))
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
    const removed = array.pop();
    const setted = await this.set(key, array, table);
    if (setted.success) {
      const poped = {
        table,
        id: key,
        old: removed ? array.concat(removed) : array,
        new: array,
        success: setted.success
      };
      this.emit("pop", poped);
      return poped;
    } else
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
  }
  /**
   * Unshifts a value in the key of the table
   * @option key - Key to unshift
   * @option value - Value to unshift
   * @option table - Table to unshift
   */
  async unshift(key, value, table) {
    const data = await this.get(key, table);
    const array = data.value || [];
    if (!Array.isArray(array))
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
    array.unshift(value);
    const setted = await this.set(key, array, table);
    if (setted.success) {
      const unshifted = {
        table,
        id: key,
        old: array.slice(1),
        new: array,
        success: setted.success
      };
      this.emit("unshift", unshifted);
      return unshifted;
    } else
      return {
        table,
        id: key,
        old: array,
        new: null,
        success: false
      };
  }
  /**
   * Adds a value in the key of the table
   * @option key - Key to add
   * @option value - Value to add
   * @option table - Table to add
   */
  async add(key, value, table) {
    const n = (await this.get(key, table))?.value;
    if (!n || typeof n !== "number")
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
    const setted = await this.set(key, n + value, table);
    if (setted.success) {
      const added = {
        table,
        id: key,
        old: n,
        new: n + value,
        success: setted.success
      };
      this.emit("add", added);
      return added;
    } else
      return {
        table,
        id: key,
        old: n,
        new: null,
        success: false
      };
  }
  /**
   * Substracts a value in the key of the table
   * @option key - Key to sub
   * @option value - Value to sub
   * @option table - Table to sub
   */
  async sub(key, value, table) {
    const n = (await this.get(key, table))?.value;
    if (!n || typeof n !== "number")
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
    const setted = await this.set(key, n - value, table);
    if (setted.success) {
      const substracted = {
        table,
        id: key,
        old: n,
        new: n - value,
        success: setted.success
      };
      this.emit("sub", substracted);
      return substracted;
    } else
      return {
        table,
        id: key,
        old: n,
        new: null,
        success: false
      };
  }
  /**
   * Multiplys a value in the key of the table
   * @option key - Key to multi
   * @option value - Value to multi
   * @option table - Table to multi
   */
  async multi(key, value, table) {
    const n = (await this.get(key, table))?.value;
    if (!n || typeof n !== "number")
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
    const setted = await this.set(key, n * value, table);
    if (setted.success) {
      const multiplyed = {
        table,
        id: key,
        old: n,
        new: n * value,
        success: setted.success
      };
      this.emit("multi", multiplyed);
      return multiplyed;
    } else
      return {
        table,
        id: key,
        old: n,
        new: null,
        success: false
      };
  }
  /**
   * Divides a value in the key of the table
   * @option key - Key to divide
   * @option value - Value to divide
   * @option table - Table to divide
   */
  async divide(key, value, table) {
    const n = (await this.get(key, table))?.value;
    if (!n || typeof n !== "number")
      return {
        table,
        id: key,
        old: null,
        new: null,
        success: false
      };
    const setted = await this.set(key, n / value, table);
    if (setted.success) {
      const divided = {
        table,
        id: key,
        old: n,
        new: n / value,
        success: setted.success
      };
      this.emit("multi", divided);
      return divided;
    } else
      return {
        table,
        id: key,
        old: n,
        new: null,
        success: false
      };
  }
}

export { DatabaseClient, parseURL };
