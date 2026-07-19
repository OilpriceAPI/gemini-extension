import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const manifest = (
  await import("../gemini-extension.json", { with: { type: "json" } })
).default;
const entryPoint = fileURLToPath(
  new URL(
    "../node_modules/oilpriceapi-mcp/build/index.js",
    import.meta.url,
  ),
);
const runtimeArgs = manifest.mcpServers.oilpriceapi.args.slice(2);
const secretValues = [
  "valid-extension-key",
  "invalid-extension-key",
  "locked-extension-key",
  "rate-extension-key",
  "timeout-extension-key",
  "malformed-extension-key",
  "customer-never-log",
];
const capturedStderr = [];
const sockets = new Set();

function json(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

const upstream = createServer((request, response) => {
  if (request.url === "/health") {
    json(response, 200, { status: "ok" });
    return;
  }
  if (request.url === "/v1/demo/prices") {
    json(response, 200, {
      status: "success",
      data: {
        prices: [
          {
            code: "BRENT_CRUDE_USD",
            name: "Brent Crude",
            price: 82.15,
            currency: "USD",
            updated_at: "2026-07-19T14:00:00Z",
            source: "extension-smoke",
          },
        ],
      },
    });
    return;
  }
  if (!request.url?.startsWith("/v1/prices/latest?by_code=")) {
    json(response, 404, { error: "not found" });
    return;
  }

  const auth = request.headers.authorization || "";
  if (auth === "Bearer valid-extension-key") {
    json(response, 200, {
      status: "success",
      data: {
        code: "BRENT_CRUDE_USD",
        name: "Brent Crude",
        price: 82.15,
        currency: "USD",
        created_at: "2026-07-19T14:00:00Z",
        source: "extension-smoke",
      },
    });
    return;
  }
  if (auth === "Bearer invalid-extension-key") {
    json(response, 401, {
      error: "invalid key",
      customer_id: "customer-never-log",
    });
    return;
  }
  if (auth === "Bearer locked-extension-key") {
    json(response, 403, {
      error: "dataset locked for this account",
      customer_id: "customer-never-log",
    });
    return;
  }
  if (auth === "Bearer rate-extension-key") {
    json(
      response,
      429,
      {
        error: "quota exhausted",
        customer_id: "customer-never-log",
      },
      { "Retry-After": "0" },
    );
    return;
  }
  if (auth === "Bearer timeout-extension-key") {
    return;
  }
  if (auth === "Bearer malformed-extension-key") {
    json(response, 200, {
      status: "unexpected",
      customer_id: "customer-never-log",
    });
    return;
  }
  json(response, 401, { error: "missing key" });
});

upstream.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

await new Promise((resolve, reject) => {
  upstream.once("error", reject);
  upstream.listen(0, "127.0.0.1", resolve);
});
const address = upstream.address();
if (!address || typeof address === "string") throw new Error("No test port");
const baseUrl = `http://127.0.0.1:${address.port}`;

function textOf(result) {
  return result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

async function withClient(apiKey, callback) {
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined),
  );
  environment.OILPRICEAPI_BASE_URL = baseUrl;
  environment.OILPRICEAPI_KEY = apiKey;
  environment.OILPRICEAPI_CLIENT_MARKER =
    manifest.mcpServers.oilpriceapi.env.OILPRICEAPI_CLIENT_MARKER;
  environment.OILPRICEAPI_CLIENT_VERSION = manifest.version;

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entryPoint, ...runtimeArgs],
    env: environment,
    stderr: "pipe",
  });
  const client = new Client({
    name: "oilpriceapi-gemini-extension-test",
    version: manifest.version,
  });
  try {
    await client.connect(transport);
    transport.stderr?.on("data", (chunk) =>
      capturedStderr.push(chunk.toString()),
    );
    return await callback(client);
  } finally {
    await client.close();
  }
}

test("Gemini manifest launches the exact read-only tool inventory", async () => {
  await withClient("", async (client) => {
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 25);
    assert.ok(listed.tools.some((tool) => tool.name === "opa_get_product_facts"));
    assert.ok(listed.tools.some((tool) => tool.name === "opa_get_price"));
    assert.ok(
      listed.tools.every(
        (tool) => tool.annotations?.readOnlyHint !== false,
      ),
    );
    assert.ok(
      !listed.tools.some((tool) => tool.name === "opa_create_price_alert"),
    );
  });
});

test("product facts and keyless current price are available without a key", async () => {
  await withClient("", async (client) => {
    const facts = await client.callTool({
      name: "opa_get_product_facts",
      arguments: {},
    });
    assert.notEqual(facts.isError, true);
    assert.match(textOf(facts), /"contractVersion"/);
    assert.match(
      textOf(facts),
      /https:\/\/api\.oilpriceapi\.com\/product-facts\.json/,
    );

    const price = await client.callTool({
      name: "opa_get_price",
      arguments: { commodity: "BRENT_CRUDE_USD" },
    });
    assert.notEqual(price.isError, true);
    assert.match(textOf(price), /82\.15/);

    const history = await client.callTool({
      name: "opa_get_history",
      arguments: { commodity: "BRENT_CRUDE_USD" },
    });
    assert.equal(history.isError, true);
    assert.match(textOf(history), /API key|sign up|signup/i);
  });
});

test("authenticated current-price call preserves value and source timestamp", async () => {
  await withClient("valid-extension-key", async (client) => {
    const result = await client.callTool({
      name: "opa_get_price",
      arguments: { commodity: "brent" },
    });
    assert.notEqual(result.isError, true);
    assert.match(textOf(result), /82\.15/);
    assert.match(textOf(result), /2026|extension-smoke/);
  });
});

test("invalid key, locked dataset, and rate limit fail with recovery", async () => {
  const cases = [
    ["invalid-extension-key", /authentication|API key|temporarily unavailable/i],
    ["locked-extension-key", /403|locked|Upgrade/i],
    ["rate-extension-key", /429|quota|Upgrade/i],
  ];
  for (const [key, expected] of cases) {
    await withClient(key, async (client) => {
      const result = await client.callTool({
        name: "opa_get_price",
        arguments: { commodity: "brent" },
      });
      assert.equal(result.isError, true);
      assert.match(textOf(result), expected);
      assert.doesNotMatch(textOf(result), /customer-never-log/);
    });
  }
});

test("malformed upstream response fails without fabricating a value", async () => {
  await withClient("malformed-extension-key", async (client) => {
    const result = await client.callTool({
      name: "opa_get_price",
      arguments: { commodity: "brent" },
    });
    assert.equal(result.isError, true);
    assert.match(textOf(result), /could not retrieve|unavailable|try again/i);
    assert.doesNotMatch(textOf(result), /customer-never-log|82\.15/);
  });
});

test("MCP request timeout is bounded by the Gemini manifest policy", async () => {
  await withClient("timeout-extension-key", async (client) => {
    await assert.rejects(
      client.callTool(
        {
          name: "opa_get_price",
          arguments: { commodity: "brent" },
        },
        undefined,
        { timeout: 200 },
      ),
      /timed out/i,
    );
  });
  assert.equal(manifest.mcpServers.oilpriceapi.timeout, 15_000);
});

test("child-process diagnostics do not log keys or customer identifiers", () => {
  const logs = capturedStderr.join("\n");
  for (const secret of secretValues) assert.ok(!logs.includes(secret));
});

test.after(async () => {
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => upstream.close(resolve));
});
