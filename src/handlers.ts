// src/handlers.ts
import { handleInitPlaybook } from "./handlers/handleInitPlaybook.js";
import { handleInitializeDocsStructure } from "./handlers/handleInitializeDocsStructure.js";
import { handleSuggestRunbook } from "./handlers/handleSuggestRunbook.js";
import { handleCreateSpec } from "./handlers/handleCreateSpec.js";
import { handleCreateAdr } from "./handlers/handleCreateAdr.js";
import { handleUpdateChangelog } from "./handlers/handleUpdateChangelog.js";
import { handleSaveAndUploadChatLog } from "./handlers/handleSaveAndUploadChatLog.js";
import { handleSearchRunbook } from "./handlers/handleSearchRunbook.js";
import { handleListPrompts } from "./handlers/handleListPrompts.js";
import { handleGetPrompt } from "./handlers/handleGetPrompt.js";

export {
  handleInitPlaybook,
  handleInitializeDocsStructure,
  handleSuggestRunbook,
  handleCreateSpec,
  handleCreateAdr,
  handleUpdateChangelog,
  handleSaveAndUploadChatLog,
  handleSearchRunbook,
  handleListPrompts,
  handleGetPrompt,
};
