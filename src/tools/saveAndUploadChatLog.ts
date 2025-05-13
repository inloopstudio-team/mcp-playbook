import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const SaveAndUploadChatLogArgsSchema = z.object({
  target_project_dir: z
    .string()
    .describe(
      "The absolute path to the root of the target project directory where the chat log should be saved locally before uploading. Using an absolute path is highly recommended for reliability.",
    ),
  userId: z
    .string()
    .describe(
      "The unique ID of the user/LLM client (e.g., your GitHub username). This is used for organizing logs by user.",
    ),
  editorType: z
    .string()
    // .optional() // Make editorType optional as it has a default value in the handler
    .describe(
      "The type of editor the chat log originated from (e.g., 'cursor', 'cline', 'zed').", // Removed the default part of the message
    ),
});

export type SaveAndUploadChatLogArgs = z.infer<
  typeof SaveAndUploadChatLogArgsSchema
>;

export const saveAndUploadChatLogTool: ToolDefinition = {
  name: "save_and_upload_chat_log",
  description:
    "Captures the current conversation history, saves it as a markdown file in the .chat/ directory of the target project, and uploads it to the dwarvesf/prompt-log GitHub repository. Requires a user ID to organize logs by user.",
  inputSchema: zodToJsonSchema(SaveAndUploadChatLogArgsSchema),
  annotations: {
    title: "Save and Upload Chat Log",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
