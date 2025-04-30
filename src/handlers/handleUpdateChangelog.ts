// src/handlers/handleUpdateChangelog.ts
import * as path from "path";
import * as fsUtils from "../utils/fsUtils.js"; // Updated import path

export async function handleUpdateChangelog(
  targetProjectDir: string,
  entryContent: string,
  changelogName: string, // changelogName is now required
): Promise<any> {
  const absoluteTargetProjectDir = path.resolve(targetProjectDir); // Add this line
  console.log(`Handling create_changelog for: ${absoluteTargetProjectDir}`);
  const changelogDir = fsUtils.joinProjectPath(
    absoluteTargetProjectDir,
    "docs",
    "changelog",
  );

  try {
    // Ensure directory exists
    fsUtils.createDirectory(changelogDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(changelogDir);
      const numberedFiles = files.filter((file: string) =>
        /^\d{4}-.*\.md$/.test(file),
      );
      if (numberedFiles.length > 0) {
        const numbers = numberedFiles.map((file: string) =>
          parseInt(file.substring(0, 4), 10),
        );
        const maxNumber = Math.max(...numbers);
        nextSequenceNumber = maxNumber + 1;
      }
    } catch (e: any) {
      // If directory doesn't exist or other read error, start with 1
      console.warn(
        `Could not read changelog directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided changelogName for the filename slug
    const baseName = changelogName; // changelogName is now typed as string
    const slug = baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(changelogDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, entryContent);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new changelog entry: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleUpdateChangelog: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create changelog entry file: ${e.message}`,
    };
  }
}
