import { DatabaseServer, DatabaseClient } from "./index";

const auth = "AA";

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
client.ping().then((r) => console.log(r + "ms"));

//client.getTables().then((r) => console.log(r));
/**
const response = fetch(
  new Request("http://localhost:3000/backup/", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      auth: server.authorization,
    },
    method: "POST",
    body: JSON.stringify({ method: "create" }),
  })
).then((r) => r);

response.then((r) => console.log(r.json()));

 */
