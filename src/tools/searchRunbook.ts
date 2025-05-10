import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SearchRunbookArgsSchema = z.object({
  keyword: z
    .string()
    .describe(
      "The keyword (maximum 3 words) to search for in the runbook repository.",
    )
    .refine(
      (keyword) => keyword.split(" ").length <= 3,
      "Keyword must be a maximum of 3 words.",
    ),
});

export type SearchRunbookArgs = z.infer<typeof SearchRunbookArgsSchema>;

export const searchRunbookTool: ToolDefinition = {
  name: "search_runbook",
  description:
    "Fuzzy search for keywords in the dwarvesf/runbook GitHub repository.",
  inputSchema: zodToJsonSchema(SearchRunbookArgsSchema),
  annotations: {
    title: "Search Runbook",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
