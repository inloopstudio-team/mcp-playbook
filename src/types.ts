// src/types.ts

import { z } from "zod";
import { JsonSchema7Type } from "zod-to-json-schema";

// Define interfaces for tool schema structure (following OpenAPI/JSON Schema like style)
// Making ToolSchema compatible with zodToJsonSchema output
export type ToolSchema = JsonSchema7Type;

// Define the structure for a single tool definition following MCP spec
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolSchema;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}
