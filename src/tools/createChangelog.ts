import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CreateChangelogArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
    ),
  entry_content: z
    .string()
    .describe("The markdown content of the new changelog entry."),
  changelog_name: z
    .string()
    .describe(
      "The desired name for the changelog file (without sequence numbers and the .md extension).",
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
