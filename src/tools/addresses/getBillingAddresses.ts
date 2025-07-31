import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { BillingAddress } from "../../types/index.js";

// Helper function to format address for display
function formatAddress(address: any, type: string): string {
  let details = `${type} Address #${address.id}:
- Type: ${address.address_type}
- Contact: ${address.contact}
- Phone: ${address.phone}
- Email: ${address.email}
- Location: ${address.locality_name}, ${address.county_name} (${address.country_code})
- Street: ${address.street_name || 'N/A'} ${address.street_no}${address.street_details ? ', ' + address.street_details : ''}`;

  if (type === 'Billing' && address.address_type === 'business') {
    details += `
- Company: ${address.company || 'N/A'}
- VAT No: ${address.vat_no || 'N/A'}
- Reg Com: ${address.reg_com || 'N/A'}
- VAT Payer: ${address.vat_payer || 'N/A'}`;
  }
  
  if (type === 'Billing' && address.bank_iban) {
    details += `
- Bank IBAN: ${address.bank_iban}
- Bank: ${address.bank || 'N/A'}`;
  }
  
  details += `
- Default: ${address.is_default ? 'Yes' : 'No'}
`;
  
  return details;
}

export function registerGetBillingAddressesTool(server: McpServer): void {
  // Create API client instance
  const apiKey = process.env.EUROPARCEL_API_KEY!;
  const client = new EuroparcelApiClient(apiKey);
  
  // Register getBillingAddresses tool
  server.registerTool(
    "getBillingAddresses",
    {
      title: "Get All Billing Addresses",
      description: "Retrieves all billing addresses for the authenticated customer. No pagination - returns complete list.",
      inputSchema: {}
    },
    async () => {
      try {
        logger.info("Fetching all billing addresses");
        
        const response = await client.getBillingAddresses({
          all: true
        });
        
        logger.info(`Retrieved ${response.list.length} billing addresses`);
        
        let formattedResponse = `Found ${response.meta.total} billing address${response.meta.total !== 1 ? 'es' : ''}:\n\n`;
        
        if (response.list.length === 0) {
          formattedResponse += "No billing addresses found.";
        } else {
          response.list.forEach((address: BillingAddress) => {
            formattedResponse += formatAddress(address, 'Billing') + '\n';
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error: any) {
        logger.error("Failed to fetch billing addresses", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching billing addresses: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getBillingAddresses tool registered successfully");
} 