# ADR: Optimize GitHub Content Fetching with Promise.all

**Date**: 2025-05-09

**Status**: Accepted

## Context

Several tool handlers, such as `handleSearchRunbook` and `handleSearchPrompts`, need to fetch the content of multiple files from GitHub after an initial search query. The previous implementation fetched these files sequentially within a `for...of` loop using `await githubApi.getContents()` for each file. While this approach is straightforward, it can lead to performance bottlenecks when multiple files need to be fetched, as each request waits for the previous one to complete. This results in a cumulative delay proportional to the number of files and the network latency for each request.

## Decision

We have decided to refactor the file content fetching logic in these handlers to use `Promise.all()`. This allows for concurrent fetching of multiple file contents.

The new approach involves:

1. Mapping the array of items (files to fetch) to an array of Promises.
2. Each promise in the array is an `async` function that calls `await githubApi.getContents()` for a single file and processes its response (e.g., decodes content, extracts snippets).
3. Crucially, error handling for each individual file fetch is performed _within_ the `async` function mapped to the promise. This ensures that if one file fetch fails, `Promise.all` does not reject immediately, and we can still process the results of successful fetches.
4. `await Promise.all(contentPromises)` is then used to wait for all these concurrent operations to complete.
5. The results (or error information for individual files) are collected into an array for further processing by the handler.

This change has been implemented in `src/handlers/handleSearchRunbook.ts` and `src/handlers/handleSearchPrompts.ts`.

## Rationale

- **Performance**: Concurrent fetching significantly reduces the total time taken to retrieve multiple files, especially when network latency is a factor. Instead of summing up individual request times, the total time will be closer to the time taken by the longest single request (plus some overhead).
- **Responsiveness**: Faster data retrieval leads to a more responsive user experience for tools that rely on these handlers.
- **Scalability**: While currently limited to fetching a small number of files (e.g., top 5), this approach is more scalable if the number of files to fetch increases in the future.

## Consequences

- **Increased Concurrency**: More requests might be made to the GitHub API in a shorter burst. Given the current low number of concurrent requests (e.g., 5), this is unlikely to hit rate limits, but it's a factor to consider if the concurrency level increases significantly.
- **Slightly More Complex Error Handling**: While individual errors are handled within each promise, the overall structure for managing a batch of potentially successful or failed operations is slightly more involved than a simple sequential loop.
- **No Change to Caching**: The underlying `githubApi.getContents` function still utilizes its own caching mechanism, which complements this concurrent fetching strategy.
