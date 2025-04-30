import { ToolDefinition } from "../types.js";

export const createSpecTool: ToolDefinition = {
  name: "create_spec",
  description:
    "Creates or overwrites a new specification file (e.g., PRD, RFC, architectural planning) in the docs/specs/ directory of the target project. Specification files will be named following a `spec-name.md` convention. For small feature changes, a simple markdown outline is sufficient. For larger or more complex changes, format the content as a formal PRD or RFC.",
  inputSchema: {
    type: "object",
    properties: {
      target_project_dir: {
        type: "string",
        description:
          "The absolute or relative path to the root of the target project directory.",
      },
      spec_name: {
        type: "string",
        description:
          "The name of the specification file (without sequence numbers and the .md extension).",
      },
      content: {
        type: "string",
        description: "The markdown content of the specification. For small feature changes, provide a simple markdown outline is sufficient. For larger or more complex changes, format the content as a formal PRD or RFC.",
      },
    },
    required: ["target_project_dir", "spec_name", "content"],
  },
  annotations: {
    title: "Create Spec",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
