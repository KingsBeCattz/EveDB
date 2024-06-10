import express, { Response } from 'express';

declare class Util {
    server: DatabaseServer;
    constructor(server: DatabaseServer);
    parseURL(...paths: string[]): string;
    check_folders(): void;
    send(res: Response, code: number, message: string): void;
    sendJSON(res: Response, data: Record<string, any>): void;
    get_table(table: string): any;
    insert(table: string, data: string): void;
    create_backup(): string;
    get_backup(id: string, table?: string): any;
    delete_backup(id: string, table?: string): boolean;
    restore_backup(id: string, table?: string): boolean;
}

type BackupOptions = {
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
type ServerOptions = {
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
declare class DatabaseServer {
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
    constructor(options: ServerOptions);
    /**
     * Starts the database server
     */
    start(): void;
}

export { type BackupOptions as B, DatabaseServer as D, type ServerOptions as S, Util as U };
