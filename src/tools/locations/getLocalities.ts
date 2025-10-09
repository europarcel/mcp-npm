import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { z } from "zod";

export function registerGetLocalitiesTool(server: McpServer): void {
  // Create API client instance
  const apiKey = process.env.EUROPARCEL_API_KEY!;
  const client = new EuroparcelApiClient(apiKey);

  // Register getLocalities tool
  server.registerTool(
    "getLocalities",
    {
      title: "Get Localities",
      description:
        "Retrieves localities for a specific country and county. Requires country_code and county_code parameters.",
      inputSchema: {
        country_code: z
          .enum(["RO"])
          .describe("The country code - must be 'RO' (Romania)"),
        county_code: z
          .string()
          .min(1)
          .max(100)
          .describe(
            "County code (1-2 characters, e.g., 'B', 'CJ') or county name (3+ characters, e.g., 'Bucuresti', 'Cluj')",
          ),
      },
    },
    async (args: any) => {
      try {
        if (!args.country_code || !args.county_code) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Both country_code and county_code parameters are required",
              },
            ],
          };
        }

        logger.info("Fetching localities", {
          country_code: args.country_code,
          county_code: args.county_code,
        });

        const localities = await client.getLocalities(
          args.country_code,
          args.county_code,
        );

        logger.info(`Retrieved ${localities.length} localities`);

        let formattedResponse = `Found ${localities.length} localities in ${args.county_code}, ${args.country_code}:\n\n`;

        localities.forEach((locality) => {
          formattedResponse += `${locality.name} - ID: ${locality.id}\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to fetch localities", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching localities: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getLocalities tool registered successfully");
}
