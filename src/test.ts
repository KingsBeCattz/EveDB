import { DatabaseServer, DatabaseClient } from "./index";

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

const client = new DatabaseClient("localhost:3000/", { auth });
client.getAll().then((r) => console.log(r));
