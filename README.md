# EveDB

A Database using: Express, JSON files and Tables

## Index
- [EveDB](#evedb)
  - [Index](#index)
  - [Install](#install)
  - [Server](#server)
  - [Client](#client)
  - [Client Events](#client-events)
  - [Client Methods](#client-methods)
  - [Contact me](#contact-me)

## Install
> _It is simply the installation of the package, here it is shown with the bun installer, however with any package that has access to the npm API it is possible to install it._
```bash
bun add evedb
```

## Server
> _Here there is nothing in general, just create a class for the server and initialize it, that's all, there is no need to do anything else._
```ts
//Example of index.ts

import { DatabaseServer } from "evedb";

const auth = "auth";

const server = new DatabaseServer({
	port: 3000,
	path: "./src/Database",
	tables: ["main", "test"],
	auth,
	backup: {
		interval: 60 * 60000,
		report: true,
	},
});

server.start();
```

## Client
> _Here you create the main client to access the database wherever you are._
```ts
//Example of index.ts
import { DatabaseClient } from "evedb";

const auth = "auth";
const url = "localhost:3000/"

const client = new DatabaseClient(url, { auth });
```

## Client Events
> Here are all the events, is its name and the data you get, if it says Reference means that the data is what the function returns. Example:
> ```ts
> client.on("error", (data) => {
>    console.log(data);
> /**
> Logs:
> {
>   error: "Error message",
>   code: 500,
> }
> */
>})
> ```
- error - `{ code: number; message: string }`
- getAll - [Reference](#getall)
- getTables - [Reference](#gettables)
- getTable - [Reference](#gettable)
- deleteTable - [Reference](#deletetable)
- getBackups - [Reference](#getbackups)
- backupCreate - [Reference](#create-example)
- backupGet - [Reference](#example-get)
- backupRestore - [Reference](#example-restore)
- backupDelete - [Reference](#example-delete)
- set - [Reference](#set)
- get - [Reference](#get)
- delete - [Reference](#delete)
- push - [Reference](#push)
- remove - [Reference](#remove)
- shift - [Reference](#shift)
- pop - [Reference](#pop)
- unshift - [Reference](#unshift)
- add - [Reference](#add)
- sub - [Reference](#sub)
- multi - [Reference](#multi)
- divide - [Reference](#divide)

## Client Methods
- [GetAll](#getall)
- [GetTables](#gettables)
- [GetTable](#gettable)
- [DeleteTable](#deletetable)
- [GetBackups](#getbackups)
- [Backup](#backup)
- [Ping](#ping)
- [Exists](#exists)
- [Has](#has)
- [Set](#set)
- [Get](#get)
- [Delete](#delete)
- [Push](#push)
- [Remove](#remove)
- [Shift](#shift)
- [Pop](#pop)
- [UnShift](#unshift)
- [Add](#add)
- [Sub](#sub)
- [Multi](#multi)
- [Divive](#divide)

> ### **GetAll**:
> **Description**: This method retrieves all data from the database. It returns an object with the client
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.getAll()
> /**
> Returns: 
> {
>    client: [DatabaseClient];
>    code: 200;
>    url: "http://localhost:3000/";
>    data: {
>        tables: {
>            "main": {...},
>            "test": {...},
>        };
>        backups: {
>            "1717978930687": {...}
>        };
>    };
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **GetTables**:
> **Description**: This method retrieves all tables in the database. It returns an object with the client
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.getTables()
> /**
> Returns: 
> {
>    client: [DatabaseClient];
>    code: 200;
>    url: "http://localhost:3000/";
>    tables: [ "main", "test" ];
>    data: {
>        "main": {
>            "foo": "bar"
>        },
>        "test": {
>            "bar": "foo"
>        },
>    };
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **GetTable**:
> **Description**: This method retrieves all data from the given table. It returns an object with the name of the table and its contents.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.getTable("main")
> /**
> Returns: 
> {
>    table: "main";
>    data: {
>        "foo": "bar";
>    };
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **DeleteTable**:
> **Description**: This method deletes all data in the given table. Returns an object with the name of the table and its empty contents.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.deleteTable("main")
> /**
> Returns: 
> {
>    table: "main";
>    data: { };
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **GetBackups**:
> **Description**: This method retrieves all backups in the database. It returns an object with the client
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.getBackups()
> /**
> Returns: 
> {
>    client: [DatabaseClient];
>    code: 200;
>    url: "http://localhost:3000/";
>    backups: [ "1717978930687" ];
>    data: {
>        "1717978930687": {
>            "main": {
>                "foo": "bar"
>            },
>            "test": {
>                "bar": "foo"
>            },
>        }
>    };
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Backup**:
> **Description**: This method has several overloads. For this reason, each situation of use is described below
> 
> **Has Event**: Yes
>
> #### **Example List**
> - [Create](#example-create)
> - [Get](#example-get)
> - [Restore](#example-restore)
> - [Delete](#example-delete)
> 
> #### **Example Create**:
> ```ts 
> await client.backup("create")
> /**
> Returns: 
> {
>    code: 200;
>    message: "Backup was created successfully";
>    id: "1717986166031";
>    success: true
>}
>*/
> ```
> [Go to list](#example-list)
> #### **Example Get**:
> ```ts 
> await client.backup("get", "1717986166031")
> /**
> Returns: 
> {
>    code: 200;
>    id: "1717986166031";
>    tables: {
>        "main": {...},
>        "test": {...}
>    }
>}
>*/
>
> await client.backup("get", "1717986166031", "main")
> /**
> Returns: 
> {
>    code: 200;
>    id: "1717986166031";
>    table: "main";
>    data: {
>        "foo": "bar"
>    }
>}
>*/
> ```
> [Go to list](#example-list)
> #### **Example Restore**:
> > In the second case, only one table is restored and not all of them.
> ```ts 
> await client.backup("restore", "1717986166031")
> /**
> Returns: 
> {
>    code: 200;
>    message: "Restore from backup was successfully";
>    success: true
>}
>*/
>
> await client.backup("restore", "1717986166031", "main")
> /**
> Returns: 
> {
>    code: 200;
>    message: "Restore from backup was successfully";
>    table: "main";
>    success: true
>}
>*/
> ```
> [Go to list](#example-list)
> #### **Example Delete**:
> > In the first case it deletes all backups, in the second only one, and in the third only one table from a single backup.
> ```ts 
> await client.backup("delete")
> /**
> Returns: 
> {
>    code: 200;
>    message: "All backups was deleted successfully";
>    success: true
>}
> 
>*/
>
> await client.backup("delete", "1717986166031")
> /**
> Returns: 
> {
>    code: 200;
>    id: "1717986166031";
>    message: "Backup \"1717986166031\" was deleted successfully";
>    success: true
>}
>*/
>
> await client.backup("delete", "1717986166031", "main")
> /**
> Returns: 
> {
>    code: 200;
>    id: "1717986166031";
>    table: "main";
>    message: "Table \"main\" was deleted successfully from backup \"1717986166031\"";
>    success: true
>}
>*/
> ```
> [Go to list](#example-list)
> 
> [Go Back](#client-methods)> 

> ### **Ping**:
> **Description**: This method retrieves the latency that the client has with the server in milliseconds.
> 
> **Has Event**: No
> 
> **Example**:
> ```ts 
> await client.ping()
> /**
> Returns: 
> 50
>*/
> ```
> [Go Back](#client-methods)

> ### **Exists**:
> **Description**: This method retrieves whether a table exists or not.
> 
> **Has Event**: No
> 
> **Example**:
> ```ts 
> await client.exists("main")
> /**
> Returns: 
> true
>*/
> ```
> [Go Back](#client-methods)

> ### **Has**:
> **Description**: This method retrieves if a certain key exists in a table.
> 
> **Has Event**: No
> 
> **Example**:
> ```ts 
> await client.has("foo", "main")
> /**
> Returns: 
> true
>*/
> ```
> [Go Back](#client-methods)

> ### **Set**:
> **Description**: This method sets a value to a specific key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.set("foo", "baar","main")
> /**
> Returns: 
> {
>    table: "main";
>    data: {
>        "foo": "baar"
>    };
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Get**:
> **Description**: This method obtains a value from a particular key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.set("foo", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    value: "baar"
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Delete**:
> **Description**: This method deletes a value from a particular key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.delete("foo", "main")
> /**
> Returns: 
> {
>    table: "main";
>    data: {  }
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Push**:
> **Description**: This method pushes a value to a particular key
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.push("foo", "bar", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    old: [  ]
>    new: [ "bar" ]
>    success: true
>}
>*/
> ```

> ### **Remove**:
> **Description**: This method removes a value to a particular key
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.remove("foo", "bar", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    old: [ "bar" ]
>    new: [  ]
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Shift**:
> **Description**: This method removes the first element of any array to a particular key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.shift("foo", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    old: [ "bar" ]
>    new: [  ]
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Pop**:
> **Description**: This method removes the last element of any array to a particular key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.pop("foo", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    old: [ "bar", "bar2" ]
>    new: [ "bar" ]
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **UnShift**:
> **Description**: This method adds an element to the beginning of some array to a particular key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.unshift("foo", "bar0", "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "foo"
>    old: [ "bar", "bar2" ]
>    new: [ "bar0", "bar", "bar2" ]
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Add**:
> **Description**: This method adds a given value to a given key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.add("money", 10, "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "money"
>    old: 0
>    new: 10
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Sub**:
> **Description**: This method subtracts a given value from a given key.
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.sub("money", 2, "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "money"
>    old: 10
>    new: 8
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Multiply**:
> **Description**: This method multiplies a given value to a particular key
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.multi("money", 2, "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "money"
>    old: 8
>    new: 16
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

> ### **Divide**:
> **Description**: This method divides a given value to a particular key
> 
> **Has Event**: Yes
> 
> **Example**:
> ```ts 
> await client.divide("money", 4, "main")
> /**
> Returns: 
> {
>    table: "main";
>    id: "money"
>    old: 16
>    new: 4
>    success: true
>}
>*/
> ```
> [Go Back](#client-methods)

## Contact me
<a href="https://discord.com/users/1125490330679115847"><img src="https://img.shields.io/badge/-Discord-000000?labelColor=5568f2&logo=discord&logoColor=ffffff" alt="Discord Badge"/></a>
<a href="https://x.com/kingsbcats"><img src="https://img.shields.io/badge/-Twitter-000000?labelColor=000000&logo=x&logoColor=ffffff" alt="X Badge"/></a>
<a href="https://instagram.com/kingsbcattz"><img src="https://img.shields.io/badge/-Instagram-000000?labelColor=E4405F&logo=instagram&logoColor=ffffff" alt="Instagram Badge"/></a>