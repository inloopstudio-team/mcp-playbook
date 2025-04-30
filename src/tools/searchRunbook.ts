import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SearchRunbookArgsSchema = z.object({
  keyword: z
    .string()
    .describe("The keyword to search for in the runbook repository."),
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
