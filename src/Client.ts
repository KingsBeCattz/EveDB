import { TypedEmitter } from "tiny-typed-emitter";
import { get } from "lodash";

export type Error = { code: number; message: string };

export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONObject
	| JSONValue[];

export interface JSONObject {
	[key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

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
				[k: string]: JSONValue;
			};
	  }
	: {
			code: number;
			id: string;
			tables: {
				[k: string]: JSONValue;
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

export type Set<SUCCESS = boolean> = {
	table: SUCCESS extends true ? string : null;
	data: SUCCESS extends true
		? {
				[k: string]: JSONValue;
		  }
		: null;
	success: SUCCESS;
};

export type Get<SUCCESS = boolean> = {
	table: SUCCESS extends true ? string : null;
	id: SUCCESS extends true ? string : null;
	value: SUCCESS extends true ? JSONValue : null;
	success: SUCCESS;
};

export type TableGet<SUCCESS = boolean> = {
	table: string;
	data: SUCCESS extends true ? { table: string; content: JSONValue } : null;
	success: SUCCESS;
};

export type Delete<SUCCESS = boolean> = {
	table: string;
	data: SUCCESS extends true ? { [k: string]: JSONValue } : null;
	success: SUCCESS;
};

export type ArrayValue<SUCCESS = boolean> = {
	table: SUCCESS extends true ? string : null;
	id: string;
	old: SUCCESS extends true ? JSONValue[] : null;
	new: SUCCESS extends true ? JSONValue[] : null;
	success: SUCCESS;
};

export type NumberValue<SUCCESS = boolean> = {
	table: SUCCESS extends true ? string : null;
	id: string;
	old: SUCCESS extends true ? number : null;
	new: SUCCESS extends true ? number : null;
	success: SUCCESS;
};

export type MaybePromise<T> = Promise<T> | T;

export interface DatabaseEvents {
	error: (data: { code: number; message: string }) => MaybePromise<any>;
	getAll: (
		data: GetAll<{
			data: {
				tables: {
					[k: string]: JSONValue;
				};
				backups: {
					[k: string]: JSONValue;
				};
			};
		}>
	) => MaybePromise<any>;
	getTables: (
		data: GetAll<{ tables: string[]; data: { [k: string]: JSONValue } }>
	) => MaybePromise<any>;
	getBackups: (
		data: GetAll<{ backups: string[]; data: { [k: string]: JSONValue } }>
	) => MaybePromise<any>;
	backupCreate: (data: BackupCreated) => MaybePromise<any>;
	backupGet: (data: BackupGetted<"table" | "tables">) => MaybePromise<any>;
	backupRestore: (data: BackupRestored<boolean>) => MaybePromise<any>;
	backupDelete: (
		data: BackupDeleted<boolean, string | string[]>
	) => MaybePromise<any>;
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
		"http://" + (queryParams ? `${sanitizedPath}?${queryParams}` : sanitizedPath)
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
					[k: string]: JSONValue;
				};
				backups: {
					[k: string]: JSONValue;
				};
			};
		}>
	> {
		const response = await fetch(
			new Request(this.url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
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
	async getTables(): Promise<GetAll<{ tables: string[]; data: JSONValue }>> {
		const response = await fetch(
			new Request(this.url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
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
	async getBackups(): Promise<GetAll<{ backups: string[]; data: JSONValue }>> {
		const response = await fetch(
			new Request(this.url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
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
	 * Deletes all backups
	 * @param method "delete"
	 * @returns BackupDeleted<false, string>
	 */
	async backup(method: "delete"): Promise<BackupDeleted<false, string>>;

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
							"Accept": "application/json",
							"Content-Type": "application/json",
							"auth": this.auth,
						},
						method: "POST",
						body: JSON.stringify({ method: "create" }),
					})
				);

				if (response.ok) {
					const jsonResponse = await response.json();
					this.emit("backupCreate", jsonResponse);
					return jsonResponse;
				} else {
					const errorResponse = {
						code: response.status,
						message: response.statusText,
					};
					this.emit("error", errorResponse);
					return errorResponse;
				}
			}
			case "get": {
				let response = await fetch(
					new Request(
						parseURL(this.url, "backup/", id!, table ? `?table=${table}` : ""),
						{
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json",
								"auth": this.auth,
							},
							method: "GET",
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
						message: response.statusText,
					};
					this.emit("error", errorResponse);
					return errorResponse;
				}
			}
			case "restore": {
				if (!id) {
					const errorResponse = {
						code: 400,
						message: "You must give a id to restore",
					};
					this.emit("error", errorResponse);
					return errorResponse;
				}
				const response = await fetch(
					new Request(parseURL(this.url, "backup/", id), {
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"auth": this.auth,
						},
						method: "POST",
						body: JSON.stringify({ method: "restore", table }),
					})
				);
				if (response.ok) {
					const jsonResponse = await response.json();
					this.emit("backupRestore", jsonResponse);
					return jsonResponse;
				} else {
					const errorResponse = {
						code: response.status,
						message: response.statusText,
					};
					this.emit("error", errorResponse);
					return errorResponse;
				}
			}
			case "delete": {
				let response = await fetch(
					new Request(
						parseURL(this.url, "backup/", id!, table ? `?table=${table}` : ""),
						{
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json",
								"auth": this.auth,
							},
							method: "DELETE",
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
						message: response.statusText,
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
	async ping(): Promise<number> {
		const time = Date.now();
		await fetch(
			new Request(parseURL(this.url), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "GET",
			})
		);
		return Date.now() - time;
	}
	/**
	 * Verify if the table exists
	 */
	async exists(table: string): Promise<boolean> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/"), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "GET",
			})
		);

		if (response.ok) {
			const json = await response.json();
			return !!json.data[table];
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
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
	async has(key: string, table: string): Promise<boolean> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "GET",
			})
		);

		if (response.ok) {
			const json = await response.json();
			if (json.tables) return false;
			return !!get(json, key);
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
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
	async set(
		key: string,
		value: JSONValue,
		table: string
	): Promise<Set<boolean>> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "POST",
				body: JSON.stringify({ id: key, value }),
			})
		);

		if (response.ok) {
			const json = Object.assign(await response.json(), { success: true });
			this.emit("set", json);
			return json;
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
			};
			this.emit("error", errorResponse);
			return {
				table: null,
				data: null,
				success: false,
			};
		}
	}

	/**
	 * Gets a table
	 * @option table - Table to get
	 * @returns TableGet
	 */
	async getTable(table: string): Promise<TableGet<boolean>> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "GET",
			})
		);

		if (response.ok) {
			const json = await response
				.json()
				.then((d) => ({ table, data: d, success: true }));
			this.emit("getTable", json);
			return json;
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
			};
			this.emit("error", errorResponse);
			return {
				table,
				data: null,
				success: false,
			};
		}
	}

	/**
	 * Gets the value from a key in provided table
	 * @option key - Key to get
	 * @option table - Table to get
	 * @returns Get
	 */
	async get(key: string, table: string): Promise<Get<boolean>> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table, "?id=" + key), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "GET",
			})
		);

		if (response.ok) {
			const json = Object.assign(await response.json(), { success: true });
			this.emit("get", json);
			return json;
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
			};
			this.emit("error", errorResponse);
			return {
				table,
				id: key,
				value: null,
				success: false,
			};
		}
	}

	/**
	 * Delete a table
	 * @option key - Key to delete
	 * @option table - Table to delete
	 * @returns Delete
	 */
	async deleteTable(table: string): Promise<Delete<boolean>> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "DELETE",
			})
		);

		if (response.ok) {
			const json = Object.assign(await response.json());
			this.emit("delete", json);
			return json;
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
			};
			this.emit("error", errorResponse);
			return {
				table,
				data: null,
				success: false,
			};
		}
	}

	/**
	 * Delete a key in provided table
	 * @option key - Key to delete
	 * @option table - Table to delete
	 * @returns Delete
	 */
	async delete(key: string, table: string): Promise<Delete<boolean>> {
		const response = await fetch(
			new Request(parseURL(this.url, "table/", table), {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"auth": this.auth,
				},
				method: "DELETE",
				body: JSON.stringify({ id: key }),
			})
		);

		if (response.ok) {
			const json = Object.assign(await response.json());
			this.emit("delete", json);
			return json;
		} else {
			const errorResponse = {
				code: response.status,
				message: response.statusText,
			};
			this.emit("error", errorResponse);
			return {
				table,
				data: null,
				success: false,
			};
		}
	}

	/**
	 * Push a value in the key of the table
	 * @option key - Key to push
	 * @option value - Value to push
	 * @option table - Table to push
	 */
	async push(
		key: string,
		value: JSONValue,
		table: string
	): Promise<ArrayValue<boolean>> {
		const data = await this.get(key, table);
		const array = (data.value as JSONValue[]) || [];

		if (!Array.isArray(array))
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};

		array.push(value);
		const setted = await this.set(key, array, table);

		if (setted.success) {
			const pushed = {
				table: table,
				id: key,
				old: array.slice(0, array.length - 1),
				new: array,
				success: setted.success,
			};
			this.emit("push", pushed);
			return pushed;
		} else
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};
	}

	/**
	 * Removes a value in the key of the table
	 * @option key - Key to removes
	 * @option value - Value to removes
	 * @option table - Table to removes
	 */
	async remove(
		key: string,
		value: JSONValue,
		table: string
	): Promise<ArrayValue<boolean>> {
		const data = await this.get(key, table);
		const array = (data.value as JSONValue[]) || [];

		if (!Array.isArray(array))
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};

		const index = array.indexOf(value);
		var v;
		if (index > -1) {
			v = array.splice(index, 1);
		}

		const setted = await this.set(key, array, table);

		if (setted.success) {
			const removed = {
				table: table,
				id: key,
				old: v ? array.concat(v) : array,
				new: array,
				success: setted.success,
			};
			this.emit("remove", removed);
			return removed;
		} else
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};
	}

	/**
	 * Shifts a value in the key of the table
	 * @option key - Key to shift
	 * @option table - Table to shift
	 */
	async shift(key: string, table: string): Promise<ArrayValue<boolean>> {
		const data = await this.get(key, table);
		const array = (data.value as JSONValue[]) || [];

		if (!Array.isArray(array))
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};

		const removed = array.shift();

		const setted = await this.set(key, array, table);

		if (setted.success) {
			const shifted = {
				table: table,
				id: key,
				old: removed ? [removed].concat(array) : array,
				new: array,
				success: setted.success,
			};
			this.emit("shift", shifted);
			return shifted;
		} else
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};
	}

	/**
	 * Pops a value in the key of the table
	 * @option key - Key to pop
	 * @option table - Table to pop
	 */
	async pop(key: string, table: string): Promise<ArrayValue<boolean>> {
		const data = await this.get(key, table);
		const array = (data.value as JSONValue[]) || [];

		if (!Array.isArray(array))
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};

		const removed = array.pop();

		const setted = await this.set(key, array, table);

		if (setted.success) {
			const poped = {
				table: table,
				id: key,
				old: removed ? array.concat(removed) : array,
				new: array,
				success: setted.success,
			};
			this.emit("pop", poped);
			return poped;
		} else
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};
	}

	/**
	 * Unshifts a value in the key of the table
	 * @option key - Key to unshift
	 * @option value - Value to unshift
	 * @option table - Table to unshift
	 */
	async unshift(
		key: string,
		value: JSONValue,
		table: string
	): Promise<ArrayValue<boolean>> {
		const data = await this.get(key, table);
		const array = (data.value as JSONValue[]) || [];

		if (!Array.isArray(array))
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};

		array.unshift(value);

		const setted = await this.set(key, array, table);

		if (setted.success) {
			const unshifted = {
				table: table,
				id: key,
				old: array.slice(1),
				new: array,
				success: setted.success,
			};
			this.emit("unshift", unshifted);
			return unshifted;
		} else
			return {
				table,
				id: key,
				old: array,
				new: null,
				success: false,
			};
	}

	/**
	 * Adds a value in the key of the table
	 * @option key - Key to add
	 * @option value - Value to add
	 * @option table - Table to add
	 */
	async add(
		key: string,
		value: number,
		table: string
	): Promise<NumberValue<boolean>> {
		const n = (await this.get(key, table))?.value;

		if (!n || typeof n !== "number")
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};

		const setted = await this.set(key, n + value, table);

		if (setted.success) {
			const added = {
				table: table,
				id: key,
				old: n,
				new: n + value,
				success: setted.success,
			};
			this.emit("add", added);
			return added;
		} else
			return {
				table,
				id: key,
				old: n,
				new: null,
				success: false,
			};
	}

	/**
	 * Substracts a value in the key of the table
	 * @option key - Key to sub
	 * @option value - Value to sub
	 * @option table - Table to sub
	 */
	async sub(
		key: string,
		value: number,
		table: string
	): Promise<NumberValue<boolean>> {
		const n = (await this.get(key, table))?.value;

		if (!n || typeof n !== "number")
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};

		const setted = await this.set(key, n - value, table);

		if (setted.success) {
			const substracted = {
				table: table,
				id: key,
				old: n,
				new: n - value,
				success: setted.success,
			};
			this.emit("sub", substracted);
			return substracted;
		} else
			return {
				table,
				id: key,
				old: n,
				new: null,
				success: false,
			};
	}

	/**
	 * Multiplys a value in the key of the table
	 * @option key - Key to multi
	 * @option value - Value to multi
	 * @option table - Table to multi
	 */
	async multi(
		key: string,
		value: number,
		table: string
	): Promise<NumberValue<boolean>> {
		const n = (await this.get(key, table))?.value;

		if (!n || typeof n !== "number")
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};

		const setted = await this.set(key, n * value, table);

		if (setted.success) {
			const multiplyed = {
				table: table,
				id: key,
				old: n,
				new: n * value,
				success: setted.success,
			};
			this.emit("multi", multiplyed);
			return multiplyed;
		} else
			return {
				table,
				id: key,
				old: n,
				new: null,
				success: false,
			};
	}

	/**
	 * Divides a value in the key of the table
	 * @option key - Key to divide
	 * @option value - Value to divide
	 * @option table - Table to divide
	 */
	async divide(
		key: string,
		value: number,
		table: string
	): Promise<NumberValue<boolean>> {
		const n = (await this.get(key, table))?.value;

		if (!n || typeof n !== "number")
			return {
				table,
				id: key,
				old: null,
				new: null,
				success: false,
			};

		const setted = await this.set(key, n / value, table);

		if (setted.success) {
			const divided = {
				table: table,
				id: key,
				old: n,
				new: n / value,
				success: setted.success,
			};
			this.emit("multi", divided);
			return divided;
		} else
			return {
				table,
				id: key,
				old: n,
				new: null,
				success: false,
			};
	}
}
