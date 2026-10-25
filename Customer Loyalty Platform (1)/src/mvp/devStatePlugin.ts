import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin } from "vite";
import { apply, createSeed, type Action, type State } from "./logic";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "data", "pumpperks-state.json");
const ACTIONS = new Set<Action["type"]>(["register", "purchase", "redeem", "confirm", "reset"]);

let chain: Promise<unknown> = Promise.resolve();

export function pumpPerksStatePlugin(): Plugin {
  return {
    name: "pumpperks-state",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

const handle: Connect.NextHandleFunction = (request, response, next) => {
  const url = request.url?.split("?")[0];
  if (url !== "/api/state" && url !== "/api/action") return next();

  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");

  if (url === "/api/state" && request.method === "GET") {
    response.end(JSON.stringify(readState()));
    return;
  }

  if (url === "/api/action" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) request.destroy();
    });
    request.on("end", () => {
      let action: Action;
      try {
        action = JSON.parse(raw) as Action;
      } catch {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: "Invalid action." }));
        return;
      }
      if (!action || !ACTIONS.has(action.type)) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: "Invalid action." }));
        return;
      }
      const run = chain.then(() => {
        const result = apply(readState(), action);
        writeState(result.state);
        return result;
      });
      chain = run.then(() => undefined, () => undefined);
      run.then(
        (result) => response.end(JSON.stringify(result)),
        () => {
          response.statusCode = 500;
          response.end(JSON.stringify({ error: "Could not save that change." }));
        },
      );
    });
    return;
  }

  response.statusCode = 405;
  response.end(JSON.stringify({ error: "Method not allowed." }));
};

function readState(): State {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
  } catch {
    const seed = createSeed();
    writeState(seed);
    return seed;
  }
}

function writeState(state: State) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}
