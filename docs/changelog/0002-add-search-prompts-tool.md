## Features

- Added a new tool `search_prompts` that allows searching for LLM prompts in the `dwarvesf/prompt-db` GitHub repository (excluding the `synced_prompts/` folder).

## Improvements

- Updated the devbox environment to use Node.js v24.
- Added an `inspect` script to `devbox.json` for easier inspection of the server.
- Improved caching logic for GitHub API calls in `src/utils/githubApi.ts`.
