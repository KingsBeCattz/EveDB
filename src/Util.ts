import { DatabaseServer } from "./index";
import { Response } from "express";
import fs from "fs";
import { join } from "path";

export class Util {
  server: DatabaseServer;

  constructor(server: DatabaseServer) {
    this.server = server;
  }

  parseURL(...paths: string[]) {
    let combinedPath = paths.join("/");

    const [pathPart, ...queryParts] = combinedPath.split("?");

    const sanitizedPath = pathPart
      .split("/")
      .filter((segment) => segment.length > 0)
      .join("/");

    const queryParams = queryParts
      .join("&")
      .replace(/\/+$/, "")
      .replaceAll("/&", "&");

    return (
      "http://" +
      (queryParams ? `${sanitizedPath}?${queryParams}` : sanitizedPath)
    );
  }

  check_folders() {
    let path = join(process.cwd(), this.server.path);
    if (this.server.backup) {
      if (!fs.existsSync(join(path, "backups")))
        fs.mkdirSync(join(path, "backups"));
    }
    if (!fs.existsSync(path)) fs.mkdirSync(path);
    if (!fs.existsSync(join(path, "tables")))
      fs.mkdirSync(join(path, "tables"));
  }

  send(res: Response, code: number, message: string) {
    res.status(code).send({
      code,
      message,
    });
  }

  sendJSON(res: Response, data: Record<string, any>) {
    res.status(200).json(data);
  }

  get_table(table: string) {
    const tabledata =
      fs.readFileSync(
        join(process.cwd(), this.server.path, "tables", `${table}.json`)
      ) || {};
    return JSON.parse(tabledata.toString());
  }

  insert(table: string, data: string) {
    this.check_folders();
    const path = join(
      process.cwd(),
      this.server.path,
      "tables",
      `${table}.json`
    );
    fs.writeFileSync(path, data);
  }

  create_backup(server: DatabaseServer) {
    const id = String(Date.now());
    const path = join(process.cwd(), this.server.path, "backups", id);
    fs.mkdirSync(path);

    for (const table of this.server.tables) {
      const tabledata = this.get_table(table);
      fs.writeFileSync(join(path, `${table}.json`), JSON.stringify(tabledata));
    }
    return id;
  }

  get_backup(id: string, table?: string) {
    const path = join(process.cwd(), this.server.path, "backups", id);
    if (table) {
      const tabledata = fs.readFileSync(join(path, `${table}.json`)) || {};
      return JSON.parse(tabledata.toString());
    } else {
      const backups: {
        [key: string]: any;
      } = {};
      for (let table of fs.readdirSync(path)) {
        table = table.replace(".json", "");
        backups[table] = this.get_backup(id, table);
      }
      return backups;
    }
  }

  delete_backup(id: string, table?: string) {
    try {
      const path = join(process.cwd(), this.server.path, "backups", id);
      if (table) {
        fs.rmSync(join(path, `${table}.json`));
        return true;
      } else {
        for (let table of fs.readdirSync(path)) {
          table = table.replace(".json", "");
          this.delete_backup(id, table);
        }
        fs.rmdirSync(path);
        return true;
      }
    } catch (e) {
      console.log(`|| EveDB > Delete Backup Error: /n${e}`);
      return false;
    }
  }

  restore_backup(id: string, table?: string) {
    try {
      const path = join(process.cwd(), this.server.path, "backups", id);
      const _path = join(process.cwd(), this.server.path, "tables");
      if (table) {
        const bpath = join(path, `${table}.json`);
        const rpath = join(_path, `${table}.json`);
        const data = fs.readFileSync(bpath).toString();
        fs.writeFileSync(rpath, data);
        return true;
      } else {
        for (let table of fs.readdirSync(path)) {
          table = table.replace(".json", "");
          this.restore_backup(id, table);
        }
        return true;
      }
    } catch (e) {
      console.log(`|| EveDB > Delete Backup Error: /n${e}`);
      return false;
    }
  }
}
