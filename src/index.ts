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
      logger.info(
        `Starting Europarcel MCP server with HTTP transport on port ${port}`,
      );

      // Create Express app for HTTP transport
      const express = await import("express");
      const { rateLimit, ipKeyGenerator } = await import("express-rate-limit");
      const app = express.default();

      app.use(express.default.json());

      // Rate limiting: configurable requests per minute and per hour
      const rateLimitPerMinute = parseInt(
        process.env.RATE_LIMIT_PER_MINUTE || "50",
        10,
      );
      const rateLimitPerHour = parseInt(
        process.env.RATE_LIMIT_PER_HOUR || "500",
        10,
      );

      const minuteRateLimit = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: rateLimitPerMinute,
        keyGenerator: (req) => {
          // Single tenant - use IP for rate limiting
          return `minute:${ipKeyGenerator(req.ip || "unknown")}`;
        },
        message: {
          error: "Rate limit exceeded",
          message: `Maximum ${rateLimitPerMinute} requests per minute allowed`,
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.method === "GET",
      });

      const hourRateLimit = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: rateLimitPerHour,
        keyGenerator: (req) => {
          // Single tenant - use IP for rate limiting
          return `hour:${ipKeyGenerator(req.ip || "unknown")}`;
        },
        message: {
          error: "Rate limit exceeded",
          message: `Maximum ${rateLimitPerHour} requests per hour allowed`,
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.method === "GET",
      });

      // Redirect GET requests to configurable URL
      const redirectUrl = process.env.REDIRECT_URL || "https://europarcel.com";
      app.get("/", (_, res) => {
        res.redirect(301, redirectUrl);
      });

      // Single-tenant MCP endpoint - uses API key from environment
      app.post("/", minuteRateLimit, hourRateLimit, async (req, res) => {
        try {
          // Create fresh transport for each request
          const { StreamableHTTPServerTransport } = await import(
            "@modelcontextprotocol/sdk/server/streamableHttp.js"
          );
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Disable session management
          });

          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          logger.error("MCP request error:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      });

      // Start Express server
      app.listen(port);
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
