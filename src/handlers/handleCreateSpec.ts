import * as path from "path";
import { CreateSpecArgs, CreateSpecArgsSchema } from "../tools/createSpec.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";
import { injectAuthorIntoFrontmatter } from "../utils/frontmatterUtils.js";

export async function handleCreateSpec(args: CreateSpecArgs): Promise<any> {
  try {
    const { spec_name, content, branch_name, commit_message, pr_title, pr_body } = validateArgs(
      CreateSpecArgsSchema,
      args,
    );

    const githubOwner = "inloopstudio";
    const githubRepo = "inloop-private-docs";
    const baseBranch = "main"; // Target branch for the PR
    const baseRepoPath = "src/content/docs/product_engineering/specs";

    console.error(
      `Handling create_spec for: ${githubOwner}/${githubRepo}/${baseRepoPath}, spec: ${spec_name}`,
    );

    // Get authenticated user and inject into frontmatter
    const user = await githubApi.getMe();
    const username = user.login;
    console.error(`Authenticated user: ${username}`);

    // Inject the authenticated user into the frontmatter using the utility function
    const contentToUse = injectAuthorIntoFrontmatter(content, username);



    // Sanitize the provided specName for the filename slug
    const slug = spec_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${slug}.md`;
    const targetFilePath = path.posix.join(baseRepoPath, newFilename);

    // Determine branch name (generate new if not provided)
    let headBranch = branch_name;
    if (!headBranch) {
      headBranch = `docs/add-spec-${slug}`;
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
    const finalCommitMessage = commit_message || `docs: add spec ${newFilename}`;
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
    const finalPrTitle = pr_title || `docs: Add spec ${newFilename}`;
    const defaultPrBody = `This PR suggests a new specification document:

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
      message: `Successfully created spec file and opened PR #${newPr.number}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateSpec: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create spec file and open PR: ${e.message}`,
    };
  }
}
