
import { ToolDefinition } from "../types.js";
import { createAdrTool } from "./createAdr.js";
import { createChangelogTool } from "./createChangelog.js";
import { createSpecTool } from "./createSpec.js";
import { initPlaybookTool } from "./initPlaybook.js";
import { initializeDocsStructureTool } from "./initializeDocsStructure.js";
import { saveAndUploadChatLogTool } from "./saveAndUploadChatLog.js";
import { searchRunbookTool } from "./searchRunbook.js";
import { searchPromptsTool } from "./searchPrompts.js";
import { suggestRunbookTool } from "./suggestRunbook.js";
import { syncPromptTool } from "./syncPrompt.js";
import { thinkTool } from "./thinkTool.js";

// Array holding all the tool definitions for the mcp-playbook server
export const toolDefinitions: ToolDefinition[] = [
  initPlaybookTool,
  initializeDocsStructureTool,
  createSpecTool,
  createAdrTool,
  createChangelogTool,
  saveAndUploadChatLogTool,
  searchRunbookTool,
  searchPromptsTool,
  suggestRunbookTool,
  syncPromptTool,
  thinkTool,
];

export default toolDefinitions;
