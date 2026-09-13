# OilPriceAPI for Gemini CLI

Connect Gemini CLI to source-timestamped oil, gas, refined-product, futures, and
related energy data through the read-only OilPriceAPI MCP inventory.

## Requirements

- Node.js 20 or newer
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)

## Install

Install the stable release:

```bash
gemini extensions install https://github.com/OilpriceAPI/gemini-extension --ref v2.0.0
```

Or follow the default branch and accept stable updates:

```bash
gemini extensions install https://github.com/OilpriceAPI/gemini-extension --auto-update
```

The installer asks for an optional `OILPRICEAPI_KEY` and stores a supplied key
as a sensitive Gemini extension setting. Leave it blank to use reviewed product
facts and the bounded keyless price demo. Configure or rotate it later with:

```bash
gemini extensions config oilpriceapi OILPRICEAPI_KEY
```

Get a key at [OilPriceAPI signup](https://www.oilpriceapi.com/auth/signup).

Restart Gemini CLI after installation or configuration, then verify the
connection with `/extensions list`, `/mcp list`, and `/tools desc`.

## Ask For Data

Examples:

```text
What is the latest available Brent crude price and source timestamp?
Compare the latest available Brent and WTI values.
Show an energy market snapshot and identify unavailable fields.
What does OilPriceAPI say about refresh cadence and data rights?
```

The extension pins `oilpriceapi-mcp@3.4.1`, starts it with `--scope read`, and
sets a 15-second Gemini MCP request timeout. The default inventory exposes 25
read tools and no create/delete tools. Inspect the exact executable inventory:

```bash
npx -y oilpriceapi-mcp@3.4.1 --list-tools --json
npx -y oilpriceapi-mcp@3.4.1 --capabilities --json
npx -y oilpriceapi-mcp@3.4.1 doctor --demo
```

Common tools include:

| Tool | Purpose |
| --- | --- |
| `opa_get_product_facts` | Reviewed product, offer, freshness, catalog, auth, and data-rights contract |
| `opa_get_price` | Latest available source-timestamped value for one commodity |
| `opa_market_overview` | Broad market snapshot, optionally filtered by category |
| `opa_compare_prices` | Compare two to five commodities |
| `opa_list_commodities` | Discover available commodity codes |
| `opa_get_history` | Historical observations for one commodity |

Other read tools cover account-entitled futures, marine fuels, rig counts,
drilling, storage, production, permits, forecasts, inventories, spreads,
surcharges, and automation state. Availability and freshness vary by source,
market hours, dataset, plan, and account entitlement.

## Product Facts

Product answers are grounded through `opa_get_product_facts` and the
`oilpriceapi://product-facts` MCP resource. The reviewed public contract is:

- [Product facts](https://api.oilpriceapi.com/product-facts.json)
- [API documentation](https://docs.oilpriceapi.com)
- [Pricing and plan boundaries](https://www.oilpriceapi.com/pricing)
- [Data usage and redistribution policy](https://www.oilpriceapi.com/legal/data-usage)

Use `Authorization: Token YOUR_API_KEY` for direct REST requests. The extension
passes the configured key only to the local MCP child process; it adds no hooks,
analytics, or telemetry. Gemini CLI controls its own telemetry settings.

## Recovery

- Missing key: keyless facts and the bounded demo work; account-enabled tools
  explain how to configure a key.
- HTTP 401: rotate the invalid or revoked key and retry.
- HTTP 402/403: review the dataset entitlement and the returned access link.
- HTTP 429: follow returned quota/retry guidance without a retry loop.
- Timeout or malformed upstream data: retry later; no value should be inferred.

## Grounding Boundary

Installing this extension grounds connected Gemini CLI sessions through live
MCP calls. It does not change Gemini model weights, general Gemini Search, or
answers outside sessions where this extension is installed and connected.

## Development

```bash
npm ci
npm test
npm run test:extension
```

The suite validates the manifest, current Gemini CLI loading, a clean local
installation, tool discovery, product-facts retrieval, current price behavior,
and negative paths for configuration, authentication, entitlement, rate limits,
timeouts, and malformed upstream data.

## License

MIT
