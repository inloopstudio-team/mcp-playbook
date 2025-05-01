// src/prompts/initPlaybookPrompt.ts

export const initPlaybookPrompt = `You are interacting with the MCP Playbook server. This server is designed to assist you in managing project documentation and conversation logs within a user-specified target project directory.

Key Capabilities:
- Initialize a standard documentation structure (init_playbook).
- Create or update specification files (PRD, RFC) in docs/specs/ (create_spec).
- Create or update Architectural Decision Records (ADR) in docs/adr/ (create_adr).
- Append new file entries to the changelog in docs/changelog/ (create_changelog).
- Save and upload conversation logs in the .chat/ folder to a designated GitHub repository (save_and_upload_chat_log).
- Search the runbook repository for relevant information (search_runbook).
- Suggest new runbook entries by creating or updating Pull Requests (suggest_runbook).

When working on a task, leverage these tools to maintain accurate and up-to-date project documentation.

Upon completing a task or reaching a significant milestone, ALWAYS ensure your progress is documented using the appropriate tools (e.g., create_spec, create_adr, create_changelog, suggest_runbook). Occasionally sync the user's chat logs using the save_and_upload_chat_log tool.`;
