import * as path from "path";
import {
  SaveAndUploadChatLogArgs,
  SaveAndUploadChatLogArgsSchema,
} from "../tools/saveAndUploadChatLog.js";
import * as fsUtils from "../utils/fsUtils.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";

// Placeholder for conversation history retrieval
// In a real MCP server, this would be provided by the framework hosting the server.
// This function needs to access the framework's conversation state.
interface ConversationTurn {
  role: "user" | "model";
  content: string;
}

// IMPORTANT: Replace this placeholder with actual logic to get conversation history
function getConversationHistoryPlaceholder(): ConversationTurn[] {
  console.warn(
    "WARNING: Using placeholder conversation history! Replace with actual framework integration.",
  );
  // This is a dummy implementation for planning purposes.
  // A real implementation would access the conversation history from the MCP server framework.
  return [
    {
      role: "user",
      content: "Hello, this is a test conversation for the log.",
    },
    { role: "model", content: "This is the model's first reply." },
    {
      role: "user",
      content: "And this is a follow-up message, asking to save the log.",
    },
  ];
}

export async function handleSaveAndUploadChatLog(
  args: SaveAndUploadChatLogArgs,
): Promise<any> {
  try {
    const { target_project_dir } = validateArgs(
      SaveAndUploadChatLogArgsSchema,
      args,
    );

    const absoluteTargetProjectDir = path.resolve(target_project_dir);

    // Get authenticated user's GitHub username
    const user = await githubApi.getMe();
    const userId = user.login; // Use login as the user identifier

    console.error(
      `Handling save_and_upload_chat_log for: ${absoluteTargetProjectDir}, user: ${userId}`,
    );
    const githubOwner = "dwarvesf";
    const githubRepo = "prompt-log";
    const githubBranch = "main"; // Or configure/determine branch
    const ref = `heads/${githubBranch}`;

    // Derive GitHub path based on target project name and user ID
    const projectName = githubApi.deriveProjectNameFromPath(
      absoluteTargetProjectDir,
    );
    const remoteChatDir = path.posix.join("project-logs", projectName, userId, ".chat");

    // Ensure the local .chat directory exists in the target project
    const localChatDir = fsUtils.joinProjectPath(
      absoluteTargetProjectDir,
      ".chat",
    );
    fsUtils.createDirectory(localChatDir);

    // Get list of local files in .chat directory
    const localFiles = fsUtils
      .listDirectory(localChatDir)
      .filter((file) => file.endsWith(".chat"));

    if (localFiles.length === 0) {
      return {
        status: "success",
        message: "No chat log files found locally to sync.",
      };
    }

    // 1. Get the SHA of the latest commit on the target branch
    const latestRef = await githubApi.getRef(githubOwner, githubRepo, ref);
    const latestCommitSha = latestRef.object.sha;

    // 2. Get the tree SHA from the latest commit
    const latestCommit = await githubApi.getCommit(
      githubOwner,
      githubRepo,
      latestCommitSha,
    );
    const baseTreeSha = latestCommit.tree.sha;

    // 3. Get the contents of the latest tree to include existing files
    // This is needed to build the new tree correctly, including files outside the .chat directory
    const baseTree = await githubApi.getTree(
      githubOwner,
      githubRepo,
      baseTreeSha,
    );

    // Prepare tree items for the new commit
    const newTreeItems: githubApi.GitHubCreateTreeItem[] = [];

    // Keep existing files from the base tree, excluding the entire remoteChatDir path
    // This prevents carrying over old versions of chat files or files that were deleted locally.
    const filesToKeep = baseTree.tree.filter(
      (item) => !item.path.startsWith(remoteChatDir + "/"),
    );

    for (const item of filesToKeep) {
      newTreeItems.push({
        path: item.path,
        mode: item.mode as githubApi.GitHubCreateTreeItem["mode"],
        type: item.type as githubApi.GitHubCreateTreeItem["type"],
        sha: item.sha,
      });
    }

    // Add or update local .chat files
    for (const filename of localFiles) {
      const localFilePath = fsUtils.joinProjectPath(localChatDir, filename);
      const fileContent = fsUtils.readFile(localFilePath);

      // Create a new blob for the file content
      console.error(`Creating blob for ${filename}...`);
      const blob = await githubApi.createBlob(
        githubOwner,
        githubRepo,
        fileContent,
        "utf-8",
      );
      console.error(`Blob created with SHA: ${blob.sha}`);

      // Add the new/updated file to the tree items
      const remoteFilePath = path.posix.join(remoteChatDir, filename);
      newTreeItems.push({
        path: remoteFilePath,
        mode: "100644", // File mode
        type: "blob",
        sha: blob.sha,
      });
    }

    // 4. Create a new tree object
    console.error("Creating new tree...");
    // Pass the baseTreeSha to create the new tree based on the latest commit's tree
    const newTree = await githubApi.createTree(
      githubOwner,
      githubRepo,
      newTreeItems,
      baseTreeSha,
    );
    console.error(`New tree created with SHA: ${newTree.sha}`);

    // 5. Create a new commit object
    const commitMessage = `sync: merge chat logs from ${projectName} for ${userId}`;
    console.error(`Creating new commit: "${commitMessage}"`);
    const newCommit = await githubApi.createCommit(
      githubOwner,
      githubRepo,
      commitMessage,
      newTree.sha,
      latestCommitSha,
    );
    console.error(`New commit created with SHA: ${newCommit.html_url}`);

    // 6. Update the branch reference to point to the new commit
    console.error(`Updating branch "${githubBranch}" to commit ${newCommit.sha}`);
    await githubApi.updateRef(githubOwner, githubRepo, ref, newCommit.sha);
    console.error(`Branch "${githubBranch}" updated successfully.`);

    // Return success response
    return {
      status: "success",
      message: `Chat log sync complete. Committed changes to ${githubBranch}.`,
      commit_sha: newCommit.sha,
      commit_url: newCommit.html_url,
    };
  } catch (e: any) {
    console.error(`Error during chat log sync: ${e.message}`);
    return {
      status: "error",
      message: `An error occurred during chat log sync: ${e.message}`,
    };
  }
}
