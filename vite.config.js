import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import bootstrapHandler from "./api/admin/bootstrap.js";
import usersHandler from "./api/admin/users.js";

function localApiPlugin() {
  return {
    name: "local-api-routes",
    configureServer(server) {
      server.middlewares.use("/api/admin/bootstrap", async (req, res) => {
        await handleLocalApi(req, res, bootstrapHandler);
      });
      server.middlewares.use("/api/admin/users", async (req, res) => {
        await handleLocalApi(req, res, usersHandler);
      });
    }
  };
}

async function handleLocalApi(req, res, handler) {
  try {
    req.body = await readBody(req);
    await handler(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message }));
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      resolve(body ? JSON.parse(body) : {});
    });
    req.on("error", reject);
  });
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [localApiPlugin(), react()],
    server: {
      port: 5173
    }
  };
});
