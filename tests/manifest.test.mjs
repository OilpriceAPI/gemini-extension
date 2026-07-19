import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(
  await readFile(new URL("../gemini-extension.json", import.meta.url), "utf8"),
);
const context = await readFile(
  new URL("../GEMINI.md", import.meta.url),
  "utf8",
);
const readme = await readFile(
  new URL("../README.md", import.meta.url),
  "utf8",
);

test("manifest pins a bounded read-only MCP runtime", () => {
  assert.equal(manifest.name, "oilpriceapi");
  assert.equal(manifest.version, "2.0.0");
  assert.equal(manifest.contextFileName, "GEMINI.md");

  const server = manifest.mcpServers.oilpriceapi;
  assert.equal(server.command, "npx");
  assert.deepEqual(server.args, [
    "-y",
    "oilpriceapi-mcp@3.0.0",
    "--scope",
    "read",
    "--profile",
    "all",
  ]);
  assert.equal(server.timeout, 15_000);
  assert.equal(server.env.OILPRICEAPI_KEY, "${OILPRICEAPI_KEY:-}");
  assert.match(server.description, /source timestamps/i);
  assert.match(server.description, /entitlement/i);
  assert.doesNotMatch(JSON.stringify(server), /@latest/);
});

test("API key is optional, declared, and sensitive", () => {
  assert.deepEqual(manifest.settings, [
    {
      name: "OilPriceAPI API Key",
      description:
        "Optional. Add a key for account-enabled datasets, or leave blank for product facts and the bounded keyless demo.",
      envVar: "OILPRICEAPI_KEY",
      sensitive: true,
    },
  ]);
  assert.doesNotMatch(JSON.stringify(manifest), /opa_(?:live|test)_[A-Za-z0-9]+/);
});

test("context grounds mutable claims and names current tools", () => {
  for (const required of [
    "mcp_oilpriceapi_opa_get_product_facts",
    "mcp_oilpriceapi_opa_get_price",
    "mcp_oilpriceapi_opa_market_overview",
    "mcp_oilpriceapi_opa_compare_prices",
    "mcp_oilpriceapi_opa_list_commodities",
    "mcp_oilpriceapi_opa_get_history",
    "HTTP 401",
    "HTTP 402 or 403",
    "HTTP 429",
    "malformed response",
    "does not update Gemini model weights",
  ]) {
    assert.ok(context.includes(required), `missing context contract: ${required}`);
  }
  assert.match(context, /latest available/i);
  assert.match(context, /source timestamp/i);
  assert.match(context, /data rights/i);
  assert.match(context, /account entitlement/i);
});

test("public copy links reviewed sources and avoids unsupported claims", () => {
  for (const url of [
    "https://api.oilpriceapi.com/product-facts.json",
    "https://docs.oilpriceapi.com",
    "https://www.oilpriceapi.com/pricing",
    "https://www.oilpriceapi.com/legal/data-usage",
  ]) {
    assert.ok(readme.includes(url), `missing public source: ${url}`);
  }
  const publicCopy = `${manifest.description}\n${readme}`;
  assert.doesNotMatch(
    publicCopy,
    /507\+|unlimited redistribution|guaranteed SLA|every \d+ minutes|all commodity prices/i,
  );
  assert.match(readme, /does not change Gemini model weights/i);
  assert.match(readme, /Gemini CLI controls its own telemetry settings/i);
});
