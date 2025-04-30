import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SuggestRunbookArgsSchema = z.object({
  content: z
    .string()
    .describe(
      "The markdown content of the runbook entry. Include frontmatter (--- title: ..., description: ..., date: ..., authors: ..., tags: ... ---) at the beginning for better organization.",
    ),
  target_folder: z
    .enum([
      "technical-patterns",
      "operational-state-reporting",
      "human-escalation-protocols",
      "diagnostic-and-information-gathering",
      "automations",
      "action-policies-and-constraints",
    ])
    .describe("The specific folder within the dwarvesf/runbook repository."),
  filename_slug: z
    .string()
    .optional()
    .describe("A slug to be used for the filename."),
  pr_number: z
    .number()
    .optional()
    .describe("The number of an existing Pull Request to update."),
  branch_name: z
    .string()
    .optional()
    .describe(
      "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'feat/add-runbook-entry-slug').",
    ),
  commit_message: z
    .string()
    .optional()
    .describe("The commit message for the file change."),
  pr_title: z
    .string()
    .optional()
    .describe(
      "The title for a new Pull Request. Follow commitlint standards (e.g., 'feat: add new runbook entry').",
    ),
  pr_body: z
    .string()
    .optional()
    .describe(
      "The body content for a new Pull Request. Provide a comprehensive and detailed description explaining the context and purpose of the runbook entry.",
    ),
});

export type SuggestRunbookArgs = z.infer<typeof SuggestRunbookArgsSchema>;

export const suggestRunbookTool: ToolDefinition = {
  name: "suggest_runbook",
  description:
    "Creates or updates a Pull Request in the dwarvesf/runbook repository with a new runbook entry.",
  inputSchema: zodToJsonSchema(SuggestRunbookArgsSchema),
  annotations: {
    title: "Suggest Runbook",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
