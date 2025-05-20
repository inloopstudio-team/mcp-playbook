import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const CreateSpecArgsSchema = z.object({

  spec_name: z
    .string()
    .describe(
      "The name of the specification file (without sequence numbers and the .md extension).",
    ),
  content: z
    .string()
    .describe(
      "The markdown content of the specification. For small feature changes, provide a simple markdown outline is sufficient. For larger or more complex changes, format the content as a formal PRD or RFC.",
    ),
  branch_name: z
    .string()
    .optional()
    .describe(
      "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'docs/add-spec-name').",
    ),
  commit_message: z
    .string()
    .optional()
    .describe("The commit message for the file change."),
  pr_title: z
    .string()
    .optional()
    .describe(
      "The title for a new Pull Request. Follow commitlint standards (e.g., 'docs: add spec name').",
    ),
  pr_body: z
    .string()
    .optional()
    .describe(
      "The body content for a new Pull Request. Provide a comprehensive and detailed description.",
    ),
});

export type CreateSpecArgs = z.infer<typeof CreateSpecArgsSchema>;

export const createSpecTool: ToolDefinition = {
  name: "create_spec",
  description:
    "Creates or overwrites a new specification file (e.g., PRD, RFC, architectural planning) in the docs/specs/ directory of the target project. Specification files will be named following a `spec-name.md` convention. For small feature changes, a simple markdown outline is sufficient. For larger or more complex changes, format the content as a formal PRD or RFC.",
  inputSchema: zodToJsonSchema(CreateSpecArgsSchema),
  annotations: {
    title: "Create Spec",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
