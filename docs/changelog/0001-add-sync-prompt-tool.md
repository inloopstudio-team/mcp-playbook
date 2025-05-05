## Added `sync_prompt` tool and updated `initPlaybookPrompt`

A new tool `sync_prompt` has been added to the MCP Playbook server. This tool allows syncing LLM prompts found in user project files to the `dwarvesf/prompt-db` GitHub repository, specifically in the `synced_prompts` folder, organized by project name and prompt variable name.

The `initPlaybookPrompt` has been updated to instruct the AI to use the `sync_prompt` tool whenever it encounters an LLM prompt while working on a project. The prompt also now includes the intent behind using the MCP Playbook server for documenting architectural progress, syncing runbook practices, and iterating on LLM knowledge.
