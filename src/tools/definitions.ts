// src/tools/definitions.ts

// Define interfaces for tool schema structure (following OpenAPI/JSON Schema like style)
interface ToolProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean; // For simple types within an object
  items?: ToolSchema; // For array types, the schema of the array elements
  properties?: { [key: string]: ToolProperty }; // For object types, the properties of the object
  enum?: (string | number | boolean)[]; // Add enum property
  // Add other JSON schema keywords if needed (e.g., format)
}

interface ToolSchema {
  type: "object";
  properties: { [key: string]: ToolProperty };
  required?: string[]; // Required properties within this object
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
    name: "init_playbook",
    description:
      "Provides an instruction to the LLM about the purpose of the mcp-playbook server, which is to facilitate local project documentation and enable partial replication of documentation and chat logs for an AI-powered playbook.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description:
            "Instruction for the LLM regarding the purpose of the mcp-playbook.",
        },
      },
      required: ["instruction"],
    },
  },
  {
    name: "initialize_docs_structure",
    description:
      "Initializes the standard documentation folder structure (docs/, docs/specs/, docs/adr/, docs/changelog/, and .chat/) within the specified target project directory.",
    inputSchema: {
      type: "object",
      properties: {
        target_project_dir: {
          type: "string",
          description:
            "The absolute or relative path to the root of the target project directory where the documentation structure should be created.",
          required: true,
        },
      },
      required: ["target_project_dir"],
    },
    outputSchema: {
      // Basic output schema based on handler response
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status", "message"],
    },
  },
  {
    name: "create_spec",
    description:
      "Creates or overwrites a new specification file (e.g., PRD, RFC, architectural planning) in the docs/specs/ directory of the target project. Specification files will be named following a `spec-name.md` convention. For small feature changes, a simple markdown outline is sufficient. For larger or more complex changes, format the content as a formal PRD or RFC.",
    inputSchema: {
      type: "object",
      properties: {
        target_project_dir: {
          type: "string",
          description:
            "The absolute or relative path to the root of the target project directory.",
          required: true,
        },
        spec_name: {
          type: "string",
          description:
            "The name of the specification file (without sequence numbers and the .md extension).",
          required: true,
        },
        content: {
          type: "string",
          description: "The markdown content of the specification. For small feature changes, provide a simple markdown outline. For larger or more complex changes, provide content formatted as a formal PRD or RFC.",
          required: true,
        },
      },
      required: ["target_project_dir", "spec_name", "content"],
    },
    outputSchema: {
      // Basic output schema based on handler response
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        path: {
          type: "string",
          description: "Path to the created file if successful",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status"], // Status is always present
    },
  },
  {
    name: "create_adr",
    description:
      "Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project. ADR files will be named following an `adr-name.md` convention.",
    inputSchema: {
      type: "object",
      properties: {
        target_project_dir: {
          type: "string",
          description:
            "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
          required: true,
        },
        adr_name: {
          type: "string",
          description:
            "The name of the ADR file (without sequence numbers and the .md extension).",
          required: true,
        },
        content: {
          type: "string",
          description: "The markdown content of the ADR.",
          required: true,
        },
      },
      required: ["target_project_dir", "adr_name", "content"],
    },
    outputSchema: {
      // Basic output schema based on handler response
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        path: {
          type: "string",
          description: "Path to the created file if successful",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "create_changelog",
    description:
      "Creates a new, detailed, and user-facing changelog entry file in the docs/changelog/ directory of the target project. Each changelog entry will be a separate file named following a `changelog-entry.md` convention. Entries should provide comprehensive information about changes, including how to use new features or any impact on existing functionality, rather than being brief summaries.",
    inputSchema: {
      type: "object",
      properties: {
        target_project_dir: {
          type: "string",
          description:
            "The absolute path to the root of the target project directory. Using an absolute path is highly recommended for reliability.",
          required: true,
        },
        entry_content: {
          type: "string",
          description: "The markdown content of the new changelog entry.",
          required: true,
        },
        changelog_name: {
          type: "string",
          description:
            "The desired name for the changelog file (without sequence numbers and the .md extension).",
        },
      },
      required: ["target_project_dir", "entry_content", "changelog_name"],
    },
    outputSchema: {
      // Basic output schema based on handler response
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        path: {
          type: "string",
          description: "Path to the updated file if successful",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "save_and_upload_chat_log",
    description:
      "Captures the current conversation history, saves it as a markdown file in the .chat/ directory of the target project, and uploads it to the dwarvesf/prompt-log GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        target_project_dir: {
          type: "string",
          description:
            "The absolute path to the root of the target project directory where the chat log should be saved locally before uploading. Using an absolute path is highly recommended for reliability.",
          required: true,
        },
        userId: {
          type: "string",
          description:
            "The unique ID of the user/LLM client (e.g., your GitHub username). You can often get this using `git config user.email`.",
          required: true,
        },
      },
      required: ["target_project_dir", "userId"],
    },
    outputSchema: {
      // Basic output schema based on handler response
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        local_path: {
          type: "string",
          description: "Path to the locally saved file",
        },
        github_path: {
          type: "string",
          description: "Path within the GitHub repository",
        },
        github_url: {
          type: "string",
          description: "URL of the file on GitHub",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "search_runbook",
    description:
      "Fuzzy search for keywords in the dwarvesf/runbook GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "The keyword to search for in the runbook repository.",
          required: true,
        },
      },
      required: ["keyword"],
    },
    outputSchema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          description: "An array of search results.",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description:
                  "The path to the file where the keyword was found.",
              },
              snippet: {
                type: "string",
                description:
                  "A snippet of the code or text where the keyword was found.",
              },
              url: {
                type: "string",
                description: "The URL to the file on GitHub.",
              },
            },
            required: ["path", "snippet", "url"],
          },
        },
        message: {
          type: "string",
          description: "A message describing the result of the search.",
        },
      },
      required: ["results"],
    },
  },
  // Add more tools here as needed in the future
  {
    name: "suggest_runbook",
    description:
      "Creates or updates a Pull Request in the dwarvesf/runbook repository with a new runbook entry.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The markdown content of the runbook entry. Include frontmatter (--- title: ..., description: ..., date: ..., authors: ..., tags: ... ---) at the beginning for better organization.",
          required: true,
        },
        target_folder: {
          type: "string",
          description: "The specific folder within the dwarvesf/runbook repository.",
          enum: [
            "technical-patterns",
            "operational-state-reporting",
            "human-escalation-protocols",
            "diagnostic-and-information-gathering",
            "automations",
            "action-policies-and-constraints"
          ],
          required: true,
        },
        filename_slug: {
          type: "string",
          description: "A slug to be used for the filename.",
        },
        pr_number: {
          type: "number",
          description: "The number of an existing Pull Request to update.",
        },
        branch_name: {
          type: "string",
          description: "The name of the branch to use for the changes.",
        },
        commit_message: {
          type: "string",
          description: "The commit message for the file change.",
        },
        pr_title: {
          type: "string",
          description: "The title for a new Pull Request.",
        },
        pr_body: {
          type: "string",
          description: "The body content for a new Pull Request. Provide a detailed description explaining the context and purpose of the runbook entry.",
        },
      },
      required: ["content", "target_folder"],
    },
    outputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Execution status (success or error)",
        },
        pr_number: {
          type: "number",
          description: "The number of the created or updated Pull Request.",
        },
        pr_url: {
          type: "string",
          description: "The URL of the created or updated Pull Request.",
        },
        message: {
          type: "string",
          description: "Description of the result or error",
        },
      },
      required: ["status"],
    },
  },
];

export default toolDefinitions;
