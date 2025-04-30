import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CreateSpecArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute or relative path to the root of the target project directory.",
    ),
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
