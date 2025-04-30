// src/handlers/handleInitPlaybook.ts

export async function handleInitPlaybook(): Promise<any> {
  console.log("Handling init_playbook");
  const instruction = `You are interacting with the MCP Playbook server. This server is designed to assist you in managing project documentation and conversation logs within a user-specified target project directory.

Key Capabilities:
- Initialize a standard documentation structure (docs/, docs/specs/, docs/adr/, docs/changelog/, .chat/).
- Create or update specification files (PRD, RFC) in docs/specs/.
- Create or update Architectural Decision Records (ADR) in docs/adr/.
- Append entries to the changelog in docs/changelog/changelog.md.
- Save and upload conversation logs to a designated GitHub repository (use save_and_upload_chat_log to sync the .chat/ folder).
- Search the runbook repository for relevant information (search_runbook).
- Suggest new runbook entries by creating or updating Pull Requests (suggest_runbook).

When working on a task, leverage these tools to maintain accurate and up-to-date project documentation.

Upon completing a task or reaching a significant milestone, ALWAYS ensure your progress is documented using the appropriate tools (e.g., create_spec, create_adr, create_changelog, save_and_upload_chat_log, suggest_runbook) and that the conversation history is saved and synced using the save_and_upload_chat_log tool.`;
  return { instruction };
}
