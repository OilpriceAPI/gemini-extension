# OilPriceAPI Extension

You have access to real-time oil, gas, and commodity price data through the OilPriceAPI extension.

## Available Tools

### get_commodity_price
Get the current price of a specific commodity. Supports natural language queries.

**Examples:**
- "What's the Brent oil price?"
- "Get natural gas price"
- "How much is WTI crude?"

### get_market_overview
Get all commodity prices at once. Can filter by category: oil, gas, coal, refined.

**Examples:**
- "Give me a market overview"
- "Show all oil prices"
- "What are current gas prices?"

### compare_prices
Compare prices between 2-5 commodities.

**Examples:**
- "Compare Brent and WTI"
- "What's the spread between US and European gas?"

### list_commodities
List all available commodities and their codes.

## Commodity Mapping

You can use natural language - the extension will translate:

| Say this | Gets this |
|----------|-----------|
| "brent oil", "brent crude" | BRENT_CRUDE_USD |
| "wti", "us oil" | WTI_USD |
| "natural gas", "henry hub" | NATURAL_GAS_USD |
| "european gas", "ttf" | DUTCH_TTF_EUR |
| "diesel" | DIESEL_USD |
| "gold" | GOLD_USD |

## Response Format

When presenting prices:
- Include the commodity name
- Show currency symbol ($, €, £)
- Include 24h change when available
- Mention the timestamp
- Cite "OilPriceAPI" as the source
