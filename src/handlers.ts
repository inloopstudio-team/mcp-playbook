// src/handlers.ts
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import * as fsUtils from "./fsUtils.js";
import * as githubApi from "./githubApi.js";
import * as crypto from "crypto";

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

// Define the handlers corresponding to the MCP tools
export async function handleInitPlaybook(): Promise<any> {
  console.log("Handling init_playbook");
  const instruction = `You are interacting with the MCP Playbook server. This server is designed to assist you in managing project documentation and conversation logs within a user-specified target project directory.

Key Capabilities:
- Initialize a standard documentation structure (docs/, docs/specs/, docs/adr/, docs/changelog/, .chat/).
- Create or update specification files (PRD, RFC) in docs/specs/.
- Create or update Architectural Decision Records (ADR) in docs/adr/.
- Append entries to the changelog in docs/changelog/changelog.md.
- Save and upload conversation logs to a designated GitHub repository (.chat/).

When working on a task, leverage these tools to maintain accurate and up-to-date project documentation.

Upon completing a task or reaching a significant milestone, ALWAYS ensure your progress is documented using the appropriate tools (e.g., create_spec, create_adr, create_changelog) and that the conversation history is saved and synced using the save_and_upload_chat_log tool.`;
  return { instruction };
}

export async function handleInitializeDocsStructure(
  targetProjectDir: string,
): Promise<any> {
  console.log(`Handling initialize_docs_structure for: ${targetProjectDir}`);
  try {
    // Use fsUtils to create directories
    fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, "docs"));
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(targetProjectDir, "docs", "specs"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(targetProjectDir, "docs", "adr"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(targetProjectDir, "docs", "changelog"),
    );
    fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, ".chat")); // Also create .chat here

    return {
      status: "success",
      message: "Documentation structure initialized.",
    };
  } catch (e: any) {
    console.error(`Error in handleInitializeDocsStructure: ${e.message}`);
    return {
      status: "error",
      message: `Failed to initialize structure: ${e.message}`,
    };
  }
}

