import fs from 'fs';
import { join } from 'node:path';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Util {
  constructor(server) {
    __publicField(this, "server");
    this.server = server;
  }
  parseURL(...paths) {
    let combinedPath = paths.join("/");
    const [pathPart, ...queryParts] = combinedPath.split("?");
    const sanitizedPath = pathPart.split("/").filter((segment) => segment.length > 0).join("/");
    const queryParams = queryParts.join("&").replace(/\/+$/, "").replaceAll("/&", "&");
    return "http://" + (queryParams ? `${sanitizedPath}?${queryParams}` : sanitizedPath);
  }
  check_folders() {
    let path = join(process.cwd(), this.server.path);
    if (this.server.backup) {
      if (!fs.existsSync(join(path, "backups")))
        fs.mkdirSync(join(path, "backups"));
    }
    if (!fs.existsSync(path))
      fs.mkdirSync(path);
    if (!fs.existsSync(join(path, "tables")))
      fs.mkdirSync(join(path, "tables"));
  }
  send(res, code, message) {
    res.status(code).send({
      code,
      message
    });
  }
  sendJSON(res, data) {
    res.status(200).json(data);
  }
  get_table(table) {
    const tabledata = fs.readFileSync(
      join(process.cwd(), this.server.path, "tables", `${table}.json`)
    ) || {};
    return JSON.parse(tabledata.toString());
  }
  insert(table, data) {
    this.check_folders();
    const path = join(process.cwd(), this.server.path, "tables", `${table}.json`);
    fs.writeFileSync(path, data, "utf8");
  }
  create_backup() {
    const id = String(Date.now());
    const path = join(process.cwd(), this.server.path, "backups", id);
    fs.mkdirSync(path);
    for (const table of this.server.tables) {
      const tabledata = this.get_table(table);
      fs.writeFileSync(
        join(path, `${table}.json`),
        JSON.stringify(tabledata),
        "utf8"
      );
    }
    return id;
  }
  get_backup(id, table) {
    const path = join(process.cwd(), this.server.path, "backups", id);
    if (table) {
      const tabledata = fs.readFileSync(join(path, `${table}.json`)) || {};
      return JSON.parse(tabledata.toString());
    } else {
      const backups = {};
      for (let table2 of fs.readdirSync(path)) {
        table2 = table2.replace(".json", "");
        backups[table2] = this.get_backup(id, table2);
      }
      return backups;
    }
  }
  delete_backup(id, table) {
    try {
      const path = join(process.cwd(), this.server.path, "backups", id);
      if (table) {
        fs.rmSync(join(path, `${table}.json`));
        return true;
      } else {
        for (let table2 of fs.readdirSync(path)) {
          table2 = table2.replace(".json", "");
          this.delete_backup(id, table2);
        }
        fs.rmdirSync(path);
        return true;
      }
    } catch (e) {
      console.log(`|| EveDB > Delete Backup Error: /n${e}`);
      return false;
    }
  }
  restore_backup(id, table) {
    try {
      const path = join(process.cwd(), this.server.path, "backups", id);
      const _path = join(process.cwd(), this.server.path, "tables");
      if (table) {
        const bpath = join(path, `${table}.json`);
        const rpath = join(_path, `${table}.json`);
        const data = fs.readFileSync(bpath).toString();
        fs.writeFileSync(rpath, data, "utf8");
        return true;
      } else {
        for (let table2 of fs.readdirSync(path)) {
          table2 = table2.replace(".json", "");
          this.restore_backup(id, table2);
        }
        return true;
      }
    } catch (e) {
      console.log(`|| EveDB > Delete Backup Error: /n${e}`);
      return false;
    }
  }
}

export { Util };
