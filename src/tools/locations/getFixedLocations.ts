import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { z } from "zod";

export function registerGetFixedLocationsTool(server: McpServer): void {
  // Create API client instance
  const apiKey = process.env.EUROPARCEL_API_KEY!;
  const client = new EuroparcelApiClient(apiKey);
  
  // Register getFixedLocations tool
  server.registerTool(
    "getFixedLocations",
    {
      title: "Get Fixed Locations",
      description: "Retrieves fixed locations (lockers) for a country. Requires country_code. Optional: locality_id, carrier_id",
      inputSchema: {
        country_code: z.string().describe("The country code (e.g., 'RO' for Romania)"),
        locality_id: z.union([z.string(), z.number()]).optional().describe("Optional locality ID to filter by"),
        carrier_id: z.union([z.string(), z.number()]).optional().describe("Optional carrier ID to filter by")
      }
    },
    async (args: any) => {
      try {
        if (!args.country_code) {
          return {
            content: [
              {
                type: "text",
                text: "Error: country_code parameter is required"
              }
            ]
          };
        }
        
        logger.info("Fetching fixed locations", args);
        
        const locations = await client.getFixedLocations(args.country_code, {
          locality_id: args.locality_id,
          carrier_id: args.carrier_id
        });
        
        logger.info(`Retrieved ${locations.length} fixed locations`);
        
        let formattedResponse = `Found ${locations.length} fixed locations in ${args.country_code}`;
        
        if (args.locality_id || args.carrier_id) {
          formattedResponse += " (filtered)";
        }
        formattedResponse += ":\n\n";
        
        locations.forEach(location => {
          formattedResponse += `${location.name} (ID: ${location.id})\n`;
          formattedResponse += `  Type: ${location.fixed_location_type}\n`;
          formattedResponse += `  Carrier: ${location.carrier_name}\n`;
          formattedResponse += `  Address: ${location.address}\n`;
          formattedResponse += `  Location: ${location.locality_name}, ${location.county_name}\n`;
          formattedResponse += `  Drop-off: ${location.allows_drop_off ? 'Yes' : 'No'}\n`;
          formattedResponse += `  Coordinates: ${location.coordinates.lat}, ${location.coordinates.long}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error: any) {
        logger.error("Failed to fetch fixed locations", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching fixed locations: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getFixedLocations tool registered successfully");
} 