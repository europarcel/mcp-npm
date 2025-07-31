#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamable-http.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.EUROPARCEL_API_KEY) {
  logger.error("EUROPARCEL_API_KEY environment variable is required");
  console.error("Error: EUROPARCEL_API_KEY environment variable is required");
  console.error("Please set it using: export EUROPARCEL_API_KEY=your-api-key");
  process.exit(1);
}

async function main() {
  try {
    // Create the MCP server
    const server = createServer();
    
    // Determine transport type
    const transportType = process.env.MCP_TRANSPORT || "stdio";
    
    if (transportType === "stdio") {
      // Use stdio transport (default for CLI usage)
      logger.info("Starting Europarcel MCP server with stdio transport");
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logger.info("Europarcel MCP server connected via stdio");
    } else if (transportType === "http") {
      // Use HTTP transport (for web-based clients)
      const port = parseInt(process.env.MCP_PORT || "3000", 10);
      logger.info(`Starting Europarcel MCP server with HTTP transport on port ${port}`);
      
      // HTTP transport implementation would go here
      // This is a placeholder for future HTTP support
      throw new Error("HTTP transport not yet implemented");
    } else {
      throw new Error(`Unknown transport type: ${transportType}`);
    }
    
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down Europarcel MCP server...");
      process.exit(0);
    });
    
    process.on("SIGTERM", async () => {
      logger.info("Shutting down Europarcel MCP server...");
      process.exit(0);
    });
    
  } catch (error) {
    logger.error("Failed to start Europarcel MCP server", error);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error("Unhandled error", error);
  console.error("Unhandled error:", error);
  process.exit(1);
}); 