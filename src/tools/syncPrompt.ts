import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SyncPromptArgsSchema = z.object({
  projectName: z
    .string()
    .describe("The name of the project the prompt belongs to."),
  promptName: z
    .string()
    .describe("The variable or logical name of the prompt within the project."),
  promptContent: z
    .string()
    .describe("The actual content of the LLM prompt."),
});

export type SyncPromptArgs = z.infer<typeof SyncPromptArgsSchema>;

export const syncPromptTool: ToolDefinition = {
  name: "sync_prompt",
  description:
    "Syncs an LLM prompt to the dwarvesf/prompt-db GitHub repository.",
  inputSchema: zodToJsonSchema(SyncPromptArgsSchema),
  annotations: {
    title: "Sync Prompt to Prompt DB",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
