import * as path from "path";
import { CreateAdrArgs, CreateAdrArgsSchema } from "../tools/createAdr.js";
import { injectAuthorIntoFrontmatter } from "../utils/frontmatterUtils.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleCreateAdr(args: CreateAdrArgs): Promise<any> {
  try {
    const {
      adr_name,
      content,
      branch_name,
      commit_message,
      pr_title,
      pr_body,
    } = validateArgs(CreateAdrArgsSchema, args);

    const githubOwner = "inloopstudio";
    const githubRepo = "inloop-private-docs";
    const baseBranch = "main"; // Target branch for the PR
    const baseRepoPath = "src/content/docs/product_engineering/adrs"; // Correct path for ADRs

    console.error(
      `Handling create_adr for: ${githubOwner}/${githubRepo}/${baseRepoPath}, adr: ${adr_name}`,
    );

    // Get authenticated user and inject into frontmatter
    const user = await githubApi.getMe();
    const username = user.login;
    console.error(`Authenticated user: ${username}`);

    // Inject the authenticated user into the frontmatter using the utility function
    const contentToUse = injectAuthorIntoFrontmatter(content, username);

    // Sanitize the provided adrName for the filename slug
    const slug = adr_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${slug}.md`;
    const targetFilePath = path.posix.join(baseRepoPath, newFilename);

    // Determine branch name (generate new if not provided)
    let headBranch = branch_name;
    if (!headBranch) {
      headBranch = `docs/add-adr-${slug}`;
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
    const ref = await githubApi.getRef(
      githubOwner,
      githubRepo,
      `heads/${baseBranch}`,
    );
    const baseCommit = await githubApi.getCommit(
      githubOwner,
      githubRepo,
      ref.object.sha,
    );
    const baseTreeSha = baseCommit.tree.sha;

    // Create a new blob with the file content
    const blob = await githubApi.createBlob(
      githubOwner,
      githubRepo,
      contentToUse,
    );

    // Create a new tree with the new file
    const tree = await githubApi.createTree(
      githubOwner,
      githubRepo,
      [
        {
          path: targetFilePath,
          mode: "100644", // file mode (blob)
          type: "blob",
          sha: blob.sha,
        },
      ],
      baseTreeSha,
    );

    // Create a new commit
    const finalCommitMessage = commit_message || `docs: add adr ${newFilename}`;
    const newCommit = await githubApi.createCommit(
      githubOwner,
      githubRepo,
      finalCommitMessage,
      tree.sha,
      baseCommit.sha,
    );

    // Update the head branch to point to the new commit
    await githubApi.updateRef(
      githubOwner,
      githubRepo,
      `heads/${headBranch}`,
      newCommit.sha,
    );

    // Create a new Pull Request
    const finalPrTitle = pr_title || `docs: Add ADR ${newFilename}`;
    const defaultPrBody = `This PR suggests a new Architectural Decision Record (ADR):

${contentToUse}

This entry was created using the mcp-playbook tool.`;
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
      message: `Successfully created ADR file and opened PR #${newPr.number}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateAdr: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create ADR file and open PR: ${e.message}`,
    };
  }
}
