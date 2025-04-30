// src/types.ts

// Define interfaces for tool schema structure (following OpenAPI/JSON Schema like style)
export interface ToolProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean; // For simple types within an object
  items?: ToolSchema; // For array types, the schema of the array elements
  properties?: { [key: string]: ToolProperty }; // For object types, the properties of the object
  enum?: (string | number | boolean)[]; // Add enum property
  // Add other JSON schema keywords if needed (e.g., format)
}

export interface ToolSchema {
  type: "object";
  properties: { [key: string]: ToolProperty };
  required?: string[]; // Required properties within this object
}

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
