import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import { join } from "path";
import { Util } from "./Util";
import { set, unset, get } from "lodash";

export type BackupOptions = {
  /**
   * Sets the interval to backups
   * @typedef number
   * @default 3600000 //One hour
   */
  interval: number;
  /**
   * Reports the process and handle errors
   * @typedef boolean
   * @default true
   */
  report: boolean;
};

export type ServerOptions = {
  /**
   * Port to listen
   * @typedef number
   */
  port: number;
  /**
   * Path of database
   * @typedef string
   */
  path: string;
  /**
   * Tables of database
   * @typedef Array<string>
   */
  tables: string[];
  /**
   * Authentication code to allow requests
   */
  auth: string;
  /**
   * Set the backup options, if not set it will be disabled.
   */
  backup?: BackupOptions;
};

function checkArray(array: any[]) {
  return array.map((item) => typeof item);
}

export class DatabaseServer {
  /**
   * Express application
   */
  app: express.Application;
  /**
   * Auth code
   * @typedef string
   */
  authorization: string;
  /**
   * Port to listen
   * @typedef number
   */
  port: number;
  /**
   * Path of database
   * @typedef string
   */
  path: string;
  /**
   * Tables of database
   * @typedef Array<string>
   * @default ["main"]
   */
  tables: string[];
  /**
   * Utilitys :)
   */
  util: Util;
  /**
   * Backup options, if not set it will be disabled.
   */
  backup?: BackupOptions;
  /**
   * Constructor of the database server
   * @param options
   */

  constructor(options: ServerOptions) {
    if (typeof options.port !== "number")
      throw new Error("You must provide an Port to listen");
    if (typeof options.path !== "string")
      throw new Error("You must provide an Path to build the database");
    if (
      !Array.isArray(options.tables) ||
      options.tables.length < 1 ||
      checkArray(options.tables).filter((t) => t !== "string").length > 0
    )
      throw new Error("You must provide an Array of strings for tables");
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.util = new Util(this);
    this.authorization = options.auth;
    this.port = options.port;
    this.path = options.path;
    this.tables = options.tables;
    this.backup = options.backup
      ? {
          interval: options.backup.interval || 60 * 60000,
          report: options.backup.report ?? true,
        }
      : undefined;
  }

