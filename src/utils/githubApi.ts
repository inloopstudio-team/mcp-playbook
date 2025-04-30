// src/githubApi.ts
import * as path from "path";
import { Buffer } from "buffer";
import { Octokit } from "octokit";
import { RequestError } from "@octokit/request-error";

const GITHUB_API_BASE_URL = "https://api.github.com";

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

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

  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    // The response data structure depends on whether filePath is a file or a directory.
    // Octokit's type definition for getContent is a bit complex, so we'll cast for now.
    // We also need to handle the case where the content is not found (404), which Octokit throws as an error.
    return response.data as GitHubContentsResponse;
  } catch (e: any) {
    if (e instanceof RequestError && e.status === 404) {
      console.log(`Content not found at ${filePath}. Returning empty.`);
      return []; // Return empty array for consistency when listing directory contents
    }
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

export async function getRef(
  owner: string,
  repo: string,
  ref: string,
): Promise<GitHubRef> {
  console.log(`Attempting to get ref from GitHub: ${owner}/${repo}/${ref}`);

  try {
    const response = await octokit.rest.git.getRef({
      owner,
      repo,
      ref,
    });
    return response.data as GitHubRef;
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

export async function getCommit(
  owner: string,
  repo: string,
  commitSha: string,
): Promise<GitHubCommit> {
  console.log(
    `Attempting to get commit from GitHub: ${owner}/${repo}/${commitSha}`,
  );

  try {
    const response = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });
    return response.data as GitHubCommit;
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

export async function getTree(
  owner: string,
  repo: string,
  treeSha: string,
): Promise<GitHubTree> {
  console.log(
    `Attempting to get tree from GitHub: ${owner}/${repo}/${treeSha}`,
  );

  try {
    const response = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
    });
    return response.data as GitHubTree;
  } catch (e: any) {
    console.error(`GitHub API GET tree error for ${treeSha}: ${e.message}`);
    throw e;
  }
}

interface GitHubBlobResponse {
  sha: string;
  url: string;
}

export async function createBlob(
  owner: string,
  repo: string,
  content: string,
  encoding: string = "utf-8",
): Promise<GitHubBlobResponse> {
  console.log(`Attempting to create blob in GitHub: ${owner}/${repo}`);

  const payload = {
    content: content,
    encoding: encoding,
  };

  try {
    const response = await octokit.rest.git.createBlob({
      owner,
      repo,
      ...payload,
    });
    return response.data as GitHubBlobResponse;
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

export async function createTree(
  owner: string,
  repo: string,
  treeItems: GitHubCreateTreeItem[],
  baseTreeSha?: string,
): Promise<GitHubCreateTreeResponse> {
  console.log(`Attempting to create tree in GitHub: ${owner}/${repo}`);

  const payload: any = {
    tree: treeItems,
  };
  if (baseTreeSha) {
    payload.base_tree = baseTreeSha;
  }

  try {
    const response = await octokit.rest.git.createTree({
      owner,
      repo,
      ...payload,
    });
    return response.data as GitHubCreateTreeResponse;
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

export async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentCommitSha: string,
): Promise<GitHubCreateCommitResponse> {
  console.log(`Attempting to create commit in GitHub: ${owner}/${repo}`);

  const payload = {
    message: message,
    tree: treeSha,
    parents: [parentCommitSha],
  };

  try {
    const response = await octokit.rest.git.createCommit({
      owner,
      repo,
      ...payload,
    });
    return response.data as GitHubCreateCommitResponse;
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

export async function updateRef(
  owner: string,
  repo: string,
  ref: string,
  commitSha: string,
  force: boolean = false,
): Promise<GitHubUpdateRefResponse> {
  console.log(`Attempting to update ref in GitHub: ${owner}/${repo}/${ref}`);

  const payload = {
    sha: commitSha,
    force: force,
  };

  try {
    const response = await octokit.rest.git.updateRef({
      owner,
      repo,
      ref,
      ...payload,
    });
    return response.data as GitHubUpdateRefResponse;
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

export async function searchCode(
  owner: string,
  repo: string,
  query: string,
): Promise<GitHubSearchCodeResponse> {
  console.log(
    `Attempting to search code in GitHub: ${owner}/${repo} with query "${query}"`,
  );

  try {
    const response = await octokit.rest.search.code({
      q: `${query} repo:${owner}/${repo}`,
      // GitHub Search API requires a specific Accept header for text matches
      headers: {
        Accept: "application/vnd.github.text-match+json",
      },
    });
    return response.data as GitHubSearchCodeResponse;
  } catch (e: any) {
    console.error(`GitHub API GET search code error: ${e.message}`);
    throw e;
  }
}

// Function to create a new branch
export async function createBranch(
  owner: string,
  repo: string,
  branch: string,
  fromBranch: string = "main",
): Promise<any> {
  console.log(
    `Attempting to create branch ${branch} from ${fromBranch} in ${owner}/${repo}`,
  );
  try {
    // Get the SHA of the branch to fork from
    const ref = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${fromBranch}`,
    });
    const sha = ref.data.object.sha;

    // Create the new branch
    const response = await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha,
    });
    return response.data;
  } catch (e: any) {
    console.error(`GitHub API create branch error: ${e.message}`);
    throw e;
  }
}

// Function to get a pull request
export async function getPullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<any> {
  console.log(`Attempting to get PR ${pullNumber} from ${owner}/${repo}`);
  try {
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return response.data;
  } catch (e: any) {
    console.error(`GitHub API get PR error: ${e.message}`);
    throw e;
  }
}

// Function to create a pull request
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  head: string, // branch with changes
  base: string, // branch to merge into
  body?: string,
  draft?: boolean,
  maintainerCanModify?: boolean,
): Promise<any> {
  console.log(
    `Attempting to create PR in ${owner}/${repo} from ${head} to ${base}`,
  );
  try {
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
      maintainer_can_modify: maintainerCanModify,
    });
    return response.data;
  } catch (e: any) {
    console.error(`GitHub API create PR error: ${e.message}`);
    throw e;
  }
}

// Function to get the authenticated user
export async function getMe(): Promise<any> {
  console.log("Attempting to get authenticated GitHub user");
  try {
    const response = await octokit.rest.users.getAuthenticated();
    return response.data;
  } catch (e: any) {
    console.error(`GitHub API get authenticated user error: ${e.message}`);
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
  sha?: string, // Optional SHA for updates
): Promise<any> {
  // Changed return type to any as it's not used by the new sync logic
  console.log(
    `Attempting to create/update file in GitHub: ${owner}/${repo}/${filePath} on branch ${branch}`,
  );

  const payload: any = {
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };

  if (sha) {
    payload.sha = sha;
  }

  try {
    const response: any =
      await octokit.rest.repos.createOrUpdateFileContents(payload);

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

    return response.data;
  } catch (e: any) {
    console.error(`GitHub API request error for ${filePath}: ${e.message}`);
    throw e; // Re-throw for the tool handler
  }
}
