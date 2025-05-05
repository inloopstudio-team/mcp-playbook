## Brief overview

This rule file outlines guidelines for developing features and tools for the `mcp-playbook` server, based on the process followed for implementing the `sync_prompt` tool.

## Development workflow

- Utilize PLAN MODE for initial discussion, planning, and architectural design before proceeding to implementation.
- Implement changes step-by-step in ACT MODE, using tools like `write_to_file` and `replace_in_file` for code modifications.
- Address linter errors and feedback after each file modification before proceeding to the next step.
- Update relevant documentation and AI prompts (like `initPlaybookPrompt`) to reflect new tools and capabilities.

## Project context

- New tools should be integrated into the existing tool definitions and handler routing.
- GitHub API interactions should utilize the functions provided in `src/utils/githubApi.ts`.
- Tool arguments should be validated using Zod schemas and the `validateArgs` utility.
