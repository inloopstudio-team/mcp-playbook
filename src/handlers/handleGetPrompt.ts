// src/handlers/handleGetPrompt.ts

import { GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { initPlaybookPrompt } from "../prompts/initPlaybookPrompt.js";

export async function handleGetPrompt(request: any): Promise<any> {
  console.log("Handling prompts/get", request.params.name);

  if (request.params.name === "init-playbook") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: initPlaybookPrompt,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${request.params.name}`);
}
