import { RequestError } from "@octokit/request-error";
import * as path from "path";
import {
  SuggestRunbookArgs,
  SuggestRunbookArgsSchema,
} from "../tools/suggestRunbook.js";
import { injectAuthorIntoFrontmatter } from "../utils/frontmatterUtils.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleSuggestRunbook(
  args: SuggestRunbookArgs,
): Promise<any> {
  try {
    const {
      content,
      target_folder,
      filename_slug,
      pr_number,
      branch_name,
      commit_message,
      pr_title,
      pr_body,
    } = validateArgs(SuggestRunbookArgsSchema, args);

    // Get authenticated user and inject into frontmatter
    const user = await githubApi.getMe();
    const username = user.login;
    console.error(`Authenticated user: ${username}`);

    // Inject the authenticated user into the frontmatter using the utility function
    const contentToUse = injectAuthorIntoFrontmatter(content, username);

    console.error(`Handling suggest_runbook for folder: ${target_folder}`);

    const githubOwner = "dwarvesf";
    const githubRepo = "runbook";
    const baseBranch = "main"; // Target branch for the PR

    // 1. Validate target_folder (Zod schema already handles this, but keeping for clarity/redundancy if needed)
    // const allowedFolders = [ ... ]; // Defined in schema
    // if (!allowedFolders.includes(target_folder)) { ... }

    // 2. Generate filename slug if not provided
    let finalFilenameSlug = filename_slug;
    if (!finalFilenameSlug) {
      // Attempt to extract title from markdown content (first heading)
      const titleMatch = contentToUse.match(/^#\s+(.*)/m); // Use contentToUse here
      if (titleMatch && titleMatch[1]) {
        finalFilenameSlug = titleMatch[1]
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9_-]/g, "")
          .substring(0, 50);
      } else {
        // Fallback if no title found
        finalFilenameSlug = `runbook-entry-${Date.now()}`;
      }
    }

    const targetFilePath = path.posix.join(
      target_folder,
      `${finalFilenameSlug}.md`,
    );

    let headBranch = branch_name;
    let isNewPr = pr_number === undefined;
    let existingFileSha: string | undefined;

    if (isNewPr) {
      // 4. Determine branch name (generate new if creating new PR)
      if (!headBranch) {
        headBranch = `suggest-runbook-${Date.now()}`;
      }
      // 5. Create the new branch
      console.error(`Creating new branch: ${headBranch}`);
      await githubApi.createBranch(
        githubOwner,
        githubRepo,
        headBranch,
        baseBranch,
      );
    } else {
      // If updating existing PR, get the head branch from the PR
      console.error(`Fetching PR ${pr_number} to get head branch`);
      const pr = await githubApi.getPullRequest(
        githubOwner,
        githubRepo,
        pr_number!,
      );
      headBranch = pr.head.ref;

      // 6. Fetch existing file SHA if updating
      console.error(
        `Fetching existing file content for ${targetFilePath} on branch ${headBranch}`,
      );
      try {
        const existingContent = await githubApi.getContents(
          githubOwner,
          githubRepo,
          targetFilePath,
          headBranch,
        );
        if (
          !Array.isArray(existingContent) &&
          existingContent.type === "file"
        ) {
          existingFileSha = existingContent.sha;
          console.error(`Found existing file with SHA: ${existingFileSha}`);
        }
      } catch (e: any) {
        if (e instanceof RequestError && e.status === 404) {
          console.error(
            `File not found at ${targetFilePath} on branch ${headBranch}. This is expected for a new file.`,
          );
        } else {
          throw e; // Re-throw other errors
        }
      }
    }

    // 7. Use createOrUpdateFileInRepo to push the content
    const finalCommitMessage =
      commit_message || `Add/update runbook entry: ${finalFilenameSlug}`;
    console.error(
      `Creating/updating file ${targetFilePath} on branch ${headBranch}`,
    );
    await githubApi.createOrUpdateFileInRepo(
      githubOwner,
      githubRepo,
      targetFilePath,
      contentToUse, // Use the modified content
      finalCommitMessage,
      headBranch!, // headBranch is guaranteed to be set here
      existingFileSha, // Pass SHA for updates
    );
    console.error(`File ${targetFilePath} successfully created/updated.`);

    let finalPrNumber = pr_number;
    let finalPrUrl: string | undefined;

    if (isNewPr) {
      // 8. Create a new Pull Request
      const finalPrTitle =
        pr_title || `feat: Add runbook entry for ${finalFilenameSlug}`;
      const defaultPrBody = `This PR suggests a new runbook entry for the \`${target_folder}\` folder.

This entry was suggested by an AI to document a technical pattern or procedure that can be helpful for Large Language Models operating on codebases.

Please review the suggested content and merge if appropriate.`;
      const finalPrBody = pr_body || defaultPrBody;
      console.error(`Creating new PR from ${headBranch} to ${baseBranch}`);
      const newPr = await githubApi.createPullRequest(
        githubOwner,
        githubRepo,
        finalPrTitle,
        headBranch!, // headBranch is guaranteed to be set here
        baseBranch,
        finalPrBody,
        false, // Not a draft by default
        true, // Allow maintainer edits
      );
      finalPrNumber = newPr.number;
      finalPrUrl = newPr.html_url;
      console.error(`New PR created: ${finalPrUrl}`);
    } else {
      // If updating existing PR, construct the URL
      finalPrUrl = `https://github.com/${githubOwner}/${githubRepo}/pull/${pr_number}`;
      console.error(`Updated existing PR: ${finalPrUrl}`);
    }

    // 9. Return status and PR details
    return {
      status: "success",
      pr_number: finalPrNumber,
      pr_url: finalPrUrl,
      message: isNewPr
        ? `Successfully created PR #${finalPrNumber}`
        : `Successfully updated PR #${finalPrNumber}`,
    };
  } catch (e: any) {
    console.error(`Error in handleSuggestRunbook: ${e.message}`);
    return {
      status: "error",
      message: `Failed to suggest runbook entry: ${e.message}`,
    };
  }
}
