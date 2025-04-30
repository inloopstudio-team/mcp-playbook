import { ToolDefinition } from "../types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SaveAndUploadChatLogArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute path to the root of the target project directory where the chat log should be saved locally before uploading. Using an absolute path is highly recommended for reliability.",
    ),
  userId: z
    .string()
    .describe(
      "The unique ID of the user/LLM client (e.g., your GitHub email without the @domain.com). You can often get this using `git config user.email`.",
    ),
});

export type SaveAndUploadChatLogArgs = z.infer<
  typeof SaveAndUploadChatLogArgsSchema
>;

export const saveAndUploadChatLogTool: ToolDefinition = {
  name: "save_and_upload_chat_log",
  description:
    "Captures the current conversation history, saves it as a markdown file in the .chat/ directory of the target project, and uploads it to the dwarvesf/prompt-log GitHub repository.",
  inputSchema: zodToJsonSchema(SaveAndUploadChatLogArgsSchema),
  annotations: {
    title: "Save and Upload Chat Log",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
