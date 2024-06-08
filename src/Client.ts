import { TypedEmitter } from "tiny-typed-emitter";

export type GetAll<T> = {
  client: DatabaseClient;
  code: number;
  url: string;
} & T;

export type BackupCreated = {
  code: string;
  message: string;
  id: string;
  success: boolean;
};

export type BackupGetted<T = "table" | "tables"> = T extends "table"
  ? {
      code: number;
      id: string;
      table: string;
      data: {
        [k: string]: any;
      };
    }
  : {
      code: number;
      id: string;
      tables: {
        [k: string]: any;
      };
    };

export type BackupRestored<T = boolean> = T extends true
  ? {
      code: number;
      message: string;
      table: string;
      success: boolean;
    }
  : {
      code: number;
      message: string;
      success: boolean;
    };

export type BackupDeleted<
  T = boolean,
  ID = string | Array<string>
> = T extends true
  ? {
      code: number;
      message: string;
      id: ID;
      table: string;
      success: boolean;
    }
  : {
      code: number;
      message: string;
      id: ID;
      success: boolean;
    };

export type Backup =
  | (
      | BackupCreated
      | BackupGetted<"table" | "tables">
      | BackupRestored<boolean>
      | BackupDeleted<boolean, string | string[]>
    )
  | { code: number; message: string };
export type MaybePromise<T> = Promise<T> | T;

export interface DatabaseEvents {
  getAll: (
    data: GetAll<{
      data: {
        tables: {
          [k: string]: any;
        };
        backups: {
          [k: string]: any;
        };
      };
    }>
  ) => MaybePromise<any>;
  getTables: (
    data: GetAll<{ tables: string[]; data: { [k: string]: any } }>
  ) => MaybePromise<any>;
  getBackups: (
    data: GetAll<{ backups: string[]; data: { [k: string]: any } }>
  ) => MaybePromise<any>;
  backupCreate: (data: BackupCreated) => MaybePromise<any>;
  backupGet: (data: BackupGetted<"table" | "tables">) => MaybePromise<any>;
  backupRestore: (data: BackupRestored<boolean>) => MaybePromise<any>;
  backupDelete: (
    data: BackupDeleted<boolean, string | string[]>
  ) => MaybePromise<any>;
}

export type DatabaseOptions = {
  auth: string;
};

export const parseURL = (...paths: string[]) => {
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
};

export class DatabaseClient extends TypedEmitter<DatabaseEvents> {
  /**
   * Authentication code to allow requests
   * @typedef string
   */
  auth: string;
  /**
   * URL of the EveDB Server
   * @typedef string
   */
  url: string;

  /**
   * Constructor of the class
   * @option url - URL of the EveDB Server
   * @option options - EveDB Client options
   */
  constructor(url: string, options: DatabaseOptions) {
    super();
    this.url = url;
    this.auth = options.auth;

    if (!this.url.endsWith("/")) this.url = url + "/";
  }

  /**
   * Gets all data of the Database
   */
  async getAll(): Promise<
    GetAll<{
      data: {
        tables: {
          [k: string]: any;
        };
        backups: {
          [k: string]: any;
        };
      };
    }>
  > {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          auth: this.auth,
        },
        method: "GET",
      })
    ).then((data) =>
      data.json().then((json) => ({
        client: this,
        code: data.status,
        url: data.url,
        data: json,
      }))
    );
    this.emit("getAll", response);
    return response;
  }

  /**
   * Gets all data of the tables
   */
  async getTables(): Promise<GetAll<{ tables: string[]; data: any }>> {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          auth: this.auth,
        },
        method: "GET",
      })
    ).then(async (data) => {
      const tables = (await data.json()).tables;
      return {
        client: this,
        code: data.status,
        url: data.url,
        tables: Object.keys(tables),
        data: tables,
      };
    });
    this.emit("getTables", response);
    return response;
  }

  /**
   * Gets all data of backups
   */
  async getBackups(): Promise<GetAll<{ backups: string[]; data: any }>> {
    const response = await fetch(
      new Request(this.url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          auth: this.auth,
        },
        method: "GET",
      })
    ).then(async (data) => {
      const backups = (await data.json()).backups;
      return {
        client: this,
        code: data.status,
        url: data.url,
        backups: Object.keys(backups),
        data: backups,
      };
    });
    this.emit("getBackups", response);
    return response;
  }

  /**
   * Creates a backup
   * @param method "create"
   * @returns BackupCreated
   */
  async backup(method: "create"): Promise<BackupCreated>;

  /**
   * Gets a backup
   * @param method "get"
   * @param id ID of backup
   * @returns BackupGetted<"tables">
   */
  async backup(method: "get", id: string): Promise<BackupGetted<"tables">>;

  /**
   * Gets a table data from a backup
   * @param method "get"
   * @param id ID of backup
   * @param table Table of backup
   * @returns BackupGetted<"table">
   */
  async backup(
    method: "get",
    id: string,
    table: string
  ): Promise<BackupGetted<"table">>;

  /**
   * Retores a table from a backup
   * @param method "restore"
   * @param id ID of backup
   * @param table Table of backup
   * @returns BackupRestored<true>
   */
  async backup(
    method: "restore",
    id: string,
    table: string
  ): Promise<BackupRestored<true>>;

  /**
   * Retores from a backup
   * @param method "restore"
   * @param id ID of backup
   * @returns BackupRestored<false>
   */
  async backup(method: "restore", id: string): Promise<BackupRestored<false>>;

  /**
   * Deletes a backup
   * @param method "delete"
   * @param id ID of backup
   * @returns BackupDeleted<false, string>
   */
  async backup(
    method: "delete",
    id: string
  ): Promise<BackupDeleted<false, string>>;

  /**
   * Deletes a table from a backup
   * @param method "delete"
   * @param id ID of backup
   * @param table Table of backup
   * @returns BackupDeleted<false, string>
   */
  async backup(
    method: "delete",
    id: string,
    table: string
  ): Promise<BackupDeleted<true, string>>;

  /**
   * Deletes all backups
   * @param method "delete"
   * @param id "all"
   * @returns BackupDeleted<false, string[]>
   */
  async backup(
    method: "delete",
    id: "all"
  ): Promise<BackupDeleted<false, string[]>>;
  async backup(
    method: "create" | "get" | "restore" | "delete",
    id?: string,
    table?: string
  ): Promise<Backup | undefined> {
    switch (method) {
      case "create": {
        const response = await fetch(
          new Request(parseURL(this.url, "backup/"), {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              auth: this.auth,
            },
            method: "POST",
            body: JSON.stringify({ method: "create" }),
          })
        );
        return response.ok
          ? await response!.json()
          : { code: response.status, message: response.statusText };
      }
      case "get": {
        let response = await fetch(
          new Request(
            parseURL(this.url, "backup/", id!, table ? `?table=${table}` : ""),
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                auth: this.auth,
              },
              method: "GET",
            }
          )
        );
        return response.ok
          ? await response!.json()
          : { code: response.status, message: response.statusText };
      }
      case "restore": {
        const response = await fetch(
          new Request(parseURL(this.url, "backup/"), {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              auth: this.auth,
            },
            method: "POST",
            body: JSON.stringify({ method: "restore" }),
          })
        );
        return response.ok
          ? await response!.json()
          : { code: response.status, message: response.statusText };
      }
      case "delete": {
      }
    }
  }
}
