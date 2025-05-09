import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SearchPromptsArgsSchema = z.object({
  keyword: z
    .string()
    .describe(
      "The keyword to search for in the dwarvesf/prompt-db repository (excluding the synced_prompts/ folder).",
    ),
});

export type SearchPromptsArgs = z.infer<typeof SearchPromptsArgsSchema>;

export const searchPromptsTool: ToolDefinition = {
  name: "search_prompts",
  description:
    "Fuzzy search for keywords in the dwarvesf/prompt-db GitHub repository (excluding the synced_prompts/ folder).",
  inputSchema: zodToJsonSchema(SearchPromptsArgsSchema),
  annotations: {
    title: "Search Prompts",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
