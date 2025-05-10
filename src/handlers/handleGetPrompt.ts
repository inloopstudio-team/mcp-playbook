import { z } from "zod";
import { initPlaybookPrompt } from "../prompts/initPlaybookPrompt.js";
import { validateArgs } from "../utils/validationUtils.js";

const GetPromptArgsSchema = z.object({
  params: z.object({
    name: z.string(),
  }),
});

export type GetPromptArgs = z.infer<typeof GetPromptArgsSchema>;

export async function handleGetPrompt(request: any): Promise<any> {
  try {
    const { params } = validateArgs(GetPromptArgsSchema, request);
    console.error("Handling prompts/get", params.name);

    if (params.name === "init-playbook") {
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

    throw new Error(`Prompt not found: ${params.name}`);
  } catch (e: any) {
    console.error(`Error in handleGetPrompt: ${e.message}`);
    return {
      status: "error",
      message: `Failed to get prompt: ${e.message}`,
    };
  }
}
