// src/githubApi.ts
import * as path from 'path';
import fetch, { Response } from 'node-fetch';
import { Buffer } from 'buffer';

const GITHUB_API_BASE_URL = "https://api.github.com";

function getGithubAuthHeader(): { [key: string]: string } {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
        throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.");
    }
    return {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
}

interface GitHubCommitResponse {
    content: {
        name: string;
        path: string;
        sha: string;
        size: number;
        url: string;
        html_url: string;
        git_url: string;
        download_url: string | null;
        type: string; // file
        _links: {
            self: string;
            git: string;
            html: string;
        };
    };
    commit: {
        sha: string;
        node_id: string;
        url: string;
        html_url: string;
        author: { name: string | null; email: string | null; date: string }; // Author can be null
        committer: { name: string | null; email: string | null; date: string }; // Committer can be null
        tree: { sha: string; url: string };
        message: string;
        parents: Array<{ sha: string; url: string; html_url: string }>;
        verification?: { // Optional field
            verified: boolean;
            reason: string;
            signature: string | null;
            payload: string | null;
        };
    };
    // Add other potential fields like 'files' for updates if needed, but not required for this tool
}


export async function createOrUpdateFileInRepo(
    owner: string,
    repo: string,
    filePath: string, // This is the path WITHIN the GitHub repo (e.g., project-name/.chat/log.md)
    content: string,
    message: string,
    branch: string = "main" // Default branch, can make configurable
): Promise<GitHubCommitResponse> {
    console.log(`Attempting to create/update file in GitHub: ${owner}/${repo}/${filePath} on branch ${branch}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}`;

    const headers = getGithubAuthHeader();
    const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

    // For chat logs with unique names, we will use PUT assuming creation or simple overwrite.
    // A more robust implementation for general file updates might need a GET first to retrieve the SHA.

    const payload = {
        message: message,
        content: encodedContent,
        branch: branch,
        // sha: sha // Include SHA here if doing an actual update based on GET result
    };

    try {
        const response: Response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
             let errorDetail = `Status: ${response.status} ${response.statusText}`;
             try {
                 // Attempt to parse JSON body for more specific error info
                 const errorBody = await response.json();
                 errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
                 console.error(`GitHub API error response body:`, errorBody);
             } catch (jsonErr) {
                 // If JSON parsing fails, try getting the raw text body
                 try {
                     const textBody = await response.text();
                     errorDetail += `, Raw Body: ${textBody}`;
                     console.error(`GitHub API raw error response body:`, textBody);
                 } catch (textErr) {
                    console.error("Could not read GitHub API error response body.");
                 }
             }
            throw new Error(`GitHub API request failed for ${filePath}: ${errorDetail}`);
        }

        const responseData = await response.json() as GitHubCommitResponse;
        console.log(`GitHub API response status: ${response.status}`);

        if (response.status === 201) {
            console.log(`Successfully created file in GitHub: ${filePath}`);
        } else if (response.status === 200) {
             console.log(`Successfully updated file in GitHub: ${filePath}`);
        } else {
             console.warn(`Unexpected successful GitHub API status code: ${response.status} for ${filePath}`);
             // Still consider it a success if status is 200 or 201, but log the unexpected code
        }

        return responseData;

    } catch (e: any) {
        console.error(`GitHub API request error for ${filePath}: ${e.message}`);
        throw e; // Re-throw for the tool handler
    }
}

// Utility to derive a project name from a path
export function deriveProjectNameFromPath(projectPath: string): string {
     const normalizedPath = path.normalize(projectPath);
     // Return the last segment of the path as the project name
     return path.basename(normalizedPath);
}
