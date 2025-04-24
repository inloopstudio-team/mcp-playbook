// src/tools/definitions.ts

// Define interfaces for tool parameter structure (following OpenAPI/JSON Schema like style)
interface ToolParameterProperty {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean; // Optional: indicate if the parameter is mandatory
    items?: ToolParameterProperty; // For array types
    properties?: { [key: string]: ToolParameterProperty }; // For object types
    // Add other JSON schema keywords if needed (e.g., enum, format)
}

interface ToolParameters {
    type: 'object';
    properties: { [key: string]: ToolParameterProperty };
    required?: string[]; // Optional: specify required properties at the object level as a string array
}

// Define the structure for a single tool definition
interface ToolDefinition {
    name: string;
    description: string;
    parameters: ToolParameters;
}

// Array holding all the tool definitions for the mcp-playbook server
export const toolDefinitions: ToolDefinition[] = [
    {
        name: 'initialize_docs_structure',
        description: 'Initializes the standard documentation folder structure (docs/, docs/specs/, docs/adr/, docs/changelog/, and .chat/) within the specified target project directory.',
        parameters: {
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
    },
    {
        name: 'create_spec',
        description: 'Creates or overwrites a new specification file (e.g., PRD, RFC) in the docs/specs/ directory of the target project.',
        parameters: {
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
    },
    {
        name: 'create_adr',
        description: 'Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project.',
        parameters: {
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
    },
    {
        name: 'update_changelog',
        description: 'Appends a new entry to the changelog file (docs/changelog/changelog.md) in the target project.',
        parameters: {
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
    },
    {
        name: 'save_and_upload_chat_log',
        description: 'Captures the current conversation history, saves it as a markdown file in the .chat/ directory of the target project, and uploads it to the dwarvesf/prompt-log GitHub repository.',
        parameters: {
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
    },
    // Add more tools here as needed in the future
];

export default toolDefinitions;
