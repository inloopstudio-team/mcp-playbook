import { ToolDefinition } from "../types.js";

export const createChangelogTool: ToolDefinition = {
  name: "create_changelog",
  description:
    "Creates a new, detailed, and user-facing changelog entry file in the docs/changelog/ directory of the target project. Each changelog entry will be a separate file named following a `changelog-entry.md` convention. Entries should provide comprehensive information about changes, including how to use new features or any impact on existing functionality, rather than being brief summaries.",
  inputSchema: {
    type: "object",
    properties: {
      target_project_dir: {
        type: "string",
        description:
          "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
      },
      entry_content: {
        type: "string",
        description: "The markdown content of the new changelog entry.",
      },
      changelog_name: {
        type: "string",
        description:
          "The desired name for the changelog file (without sequence numbers and the .md extension).",
      },
    },
    required: ["target_project_dir", "entry_content", "changelog_name"],
  },
  annotations: {
    title: "Create Changelog",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
