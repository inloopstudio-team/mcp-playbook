// src/handlers/handleInitPlaybook.ts

import { initPlaybookPrompt } from "../prompts/initPlaybookPrompt.js";
import * as githubApi from "../utils/githubApi.js";

export async function handleInitPlaybook(): Promise<any> {
  console.log("Handling init_playbook");

  // Get authenticated user's GitHub username
  const user = await githubApi.getMe();
  const userId = user.login; // Use login as the user identifier

  const instruction = initPlaybookPrompt;
  return { instruction, userId };
}
