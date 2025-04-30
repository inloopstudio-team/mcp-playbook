// src/fsUtils.ts
import * as fs from "fs";
import * as path from "path";

export function createDirectory(dirPath: string): void {
  console.log(`Attempting to create directory: ${dirPath}`);
  try {
    fs.mkdirSync(dirPath, { recursive: true }); // recursive: true creates parent dirs
    console.log(`Directory created or already exists: ${dirPath}`);
  } catch (e: any) {
    console.error(`Error creating directory ${dirPath}: ${e.message}`);
    throw e; // Re-throw the error
  }
}

export function writeFile(filePath: string, content: string): void {
  console.log(`Attempting to write file: ${filePath}`);
  try {
    // Ensure directory exists before writing (optional if createDirectory is called first)
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, { encoding: "utf-8" });
    console.log(`Successfully wrote file: ${filePath}`);
  } catch (e: any) {
    console.error(`Error writing file ${filePath}: ${e.message}`);
    throw e;
  }
}

export function readFile(filePath: string): string {
  console.log(`Attempting to read file: ${filePath}`);
  try {
    const content = fs.readFileSync(filePath, { encoding: "utf-8" });
    console.log(`Successfully read file: ${filePath}`);
    return content;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      console.warn(`File not found: ${filePath}`);
      // Throw a specific error or re-throw to be caught by handler
      const notFoundErr = new Error(`File not found: ${filePath}`);
      (notFoundErr as any).code = "ENOENT"; // Attach code for easier handling
      throw notFoundErr;
    }
    console.error(`Error reading file ${filePath}: ${e.message}`);
    throw e;
  }
}

export function listDirectory(dirPath: string): string[] {
  console.log(`Attempting to list directory: ${dirPath}`);
  try {
    const contents = fs.readdirSync(dirPath);
    console.log(`Successfully listed directory: ${dirPath}`);
    // Optional: Add [FILE] or [DIR] prefix if needed, requires checking isDirectory for each entry
    return contents;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      console.warn(`Directory not found: ${dirPath}`);
      const notFoundErr = new Error(`Directory not found: ${dirPath}`);
      (notFoundErr as any).code = "ENOENT";
      throw notFoundErr;
    }
    console.error(`Error listing directory ${dirPath}: ${e.message}`);
    throw e;
  }
}

// Utility to join paths relative to the target_project_dir
export function joinProjectPath(
  targetProjectDir: string,
  ...segments: string[]
): string {
  return path.join(targetProjectDir, ...segments);
}
