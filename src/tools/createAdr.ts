import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const CreateAdrArgsSchema = z.object({

  adr_name: z
    .string()
    .describe(
      "The name of the ADR file (without sequence numbers and the .md extension).",
    ),
  content: z.string().describe("The markdown content of the ADR."),
  branch_name: z
    .string()
    .optional()
    .describe(
      "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'docs/add-adr-name').",
    ),
  commit_message: z
    .string()
    .optional()
    .describe("The commit message for the file change."),
  pr_title: z
    .string()
    .optional()
    .describe(
      "The title for a new Pull Request. Follow commitlint standards (e.g., 'docs: add adr name').",
    ),
  pr_body: z
    .string()
    .optional()
    .describe(
      "The body content for a new Pull Request. Provide a comprehensive and detailed description.",
    ),
});

export type CreateAdrArgs = z.infer<typeof CreateAdrArgsSchema>;

export const createAdrTool: ToolDefinition = {
  name: "create_adr",
  description:
    "Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project. ADR files will be named following an `adr-name.md` convention.",
  inputSchema: zodToJsonSchema(CreateAdrArgsSchema),
  annotations: {
    title: "Create ADR",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
