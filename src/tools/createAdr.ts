import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CreateAdrArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
    ),
  adr_name: z
    .string()
    .describe(
      "The name of the ADR file (without sequence numbers and the .md extension).",
    ),
  content: z.string().describe("The markdown content of the ADR."),
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
