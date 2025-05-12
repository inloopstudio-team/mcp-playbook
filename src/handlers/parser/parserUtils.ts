// src/handlers/parser/parserUtils.ts

import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";
import { URL } from "url"; // Import URL for parsing file paths

// Safely parse JSON, returning null on error
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e: any) {
    // console.warn(`Failed to parse JSON: ${e.message}`);
    return null;
  }
}

// Extracts a file path from various URI formats (file://, git:, etc.)
export function extractPathFromUri(uri: string): string | null {
  try {
    if (uri.startsWith("file:///")) {
      let pathname = new URL(uri).pathname;
      if (false && pathname.startsWith("/")) {
        // Original: process.platform === "win32"

        pathname = pathname.substring(1); // Remove leading slash for Windows drive letters
      }
      // Decode URI components like %20
      pathname = decodeURIComponent(pathname);
      // Normalize path separators for the current OS
      return path.normalize(pathname);
    } else if (uri.includes("://")) {
      // Handle other potential schemes like git: by trying to extract the path part
      const pathPart = uri.split("://")[1];
      return pathPart ? path.normalize(decodeURIComponent(pathPart)) : null;
    } else if (path.isAbsolute(uri)) {
      // Assume it's already a potentially valid absolute path
      return path.normalize(uri);
    }
  } catch (error: any) {
    // console.warn(`Could not parse URI/path: ${uri}`, error.message);
  }
  return null;
}

// Ported/Adapted from cursor-view/server.py: extract_project_name_from_path
export function extractProjectNameFromPath(rootPath: string | null): string {
  if (!rootPath || rootPath === path.sep) {
    return "Root";
  }

  // Normalize and split path
  const normalizedPath = path.normalize(rootPath);
  const pathParts = normalizedPath.split(path.sep).filter((p) => p); // Remove empty parts

  if (pathParts.length === 0) {
    return "Root"; // Handle edge case after filtering
  }

  const homeDir = os.homedir();
  const isUserPath = normalizedPath.startsWith(homeDir);
  const username = path.basename(homeDir);

  let projectName: string | null = null;

  // --- Heuristics based on Python script ---

  // 1. Check if it's just the user's home directory
  if (normalizedPath === homeDir) {
    return "Home Directory";
  }

  // 2. Identify project name if it's deeper within the user's path
  if (isUserPath) {
    const homeParts = homeDir.split(path.sep).filter((p) => p);
    const relativePathParts = pathParts.slice(homeParts.length);

    if (relativePathParts.length === 0) {
      return "Home Directory"; // Path is exactly home dir
    }

    // Prioritize known project names (example list, customize as needed)
    const knownProjects = [
      "genaisf",
      "cursor-view",
      "mcp-playbook",
      "universal-github",
      "inquiry",
    ];
    for (let i = relativePathParts.length - 1; i >= 0; i--) {
      if (knownProjects.includes(relativePathParts[i])) {
        projectName = relativePathParts[i];
        break;
      }
    }

    // Handle common container structures like Documents/codebase/project
    if (
      !projectName &&
      relativePathParts.includes("Documents") &&
      relativePathParts.includes("codebase")
    ) {
      const codebaseIndex = relativePathParts.indexOf("codebase");
      if (codebaseIndex + 1 < relativePathParts.length) {
        projectName = relativePathParts[codebaseIndex + 1];
      }
    }

    // Default to the last part of the path if no specific rule matched
    if (!projectName && relativePathParts.length > 0) {
      projectName = relativePathParts[relativePathParts.length - 1];
    }

    // Avoid using username or generic container names as the project name
    const commonContainers = [
      "Documents",
      "Projects",
      "Code",
      "workspace",
      "repos",
      "git",
      "src",
      "codebase",
      "Downloads",
      "Desktop",
      "VCS",
    ];
    if (
      projectName === username ||
      (projectName && commonContainers.includes(projectName))
    ) {
      // If the 'project name' is a container, try the part *before* it if possible
      if (projectName && commonContainers.includes(projectName)) {
        const containerIndex = relativePathParts.lastIndexOf(projectName);
        // If there's something *after* the container, maybe use that? (Less common)
        // Example: /Users/me/Code/company/project -> project
        if (containerIndex + 1 < relativePathParts.length) {
          projectName = relativePathParts[containerIndex + 1];
        }
        // If there's something *before* the container (and not just user dir), use that?
        // Example: /Users/me/company/Code -> company (less likely)
        // Let's stick to using the last part, or the part after codebase for now.
        // If the last part was a container, we might fall back to "Home Directory" or "Unknown"
        else {
          projectName = "Unknown Project"; // Or maybe keep the container name? Let's try Unknown.
        }
      } else if (projectName === username) {
        projectName = "Home Directory";
      }
    }
  } else {
    // If not in a user directory, use the last part of the path
    projectName = pathParts[pathParts.length - 1];
  }

  // Final fallback
  return projectName || "Unknown Project";
}

// Helper to infer project path from history entries (adapted from existing)
// This function uses fsSync, so ensure it's appropriate if this util file
// is used in contexts where only async fs is preferred.
export function inferProjectPathFromHistoryEntries(
  historyEntriesJson: string | null,
): string | null {
  const historyEntries = safeJsonParse<any[]>(historyEntriesJson);
  if (!Array.isArray(historyEntries)) {
    return null;
  }

  const paths: string[] = [];
  for (const entry of historyEntries) {
    const resourceUri = entry?.editor?.resource;
    if (resourceUri && typeof resourceUri === "string") {
      const extractedPath = extractPathFromUri(resourceUri);
      if (extractedPath) {
        paths.push(extractedPath);
      }
    }
  }

  if (paths.length === 0) return null;

  // Find the longest common path prefix
  let commonPrefix = paths[0];
  for (let i = 1; i < paths.length; i++) {
    while (!paths[i].startsWith(commonPrefix) && commonPrefix.length > 0) {
      // Go up one level by finding the last directory separator
      const lastSepIndex = commonPrefix.lastIndexOf(path.sep);
      if (lastSepIndex === -1) {
        // No separator found, possibly at root or invalid
        commonPrefix = "";
        break;
      }
      commonPrefix = commonPrefix.substring(0, lastSepIndex);
    }
    if (commonPrefix.length === 0) break;
  }

  // Ensure the common prefix is a directory path
  if (commonPrefix.length > 0) {
    try {
      // Check if the path exists and is a file. If so, take its directory.
      if (
        fsSync.existsSync(commonPrefix) &&
        fsSync.statSync(commonPrefix).isFile()
      ) {
        return path.dirname(commonPrefix);
      }
      // If it exists and is a directory, or doesn't exist (might be a workspace root placeholder), return it.
      return commonPrefix;
    } catch (e: any) {
      // console.warn("Could not stat common prefix:", e.message);
      // If stat fails, return the prefix as is - it's the best guess.
      return commonPrefix;
    }
  }

  return null;
}
