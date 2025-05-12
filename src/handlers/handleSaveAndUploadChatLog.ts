// src/handlers/handleSaveAndUploadChatLog.ts

import * as path from 'path';
import * as fs from 'fs/promises'; // Use promises version for async operations
import * as fsSync from 'fs'; // For existsSync
import { Buffer } from 'buffer'; // Required for base64 encoding
// Need a library for making HTTP requests, like node-fetch.
// import fetch from 'node-fetch'; // This dependency must be added to package.json and installed.
// Assuming a placeholder or a separate module handles GitHub API calls.
// As per the README, the server implements GitHub interactions directly.
// A simple fetch call placeholder will be added for now.

import { getCursorConversationHistory, formatConversationHistory } from './parser/cursorChatParser.js'; // Import with .js extension

// Assuming the tool definition in src/index.ts will call this function
// with targetProjectDir, userId, and optionally editorType.
export async function handleSaveAndUploadChatLog(targetProjectDir: string, userId: string, editorType: string = 'cursor'): Promise<any> {

    console.log(`Handling save and upload chat log for user: ${userId} in project: ${targetProjectDir}`);
    console.log(`Attempting to get history for editor type: ${editorType}`);

    let conversationHistory = null;

    // Get conversation history based on editor type
    if (editorType === 'cursor') {
        // Pass the targetProjectDir to the Cursor parser
        conversationHistory = await getCursorConversationHistory(targetProjectDir);
    } else {
        console.warn(`Unsupported editor type: ${editorType}`);
        return { status: 'error', message: `Unsupported editor type: ${editorType}` };
    }

    // Check if history was successfully retrieved
    if (!conversationHistory || (Array.isArray(conversationHistory.messages) && conversationHistory.messages.length === 0)) {
        const message = `Could not retrieve or found no conversation history for editor type: ${editorType} for project ${targetProjectDir}.`;
        console.warn(message);
        // Return an error as there's no history to save based on the current logic.
        return { status: 'error', message: message };
    }

    // Format the retrieved history into markdown
    const chatLogContent = formatConversationHistory(conversationHistory); // Use the imported formatter

    // --- Logic to save and upload the file using Node.js APIs ---
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    // Sanitize userId for filename
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Use a slug from the project path or workspace name for the filename
     const projectSlug = conversationHistory.workspaceName
                           ? conversationHistory.workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')
                           : path.basename(conversationHistory.projectPath || '').replace(/[^a-zA-Z0-9_-]/g, '_'); // Added check for conversationHistory.projectPath
    const chatLogFilename = `chat_log_${safeUserId}_${projectSlug}_${timestamp}.md`;
    const localChatDir = path.join(targetProjectDir, '.chat');
    const localFilePath = path.join(localChatDir, chatLogFilename);
    const githubFilePath = `prompt-logs/${safeUserId}/${chatLogFilename}`; // Path in the GitHub repo

    console.log(`Saving chat log locally to: ${localFilePath}`);
    console.log(`Uploading chat log to GitHub path: ${githubFilePath}`);


    try {
        // Ensure the local .chat directory exists using Node.js fs
        await fs.mkdir(localChatDir, { recursive: true });
        console.log(`Local directory ensured: ${localChatDir}`);

        // Save the chat log locally using Node.js fs
        await fs.writeFile(localFilePath, chatLogContent, 'utf-8');
        console.log(`Chat log saved locally: ${localFilePath}`);


        // Upload the chat log to the GitHub repository using a Node.js HTTP library (e.g., node-fetch)
        // This part needs a proper implementation using GitHub API and authentication (GITHUB_PERSONAL_ACCESS_TOKEN).
        // As per README, this server implements GitHub interactions directly.
        const githubOwner = 'dwarvesf';
        const githubRepo = 'prompt-log';
        const githubBranch = 'main'; // Or a configurable branch
        const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN; // Get token from environment variables

        if (!githubToken) {
            console.error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.');
            return { status: 'error', message: 'GitHub token not configured for upload.' };
        }

        console.log(`Attempting to upload to github.com/${githubOwner}/${githubRepo} on branch ${githubBranch}`);

        // --- Placeholder for GitHub API upload using node-fetch ---
        // This needs to be replaced with a proper implementation that interacts with the GitHub Content API (PUT /repos/{owner}/{repo}/contents/{path})
        // and handles checking for existing files (GET) if updates are needed (though we are creating new files here).
        // A dedicated module for GitHub API calls would be cleaner.

        // Example structure (requires node-fetch dependency and proper API call details):
        /*
        const githubApiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${githubFilePath}`;
        const base64Content = Buffer.from(chatLogContent).toString('base64');

        const uploadResponse = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                 // GitHub API requires Accept header for certain previews, might be needed depending on API version
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Add chat log for ${userId} - ${projectSlug} (${timestamp})`,
                content: base64Content,
                branch: githubBranch,
                 // Optional: sha if updating an existing file, but we are creating new ones
                // sha: '...'
            })
        });

        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            console.error(`GitHub API upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`, errorBody);
            return { status: 'error', message: `GitHub upload failed: ${uploadResponse.statusText}` };
        }

        const uploadResult = await uploadResponse.json();
        console.log('Chat log uploaded to GitHub successfully.');

        return {
            status: 'success',
            local_path: localFilePath,
            github_path: githubFilePath,
            github_url: uploadResult.content?.html_url, // Adjust based on actual API response structure
            commit_sha: uploadResult.commit?.sha,
            commit_url: uploadResult.commit?.html_url,
            message: 'Chat log saved locally and uploaded to GitHub.'
        };
        */
        // --- End Placeholder ---

        console.warn("GitHub upload logic is currently a placeholder and requires node-fetch and GitHub API implementation.");
        // Returning a placeholder success for now, but the real upload needs to be implemented.
         return {
            status: 'success',
            local_path: localFilePath,
            github_path: githubFilePath,
            github_url: 'placeholder_github_url',
            commit_sha: 'placeholder_commit_sha',
            commit_url: 'placeholder_commit_url',
            message: 'Chat log saved locally. GitHub upload placeholder.'
        };


    } catch (error: any) { // Explicitly type error as any
        console.error('An unexpected error occurred during save and upload:', error);
        return { status: 'error', message: `An unexpected error occurred: ${error.message}` };
    }
}

// Note: This handler now uses Node.js built-in modules (fs, path, buffer, os).
// The GitHub upload logic is a placeholder and requires implementing HTTP requests
// to the GitHub API, ideally using a library like 'node-fetch', which needs
// to be added as a project dependency (`npm install node-fetch`).
// Ensure the GITHUB_PERSONAL_ACCESS_TOKEN environment variable is set for the server process.
