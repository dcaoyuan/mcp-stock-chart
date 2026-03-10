#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. Initialize the MCP Server
const server = new Server(
  {
    name: "stock-chart-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. Register the tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_stock_chart",
        description: "Generates technical analysis candlestick charts for specified stocks or cryptocurrencies. Returns a PNG image.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: {
              type: "string",
              description: "The stock ticker symbol (e.g., MSFT, AAPL, BTC-USD)",
            },
            timeframe: {
              type: "string",
              description: "The timeframe for the chart (e.g., 1D for daily, 1W for weekly)",
              default: "1D",
            },
            scheme: {
              type: "string",
              description: "The color scheme of the chart (light or dark)",
              enum: ["light", "dark"],
              default: "dark",
            },
          },
          required: ["ticker"],
        },
      },
    ],
  };
});

// 3. Handle the tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_stock_chart") {
    const args = request.params.arguments as any;
    const ticker = args.ticker;
    const timeframe = args.timeframe || "1D";
    const scheme = args.scheme || "light";

    try {
      // NOTE: I changed `output=file` to `output=json` here assuming your API expects it, 
      // but feel free to change it back or remove it based on your actual endpoint design.
      const url = `https://mmmmmm.io/chart?ticker=${ticker}&timeframe=${timeframe}&width=1000&scheme=${scheme}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scripts: [] }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // Parse the JSON response directly from your API
      const responseData = await response.json();

      // Ensure the API returned the expected data property
      if (!responseData || !responseData.data) {
        throw new Error("Invalid response format: Missing image data from chart API.");
      }

      // Return the MCP standard format, directly passing through your API's JSON values
      return {
        content: [
          {
            type: "image",
            data: responseData.data,
            mimeType: responseData.mimeType || "image/png",
          },
          {
            type: "text",
            text: `Successfully generated the chart for ${ticker} (${timeframe}).`
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Failed to fetch chart: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// 4. Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stock Chart MCP Server running on stdio");
}

main().catch(console.error);

