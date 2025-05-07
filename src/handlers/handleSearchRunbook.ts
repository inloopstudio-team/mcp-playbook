import {
  SearchRunbookArgs,
  SearchRunbookArgsSchema,
} from "../tools/searchRunbook.js";
import * as githubApi from "../utils/githubApi.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleSearchRunbook(
  args: SearchRunbookArgs,
): Promise<any> {
  try {
    const { keyword } = validateArgs(SearchRunbookArgsSchema, args);

    console.error(`Handling search_runbook for keyword: ${keyword}`);

    const githubOwner = "dwarvesf";
    const githubRepo = "runbook";

    // Use the githubApi function to search code to get matching file paths
    const searchResults = await githubApi.searchCode(
      githubOwner,
      githubRepo,
      keyword,
    );

    const processedResults = [];
    const itemsToProcess = searchResults.items.slice(0, 5); // Limit to top 5 results

    // For each matching file, fetch the full content
    for (const item of itemsToProcess) {
      try {
        // getContents returns GitHubContentsResponse, which can be an array if the path is a directory.
        // Since searchCode finds files, we expect a single GitHubContentItem.
        const fileContentResponse = await githubApi.getContents(
          githubOwner,
          githubRepo,
          item.path,
          item.repository.default_branch,
        );

        // Ensure it's a single file item and has content
        if (
          !Array.isArray(fileContentResponse) &&
          fileContentResponse.type === "file" &&
          fileContentResponse.content
        ) {
          const fullContent = Buffer.from(
            fileContentResponse.content,
            "base64",
          ).toString("utf-8");

          // We still include the snippet for context, and now the full content
          const snippet =
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available";

          processedResults.push({
            path: item.path,
            snippet: snippet, // Keep snippet for quick context
            full_content: fullContent, // Add full content
            url: item.html_url,
          });
        } else {
          console.warn(
            `Could not fetch full content for ${item.path}. Unexpected response type or missing content.`,
          );
          // Optionally push a result without full content or skip
          processedResults.push({
            path: item.path,
            snippet:
              item.text_matches && item.text_matches.length > 0
                ? item.text_matches[0].fragment
                : "No snippet available",
            full_content: null, // Indicate no full content was fetched
            url: item.html_url,
            message: "Could not fetch full content.",
          });
        }
      } catch (contentError: any) {
        console.error(
          `Error fetching content for ${item.path}: ${contentError.message}`,
        );
        // Optionally push a result with error info or skip
        processedResults.push({
          path: item.path,
          snippet:
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available",
          full_content: null, // Indicate no full content was fetched
          url: item.html_url,
          message: `Error fetching content: ${contentError.message}`,
        });
      }
    }

    return {
      results: processedResults,
      total_count: searchResults.total_count,
      message: `Found and processed ${processedResults.length} results out of ${searchResults.total_count} total.`,
    };
  } catch (e: any) {
    console.error(`Error during runbook search: ${e.message}`);
    return {
      results: [],
      message: `An error occurred during runbook search: ${e.message}`,
    };
  }
}
