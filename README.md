# OilPriceAPI Gemini CLI Extension

Real-time oil, gas, and commodity prices for Gemini CLI.

## Installation

```bash
gemini extensions install https://github.com/OilpriceAPI/gemini-extension
```

Or install with auto-update:

```bash
gemini extensions install https://github.com/OilpriceAPI/gemini-extension --auto-update
```

## Setup

Set your API key as an environment variable:

```bash
export OILPRICEAPI_KEY="your-api-key-here"
```

Get an API key at [oilpriceapi.com](https://oilpriceapi.com).

## Usage

Once installed, you can ask Gemini about commodity prices:

```
> What's the current Brent oil price?

> Give me a market overview of all energy prices

> Compare WTI and Brent crude prices

> How has natural gas changed?
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_commodity_price` | Get current price for a commodity |
| `get_market_overview` | Get all prices, optionally filtered by category |
| `compare_prices` | Compare 2-5 commodities |
| `list_commodities` | List all available commodities |

## Supported Commodities

### Crude Oil
- Brent Crude (global benchmark)
- WTI (US benchmark)
- Urals (Russian)
- Dubai (Middle East)

### Natural Gas
- US Henry Hub
- UK NBP
- European TTF

### Refined Products
- Diesel, Gasoline, Jet Fuel, Heating Oil

### Other
- Coal, Gold, Carbon Credits, Forex

## Natural Language Support

Ask naturally - the extension understands:
- "brent oil" → BRENT_CRUDE_USD
- "natural gas" → NATURAL_GAS_USD
- "european gas" → DUTCH_TTF_EUR
- "diesel" → DIESEL_USD

## Links

- [OilPriceAPI](https://oilpriceapi.com)
- [API Documentation](https://docs.oilpriceapi.com)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)

## License

MIT
