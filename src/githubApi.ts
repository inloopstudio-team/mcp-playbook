// src/githubApi.ts
import * as path from "path";
import fetch, { Response } from "node-fetch";
import { Buffer } from "buffer";

const GITHUB_API_BASE_URL = "https://api.github.com";

function getGithubAuthHeader(): { [key: string]: string } {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.",
    );
  }
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string; // file or dir
  content?: string; // Add content property for file content (base64 encoded)
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

// Define a type that can be a single item or an array of items
type GitHubContentsResponse = GitHubContentItem | GitHubContentItem[];


export async function getContents(
  owner: string,
  repo: string,
  filePath: string, // This is the path WITHIN the GitHub repo
  branch: string = "main", // Default branch
): Promise<GitHubContentsResponse> {
  console.log(
    `Attempting to get contents from GitHub: ${owner}/${repo}/${filePath} on branch ${branch}`,
  );
  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  const headers = getGithubAuthHeader();

  try {
    const response: Response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
       // If the file/directory doesn't exist, GitHub returns 404.
       // We should not throw an error in this specific case, but return an empty array or null
       if (response.status === 404) {
           console.log(`Content not found at ${filePath}. Returning empty.`);
           return []; // Return empty array for consistency when listing directory contents
       }

      let errorDetail = `Status: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
        console.error(`GitHub API error response body:`, errorBody);
      } catch (jsonErr) {
        try {
          const textBody = await response.text();
          errorDetail += `, Raw Body: ${textBody}`;
          console.error(`GitHub API raw error response body:`, textBody);
        } catch (textErr) {
          console.error("Could not read GitHub API error response body.");
        }
      }
      throw new Error(
        `GitHub API GET request failed for ${filePath}: ${errorDetail}`,
      );
    }

    const responseData = (await response.json()) as GitHubContentsResponse;
    console.log(`GitHub API response status: ${response.status}`);

    return responseData;
  } catch (e: any) {
    console.error(`GitHub API GET request error for ${filePath}: ${e.message}`);
    throw e; // Re-throw for the tool handler
  }
}

// Git Database API Functions for creating a single commit

interface GitHubRef {
    object: {
        sha: string;
        type: string;
        url: string;
    };
    ref: string;
    url: string;
    node_id: string;
}

export async function getRef(owner: string, repo: string, ref: string): Promise<GitHubRef> {
    console.log(`Attempting to get ref from GitHub: ${owner}/${repo}/${ref}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/ref/${ref}`;
    const headers = getGithubAuthHeader();

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`GitHub API GET ref failed for ${ref}: Status: ${response.status} ${response.statusText}`);
        }
        return await response.json() as GitHubRef;
    } catch (e: any) {
        console.error(`GitHub API GET ref error for ${ref}: ${e.message}`);
        throw e;
    }
}

interface GitHubCommit {
    sha: string;
    node_id: string;
    url: string;
    html_url: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    tree: { sha: string; url: string };
    message: string;
    parents: Array<{ sha: string; url: string; html_url: string }>;
    verification?: {
        verified: boolean;
        reason: string;
        signature: string | null;
        payload: string | null;
    };
}

export async function getCommit(owner: string, repo: string, commitSha: string): Promise<GitHubCommit> {
    console.log(`Attempting to get commit from GitHub: ${owner}/${repo}/${commitSha}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/commits/${commitSha}`;
    const headers = getGithubAuthHeader();

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`GitHub API GET commit failed for ${commitSha}: Status: ${response.status} ${response.statusText}`);
        }
        return await response.json() as GitHubCommit;
    } catch (e: any) {
        console.error(`GitHub API GET commit error for ${commitSha}: ${e.message}`);
        throw e;
    }
}

interface GitHubTreeItem {
    path: string;
    mode: string; // e.g., '100644' for file, '040000' for directory
    type: string; // 'blob' or 'tree'
    sha: string;
    size?: number; // Only for blobs
    url: string;
}

interface GitHubTree {
    sha: string;
    url: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
}

export async function getTree(owner: string, repo: string, treeSha: string): Promise<GitHubTree> {
    console.log(`Attempting to get tree from GitHub: ${owner}/${repo}/${treeSha}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/trees/${treeSha}`;
    const headers = getGithubAuthHeader();

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`GitHub API GET tree failed for ${treeSha}: Status: ${response.status} ${response.statusText}`);
        }
        return await response.json() as GitHubTree;
    } catch (e: any) {
        console.error(`GitHub API GET tree error for ${treeSha}: ${e.message}`);
        throw e;
    }
}

interface GitHubBlobResponse {
    sha: string;
    url: string;
}

export async function createBlob(owner: string, repo: string, content: string, encoding: string = 'utf-8'): Promise<GitHubBlobResponse> {
    console.log(`Attempting to create blob in GitHub: ${owner}/${repo}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/blobs`;
    const headers = getGithubAuthHeader();

    const payload = {
        content: content,
        encoding: encoding,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
            } catch (jsonErr) { /* ignore */ }
            throw new Error(`GitHub API POST blob failed: ${errorDetail}`);
        }
        return await response.json() as GitHubBlobResponse;
    } catch (e: any) {
        console.error(`GitHub API POST blob error: ${e.message}`);
        throw e;
    }
}

export interface GitHubCreateTreeItem {
    path: string;
    mode: string; // e.g., '100644' for file, '040000' for directory
    type: string; // 'blob' or 'tree'
    sha: string; // SHA of the blob or tree
}

interface GitHubCreateTreeResponse {
    sha: string;
    url: string;
    tree: GitHubCreateTreeItem[];
    truncated: boolean;
}

export async function createTree(owner: string, repo: string, treeItems: GitHubCreateTreeItem[], baseTreeSha?: string): Promise<GitHubCreateTreeResponse> {
    console.log(`Attempting to create tree in GitHub: ${owner}/${repo}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/trees`;
    const headers = getGithubAuthHeader();

    const payload: any = {
        tree: treeItems,
    };
    if (baseTreeSha) {
        payload.base_tree = baseTreeSha;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
            } catch (jsonErr) { /* ignore */ }
            throw new Error(`GitHub API POST tree failed: ${errorDetail}`);
        }
        return await response.json() as GitHubCreateTreeResponse;
    } catch (e: any) {
        console.error(`GitHub API POST tree error: ${e.message}`);
        throw e;
    }
}

interface GitHubCreateCommitResponse {
    sha: string;
    node_id: string;
    url: string;
    html_url: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    tree: { sha: string; url: string };
    message: string;
    parents: Array<{ sha: string; url: string; html_url: string }>;
    verification?: {
        verified: boolean;
        reason: string;
        signature: string | null;
        payload: string | null;
    };
}


export async function createCommit(owner: string, repo: string, message: string, treeSha: string, parentCommitSha: string): Promise<GitHubCreateCommitResponse> {
    console.log(`Attempting to create commit in GitHub: ${owner}/${repo}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/commits`;
    const headers = getGithubAuthHeader();

    const payload = {
        message: message,
        tree: treeSha,
        parents: [parentCommitSha],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
            } catch (jsonErr) { /* ignore */ }
            throw new Error(`GitHub API POST commit failed: ${errorDetail}`);
        }
        return await response.json() as GitHubCreateCommitResponse;
    } catch (e: any) {
        console.error(`GitHub API POST commit error: ${e.message}`);
        throw e;
    }
}

interface GitHubUpdateRefResponse {
    object: {
        sha: string;
        type: string;
        url: string;
    };
    ref: string;
    url: string;
    node_id: string;
}

export async function updateRef(owner: string, repo: string, ref: string, commitSha: string, force: boolean = false): Promise<GitHubUpdateRefResponse> {
    console.log(`Attempting to update ref in GitHub: ${owner}/${repo}/${ref}`);
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/refs/${ref}`;
    const headers = getGithubAuthHeader();

    const payload = {
        sha: commitSha,
        force: force,
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
            } catch (jsonErr) { /* ignore */ }
            throw new Error(`GitHub API PATCH ref failed: ${errorDetail}`);
        }
        return await response.json() as GitHubUpdateRefResponse;
    } catch (e: any) {
        console.error(`GitHub API PATCH ref error: ${e.message}`);
    throw e;
  }
}

