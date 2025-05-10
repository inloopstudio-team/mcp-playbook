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

    const itemsToProcess = searchResults.items.slice(0, 5); // Limit to top 5 results

    // Map each item to a promise that fetches and processes its content
    const contentPromises = itemsToProcess.map(async (item) => {
      try {
        const fileContentResponse = await githubApi.getContents(
          githubOwner,
          githubRepo,
          item.path,
          item.repository.default_branch,
        );

        if (
          !Array.isArray(fileContentResponse) &&
          fileContentResponse.type === "file" &&
          fileContentResponse.content
        ) {
          const fullContent = Buffer.from(
            fileContentResponse.content,
            "base64",
          ).toString("utf-8");
          const snippet =
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available";
          return {
            path: item.path,
            snippet: snippet,
            full_content: fullContent,
            url: item.html_url,
          };
        } else {
          console.warn(
            `Could not fetch full content for ${item.path}. Unexpected response type or missing content.`,
          );
          return {
            path: item.path,
            snippet:
              item.text_matches && item.text_matches.length > 0
                ? item.text_matches[0].fragment
                : "No snippet available",
            full_content: null,
            url: item.html_url,
            message:
              "Could not fetch full content. Unexpected response type or missing content.",
          };
        }
      } catch (contentError: any) {
        console.error(
          `Error fetching content for ${item.path}: ${contentError.message}`,
        );
        return {
          path: item.path,
          snippet:
            item.text_matches && item.text_matches.length > 0
              ? item.text_matches[0].fragment
              : "No snippet available",
          full_content: null,
          url: item.html_url,
          message: `Error fetching content: ${contentError.message}`,
        };
      }
    });

    // Wait for all content fetching and processing promises to resolve
    const processedResults = await Promise.all(contentPromises);

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
