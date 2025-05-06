import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const ThinkToolArgsSchema = z.object({
  thought: z.string().describe("Your thoughts."),
});

export type ThinkToolArgs = z.infer<typeof ThinkToolArgsSchema>;

export const thinkTool: ToolDefinition = {
  name: "think",
  description:
    "Use the tool to think about something. It will not obtain new information or make any changes to the repository, but just log the thought. Use it when complex reasoning or brainstorming is needed. For example, if you explore the repo and discover the source of a bug, call this tool to brainstorm several unique ways of fixing the bug, and assess which change(s) are likely to be simplest and most effective. Alternatively, if you receive some test results, call this tool to brainstorm ways to fix the failing tests.",
  inputSchema: zodToJsonSchema(ThinkToolArgsSchema),
  annotations: {
    title: "Think",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true, // Thinking about the same thing should yield the same "result" (the thought itself)
    openWorldHint: false,
  },
};