export interface GitHubSearchCodeResultItem {
    name: string;
    path: string;
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
    repository: {
        id: number;
        node_id: string;
        name: string;
        full_name: string;
        private: boolean;
        owner: {
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
        };
        html_url: string;
        description: string | null;
        fork: boolean;
        url: string;
        forks_url: string;
        keys_url: string;
        collaborators_url: string;
        teams_url: string;
        hooks_url: string;
        issue_events_url: string;
        events_url: string;
        assignees_url: string;
        branches_url: string;
        tags_url: string;
        blobs_url: string;
        git_tags_url: string;
        git_refs_url: string;
        trees_url: string;
        statuses_url: string;
        languages_url: string;
        stargazers_url: string;
        contributors_url: string;
        subscribers_url: string;
        subscription_url: string;
        commits_url: string;
        git_commits_url: string;
        comments_url: string;
        issue_comment_url: string;
        contents_url: string;
        compare_url: string;
        merges_url: string;
        archive_url: string;
        downloads_url: string;
        issues_url: string;
        pulls_url: string;
        milestones_url: string;
        notifications_url: string;
        labels_url: string;
        releases_url: string;
        deployments_url: string;
        created_at: string;
        updated_at: string;
        pushed_at: string;
        git_url: string;
        ssh_url: string;
        clone_url: string;
        svn_url: string;
        homepage: string | null;
        size: number;
        stargazers_count: number;
        watchers_count: number;
        language: string | null;
        has_issues: boolean;
        has_projects: boolean;
        has_downloads: boolean;
        has_wiki: boolean;
        has_pages: boolean;
        has_discussions: boolean;
        forks_count: number;
        mirror_url: string | null;
        archived: boolean;
        disabled: boolean;
        open_issues_count: number;
        license: {
            key: string;
            name: string;
            spdx_id: string;
            url: string;
            node_id: string;
        } | null;
        allow_forking: boolean;
        is_template: boolean;
        web_commit_signoff_required: boolean;
        topics: string[];
        visibility: string;
        forks: number;
        open_issues: number;
        watchers: number;
        default_branch: string;
        score: number;
    };
    score: number;
    // Note: The GitHub API response for search code includes 'text_matches'
    // which provides snippets. We should include this in the type definition.
    text_matches?: Array<{
        object_url: string;
        object_type: string;
        property: string;
        fragment: string; // The snippet
        matches: Array<{
            text: string;
            indices: [number, number];
        }>;
    }>;
}

