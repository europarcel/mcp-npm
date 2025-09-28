import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";

export function registerGetCarriersTool(server: McpServer): void {
  // Create API client instance
  const apiKey = process.env.EUROPARCEL_API_KEY!;
  const client = new EuroparcelApiClient(apiKey);

  // Register getCarriers tool
  server.registerTool(
    "getCarriers",
    {
      title: "Get Carriers",
      description: "Retrieves all available carriers with their status",
      inputSchema: {},
    },
    async () => {
      try {
        logger.info("Fetching carriers");

        const carriers = await client.getCarriers();

        logger.info(`Retrieved ${carriers.length} carriers`);

        let formattedResponse = `Found ${carriers.length} carriers:\n\n`;

        carriers.forEach((carrier) => {
          formattedResponse += `${carrier.name} (ID: ${carrier.id})\n`;
          formattedResponse += `  Status: ${carrier.is_active ? "Active" : "Inactive"}\n\n`;
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
        logger.error("Failed to fetch carriers", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching carriers: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getCarriers tool registered successfully");
}
