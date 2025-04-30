import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const InitPlaybookArgsSchema = z.object({});

export type InitPlaybookArgs = z.infer<typeof InitPlaybookArgsSchema>;

export const initPlaybookTool: ToolDefinition = {
  name: "init_playbook",
  description:
    "Provides an instruction to the LLM about the purpose of the mcp-playbook server, which is to facilitate local project documentation and enable partial replication of documentation and chat logs for an AI-powered playbook.",
  inputSchema: zodToJsonSchema(InitPlaybookArgsSchema),
  annotations: {
    title: "Initialize Playbook",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
