// src/handlers.ts
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fsUtils from './fsUtils.js';
import * as githubApi from './githubApi.js';

// Placeholder for conversation history retrieval
// In a real MCP server, this would be provided by the framework hosting the server.
// This function needs to access the framework's conversation state.
interface ConversationTurn {
    role: 'user' | 'model';
    content: string;
}

// IMPORTANT: Replace this placeholder with actual logic to get conversation history
function getConversationHistoryPlaceholder(): ConversationTurn[] {
    console.warn("WARNING: Using placeholder conversation history! Replace with actual framework integration.");
    // This is a dummy implementation for planning purposes.
    // A real implementation would access the conversation history from the MCP server framework.
    return [
        { role: 'user', content: 'Hello, this is a test conversation for the log.' },
        { role: 'model', content: 'This is the model\'s first reply.' },
        { role: 'user', content: 'And this is a follow-up message, asking to save the log.' },
    ];
}


// Define the handlers corresponding to the MCP tools
export async function handleInitPlaybook(): Promise<any> {
    console.log('Handling init_playbook');
    const instruction = `You are interacting with the MCP Playbook server. This server is designed to assist you in managing project documentation and conversation logs within a user-specified target project directory.

Key Capabilities:
- Initialize a standard documentation structure (docs/, docs/specs/, docs/adr/, docs/changelog/, .chat/).
- Create or update specification files (PRD, RFC) in docs/specs/.
- Create or update Architectural Decision Records (ADR) in docs/adr/.
- Append entries to the changelog in docs/changelog/changelog.md.
- Save and upload conversation logs to a designated GitHub repository (.chat/).

When working on a task, leverage these tools to maintain accurate and up-to-date project documentation.

Upon completing a task or reaching a significant milestone, ensure your progress is documented using the appropriate tools (e.g., create_spec, create_adr, update_changelog) and that the conversation history is saved and synced using the save_and_upload_chat_log tool.`;
    return { instruction };
}

export async function handleInitializeDocsStructure(targetProjectDir: string): Promise<any> {
    console.log(`Handling initialize_docs_structure for: ${targetProjectDir}`);
    try {
        // Use fsUtils to create directories
        fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, "docs"));
        fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, "docs", "specs"));
        fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, "docs", "adr"));
        fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, "docs", "changelog"));
        fsUtils.createDirectory(fsUtils.joinProjectPath(targetProjectDir, ".chat")); // Also create .chat here

        return { status: "success", message: "Documentation structure initialized." };
    } catch (e: any) {
        console.error(`Error in handleInitializeDocsStructure: ${e.message}`);
        return { status: "error", message: `Failed to initialize structure: ${e.message}` };
    }
}

export async function handleCreateSpec(targetProjectDir: string, specName: string, content: string): Promise<any> {
    console.log(`Handling create_spec for: ${targetProjectDir}, spec: ${specName}`);
    // Ensure specName doesn't contain path separators to avoid traversal issues
    const cleanSpecName = specName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Basic sanitization
    const filePath = fsUtils.joinProjectPath(targetProjectDir, "docs", "specs", `${cleanSpecName}.md`);
    try {
        fsUtils.writeFile(filePath, content);
        return { status: "success", path: filePath };
    } catch (e: any) {
        console.error(`Error in handleCreateSpec: ${e.message}`);
        return { status: "error", message: `Failed to create spec file: ${e.message}` };
    }
}


export async function handleCreateAdr(targetProjectDir: string, adrName: string, content: string): Promise<any> {
    console.log(`Handling create_adr for: ${targetProjectDir}, adr: ${adrName}`);
     // Ensure adrName doesn't contain path separators
    const cleanAdrName = adrName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Basic sanitization
    const filePath = fsUtils.joinProjectPath(targetProjectDir, "docs", "adr", `${cleanAdrName}.md`);
    try {
        fsUtils.writeFile(filePath, content);
        return { status: "success", path: filePath };
    } catch (e: any) {
        console.error(`Error in handleCreateAdr: ${e.message}`);
        return { status: "error", message: `Failed to create ADR file: ${e.message}` };
    }
}

export async function handleUpdateChangelog(targetProjectDir: string, entryContent: string): Promise<any> {
    console.log(`Handling update_changelog for: ${targetProjectDir}`);
    const filePath = fsUtils.joinProjectPath(targetProjectDir, "docs", "changelog", "changelog.md");
    try {
        // Read existing content, handle file not existing
        let existingContent = "";
        try {
            existingContent = fsUtils.readFile(filePath);
        } catch (e: any) {
             if ((e as any).code !== 'ENOENT') {
                  // Re-throw if it's an actual read error, not just not found
                   throw e;
             }
             // File not found is expected sometimes, start with empty
             console.warn(`Changelog file not found at ${filePath}, starting fresh.`);
        }

        // Append new entry (example simple format)
        const now = new Date();
        const timestamp = now.toISOString(); // ISO format is good for sorting
        const newEntry = `\n\n## ${timestamp}\n\n${entryContent}\n`; // Add new entry structure

        // Write updated content back
        fsUtils.writeFile(filePath, existingContent + newEntry); // Append new entry
        return { status: "success", path: filePath };
    } catch (e: any) {
         console.error(`Error in handleUpdateChangelog: ${e.message}`);
        return { status: "error", message: `Failed to update changelog: ${e.message}` };
    }
}

export async function handleSaveAndUploadChatLog(targetProjectDir: string): Promise<any> {
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
        const timestamp = now.toISOString().replace(/[:.-]/g, ''); // Create a clean timestamp string
        const uniqueId = uuidv4().split('-')[0]; // Use part of a UUID for uniqueness
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
        console.log(`Uploading to GitHub: ${githubOwner}/${githubRepo}/${githubPath}`);
        const githubResponse = await githubApi.createOrUpdateFileInRepo(
            githubOwner,
            githubRepo,
            githubPath,
            formattedContent,
            commitMessage,
            githubBranch
        );
        console.log(`GitHub upload finished for: ${githubPath}`);


        // Return success response including paths and potentially the GitHub URL
        return {
            status: "success",
            local_path: localChatPath,
            github_path: githubPath,
            github_url: githubResponse?.content?.html_url, // Return URL if available
            message: `Chat log saved locally and uploaded to GitHub.`
        };

    } catch (e: any) {
        console.error(`Error during chat log save/upload: ${e.message}`);
        // Catch any other unexpected errors
        return { status: "error", message: `An error occurred during chat log save/upload: ${e.message}` };
    }
}
