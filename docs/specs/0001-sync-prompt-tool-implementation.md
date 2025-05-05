# 0001 - Sync Prompt Tool Specification

## Overview

This specification details the design and implementation plan for the `sync_prompt` tool within the MCP Playbook server.

## Motivation

As Large Language Models (LLMs) are increasingly used in development workflows, they often interact with or generate prompt templates and system instructions. Capturing and centralizing these prompts is valuable for several reasons:

- **Knowledge Sharing:** Allows engineers to share effective prompts and learn from each other's experiences.
- **Iteration and Improvement:** Provides a repository for iterating on and improving prompt engineering techniques.
- **Documentation:** Serves as a living document of prompts used across different projects.

The `sync_prompt` tool aims to automate the process of saving these prompts to a central repository (`dwarvesf/prompt-db`), making it easy for AIs and humans to contribute and access this knowledge base.

## Goals

- Implement a new MCP tool `sync_prompt` that accepts prompt content along with project and prompt names.
- Develop a handler for `sync_prompt` that saves the provided prompt content to the `dwarvesf/prompt-db` GitHub repository in the `synced_prompts` folder, organized by project and prompt name.
- Ensure the tool can create new files and update existing ones in the target repository.
- Update the `initPlaybookPrompt` to instruct the AI to use the `sync_prompt` tool when appropriate.

## Non-Goals

- Implementing a mechanism to automatically detect prompts in files without explicit instruction. The AI will use the tool based on its understanding and the updated `initPlaybookPrompt`.
- Handling complex versioning or conflict resolution within the `prompt-db` repository beyond standard Git behavior.
- Creating a user interface for browsing or managing prompts in the `prompt-db` repository.

## Implementation Details

1.  **Define the `sync_prompt` Tool:**

    - Create a new file `src/tools/syncPrompt.ts`.
    - Define a Zod schema for the tool's arguments, including `projectName` (string, required), `promptName` (string, required), and `promptContent` (string, required).
    - Define the `syncPromptTool` object with `name`, `description`, `inputSchema`, and `annotations`.

2.  **Create the `handleSyncPrompt` Handler:**

    - Create a new file `src/handlers/handleSyncPrompt.ts`.
    - Implement an asynchronous function `handleSyncPrompt` that takes the parsed arguments as input.
    - Inside the handler:
      - Validate the input arguments using the Zod schema.
      - Define the target GitHub repository (`dwarvesf/prompt-db`) and the target folder (`synced_prompts`).
      - Construct the full file path within the GitHub repository: `synced_prompts/${projectName}/${promptName}.md`.\n - Use the functions from `src/utils/githubApi.ts` to perform the following steps to create or update the file:\n - Get the latest commit SHA of the `main` branch of `dwarvesf/prompt-db`.\n - Get the tree SHA from that commit.\n - Attempt to get the existing file content at the target path to check if it exists and get its SHA if it does.\n - Create a new blob with the `promptContent`.\n - Create a new tree, including the existing tree items and adding/updating the item for the target file path with the new blob SHA.\n - Create a new commit referencing the new tree and the parent commit (the latest commit on `main`).\n - Update the `main` branch reference to point to the new commit.\n - Return a JSON object indicating the status (`success` or `error`) and a descriptive message, including the GitHub file path and URL if successful.

3.  **Integrate the New Tool and Handler:**

    - Update `src/tools/definitions.ts` to import and include `syncPromptTool` in the exported array of tool definitions.
    - Update `src/handlers.ts` to import `handleSyncPrompt` and map the `sync_prompt` tool name to this handler function.

4.  **Update `initPlaybookPrompt`:**
    - Modify the content of `src/prompts/initPlaybookPrompt.ts`.
    - Add a new instruction line informing the AI that whenever it encounters an LLM prompt while reading files or working on a project, it should use the `sync_prompt` tool to save it to the prompt-db repository.

## Testing

- After implementing the changes, the project needs to be built (`npm run build`).
- The updated `mcp-playbook` server needs to be run.
- A task involving reading a file containing a prompt should be performed to test if the `sync_prompt` tool is called correctly and if the file is created/updated in the `dwarvesf/prompt-db` repository.
