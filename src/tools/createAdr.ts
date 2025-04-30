import { ToolDefinition } from "../types.js";

export const createAdrTool: ToolDefinition = {
  name: "create_adr",
  description:
    "Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project. ADR files will be named following an `adr-name.md` convention.",
  inputSchema: {
    type: "object",
    properties: {
      target_project_dir: {
        type: "string",
        description:
          "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
      },
      adr_name: {
        type: "string",
        description:
          "The name of the ADR file (without sequence numbers and the .md extension).",
      },
      content: {
        type: "string",
        description: "The markdown content of the ADR.",
      },
    },
    required: ["target_project_dir", "adr_name", "content"],
  },
  annotations: {
    title: "Create ADR",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
