# MCP Playbook Server

A Model Context Protocol (MCP) server for managing project documentation and saving conversation logs within a user-specified target project directory.

## Overview

This `mcp-playbook` server is a self-contained Node.js/TypeScript application that provides a set of tools accessible via the Model Context Protocol (MCP). Its primary functions are to help LLMs structure documentation within a designated project directory and to save/upload conversation histories. Unlike tools that might rely on external `commander` or `github` environments, this server implements file system operations and GitHub API interactions directly using Node.js's built-in modules (`fs`, `path`, `https`) and libraries like `node-fetch`.

The server operates on a `target_project_dir` specified by the LLM, managing files and directories within that location. It does *not* store documentation or chat logs within its own repository structure.

## Available Tools

This server exposes the following MCP tools:

### `initialize_docs_structure`

Initializes the standard documentation folder structure (`docs/`, `docs/specs/`, `docs/adr/`, `docs/changelog/`, and `.chat/`) within the specified target project directory.

**Parameters:**
- `target_project_dir` (string, required): The absolute or relative path to the root of the target project directory where the documentation structure should be created.

**Returns:**
A JSON object indicating success or failure.
```json
{
  "status": "success" | "error",
  "message": "string" // Success or error description
}
```

### `create_spec`

Creates or overwrites a new specification file (e.g., PRD, RFC) in the `docs/specs/` directory of the target project.

**Parameters:**
- `target_project_dir` (string, required): The absolute or relative path to the root of the target project directory.
- `spec_name` (string, required): The name of the specification file (without the `.md` extension). Basic sanitization is applied.
- `content` (string, required): The markdown content of the specification.

**Returns:**
A JSON object indicating success or failure, including the path if successful.
```json
{
  "status": "success" | "error",
  "path": "string" | undefined, // Path to the created file if successful
  "message": "string" // Success or error description
}
```

### `create_adr`

Creates or overwrites a new Architectural Decision Record (ADR) file in the `docs/adr/` directory of the target project.

**Parameters:**
- `target_project_dir` (string, required): The absolute or relative path to the root of the target project directory.
- `adr_name` (string, required): The name of the ADR file (without the `.md` extension). Basic sanitization is applied.
- `content` (string, required): The markdown content of the ADR.

**Returns:**
A JSON object indicating success or failure, including the path if successful.
```json
{
  "status": "success" | "error",
  "path": "string" | undefined, // Path to the created file if successful
  "message": "string" // Success or error description
}
```

### `create_changelog`

Appends a new entry to the changelog file (`docs/changelog/changelog.md`) in the target project. If the file does not exist, it will be created.

**Parameters:**
- `target_project_dir` (string, required): The absolute or relative path to the root of the target project directory.
- `entry_content` (string, required): The markdown content of the new changelog entry.

**Returns:**
A JSON object indicating success or failure, including the path if successful.
```json
{
  "status": "success" | "error",
  "path": "string" | undefined, // Path to the updated file if successful
  "message": "string" // Success or error description
}
```

### `save_and_upload_chat_log`

Captures the current conversation history, saves it as a uniquely named markdown file in the `.chat/` directory of the target project, and uploads it to the `dwarvesf/prompt-log` GitHub repository.

**Parameters:**
- `target_project_dir` (string, required): The absolute or relative path to the root of the target project directory where the chat log should be saved locally before uploading.

**Returns:**
A JSON object indicating success or failure, including the local path, GitHub path, and potentially the GitHub URL if successful.
```json
{
  "status": "success" | "error",
  "local_path": "string" | undefined, // Path to the locally saved file
  "github_path": "string" | undefined, // Path within the GitHub repository
  "github_url": "string" | undefined, // URL of the file on GitHub
  "message": "string" // Success or error description
}
```

## Setup

### Local Development

1.  Clone the repository:
    ```bash
    git clone git@github.com:dwarvesf/mcp-playbook.git
    cd mcp-playbook
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build # This compiles TypeScript to JavaScript in the 'dist' directory
    ```
4.  Configure GitHub Authentication (see Configuration section below).
5.  Run the compiled server:
    ```bash
    node dist/src/index.js
    ```

### Running with Docker (Optional)

A `Dockerfile` is included in the plan but not fully implemented here. Once completed, you can build and run the Docker image:

1.  Build the Docker image:
    ```bash
    docker build -t mcp-playbook .
    ```
2.  Run the container, ensuring the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable is passed:
    ```bash
    docker run -e GITHUB_PERSONAL_ACCESS_TOKEN="your_token" mcp-playbook
    ```

## Configuration

The `save_and_upload_chat_log` tool requires a GitHub Personal Access Token with `repo` scope to upload files to `dwarvesf/prompt-log`. This token must be provided via the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable.

For local development, you can use a `.env` file in the project root:

```dotenv
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

Ensure `.env` is added to your `.gitignore` file.

## Usage with Claude Desktop (Conceptual)

To use this MCP server with Claude Desktop, you would add a configuration entry to your Claude Desktop settings. The exact `command` and `args` will depend on how you choose to run the server (e.g., directly via `node` or using Docker). 

Example configuration for running directly:

```json
{
  "mcpServers": {
    "mcp-playbook": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-playbook/dist/src/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here" // Or manage environment variables separately
      }
    }
  }
}
```

Example configuration for running with Docker:

```json
{
  "mcpServers": {
    "mcp-playbook": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN", // Pass the env var from the agent environment
        "mcp-playbook:latest" // Your built image name
      ]
    }
  }
}
```

Consult the Claude Desktop documentation for detailed instructions on configuring MCP servers.

## Usage Example

```
mcp_mcp-playbook_initialize_docs_structure(target_project_dir="/Users/monotykamary/VCS/working-remote/my-new-project")
```

```
mcp_mcp-playbook_create_spec(target_project_dir="/Users/monotykamary/VCS/working-remote/my-new-project", spec_name="Initial Design", content="# Initial Design Specification\n\nThis document outlines the initial design of the project...")
```

## Troubleshooting

*   **Environment Variable Not Set**: Ensure the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable is correctly set in the environment where the `mcp-playbook` server process is running.
*   **File/Directory Not Found**: The server operates within the specified `target_project_dir`. Ensure the path provided exists and is accessible by the server process. File system errors (`ENOENT`) often indicate an incorrect path or missing directory.
*   **GitHub API Errors**: If `save_and_upload_chat_log` fails, check the server logs for details from the `githubApi.ts` error handling. Common issues include incorrect tokens, insufficient permissions, or rate limiting.

## Handoff Guidance for Another Engineer

*   **Self-Contained Implementation:** This server uses direct Node.js `fs` and `node-fetch` for file system and GitHub API interactions, *not* external `commander` or `github` tools provided by the environment.
*   **`target_project_dir`:** All tools interacting with user files require and operate within the `target_project_dir`. Input validation for this path is crucial for security.
*   **Dependencies:** Ensure all `npm` dependencies are installed (`npm install`). The project uses TypeScript; compile with `npm run build` (or `npx tsc`).
*   **Authentication:** GitHub authentication relies solely on the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable read by `process.env` in `src/githubApi.ts`.
*   **Conversation History Placeholder:** The `getConversationHistoryPlaceholder()` function in `src/handlers.ts` is a *dummy implementation*. It *must* be replaced with logic to retrieve actual conversation history from the MCP framework hosting this server for the `save_and_upload_chat_log` tool to work correctly.
*   **MCP Framework Integration:** The handler functions in `src/handlers.ts` are designed to be called by an external MCP framework that receives and routes tool calls from the LLM. The `src/index.ts` file is the conceptual entry point for this integration.
