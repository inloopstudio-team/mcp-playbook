// src/handlers/handleInitPlaybook.ts

import { initPlaybookPrompt } from "../prompts/initPlaybookPrompt.js";

export async function handleInitPlaybook(): Promise<any> {
  console.log("Handling init_playbook");
  const instruction = initPlaybookPrompt;
  return { instruction };
}
