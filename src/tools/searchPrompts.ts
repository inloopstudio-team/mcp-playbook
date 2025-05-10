import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SearchPromptsArgsSchema = z.object({
  keyword: z
    .string()
    .describe(
      "The keyword (maximum 3 words) to search for in the prompt-db repository.",
    )
    .refine(
      (keyword) => keyword.split(" ").length <= 3,
      "Keyword must be a maximum of 3 words.",
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
