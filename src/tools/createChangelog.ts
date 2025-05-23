import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const CreateChangelogArgsSchema = z.object({
  entry_content: z
    .string()
    .describe("The markdown content of the new changelog entry."),
  changelog_name: z
    .string()
    .describe(
      "The desired name for the changelog file (without sequence numbers and the .md extension).",
    ),
  branch_name: z
    .string()
    .optional()
    .describe(
      "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'docs/add-changelog-entry').",
    ),
  commit_message: z
    .string()
    .optional()
    .describe("The commit message for the file change."),
  pr_title: z
    .string()
    .optional()
    .describe(
      "The title for a new Pull Request. Follow commitlint standards (e.g., 'docs: add changelog entry').",
    ),
  pr_body: z
    .string()
    .optional()
    .describe(
      "The body content for a new Pull Request. Provide a comprehensive and detailed description.",
    ),
});

export type CreateChangelogArgs = z.infer<typeof CreateChangelogArgsSchema>;

export const createChangelogTool: ToolDefinition = {
  name: "create_changelog",
  description:
    "Creates a new, detailed, and user-facing changelog entry file in the docs/changelog/ directory of the target project. Each changelog entry will be a separate file named following a `changelog-entry.md` convention. Entries should provide comprehensive information about changes, including how to use new features or any impact on existing functionality, rather than being brief summaries.",
  inputSchema: zodToJsonSchema(CreateChangelogArgsSchema),
  annotations: {
    title: "Create Changelog",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
