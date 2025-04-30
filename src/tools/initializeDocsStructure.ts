import { ToolDefinition } from "../types.js";

export const initializeDocsStructureTool: ToolDefinition = {
  name: "initialize_docs_structure",
  description:
    "Initializes the standard documentation folder structure (docs/, docs/specs/, docs/adr/, docs/changelog/, and .chat/) within the specified target project directory.",
  inputSchema: {
    type: "object",
    properties: {
      target_project_dir: {
        type: "string",
        description:
          "The absolute or relative path to the root of the target project directory where the documentation structure should be created.",
      },
    },
    required: ["target_project_dir"],
  },
  annotations: {
    title: "Initialize Docs Structure",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};
