import * as path from "path";
import {
  CreateChangelogArgs,
  CreateChangelogArgsSchema,
} from "../tools/createChangelog.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";
import { injectAuthorIntoFrontmatter } from "../utils/frontmatterUtils.js";

export async function handleUpdateChangelog(
  args: CreateChangelogArgs,
): Promise<any> {
  try {
    const { entry_content, changelog_name, branch_name, commit_message, pr_title, pr_body } = validateArgs(
      CreateChangelogArgsSchema,
      args,
    );

    const githubOwner = "inloopstudio";
    const githubRepo = "inloop-private-docs";
    const baseBranch = "main"; // Target branch for the PR
    const baseRepoPath = "src/content/docs/product_engineering/changelogs"; // Path for changelog entries

    console.error(`Handling create_changelog for: ${githubOwner}/${githubRepo}/${baseRepoPath}`);

    // Get authenticated user and inject into frontmatter
    const user = await githubApi.getMe();
    const username = user.login;
    console.error(`Authenticated user: ${username}`);

    // Inject the authenticated user into the frontmatter using the utility function
    const contentToUse = injectAuthorIntoFrontmatter(entry_content, username);

    // Determine the next sequence number by listing files in the target directory on GitHub
    let nextSequenceNumber = 1;
    try {
      const files = await githubApi.getContents(
        githubOwner,
        githubRepo,
        baseRepoPath,
        baseBranch
      );
      if (Array.isArray(files) && files.length > 0) {
         const numberedFiles = files.filter((file: any) => file.type === 'file' && /^\d{4}-.*\.md$/.test(file.name));
         if (numberedFiles.length > 0) {
           const numbers = numberedFiles.map((file: any) =>
             parseInt(file.name.substring(0, 4), 10)
           );
           const maxNumber = Math.max(...numbers);
           nextSequenceNumber = maxNumber + 1;
         }
       }
    } catch (e: any) {
      console.warn(
        `Could not read changelog directory on GitHub or no numbered files found, starting sequence from 1: ${e.message}`
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided changelogName for the filename slug
    const slug = changelog_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const targetFilePath = path.posix.join(baseRepoPath, newFilename);

    // Determine branch name (generate new if not provided)
    let headBranch = branch_name;
    if (!headBranch) {
      headBranch = `docs/add-changelog-${slug}`;
    }

    // Create the new branch
    console.error(`Creating new branch: ${headBranch}`);
    await githubApi.createBranch(
      githubOwner,
      githubRepo,
      headBranch,
      baseBranch,
    );

    // Create blob, tree, commit, and update ref (similar to suggestRunbook)
    // Get the latest commit SHA of the base branch
    const ref = await githubApi.getRef(githubOwner, githubRepo, `heads/${baseBranch}`);
    const baseCommit = await githubApi.getCommit(githubOwner, githubRepo, ref.object.sha);
    const baseTreeSha = baseCommit.tree.sha;

    // Create a new blob with the file content
    const blob = await githubApi.createBlob(githubOwner, githubRepo, contentToUse);

    // Create a new tree with the new file
    const tree = await githubApi.createTree(githubOwner, githubRepo, [
      {
        path: targetFilePath,
        mode: '100644', // file mode (blob)
        type: 'blob',
        sha: blob.sha,
      },
    ], baseTreeSha);

    // Create a new commit
    const finalCommitMessage = commit_message || `docs: add changelog ${newFilename}`;
    const newCommit = await githubApi.createCommit(
      githubOwner,
      githubRepo,
      finalCommitMessage,
      tree.sha,
      baseCommit.sha
    );

    // Update the head branch to point to the new commit
    await githubApi.updateRef(githubOwner, githubRepo, `heads/${headBranch}`, newCommit.sha);

    // Create a new Pull Request
    const finalPrTitle = pr_title || `docs: Add changelog entry ${newFilename}`;
    const defaultPrBody = `This PR suggests a new changelog entry:\n\n${contentToUse}\n\nThis entry was created using the mcp-playbook tool.`;
    const finalPrBody = pr_body || defaultPrBody;

    console.error(`Creating new PR from ${headBranch} to ${baseBranch}`);
    const newPr = await githubApi.createPullRequest(
      githubOwner,
      githubRepo,
      finalPrTitle,
      headBranch,
      baseBranch,
      finalPrBody,
      false, // Not a draft by default
      true, // Allow maintainer edits
    );

    return {
      status: "success",
      pr_number: newPr.number,
      pr_url: newPr.html_url,
      message: `Successfully created changelog entry and opened PR #${newPr.number}`,
    };
  } catch (e: any) {
    console.error(`Error in handleUpdateChangelog: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create changelog entry and open PR: ${e.message}`,
    };
  }
}
