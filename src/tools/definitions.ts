import { ToolDefinition } from "../types.js";
import { createAdrTool } from "./createAdr.js";
import { createChangelogTool } from "./createChangelog.js";
import { createSpecTool } from "./createSpec.js";
import { initPlaybookTool } from "./initPlaybook.js";

import { thinkTool } from "./thinkTool.js";

// Array holding all the tool definitions for the mcp-playbook server
export const toolDefinitions: ToolDefinition[] = [
  initPlaybookTool,
  createSpecTool,
  createAdrTool,
  createChangelogTool,

  thinkTool,
];

export default toolDefinitions;