export async function handleCreateSpec(
  targetProjectDir: string,
  specName: string,
  content: string,
): Promise<any> {
  console.log(
    `Handling create_spec for: ${targetProjectDir}, spec: ${specName}`,
  );
  const specsDir = fsUtils.joinProjectPath(targetProjectDir, "docs", "specs");

  try {
    // Ensure directory exists
    fsUtils.createDirectory(specsDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(specsDir);
      const numberedFiles = files.filter((file: string) =>
        /^\d{4}-.*\.md$/.test(file),
      );
      if (numberedFiles.length > 0) {
        const numbers = numberedFiles.map((file: string) =>
          parseInt(file.substring(0, 4), 10),
        );
        const maxNumber = Math.max(...numbers);
        nextSequenceNumber = maxNumber + 1;
      }
    } catch (e: any) {
      console.warn(
        `Could not read specs directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided specName for the filename slug
    const slug = specName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(specsDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new spec file: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateSpec: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create spec file: ${e.message}`,
    };
  }
}

export async function handleCreateAdr(
  targetProjectDir: string,
  adrName: string,
  content: string,
): Promise<any> {
  console.log(`Handling create_adr for: ${targetProjectDir}, adr: ${adrName}`);
  const adrDir = fsUtils.joinProjectPath(targetProjectDir, "docs", "adr");

  try {
    // Ensure directory exists
    fsUtils.createDirectory(adrDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(adrDir);
      const numberedFiles = files.filter((file: string) =>
        /^\d{4}-.*\.md$/.test(file),
      );
      if (numberedFiles.length > 0) {
        const numbers = numberedFiles.map((file: string) =>
          parseInt(file.substring(0, 4), 10),
        );
        const maxNumber = Math.max(...numbers);
        nextSequenceNumber = maxNumber + 1;
      }
    } catch (e: any) {
      console.warn(
        `Could not read adr directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided adrName for the filename slug
    const slug = adrName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(adrDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new ADR file: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateAdr: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create ADR file: ${e.message}`,
    };
  }
}

export async function handleUpdateChangelog(
  targetProjectDir: string,
  entryContent: string,
  changelogName: string, // changelogName is now required
): Promise<any> {
  console.log(`Handling create_changelog for: ${targetProjectDir}`);
  const changelogDir = fsUtils.joinProjectPath(
    targetProjectDir,
    "docs",
    "changelog",
  );

  try {
    // Ensure directory exists
    fsUtils.createDirectory(changelogDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(changelogDir);
      const numberedFiles = files.filter((file: string) =>
        /^\d{4}-.*\.md$/.test(file),
      );
      if (numberedFiles.length > 0) {
        const numbers = numberedFiles.map((file: string) =>
          parseInt(file.substring(0, 4), 10),
        );
        const maxNumber = Math.max(...numbers);
        nextSequenceNumber = maxNumber + 1;
      }
    } catch (e: any) {
      // If directory doesn't exist or other read error, start with 1
      console.warn(
        `Could not read changelog directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided changelogName for the filename slug
    const baseName = changelogName; // changelogName is now typed as string
    const slug = baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(changelogDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, entryContent);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new changelog entry: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleUpdateChangelog: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create changelog entry file: ${e.message}`,
    };
  }
}

export async function handleSaveAndUploadChatLog(
  targetProjectDir: string,
  userId: string,
): Promise<any> {
  console.log(
    `Handling save_and_upload_chat_log for: ${targetProjectDir}, user: ${userId}`,
  );
  const githubOwner = "dwarvesf";
  const githubRepo = "prompt-log";
  const githubBranch = "main"; // Or configure/determine branch
  const ref = `heads/${githubBranch}`;

  try {
    // Derive GitHub path based on target project name and user ID
    const projectName = githubApi.deriveProjectNameFromPath(targetProjectDir);
    const remoteChatDir = path.posix.join(projectName, userId, ".chat");

    // Ensure the local .chat directory exists in the target project
    const localChatDir = fsUtils.joinProjectPath(targetProjectDir, ".chat");
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
        mode: item.mode,
        type: item.type,
        sha: item.sha,
      });
    }

    // Add or update local .chat files
    for (const filename of localFiles) {
      const localFilePath = fsUtils.joinProjectPath(localChatDir, filename);
      const fileContent = fsUtils.readFile(localFilePath);

      // Create a new blob for the file content
      console.log(`Creating blob for ${filename}...`);
      const blob = await githubApi.createBlob(
        githubOwner,
        githubRepo,
        fileContent,
        "utf-8",
      );
      console.log(`Blob created with SHA: ${blob.sha}`);

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
    console.log("Creating new tree...");
    // Pass the baseTreeSha to create the new tree based on the latest commit's tree
    const newTree = await githubApi.createTree(
      githubOwner,
      githubRepo,
      newTreeItems,
      baseTreeSha,
    );
    console.log(`New tree created with SHA: ${newTree.sha}`);

    // 5. Create a new commit object
    const commitMessage = `Sync chat logs from ${projectName} for ${userId}`;
    console.log(`Creating new commit: "${commitMessage}"`);
    const newCommit = await githubApi.createCommit(
      githubOwner,
      githubRepo,
      commitMessage,
      newTree.sha,
      latestCommitSha,
    );
    console.log(`New commit created with SHA: ${newCommit.html_url}`);

    // 6. Update the branch reference to point to the new commit
    console.log(`Updating branch "${githubBranch}" to commit ${newCommit.sha}`);
    await githubApi.updateRef(githubOwner, githubRepo, ref, newCommit.sha);
    console.log(`Branch "${githubBranch}" updated successfully.`);

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

// In-memory cache for search results
const searchCache = new Map<string, any>(); // Cache key: keyword, Cache value: GitHub search results

export async function handleSearchRunbook(keyword: string): Promise<any> {
  console.log(`Handling search_runbook for keyword: ${keyword}`);

  // Check if the result is in the cache
  if (searchCache.has(keyword)) {
    console.log(`Cache hit for keyword: ${keyword}`);
    return {
      results: searchCache.get(keyword),
      message: "Results from cache.",
    };
  }

  console.log(`Cache miss for keyword: ${keyword}. Searching GitHub...`);
  const githubOwner = "dwarvesf";
  const githubRepo = "runbook";
  const searchQuery = `repo:${githubOwner}/${githubRepo} ${keyword}`;

  try {
    // Use the githubApi function to search code to get matching file paths
    const searchResults = await githubApi.searchCode(
      githubOwner,
      githubRepo,
      keyword,
    );

    const processedResults = [];
    const itemsToProcess = searchResults.items.slice(0, 5); // Limit to top 5 results

    // For each matching file, fetch the full content
    for (const item of itemsToProcess) {
      try {
        // getContents returns GitHubContentsResponse, which can be an array if the path is a directory.
        // Since searchCode finds files, we expect a single GitHubContentItem.
        const fileContentResponse = await githubApi.getContents(
          githubOwner,
          githubRepo,
          item.path,
          item.repository.default_branch,
        );

        // Ensure it's a single file item and has content
        if (
          !Array.isArray(fileContentResponse) &&
          fileContentResponse.type === "file" &&
          fileContentResponse.content
        ) {
          const fullContent = Buffer.from(
            fileContentResponse.content,
            "base64",
          ).toString("utf-8");

          // We still include the snippet for context, and now the full content
          const snippet =
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available";

          processedResults.push({
            path: item.path,
            snippet: snippet, // Keep snippet for quick context
            full_content: fullContent, // Add full content
            url: item.html_url,
          });
        } else {
          console.warn(
            `Could not fetch full content for ${item.path}. Unexpected response type or missing content.`,
          );
          // Optionally push a result without full content or skip
          processedResults.push({
            path: item.path,
            snippet:
              item.text_matches && item.text_matches.length > 0
                ? item.text_matches[0].fragment
                : "No snippet available",
            full_content: null, // Indicate no full content was fetched
            url: item.html_url,
            message: "Could not fetch full content.",
          });
        }
      } catch (contentError: any) {
        console.error(
          `Error fetching content for ${item.path}: ${contentError.message}`,
        );
        // Optionally push a result with error info or skip
        processedResults.push({
          path: item.path,
          snippet:
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available",
          full_content: null, // Indicate no full content was fetched
          url: item.html_url,
          message: `Error fetching content: ${contentError.message}`,
        });
      }
    }

    // Store results in cache (cache the processed results including full content)
    searchCache.set(keyword, processedResults);
    console.log(`Cached results for keyword: ${keyword}`);

    return {
      results: processedResults,
      message: `Found and processed ${processedResults.length} results.`,
    };
  } catch (e: any) {
    console.error(`Error during runbook search: ${e.message}`);
    return {
      results: [],
      message: `An error occurred during runbook search: ${e.message}`,
    };
  }
}
