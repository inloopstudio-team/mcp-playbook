import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const InitializeDocsStructureArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute or relative path to the root of the target project directory where the documentation structure should be created.",
    ),
});

export type InitializeDocsStructureArgs = z.infer<
  typeof InitializeDocsStructureArgsSchema
>;

export const initializeDocsStructureTool: ToolDefinition = {
  name: "initialize_docs_structure",
  description:
    "Initializes the standard documentation folder structure (docs/, docs/specs/, docs/adr/, docs/changelog/, and .chat/) within the specified target project directory.",
  inputSchema: zodToJsonSchema(InitializeDocsStructureArgsSchema),
  annotations: {
    title: "Initialize Docs Structure",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};
