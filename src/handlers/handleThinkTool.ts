import {
  ThinkToolArgs,
  ThinkToolArgsSchema,
} from "../tools/thinkTool.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleThinkTool(
  args: Record<string, unknown>,
): Promise<string> {
  console.error("Handling think tool with args:", args);
  try {
    const validatedArgs = validateArgs(ThinkToolArgsSchema, args);
    const thought = validatedArgs.thought;

    // The tool doesn't change state, just logs the thought for the LLM's internal process.
    // We return the thought itself as the result for confirmation.
    return thought;
  } catch (error) {
    console.error("Error in handleThinkTool:", error);
    // Re-throw the error to be caught by the main error handler in index.ts
    // Or handle it specifically if needed (e.g., return a specific error structure for MCP)
    if (error instanceof Error) {
      throw new Error(`Think tool argument validation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during think tool argument validation.");
  }
}
