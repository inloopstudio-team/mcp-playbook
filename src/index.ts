#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import toolDefinitions from "./tools/definitions.js";
import {
  handleInitializeDocsStructure,
  handleCreateSpec,
  handleCreateAdr,
  handleUpdateChangelog,
  handleSaveAndUploadChatLog,
  handleInitPlaybook,
} from "./handlers.js";

// Optional: Load environment variables from .env in local development
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Starting MCP Playbook Server...");
  const server = new Server(
    {
      name: "MCP Playbook Server",
      version: "0.1.0", // Or appropriate version
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.log("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const toolName = request.params.name;
        const toolArgs = request.params.arguments;
        let result: any;

        // Route the tool call to the appropriate handler
        switch (toolName) {
          case "init_playbook":
            result = await handleInitPlaybook();
            break;
          case "initialize_docs_structure":
            result = await handleInitializeDocsStructure(
              toolArgs.target_project_dir as string,
            );
            break;
          case "create_spec":
            result = await handleCreateSpec(
              toolArgs.target_project_dir as string,
              toolArgs.spec_name as string,
              toolArgs.content as string,
            );
            break;
          case "create_adr":
            result = await handleCreateAdr(
              toolArgs.target_project_dir as string,
              toolArgs.adr_name as string,
              toolArgs.content as string,
            );
            break;
          case "create_changelog":
            result = await handleUpdateChangelog(
              toolArgs.target_project_dir as string,
              toolArgs.entry_content as string,
              toolArgs.changelog_name as string,
            );
            break;
          case "save_and_upload_chat_log":
            // TODO: Integrate with actual framework history retrieval
            // For now, the handler uses a placeholder.
            result = await handleSaveAndUploadChatLog(
              toolArgs.target_project_dir as string,
            );
            break;
          default:
            result = { status: "error", message: `Unknown tool: ${toolName}` };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "error",
                message: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.log("Received ListToolsRequest, returning definitions.");
    return {
      tools: toolDefinitions,
    };
  });

  const transport = new StdioServerTransport();
  console.log("Connecting server to transport...");
  await server.connect(transport);

  console.log("MCP Playbook Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
