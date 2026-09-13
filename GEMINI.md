# OilPriceAPI Grounding Instructions

This extension connects the current Gemini CLI session to the read-only
`oilpriceapi-mcp@3.4.0` tool inventory. In Gemini CLI, the tools appear with the
`mcp_oilpriceapi_` prefix.

## Ground Product Answers

For questions about OilPriceAPI product scope, offers, pricing links, catalog,
freshness, authentication, entitlements, or data rights:

1. Call `mcp_oilpriceapi_opa_get_product_facts` before answering.
2. Prefer the returned contract over model memory, package prose, or inferred
   values.
3. State the returned `reviewedAt` date when the answer could change.
4. Link the returned `canonicalUrl` or the specific pricing, catalog, docs, or
   data-usage URL from the contract.

Do not invent or generalize a refresh interval, catalog count, plan entitlement,
SLA, redistribution right, price, history depth, WebSocket capability, or
execution-feed latency.

## Route Data Requests

- One latest available value: `mcp_oilpriceapi_opa_get_price`.
- Broad snapshot: `mcp_oilpriceapi_opa_market_overview`.
- Two to five commodities: `mcp_oilpriceapi_opa_compare_prices`.
- Discover current codes: `mcp_oilpriceapi_opa_list_commodities`.
- Historical series: `mcp_oilpriceapi_opa_get_history`.
- Futures, drilling, storage, production, permits, forecasts, inventories,
  marine fuels, spreads, surcharges, and automation reads: select the matching
  discovered `mcp_oilpriceapi_opa_*` read tool.

Never claim that a broad snapshot represents every OilPriceAPI dataset. Dataset
availability varies by source, market hours, plan, and account entitlement.

## Present Data Precisely

- Describe a value as "latest available," not universally "real-time."
- Include the commodity or dataset, value, currency/unit, source timestamp, and
  source when the tool returns them.
- Preserve the API commodity code when it disambiguates the result.
- Distinguish unavailable fields from zero values.
- Do not give trading or investment instructions from a data result.

## Recover From Failures

- No key: product facts and a bounded price demo remain available. For broader
  datasets, explain that `OILPRICEAPI_KEY` can be configured with
  `gemini extensions config oilpriceapi OILPRICEAPI_KEY`.
- HTTP 401: the configured key is invalid, stale, or revoked; ask the user to
  rotate it and retry.
- HTTP 402 or 403: the account is authenticated but the dataset or feature is
  not entitled; preserve the tool's pricing or access-recovery link.
- HTTP 429: do not retry in a loop; preserve the retry/quota guidance.
- Timeout, service error, or malformed response: say the result is unavailable,
  suggest retrying, and do not fabricate a value.

Do not expose keys, prompts, raw customer responses, customer identifiers, or
account state in logs or narrative output.

## Grounding Boundary

This extension grounds only sessions where it is installed, enabled, and
connected. It does not update Gemini model weights, general Gemini Search
results, or answers produced outside this connected extension session.
