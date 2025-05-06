/**
 * Parses the frontmatter from a markdown string and injects/updates the authors field.
 * If the authors field exists, it attempts to parse it (supporting single strings or JSON arrays)
 * and adds the provided username if not already present.
 * If the authors field does not exist, it adds it with the provided username.
 * If no frontmatter exists, it adds a new frontmatter block with the author.
 *
 * @param content The markdown content string.
 * @param username The username to inject into the authors field.
 * @returns The modified markdown content string with updated frontmatter.
 */
export function injectAuthorIntoFrontmatter(
  content: string,
  username: string,
): string {
  let modifiedContent = content;
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (match) {
    // Frontmatter exists
    const frontmatterBlock = match[1];
    const contentAfterFrontmatter = content.substring(match[0].length);

    const authorsRegex = /^authors:\s*(.*)$/m;
    const authorsMatch = frontmatterBlock.match(authorsRegex);

    let currentAuthors: string[] = [];
    if (authorsMatch && authorsMatch[1]) {
      // Authors field exists, attempt to parse existing value
      const existingAuthorsString = authorsMatch[1].trim();
      try {
        // Attempt to parse as JSON array (e.g., ["Author One", "Author Two"])
        currentAuthors = JSON.parse(existingAuthorsString);
        if (!Array.isArray(currentAuthors)) {
          // If not an array, treat as a single string author
          currentAuthors = [existingAuthorsString.replace(/^['"]|['"]$/g, "")]; // Remove quotes if present
        }
      } catch (e) {
        // If JSON parsing fails, treat as a single string author
        currentAuthors = [existingAuthorsString.replace(/^['"]|['"]$/g, "")]; // Remove quotes if present
      }
    }

    // Add the current user's username if not already present
    if (!currentAuthors.includes(username)) {
      currentAuthors.push(username);
    }

    const updatedAuthorsLine = `authors: ${JSON.stringify(currentAuthors)}`;

    if (authorsMatch) {
      // Authors field existed, replace the line
      const updatedFrontmatterBlock = frontmatterBlock.replace(
        authorsRegex,
        updatedAuthorsLine,
      );
      modifiedContent = `---\n${updatedFrontmatterBlock}\n---\n${contentAfterFrontmatter}`;
    } else {
      // Authors field did not exist, add it
      const updatedFrontmatterBlock = `${frontmatterBlock}\n${updatedAuthorsLine}`;
      modifiedContent = `---\n${updatedFrontmatterBlock}\n---\n${contentAfterFrontmatter}`;
    }
  } else {
    // No frontmatter, add it with the user as author
    modifiedContent = `---\nauthors: ["${username}"]\n---\n\n${content}`;
  }

  return modifiedContent;
}
