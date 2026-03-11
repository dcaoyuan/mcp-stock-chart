#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

// 1. Initialize the MCP Server
const server = new McpServer({
    name: "stock-chart-server",
    version: "1.0.0",
});

// 2. Register the tool
server.registerTool(
    "generate_stock_chart",
    {
        // Description and schemas are now grouped in this configuration object
        description: "Generates technical analysis candlestick charts for specified stocks or cryptocurrencies. Returns a PNG image.",
        inputSchema: {
            ticker: z.string().describe("The stock ticker symbol in Yahoo Finance format (e.g., MSFT, AAPL, BTC-USD, 0900.HK, 000001.SS, 399001.SZ)"),
            timeframe: z.string().default("1D").describe("The timeframe for the chart (e.g., 1D for daily, 1W for weekly)"),
            scheme: z.enum(["light", "dark"]).default("dark").describe("The color scheme of the chart (light or dark)"),
            saveToLocal: z.boolean().default(false).describe("Save the chart to local if true")
        }
    },
    async ({ ticker, timeframe, scheme, saveToLocal }) => {
        try {
            // Fetch chart data from the API
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

            let filePath = "";

            // Handle local saving if requested
            if (saveToLocal) {
                const time = new Date().getTime();
                const fileName = `${ticker}_${timeframe}_chart_${time}.png`;
                filePath = path.join(process.cwd(), fileName);

                const imageBuffer = Buffer.from(responseData.data, 'base64');
                fs.writeFileSync(filePath, imageBuffer);
            }

            // Return the MCP standard format
            return {
                content: [
                    {
                        type: "image",
                        data: responseData.data,
                        mimeType: responseData.mimeType || "image/png",
                    },
                    {
                        type: "text",
                        text: `Successfully generated the chart for ${ticker} (${timeframe}).${saveToLocal ? " Saved to " + filePath + "." : ""}`
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
);

// 3. Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Stock Chart MCP Server running on stdio");
}

main().catch(console.error);