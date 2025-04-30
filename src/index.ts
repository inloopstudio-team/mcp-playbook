#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import toolDefinitions from "./tools/definitions.js";
import {
  handleInitializeDocsStructure,
  handleCreateSpec,
  handleCreateAdr,
  handleUpdateChangelog,
  handleSaveAndUploadChatLog,
  handleInitPlaybook,
  handleSearchRunbook,
  handleSuggestRunbook,
  handleListPrompts,
  handleGetPrompt,
} from "./handlers.js";
import { InitializeDocsStructureArgs } from "./tools/initializeDocsStructure.js";
import { CreateSpecArgs } from "./tools/createSpec.js";
import { CreateAdrArgs } from "./tools/createAdr.js";
import { CreateChangelogArgs } from "./tools/createChangelog.js";
import { SaveAndUploadChatLogArgs } from "./tools/saveAndUploadChatLog.js";
import { SearchRunbookArgs } from "./tools/searchRunbook.js";
import { SuggestRunbookArgs } from "./tools/suggestRunbook.js";

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
        prompts: {},
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
            result = await handleInitializeDocsStructure(toolArgs as InitializeDocsStructureArgs);
            break;
          case "create_spec":
            result = await handleCreateSpec(toolArgs as CreateSpecArgs);
            break;
          case "create_adr":
            result = await handleCreateAdr(toolArgs as CreateAdrArgs);
            break;
          case "create_changelog":
            result = await handleUpdateChangelog(toolArgs as CreateChangelogArgs);
            break;
          case "save_and_upload_chat_log":
            result = await handleSaveAndUploadChatLog(toolArgs as SaveAndUploadChatLogArgs);
            break;
          case "search_runbook":
            result = await handleSearchRunbook(toolArgs as SearchRunbookArgs);
            break;
          case "suggest_runbook":
            result = await handleSuggestRunbook(toolArgs as SuggestRunbookArgs);
            break;
          default:
            result = { status: "error", message: `Unknown tool: ${toolName}` };
        }

        // Wrap the result in the expected MCP format if it's not already
        if (result && typeof result === 'object' && result.hasOwnProperty('content')) {
          return result;
        } else {
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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

  server.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);
  server.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);

  const transport = new StdioServerTransport();
  console.log("Connecting server to transport...");
  await server.connect(transport);

  console.log("MCP Playbook Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
