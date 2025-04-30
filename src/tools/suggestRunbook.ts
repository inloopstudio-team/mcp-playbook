import { ToolDefinition } from "../types.js";

export const suggestRunbookTool: ToolDefinition = {
  name: "suggest_runbook",
  description:
    "Creates or updates a Pull Request in the dwarvesf/runbook repository with a new runbook entry.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The markdown content of the runbook entry. Include frontmatter (--- title: ..., description: ..., date: ..., authors: ..., tags: ... ---) at the beginning for better organization.",
      },
      target_folder: {
        type: "string",
        description: "The specific folder within the dwarvesf/runbook repository.",
        enum: [
          "technical-patterns",
          "operational-state-reporting",
          "human-escalation-protocols",
          "diagnostic-and-information-gathering",
          "automations",
          "action-policies-and-constraints"
        ],
      },
      filename_slug: {
        type: "string",
        description: "A slug to be used for the filename.",
      },
      pr_number: {
        type: "number",
        description: "The number of an existing Pull Request to update.",
      },
      branch_name: {
        type: "string",
        description: "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'feat/add-runbook-entry-slug').",
      },
      commit_message: {
        type: "string",
        description: "The commit message for the file change.",
      },
      pr_title: {
        type: "string",
        description: "The title for a new Pull Request. Follow commitlint standards (e.g., 'feat: add new runbook entry').",
      },
      pr_body: {
        type: "string",
        description: "The body content for a new Pull Request. Provide a comprehensive and detailed description explaining the context and purpose of the runbook entry.",
      },
    },
    required: ["content", "target_folder"],
  },
  annotations: {
    title: "Suggest Runbook",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
