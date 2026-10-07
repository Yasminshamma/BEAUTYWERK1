import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApp } from "./app.js";

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export function startServer() {
  const port = Number.parseInt(process.env.PORT || "3001", 10);
  const app = createApp({ serveClient: process.env.NODE_ENV === "production" });
  const server = createServer(app);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Beautywerk API listening on http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      app.locals.database.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  startServer();
}