interface GitHubSearchCodeResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubSearchCodeResultItem[];
}

export async function searchCode(owner: string, repo: string, query: string): Promise<GitHubSearchCodeResponse> {
    console.log(`Attempting to search code in GitHub: ${owner}/${repo} with query "${query}"`);
    // The search query format is "q=keyword+in:file+repo:owner/repo"
    const encodedQuery = encodeURIComponent(`${query} repo:${owner}/${repo}`);
    const url = `${GITHUB_API_BASE_URL}/search/code?q=${encodedQuery}`;

    const headers = getGithubAuthHeader();
    // GitHub Search API requires a specific Accept header for text matches
    headers['Accept'] = 'application/vnd.github.text-match+json';


    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetail += `, Body: ${JSON.stringify(errorBody, null, 2)}`;
            } catch (jsonErr) { /* ignore */ }
            throw new Error(`GitHub API GET search code failed: ${errorDetail}`);
        }
        return await response.json() as GitHubSearchCodeResponse;
    } catch (e: any) {
        console.error(`GitHub API GET search code error: ${e.message}`);
        throw e;
    }
}


// Utility to derive a project name from a path
export function deriveProjectNameFromPath(projectPath: string): string {
  const normalizedPath = path.normalize(projectPath);
  // Return the last segment of the path as the project name
  return path.basename(normalizedPath);
}

// Keep the old createOrUpdateFileInRepo for now, although it won't be used by chat log sync
export async function createOrUpdateFileInRepo(
  owner: string,
  repo: string,
  filePath: string, // This is the path WITHIN the GitHub repo (e.g., project-name/.chat/log.md)
  content: string,
  message: string,
  branch: string = "main", // Default branch, can make configurable
  sha?: string // Optional SHA for updates
): Promise<any> { // Changed return type to any as it's not used by the new sync logic
  console.log(
    `Attempting to create/update file in GitHub: ${owner}/${repo}/${filePath} on branch ${branch}`,
  );
  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}`;

  const headers = getGithubAuthHeader();
  const encodedContent = Buffer.from(content, "utf-8").toString("base64");

  const payload: any = { // Use 'any' for now to easily add optional sha
    message: message,
    content: encodedContent,
    branch: branch,
  };

  if (sha) {
    payload.sha = sha;
  }

  try {
    const response: Response = await fetch(url, {
      method: "PUT",
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
      throw new Error(
        `GitHub API request failed for ${filePath}: ${errorDetail}`,
      );
    }

    const responseData = (await response.json()) as any; // Changed type to any
    console.log(`GitHub API response status: ${response.status}`);

    if (response.status === 201) {
      console.log(`Successfully created file in GitHub: ${filePath}`);
    } else if (response.status === 200) {
      console.log(`Successfully updated file in GitHub: ${filePath}`);
    } else {
      console.warn(
        `Unexpected successful GitHub API status code: ${response.status} for ${filePath}`,
      );
      // Still consider it a success if status is 200 or 201, but log the unexpected code
    }

    return responseData;
  } catch (e: any) {
    console.error(`GitHub API request error for ${filePath}: ${e.message}`);
    throw e; // Re-throw for the tool handler
  }
}