  /**
   * Starts the database server
   */
  start() {
    this.util.check_folders();

    for (const table of this.tables) {
      let tablePath = join(process.cwd(), this.path, "tables", table + ".json");
      if (!fs.existsSync(tablePath)) this.util.insert(tablePath, "{}");
    }

    const auth = (req: Request, res: Response, next: NextFunction) => {
      if (req.headers["auth"] !== this.authorization)
        this.util.send(res, 401, "Unauthorized");
      else next();
    };

    this.app.all("/", auth, (req, res) => {
      const backups = fs
        .readdirSync(join(process.cwd(), this.path, "backups"))
        .filter((f) =>
          fs
            .lstatSync(join(process.cwd(), this.path, "backups", f))
            .isDirectory()
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
            ),
          ])
        ),
      });
    });

    this.app.all("/table/", auth, (req, res) => {
      return this.util.sendJSON(res, {
        code: 200,
        data: Object.fromEntries(
          this.tables.map((t) => [t, this.util.get_table(t)])
        ),
      });
    });

    this.app.all("/backup/", (req, res) => {
      if (req.method == "POST") {
        const { method } = req.body as
          | {
              method: "restore";
            }
          | {
              method: "create";
            };
        console.log("a");
        if (!method) return this.util.send(res, 400, "Invalid method");
        const id = this.util.create_backup();

        this.util.sendJSON(res, {
          code: 200,
          message: "Backup was created successfully",
          id,
          success: true,
        });
      } else {
        const backups = fs
          .readdirSync(join(process.cwd(), this.path, "backups"))
          .filter((f) =>
            fs
              .lstatSync(join(process.cwd(), this.path, "backups", f))
              .isDirectory()
          );
        return this.util.sendJSON(res, {
          code: 200,
          data: Object.fromEntries(
            backups.map((b) => [
              b,
              Object.fromEntries(
                this.tables.map((t) => [t, this.util.get_backup(b, t)])
              ),
            ])
          ),
        });
      }
    });

    this.app
      .route("/table/:table")
      .get(auth, (req, res) => {
        const { table } = req.params;
        const { id } = req.query;

        if (!this.tables.includes(table))
          return this.util.sendJSON(res, {
            code: 200,
            tables: this.tables.map((t) => ({
              table: t,
              content: this.util.get_table(t),
            })),
          });

        const table_data = this.util.get_table(table);

        if (id) {
          if (get(table_data, id as string))
            this.util.sendJSON(res, {
              table,
              id,
              value: get(table_data, id as string),
            });
          else this.util.send(res, 404, `"${id}" doesn\'t exists on ${table}`);
        } else this.util.sendJSON(res, table_data);
      })
      .post(auth, (req, res) => {
        const { table } = req.params;
        const { id, value } = req.body;
        if (!this.tables.includes(table))
          return this.util.send(res, 404, `Doesn\'t a table named: "${table}"`);

        let data = this.util.get_table(table);
        set(data, id, value);
        this.util.insert(table, JSON.stringify(data));
        this.util.sendJSON(res, {
          table,
          data,
        });
      })
      .delete(auth, (req, res) => {
        const { table } = req.params;
        const { id } = req.body;
        if (!this.tables.includes(table))
          return this.util.send(res, 404, `Doesn\'t a table named: "${table}"`);

        let data = this.util.get_table(table);
        if (id) {
          const response = unset(data, id);
          this.util.insert(table, JSON.stringify(data));
          this.util.sendJSON(res, {
            table,
            data,
            success: response,
          });
        } else {
          this.util.insert(table, "{}");
          this.util.sendJSON(res, {
            table,
            data: {},
            success: true,
          });
        }
      });

    this.app
      .route("/backup/:id")
      .get(auth, (req, res) => {
        const { id } = req.params;
        const { table } = req.query;
        const backups = fs
          .readdirSync(join(process.cwd(), this.path, "backups"))
          .filter((f) =>
            fs
              .lstatSync(join(process.cwd(), this.path, "backups", f))
              .isDirectory()
          );

        if (!backups.includes(id))
          return this.util.send(
            res,
            404,
            `Doesn\'t a backup with the id: "${id}"`
          );

        if (id) {
          const tables = Object.fromEntries(
            this.tables.map((t) => [t, this.util.get_backup(id, t)])
          );
          if (table) {
            const data = tables[table as string];
            if (!data)
              this.util.send(res, 404, `"${table}" doesn\'t exists on ${id}`);
            this.util.sendJSON(res, {
              code: 200,
              id,
              table,
              data,
            });
          } else
            this.util.sendJSON(res, {
              code: 200,
              id,
              tables,
            });
        } else {
          this.util.sendJSON(res, {
            code: 200,
            backups: Object.fromEntries(
              backups.map((b) => [
                b,
                Object.fromEntries(
                  this.tables.map((t) => [t, this.util.get_backup(b, t)])
                ),
              ])
            ),
          });
        }
      })
      .post(auth, (req, res) => {
        const { id } = req.params;
        const { table, method } = req.body as
          | {
              table?: string;
              method: "restore";
            }
          | {
              table?: string;
              method: "create";
            };
        const backups = fs
          .readdirSync(join(process.cwd(), this.path, "backups"))
          .filter((f) =>
            fs
              .lstatSync(join(process.cwd(), this.path, "backups", f))
              .isDirectory()
          );

        if (method === "create")
          return this.util.send(res, 400, "Invalid usage");
        else if (method === "restore") {
          if (!backups.includes(id))
            return this.util.send(
              res,
              404,
              `Doesn\'t a backup with the id: "${id}"`
            );

          const tables = Object.fromEntries(
            this.tables.map((t) => [t, this.util.get_backup(id, t)])
          );
          if (table) {
            const data = tables[table as string];
            if (!data)
              this.util.send(res, 404, `"${table}" doesn\'t exists on ${id}`);
            this.util.restore_backup(id, table);
            this.util.sendJSON(res, {
              code: 200,
              message: "Restore from backup was successfully",
              table,
              success: true,
            });
          } else this.util.restore_backup(id);
          this.util.sendJSON(res, {
            code: 200,
            message: "Restore from backup was successfully",
            success: true,
          });
        } else this.util.send(res, 400, "Invalid method");
      })
      .delete(auth, (req, res) => {
        const { id } = req.params;
        const { table } = req.query as { table: string };
        const backups = fs
          .readdirSync(join(process.cwd(), this.path, "backups"))
          .filter((f) =>
            fs
              .lstatSync(join(process.cwd(), this.path, "backups", f))
              .isDirectory()
          );

        if (!backups.includes(id))
          return this.util.send(
            res,
            404,
            `Doesn\'t a backup with the id: "${id}"`
          );

        if (id) {
          if (table) {
            this.util.delete_backup(id, table);
            this.util.sendJSON(res, {
              code: 200,
              message: `Table "${table}" was deleted successfully from backup: "${id}"`,
              id,
              table,
              success: true,
            });
          } else {
            this.util.delete_backup(id);
            this.util.sendJSON(res, {
              code: 200,
              message: `Backup "${id}" was deleted successfully`,
              id,
              success: true,
            });
          }
        } else {
          backups.forEach((b) => this.util.delete_backup(b));
          this.util.sendJSON(res, {
            code: 200,
            message: `All backups was deleted successfully`,
            id: backups,
            success: true,
          });
        }
      });

    if (this.backup) {
      let path = join(process.cwd(), this.path, "backups");
      if (!fs.existsSync(path)) fs.mkdirSync(path);
      setInterval(this.util.create_backup, this.backup.interval);
    }

    this.app.listen(this.port, () =>
      console.log(`|| Listening port: ${this.port}`)
    );
  }
}
