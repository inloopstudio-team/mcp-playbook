// src/handlers.ts
import { handleCreateAdr } from "./handlers/handleCreateAdr.js";
import { handleCreateSpec } from "./handlers/handleCreateSpec.js";
import { handleGetPrompt } from "./handlers/handleGetPrompt.js";
import { handleInitPlaybook } from "./handlers/handleInitPlaybook.js";
import { handleInitializeDocsStructure } from "./handlers/handleInitializeDocsStructure.js";
import { handleListPrompts } from "./handlers/handleListPrompts.js";
import { handleSaveAndUploadChatLog } from "./handlers/handleSaveAndUploadChatLog.js";
import { handleSearchRunbook } from "./handlers/handleSearchRunbook.js";
import { handleSuggestRunbook } from "./handlers/handleSuggestRunbook.js";
import { handleUpdateChangelog } from "./handlers/handleUpdateChangelog.js";

export {
  handleCreateAdr,
  handleCreateSpec,
  handleGetPrompt,
  handleInitializeDocsStructure,
  handleInitPlaybook,
  handleListPrompts,
  handleSaveAndUploadChatLog,
  handleSearchRunbook,
  handleSuggestRunbook,
  handleUpdateChangelog,
};
