import express from 'express';
import fs from 'fs';
import { join } from 'path';
import { Util } from './Util.mjs';
import { get, set, unset } from 'lodash';
import 'node:path';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function checkArray(array) {
  return array.map((item) => typeof item);
}
class DatabaseServer {
  /**
   * Constructor of the database server
   * @param options
   */
  constructor(options) {
    /**
     * Express application
     */
    __publicField(this, "app");
    /**
     * Auth code
     * @typedef string
     */
    __publicField(this, "authorization");
    /**
     * Port to listen
     * @typedef number
     */
    __publicField(this, "port");
    /**
     * Path of database
     * @typedef string
     */
    __publicField(this, "path");
    /**
     * Tables of database
     * @typedef Array<string>
     * @default ["main"]
     */
    __publicField(this, "tables");
    /**
     * Utilitys :)
     */
    __publicField(this, "util");
    /**
     * Backup options, if not set it will be disabled.
     */
    __publicField(this, "backup");
    if (typeof options.port !== "number")
      throw new Error("You must provide an Port to listen");
    if (typeof options.path !== "string")
      throw new Error("You must provide an Path to build the database");
    if (!Array.isArray(options.tables) || options.tables.length < 1 || checkArray(options.tables).filter((t) => t !== "string").length > 0)
      throw new Error("You must provide an Array of strings for tables");
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.util = new Util(this);
    this.authorization = options.auth;
    this.port = options.port;
    this.path = options.path;
    this.tables = options.tables;
    this.backup = options.backup ? {
      interval: options.backup.interval || 60 * 6e4,
      report: options.backup.report ?? true
    } : void 0;
  }
  /**
   * Starts the database server
   */
  start() {
    this.util.check_folders();
    for (const table of this.tables) {
      let tablePath = join(process.cwd(), this.path, "tables", table + ".json");
      if (!fs.existsSync(tablePath))
        this.util.insert(tablePath, "{}");
    }
    const auth = (req, res, next) => {
      if (req.headers["auth"] !== this.authorization)
        this.util.send(res, 401, "Unauthorized");
      else
        next();
    };
    this.app.all("/", auth, (req, res) => {
      const backups = fs.readdirSync(join(process.cwd(), this.path, "backups")).filter(
        (f) => fs.lstatSync(join(process.cwd(), this.path, "backups", f)).isDirectory()
      );
      return this.util.sendJSON(res, {
        code: 200,
        tables: Object.fromEntries(
          this.tables.map((t) => [t, this.util.get_table(t)])
        ),
        backups: Object.fromEntries(
          backups.map((b) => [
            b,
            Object.fromEntries(
              this.tables.map((t) => [t, this.util.get_backup(b, t)])
            )
          ])
        )
      });
    });
    this.app.all("/table/", auth, (req, res) => {
      return this.util.sendJSON(res, {
        code: 200,
        data: Object.fromEntries(
          this.tables.map((t) => [t, this.util.get_table(t)])
        )
      });
    });
    this.app.all("/backup/:id?", (req, res) => {
      const { id } = req.params;
      const backups = fs.readdirSync(join(process.cwd(), this.path, "backups")).filter(
        (f) => fs.lstatSync(join(process.cwd(), this.path, "backups", f)).isDirectory()
      );
      if (req.method == "POST") {
        const { table, method } = req.body;
        if (!method)
          return this.util.send(res, 400, "Invalid method");
        if (method == "create") {
          const id2 = this.util.create_backup();
          this.util.sendJSON(res, {
            code: 200,
            message: "Backup was created successfully",
            id: id2,
            success: true
          });
        } else if (method == "restore") {
          if (!backups.includes(id))
            return this.util.send(res, 404, `Doesn't a backup with the id: "${id}"`);
          const tables = Object.fromEntries(
            this.tables.map((t) => [t, this.util.get_backup(id, t)])
          );
          if (table) {
            const data = tables[table];
            if (!data)
              this.util.send(res, 404, `"${table}" doesn't exists on ${id}`);
            this.util.restore_backup(id, table);
            this.util.sendJSON(res, {
              code: 200,
              message: "Restore from backup was successfully",
              table,
              success: true
            });
          } else
            this.util.restore_backup(id);
          this.util.sendJSON(res, {
            code: 200,
            message: "Restore from backup was successfully",
            success: true
          });
        }
      } else if (req.method == "DELETE") {
        const { id: id2 } = req.params;
        const { table } = req.query;
        const backups2 = fs.readdirSync(join(process.cwd(), this.path, "backups")).filter(
          (f) => fs.lstatSync(join(process.cwd(), this.path, "backups", f)).isDirectory()
        );
        if (id2) {
          if (!backups2.includes(id2))
            return this.util.send(res, 404, `Doesn't a backup with the id: "${id2}"`);
          if (table) {
            this.util.delete_backup(id2, table);
            this.util.sendJSON(res, {
              code: 200,
              message: `Table "${table}" was deleted successfully from backup "${id2}"`,
              id: id2,
              table,
              success: true
            });
          } else {
            this.util.delete_backup(id2);
            this.util.sendJSON(res, {
              code: 200,
              message: `Backup "${id2}" was deleted successfully`,
              id: id2,
              success: true
            });
          }
        } else {
          backups2.forEach((b) => this.util.delete_backup(b));
          this.util.sendJSON(res, {
            code: 200,
            message: `All backups was deleted successfully`,
            id: backups2,
            success: true
          });
        }
      } else if (req.method == "GET") {
        const { id: id2 } = req.params;
        const { table } = req.query;
        const backups2 = fs.readdirSync(join(process.cwd(), this.path, "backups")).filter(
          (f) => fs.lstatSync(join(process.cwd(), this.path, "backups", f)).isDirectory()
        );
        if (id2) {
          if (!backups2.includes(id2))
            return this.util.send(res, 404, `Doesn't a backup with the id: "${id2}"`);
          const tables = Object.fromEntries(
            this.tables.map((t) => [t, this.util.get_backup(id2, t)])
          );
          if (table) {
            const data = tables[table];
            if (!data)
              this.util.send(res, 404, `"${table}" doesn't exists on ${id2}`);
            this.util.sendJSON(res, {
              code: 200,
              id: id2,
              table,
              data
            });
          } else
            this.util.sendJSON(res, {
              code: 200,
              id: id2,
              tables
            });
        } else {
          this.util.sendJSON(res, {
            code: 200,
            backups: Object.fromEntries(
              backups2.map((b) => [
                b,
                Object.fromEntries(
                  this.tables.map((t) => [t, this.util.get_backup(b, t)])
                )
              ])
            )
          });
        }
      }
    });
    this.app.route("/table/:table").get(auth, (req, res) => {
      const { table } = req.params;
      const { id } = req.query;
      if (!this.tables.includes(table))
        return this.util.sendJSON(res, {
          code: 200,
          tables: this.tables.map((t) => ({
            table: t,
            content: this.util.get_table(t)
          }))
        });
      const table_data = this.util.get_table(table);
      if (id) {
        if (get(table_data, id))
          this.util.sendJSON(res, {
            table,
            id,
            value: get(table_data, id)
          });
        else
          this.util.send(res, 404, `"${id}" doesn't exists on ${table}`);
      } else
        this.util.sendJSON(res, table_data);
    }).post(auth, (req, res) => {
      const { table } = req.params;
      const { id, value } = req.body;
      if (!this.tables.includes(table))
        return this.util.send(res, 404, `Doesn't a table named: "${table}"`);
      let data = this.util.get_table(table);
      set(data, id, value);
      this.util.insert(table, JSON.stringify(data, null, 2));
      this.util.sendJSON(res, {
        table,
        data
      });
    }).delete(auth, (req, res) => {
      const { table } = req.params;
      const { id } = req.body;
      if (!this.tables.includes(table))
        return this.util.send(res, 404, `Doesn't a table named: "${table}"`);
      let data = this.util.get_table(table);
      if (id) {
        const response = unset(data, id);
        this.util.insert(table, JSON.stringify(data, null, 2));
        this.util.sendJSON(res, {
          table,
          data,
          success: response
        });
      } else {
        this.util.insert(table, "{}");
        this.util.sendJSON(res, {
          table,
          data: {},
          success: true
        });
      }
    });
    if (this.backup) {
      let path = join(process.cwd(), this.path, "backups");
      if (!fs.existsSync(path))
        fs.mkdirSync(path);
      setInterval(() => this.util.create_backup(), this.backup.interval);
    }
    this.app.listen(
      this.port,
      () => console.log(`|| Listening port: ${this.port}`)
    );
  }
}

export { DatabaseServer };
