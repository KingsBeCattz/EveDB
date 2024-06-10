import { TypedEmitter } from 'tiny-typed-emitter';

type Error = {
    code: number;
    message: string;
};
type JSONValue = string | number | boolean | null | JSONObject | JSONValue[];
interface JSONObject {
    [key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {
}
type GetAll<T> = {
    client: DatabaseClient;
    code: number;
    url: string;
} & T;
type BackupCreated = {
    code: string;
    message: string;
    id: string;
    success: boolean;
};
type BackupGetted<T = "table" | "tables"> = T extends "table" ? {
    code: number;
    id: string;
    table: string;
    data: {
        [k: string]: JSONValue;
    };
} : {
    code: number;
    id: string;
    tables: {
        [k: string]: JSONValue;
    };
};
type BackupRestored<T = boolean> = T extends true ? {
    code: number;
    message: string;
    table: string;
    success: boolean;
} : {
    code: number;
    message: string;
    success: boolean;
};
type BackupDeleted<T = boolean, ID = string | Array<string>> = T extends true ? {
    code: number;
    message: string;
    id: ID;
    table: string;
    success: boolean;
} : {
    code: number;
    message: string;
    id: ID;
    success: boolean;
};
type Backup = (BackupCreated | BackupGetted<"table" | "tables"> | BackupRestored<boolean> | BackupDeleted<boolean, string | string[]>) | {
    code: number;
    message: string;
};
type Set<SUCCESS = boolean> = {
    table: SUCCESS extends true ? string : null;
    data: SUCCESS extends true ? {
        [k: string]: JSONValue;
    } : null;
    success: SUCCESS;
};
type Get<SUCCESS = boolean> = {
    table: SUCCESS extends true ? string : null;
    id: SUCCESS extends true ? string : null;
    value: SUCCESS extends true ? JSONValue : null;
    success: SUCCESS;
};
type TableGet<SUCCESS = boolean> = {
    table: string;
    data: SUCCESS extends true ? {
        table: string;
        content: JSONValue;
    } : null;
    success: SUCCESS;
};
type Delete<SUCCESS = boolean> = {
    table: string;
    data: SUCCESS extends true ? {
        [k: string]: JSONValue;
    } : null;
    success: SUCCESS;
};
type ArrayValue<SUCCESS = boolean> = {
    table: SUCCESS extends true ? string : null;
    id: string;
    old: SUCCESS extends true ? JSONValue[] : null;
    new: SUCCESS extends true ? JSONValue[] : null;
    success: SUCCESS;
};
type NumberValue<SUCCESS = boolean> = {
    table: SUCCESS extends true ? string : null;
    id: string;
    old: SUCCESS extends true ? number : null;
    new: SUCCESS extends true ? number : null;
    success: SUCCESS;
};
type MaybePromise<T> = Promise<T> | T;
interface DatabaseEvents {
    error: (data: {
        code: number;
        message: string;
    }) => MaybePromise<any>;
    getAll: (data: GetAll<{
        data: {
            tables: {
                [k: string]: JSONValue;
            };
            backups: {
                [k: string]: JSONValue;
            };
        };
    }>) => MaybePromise<any>;
    getTables: (data: GetAll<{
        tables: string[];
        data: {
            [k: string]: JSONValue;
        };
    }>) => MaybePromise<any>;
    getBackups: (data: GetAll<{
        backups: string[];
        data: {
            [k: string]: JSONValue;
        };
    }>) => MaybePromise<any>;
    backupCreate: (data: BackupCreated) => MaybePromise<any>;
    backupGet: (data: BackupGetted<"table" | "tables">) => MaybePromise<any>;
    backupRestore: (data: BackupRestored<boolean>) => MaybePromise<any>;
    backupDelete: (data: BackupDeleted<boolean, string | string[]>) => MaybePromise<any>;
    set: (data: Set<boolean>) => MaybePromise<any>;
    getTable: (data: TableGet<boolean>) => MaybePromise<any>;
    get: (data: Get<boolean>) => MaybePromise<any>;
    delete: (data: Delete<boolean>) => MaybePromise<any>;
    deleteTable: (data: Delete<boolean>) => MaybePromise<any>;
    push: (data: ArrayValue<boolean>) => MaybePromise<any>;
    remove: (data: ArrayValue<boolean>) => MaybePromise<any>;
    shift: (data: ArrayValue<boolean>) => MaybePromise<any>;
    pop: (data: ArrayValue<boolean>) => MaybePromise<any>;
    unshift: (data: ArrayValue<boolean>) => MaybePromise<any>;
    add: (data: NumberValue<boolean>) => MaybePromise<any>;
    sub: (data: NumberValue<boolean>) => MaybePromise<any>;
    multi: (data: NumberValue<boolean>) => MaybePromise<any>;
    divide: (data: NumberValue<boolean>) => MaybePromise<any>;
}
type DatabaseOptions = {
    auth: string;
};
declare const parseURL: (...paths: string[]) => string;
declare class DatabaseClient extends TypedEmitter<DatabaseEvents> {
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
    constructor(url: string, options: DatabaseOptions);
    /**
     * Gets all data of the Database
     */
    getAll(): Promise<GetAll<{
        data: {
            tables: {
                [k: string]: JSONValue;
            };
            backups: {
                [k: string]: JSONValue;
            };
        };
    }>>;
    /**
     * Gets all data of the tables
     */
    getTables(): Promise<GetAll<{
        tables: string[];
        data: JSONValue;
    }>>;
    /**
     * Gets all data of backups
     */
    getBackups(): Promise<GetAll<{
        backups: string[];
        data: JSONValue;
    }>>;
    /**
     * Creates a backup
     * @param method "create"
     * @returns BackupCreated
     */
    backup(method: "create"): Promise<BackupCreated>;
    /**
     * Gets a backup
     * @param method "get"
     * @param id ID of backup
     * @returns BackupGetted<"tables">
     */
    backup(method: "get", id: string): Promise<BackupGetted<"tables">>;
    /**
     * Gets a table data from a backup
     * @param method "get"
     * @param id ID of backup
     * @param table Table of backup
     * @returns BackupGetted<"table">
     */
    backup(method: "get", id: string, table: string): Promise<BackupGetted<"table">>;
    /**
     * Retores a table from a backup
     * @param method "restore"
     * @param id ID of backup
     * @param table Table of backup
     * @returns BackupRestored<true>
     */
    backup(method: "restore", id: string, table: string): Promise<BackupRestored<true>>;
    /**
     * Retores from a backup
     * @param method "restore"
     * @param id ID of backup
     * @returns BackupRestored<false>
     */
    backup(method: "restore", id: string): Promise<BackupRestored<false>>;
    /**
     * Deletes all backups
     * @param method "delete"
     * @returns BackupDeleted<false, string>
     */
    backup(method: "delete"): Promise<BackupDeleted<false, string>>;
    /**
     * Deletes a backup
     * @param method "delete"
     * @param id ID of backup
     * @returns BackupDeleted<false, string>
     */
    backup(method: "delete", id: string): Promise<BackupDeleted<false, string>>;
    /**
     * Deletes a table from a backup
     * @param method "delete"
     * @param id ID of backup
     * @param table Table of backup
     * @returns BackupDeleted<false, string>
     */
    backup(method: "delete", id: string, table: string): Promise<BackupDeleted<true, string>>;
    /**
     * Gets the latency with the EveDB Server
     * @returns number
     */
    ping(): Promise<number>;
    /**
     * Verify if the table exists
     */
    exists(table: string): Promise<boolean>;
    /**
     * Verify if the key exists in provided table
     * @option key - Key to check
     * @option table - Table to check
     * @returns boolean
     */
    has(key: string, table: string): Promise<boolean>;
    /**
     * Sets a value with the provided key on a table
     * @option key - Key to set
     * @option value - Value to set
     * @option table - Table to be setted
     * @returns Set<boolean>
     */
    set(key: string, value: JSONValue, table: string): Promise<Set<boolean>>;
    /**
     * Gets a table
     * @option table - Table to get
     * @returns TableGet
     */
    getTable(table: string): Promise<TableGet<boolean>>;
    /**
     * Gets the value from a key in provided table
     * @option key - Key to get
     * @option table - Table to get
     * @returns Get
     */
    get(key: string, table: string): Promise<Get<boolean>>;
    /**
     * Delete a table
     * @option key - Key to delete
     * @option table - Table to delete
     * @returns Delete
     */
    deleteTable(table: string): Promise<Delete<boolean>>;
    /**
     * Delete a key in provided table
     * @option key - Key to delete
     * @option table - Table to delete
     * @returns Delete
     */
    delete(key: string, table: string): Promise<Delete<boolean>>;
    /**
     * Push a value in the key of the table
     * @option key - Key to push
     * @option value - Value to push
     * @option table - Table to push
     */
    push(key: string, value: JSONValue, table: string): Promise<ArrayValue<boolean>>;
    /**
     * Removes a value in the key of the table
     * @option key - Key to removes
     * @option value - Value to removes
     * @option table - Table to removes
     */
    remove(key: string, value: JSONValue, table: string): Promise<ArrayValue<boolean>>;
    /**
     * Shifts a value in the key of the table
     * @option key - Key to shift
     * @option table - Table to shift
     */
    shift(key: string, table: string): Promise<ArrayValue<boolean>>;
    /**
     * Pops a value in the key of the table
     * @option key - Key to pop
     * @option table - Table to pop
     */
    pop(key: string, table: string): Promise<ArrayValue<boolean>>;
    /**
     * Unshifts a value in the key of the table
     * @option key - Key to unshift
     * @option value - Value to unshift
     * @option table - Table to unshift
     */
    unshift(key: string, value: JSONValue, table: string): Promise<ArrayValue<boolean>>;
    /**
     * Adds a value in the key of the table
     * @option key - Key to add
     * @option value - Value to add
     * @option table - Table to add
     */
    add(key: string, value: number, table: string): Promise<NumberValue<boolean>>;
    /**
     * Substracts a value in the key of the table
     * @option key - Key to sub
     * @option value - Value to sub
     * @option table - Table to sub
     */
    sub(key: string, value: number, table: string): Promise<NumberValue<boolean>>;
    /**
     * Multiplys a value in the key of the table
     * @option key - Key to multi
     * @option value - Value to multi
     * @option table - Table to multi
     */
    multi(key: string, value: number, table: string): Promise<NumberValue<boolean>>;
    /**
     * Divides a value in the key of the table
     * @option key - Key to divide
     * @option value - Value to divide
     * @option table - Table to divide
     */
    divide(key: string, value: number, table: string): Promise<NumberValue<boolean>>;
}

export { type ArrayValue, type Backup, type BackupCreated, type BackupDeleted, type BackupGetted, type BackupRestored, DatabaseClient, type DatabaseEvents, type DatabaseOptions, type Delete, type Error, type Get, type GetAll, type JSONArray, type JSONObject, type JSONValue, type MaybePromise, type NumberValue, type Set, type TableGet, parseURL };
