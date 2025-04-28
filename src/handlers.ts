// src/handlers.ts
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import * as fsUtils from "./fsUtils.js";
import * as githubApi from "./githubApi.js";

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
        const numberedFiles = files.filter((file: string) => /^\d{4}-.*\.md$/.test(file));
        if (numberedFiles.length > 0) {
            const numbers = numberedFiles.map((file: string) => parseInt(file.substring(0, 4), 10));
            const maxNumber = Math.max(...numbers);
            nextSequenceNumber = maxNumber + 1;
        }
    } catch (e: any) {
        console.warn(`Could not read specs directory or no numbered files found, starting sequence from 1: ${e.message}`);
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, '0');

    // Sanitize the provided specName for the filename slug
    const slug = specName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(specsDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return { status: "success", path: newFilePath, message: `Created new spec file: ${newFilename}` };
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
        const numberedFiles = files.filter((file: string) => /^\d{4}-.*\.md$/.test(file));
        if (numberedFiles.length > 0) {
            const numbers = numberedFiles.map((file: string) => parseInt(file.substring(0, 4), 10));
            const maxNumber = Math.max(...numbers);
            nextSequenceNumber = maxNumber + 1;
        }
    } catch (e: any) {
        console.warn(`Could not read adr directory or no numbered files found, starting sequence from 1: ${e.message}`);
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, '0');

    // Sanitize the provided adrName for the filename slug
    const slug = adrName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(adrDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return { status: "success", path: newFilePath, message: `Created new ADR file: ${newFilename}` };
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
  const changelogDir = fsUtils.joinProjectPath(targetProjectDir, "docs", "changelog");

  try {
    // Ensure directory exists
    fsUtils.createDirectory(changelogDir);

    let nextSequenceNumber = 1;
    try {
        const files = fsUtils.listDirectory(changelogDir);
        const numberedFiles = files.filter((file: string) => /^\d{4}-.*\.md$/.test(file));
        if (numberedFiles.length > 0) {
            const numbers = numberedFiles.map((file: string) => parseInt(file.substring(0, 4), 10));
            const maxNumber = Math.max(...numbers);
            nextSequenceNumber = maxNumber + 1;
        }
    } catch (e: any) {
        // If directory doesn't exist or other read error, start with 1
        console.warn(`Could not read changelog directory or no numbered files found, starting sequence from 1: ${e.message}`);
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, '0');

    // Sanitize the provided changelogName for the filename slug
    const baseName = changelogName; // changelogName is now typed as string
    const slug = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(changelogDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, entryContent);

    return { status: "success", path: newFilePath, message: `Created new changelog entry: ${newFilename}` };
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
): Promise<any> {
  console.log(`Handling save_and_upload_chat_log for: ${targetProjectDir}`);
  try {
    // 1. Get conversation history (REPLACE THIS PLACEEHOLDER)
    const conversationHistory = getConversationHistoryPlaceholder(); // TODO: Integrate with actual framework history

    // Format history into Markdown
    let formattedContent = "";
    for (const turn of conversationHistory) {
      const role = turn.role.charAt(0).toUpperCase() + turn.role.slice(1); // Capitalize role
      formattedContent += `## ${role}\n\n${turn.content}\n\n---\n\n`;
    }

    // 2. Generate filename and local path within target project's .chat dir
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.-]/g, ""); // Create a clean timestamp string
    const uniqueId = uuidv4().split("-")[0]; // Use part of a UUID for uniqueness
    const filename = `chat_${timestamp}_${uniqueId}.md`;
    const localChatDir = fsUtils.joinProjectPath(targetProjectDir, ".chat");
    const localChatPath = fsUtils.joinProjectPath(localChatDir, filename);

    // Ensure the .chat directory exists in the target project
    fsUtils.createDirectory(localChatDir);

    // 3. Save locally using direct FS
    fsUtils.writeFile(localChatPath, formattedContent);
    console.log(`Saved chat log locally to: ${localChatPath}`);

    // 4. Prepare for GitHub upload
    const githubOwner = "dwarvesf";
    const githubRepo = "prompt-log";
    const githubBranch = "main"; // Or configure/determine branch

    // Derive GitHub path based on target project name from the provided directory
    const projectName = githubApi.deriveProjectNameFromPath(targetProjectDir);
    // Path within the dwarvesf/prompt-log repo will be projectName/.chat/filename.md
    // Use path.posix.join for consistency in GitHub paths
    const githubPath = path.posix.join(projectName, ".chat", filename);

    const commitMessage = `Add chat log from ${projectName}: ${filename}`;

    // 5. Upload to GitHub using direct API call
    console.log(
      `Uploading to GitHub: ${githubOwner}/${githubRepo}/${githubPath}`,
    );
    const githubResponse = await githubApi.createOrUpdateFileInRepo(
      githubOwner,
      githubRepo,
      githubPath,
      formattedContent,
      commitMessage,
      githubBranch,
    );
    console.log(`GitHub upload finished for: ${githubPath}`);

    // Return success response including paths and potentially the GitHub URL
    return {
      status: "success",
      local_path: localChatPath,
      github_path: githubPath,
      github_url: githubResponse?.content?.html_url, // Return URL if available
      message: `Chat log saved locally and uploaded to GitHub.`,
    };
  } catch (e: any) {
    console.error(`Error during chat log save/upload: ${e.message}`);
    // Catch any other unexpected errors
    return {
      status: "error",
      message: `An error occurred during chat log save/upload: ${e.message}`,
    };
  }
}
