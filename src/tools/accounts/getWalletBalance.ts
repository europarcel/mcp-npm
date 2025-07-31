import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";

export function registerGetWalletBalanceTool(server: McpServer): void {
  // Create API client instance
  const apiKey = process.env.EUROPARCEL_API_KEY!;
  const client = new EuroparcelApiClient(apiKey);
  
  // Register getWalletBalance tool
  server.registerTool(
    "getWalletBalance",
    {
      title: "Get Wallet Balance",
      description: "Retrieves the customer's current wallet balance and status",
      inputSchema: {}
    },
    async () => {
      try {
        logger.info("Executing getWalletBalance tool");
        
        // Call the API
        const walletData = await client.getWalletBalance();
        
        // Format the response
        const formattedResponse = `
Wallet Information:
- Balance: ${walletData.wallet_balance} ${walletData.wallet_currency}
- Status: ${walletData.is_active ? 'Active' : 'Inactive'}
- Currency: ${walletData.wallet_currency}
`;
        
        logger.info("getWalletBalance tool executed successfully");
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error) {
        logger.error("Error in getWalletBalance tool", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
  
  logger.info("getWalletBalance tool registered successfully");
} 