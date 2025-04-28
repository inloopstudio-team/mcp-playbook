// src/tools/definitions.ts

// Define interfaces for tool schema structure (following OpenAPI/JSON Schema like style)
interface ToolProperty {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean; // Optional: indicate if the parameter is mandatory (within properties object)
    items?: ToolProperty; // For array types
    properties?: { [key: string]: ToolProperty }; // For object types
    // Add other JSON schema keywords if needed (e.g., enum, format)
}

interface ToolSchema {
    type: 'object';
    properties: { [key: string]: ToolProperty };
    required?: string[]; // Optional: specify required properties at the object level as a string array
}

// Define the structure for a single tool definition following MCP spec
interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: ToolSchema; // Renamed from parameters
    outputSchema: ToolSchema; // Added outputSchema
}

// Array holding all the tool definitions for the mcp-playbook server
export const toolDefinitions: ToolDefinition[] = [
    {
        name: 'init_playbook',
        description: 'Provides an instruction to the LLM about the purpose of the mcp-playbook server, which is to facilitate local project documentation and enable partial replication of documentation and chat logs for an AI-powered playbook.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        outputSchema: {
            type: 'object',
            properties: {
                instruction: {
                    type: 'string',
                    description: 'Instruction for the LLM regarding the purpose of the mcp-playbook.',
                },
            },
            required: ['instruction'],
        },
    },
    {
        name: 'initialize_docs_structure',
        description: 'Initializes the standard documentation folder structure (docs/, docs/specs/, docs/adr/, docs/changelog/, and .chat/) within the specified target project directory.',
        inputSchema: {
            type: 'object',
            properties: {
                target_project_dir: {
                    type: 'string',
                    description: 'The absolute or relative path to the root of the target project directory where the documentation structure should be created.',
                    required: true,
                },
            },
            required: ['target_project_dir'],
        },
         outputSchema: { // Basic output schema based on handler response
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Execution status (success or error)' },
                message: { type: 'string', description: 'Description of the result or error' },
            },
            required: ['status', 'message'],
        },
    },
    {
        name: 'create_spec',
        description: 'Creates or overwrites a new specification file (e.g., PRD, RFC) in the docs/specs/ directory of the target project.',
        inputSchema: {
            type: 'object',
            properties: {
                target_project_dir: {
                    type: 'string',
                    description: 'The absolute or relative path to the root of the target project directory.',
                    required: true,
                },
                spec_name: {
                    type: 'string',
                    description: 'The name of the specification file (without the .md extension).',
                    required: true,
                },
                content: {
                    type: 'string',
                    description: 'The markdown content of the specification.',
                    required: true,
                },
            },
            required: ['target_project_dir', 'spec_name', 'content'],
        },
         outputSchema: { // Basic output schema based on handler response
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Execution status (success or error)' },
                path: { type: 'string', description: 'Path to the created file if successful' },
                message: { type: 'string', description: 'Description of the result or error' },
            },
            required: ['status'], // Status is always present
        },
    },
    {
        name: 'create_adr',
        description: 'Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project.',
        inputSchema: {
            type: 'object',
            properties: {
                target_project_dir: {
                    type: 'string',
                    description: 'The absolute or relative path to the root of the target project directory.',
                    required: true,
                },
                adr_name: {
                    type: 'string',
                    description: 'The name of the ADR file (without the .md extension).',
                    required: true,
                },
                content: {
                    type: 'string',
                    description: 'The markdown content of the ADR.',
                    required: true,
                },
            },
            required: ['target_project_dir', 'adr_name', 'content'],
        },
         outputSchema: { // Basic output schema based on handler response
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Execution status (success or error)' },
                path: { type: 'string', description: 'Path to the created file if successful' },
                message: { type: 'string', description: 'Description of the result or error' },
            },
            required: ['status'],
        },
    },
    {
        name: 'update_changelog',
        description: 'Appends a new entry to the changelog file (docs/changelog/changelog.md) in the target project.',
        inputSchema: {
            type: 'object',
            properties: {
                target_project_dir: {
                    type: 'string',
                    description: 'The absolute or relative path to the root of the target project directory.',
                    required: true,
                },
                entry_content: {
                    type: 'string',
                    description: 'The markdown content of the new changelog entry.',
                    required: true,
                },
            },
             required: ['target_project_dir', 'entry_content'],
        },
         outputSchema: { // Basic output schema based on handler response
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Execution status (success or error)' },
                path: { type: 'string', description: 'Path to the updated file if successful' },
                message: { type: 'string', description: 'Description of the result or error' },
            },
            required: ['status'],
        },
    },
    {
        name: 'save_and_upload_chat_log',
        description: 'Captures the current conversation history, saves it as a markdown file in the .chat/ directory of the target project, and uploads it to the dwarvesf/prompt-log GitHub repository.',
        inputSchema: {
            type: 'object',
            properties: {
                target_project_dir: {
                    type: 'string',
                    description: 'The absolute or relative path to the root of the target project directory where the chat log should be saved locally before uploading.',
                    required: true,
                },
            },
            required: ['target_project_dir'],
        },
         outputSchema: { // Basic output schema based on handler response
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Execution status (success or error)' },
                local_path: { type: 'string', description: 'Path to the locally saved file' },
                github_path: { type: 'string', description: 'Path within the GitHub repository' },
                github_url: { type: 'string', description: 'URL of the file on GitHub' },
                message: { type: 'string', description: 'Description of the result or error' },
            },
             required: ['status'],
        },
    },
    // Add more tools here as needed in the future
];

export default toolDefinitions;
