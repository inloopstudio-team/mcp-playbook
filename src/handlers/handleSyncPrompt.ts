import { RequestError } from "@octokit/request-error";
import * as path from "path";
import { SyncPromptArgs, SyncPromptArgsSchema } from "../tools/syncPrompt.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleSyncPrompt(args: SyncPromptArgs): Promise<any> {
  try {
    const { projectName, promptName, promptContent } = validateArgs(
      SyncPromptArgsSchema,
      args,
    );

    console.error(
      `Handling sync_prompt for project: ${projectName}, prompt: ${promptName}`,
    );

    const githubOwner = "dwarvesf";
    const githubRepo = "prompt-db";
    const targetFolder = "synced_prompts";
    const baseBranch = "main"; // Target branch for syncing

    const targetFilePath = path.posix.join(
      targetFolder,
      projectName,
      `${promptName}.md`,
    );

    let existingFileSha: string | undefined;

    // 1. Check if the file already exists to get its SHA for updating
    try {
      const existingContent = await githubApi.getContents(
        githubOwner,
        githubRepo,
        targetFilePath,
        baseBranch,
      );
      if (!Array.isArray(existingContent) && existingContent.type === "file") {
        existingFileSha = existingContent.sha;
        console.error(`Found existing file with SHA: ${existingFileSha}`);
      }
    } catch (e: any) {
      if (e instanceof RequestError && e.status === 404) {
        console.error(
          `File not found at ${targetFilePath} on branch ${baseBranch}. This is expected for a new file.`,
        );
      } else {
        throw e; // Re-throw other errors
      }
    }

    // 2. Get the latest commit SHA of the base branch
    const latestRef = await githubApi.getRef(
      githubOwner,
      githubRepo,
      `heads/${baseBranch}`,
    );
    const latestCommitSha = latestRef.object.sha;

    // 3. Get the tree SHA from the latest commit
    const latestCommit = await githubApi.getCommit(
      githubOwner,
      githubRepo,
      latestCommitSha,
    );
    const baseTreeSha = latestCommit.tree.sha;

    // 4. Create a new blob with the prompt content
    const blob = await githubApi.createBlob(
      githubOwner,
      githubRepo,
      promptContent,
      "utf-8",
    );
    const blobSha = blob.sha;

    // 5. Create a new tree, including the existing tree and adding/updating the file
    const treeItems: githubApi.GitHubCreateTreeItem[] = [
      {
        path: targetFilePath,
        mode: "100644", // File mode
        type: "blob",
        sha: blobSha,
      },
    ];

    const newTree = await githubApi.createTree(
      githubOwner,
      githubRepo,
      treeItems,
      baseTreeSha, // Base the new tree on the latest tree
    );
    const newTreeSha = newTree.sha;

    // 6. Create a new commit referencing the new tree and the parent commit
    const commitMessage = existingFileSha
      ? `sync: update prompt ${projectName}/${promptName}`
      : `sync: add new prompt ${projectName}/${promptName}`;

    const newCommit = await githubApi.createCommit(
      githubOwner,
      githubRepo,
      commitMessage,
      newTreeSha,
      latestCommitSha,
    );
    const newCommitSha = newCommit.sha;

    // 7. Update the base branch reference to point to the new commit
    await githubApi.updateRef(
      githubOwner,
      githubRepo,
      `heads/${baseBranch}`,
      newCommitSha,
    );

    const githubFileUrl = `https://github.com/${githubOwner}/${githubRepo}/blob/${baseBranch}/${targetFilePath}`;

    console.error(`Prompt synced successfully to ${githubFileUrl}`);

    return {
      status: "success",
      github_path: targetFilePath,
      github_url: githubFileUrl,
      commit_sha: newCommitSha,
      message: existingFileSha
        ? `Successfully updated prompt ${projectName}/${promptName}`
        : `Successfully synced prompt ${projectName}/${promptName}`,
    };
  } catch (e: any) {
    console.error(`Error in handleSyncPrompt: ${e.message}`);
    return {
      status: "error",
      message: `Failed to sync prompt: ${e.message}`,
    };
  }
}
