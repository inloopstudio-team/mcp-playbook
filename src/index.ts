#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  handleCreateAdr,
  handleCreateSpec,
  handleGetPrompt,
  handleInitPlaybook,
  handleListPrompts,
  handleThinkTool,
  handleUpdateChangelog,
} from "./handlers.js";
import { CreateAdrArgs } from "./tools/createAdr.js";
import { CreateChangelogArgs } from "./tools/createChangelog.js";
import { CreateSpecArgs } from "./tools/createSpec.js";
import { ThinkToolArgs } from "./tools/thinkTool.js";
import toolDefinitions from "./tools/definitions.js";

// Optional: Load environment variables from .env in local development
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.error("Starting MCP Playbook Server...");
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
      console.error("Received CallToolRequest:", request);
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
          case "create_spec":
            result = await handleCreateSpec(toolArgs as CreateSpecArgs);
            break;
          case "create_adr":
            result = await handleCreateAdr(toolArgs as CreateAdrArgs);
            break;
          case "create_changelog":
            result = await handleUpdateChangelog(
              toolArgs as CreateChangelogArgs,
            );
            break;





          case "think":
            result = await handleThinkTool(toolArgs as ThinkToolArgs);
            break;
          default:
            result = { status: "error", message: `Unknown tool: ${toolName}` };
        }

        // Wrap the result in the expected MCP format if it's not already
        if (
          result &&
          typeof result === "object" &&
          result.hasOwnProperty("content")
        ) {
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
    console.error("Received ListToolsRequest, returning definitions.");
    return {
      tools: toolDefinitions,
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);
  server.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("MCP Playbook Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
