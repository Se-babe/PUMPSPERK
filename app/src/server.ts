import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accountState, apply, createSeed, normalizePhone, normalizeState, type Action, type ApplyResult, type State } from "./mvp/logic.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const FILE = path.join(ROOT, "data", "pumpperks-state.json");
const ACTIONS = new Set<Action["type"]>(["register", "purchase", "redeem", "confirm", "adjust", "reward", "reset"]);
const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

let chain: Promise<unknown> = Promise.resolve();

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  if (url.pathname === "/api/state" || url.pathname === "/api/action" || url.pathname === "/api/account") {
    handleApi(request, response, url);
    return;
  }
  serveStatic(response, url.pathname);
});

const port = Number(process.env.PORT || 10000);
server.listen(port, "0.0.0.0", () => {
  console.log(`PumpPerks listening on ${port}`);
});

function handleApi(request: http.IncomingMessage, response: http.ServerResponse, url: URL) {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  const pathname = url.pathname;

  if (pathname === "/api/account" && request.method === "GET") {
    const account = accountState(readState(), url.searchParams.get("phone") ?? "");
    if (!account) {
      response.statusCode = normalizePhone(url.searchParams.get("phone") ?? "") ? 404 : 400;
      response.end(JSON.stringify({ error: response.statusCode === 400 ? "Enter a valid Ugandan mobile number." : "No account uses this number." }));
      return;
    }
    response.end(JSON.stringify(account));
    return;
  }

  if (pathname === "/api/state" && request.method === "GET") {
    response.end(JSON.stringify(readState()));
    return;
  }

  if (pathname === "/api/action" && request.method === "POST") {
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
        return visibleResult(result, action);
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
}

function serveStatic(response: http.ServerResponse, pathname: string) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = path.normalize(path.join(DIST, requested));
  if (!file.startsWith(DIST)) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(DIST, "index.html");
  if (!fs.existsSync(target)) {
    response.statusCode = 503;
    response.end("PumpPerks has not been built yet.");
    return;
  }
  response.setHeader("Content-Type", TYPES[path.extname(target)] || "application/octet-stream");
  if (path.basename(target) === "index.html") response.setHeader("Cache-Control", "no-cache");
  fs.createReadStream(target).pipe(response);
}

function visibleResult(result: ApplyResult, action: Action): ApplyResult {
  if (action.type !== "register" && action.type !== "redeem") return result;
  const account = accountState(result.state, action.phone);
  return {
    ...result,
    state: account ?? { revision: result.state.revision, seq: result.state.seq, customers: [], activity: [], rewards: result.state.rewards },
  };
}

function readState(): State {
  try {
    const parsed = normalizeState(JSON.parse(fs.readFileSync(FILE, "utf8")) as State);
    if (!parsed) throw new Error("Stored PumpPerks data is incomplete.");
    return parsed;
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
