import { ToolDefinition } from "../types.js";

export const searchRunbookTool: ToolDefinition = {
  name: "search_runbook",
  description:
    "Fuzzy search for keywords in the dwarvesf/runbook GitHub repository.",
  inputSchema: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "The keyword to search for in the runbook repository.",
      },
    },
    required: ["keyword"],
  },
  annotations: {
    title: "Search Runbook",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
